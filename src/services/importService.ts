import type { ResumeTemplate } from '../data/templates';
import { parseResumeHtml, parseResumeText } from './resumeParser';
import type { ResumeData } from '../types/resume';

export type ImportConfidence = 'high' | 'moderate' | 'low';

export type ImportResult = {
  resume: ResumeData;
  styleOverrides: Partial<ResumeTemplate['cssVars']>;
  confidence: ImportConfidence;
  warnings: string[];
  sourceName: string;
};

// Maps common DOCX font names to web-safe CSS stacks
const FONT_MAP: Record<string, string> = {
  calibri: "'Inter', 'Calibri', Arial, sans-serif",
  arial: "Arial, 'Helvetica Neue', sans-serif",
  'helvetica neue': "'Helvetica Neue', Helvetica, Arial, sans-serif",
  helvetica: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  'times new roman': "Georgia, 'Times New Roman', serif",
  georgia: 'Georgia, serif',
  garamond: "Georgia, 'Garamond', serif",
  'eb garamond': "Georgia, 'Garamond', serif",
  cambria: "Georgia, 'Cambria', serif",
  'trebuchet ms': "system-ui, -apple-system, sans-serif",
  verdana: "Verdana, system-ui, sans-serif",
  palatino: "Georgia, 'Palatino Linotype', serif",
  'palatino linotype': "Georgia, 'Palatino Linotype', serif",
  'gill sans': "system-ui, 'Gill Sans', sans-serif",
  futura: "'Trebuchet MS', system-ui, sans-serif",
  'century gothic': "system-ui, 'Century Gothic', sans-serif",
  tahoma: "Tahoma, system-ui, sans-serif",
  'book antiqua': "Georgia, serif",
  lato: "'Lato', 'Inter', sans-serif",
  'open sans': "'Open Sans', 'Inter', sans-serif",
  roboto: "'Roboto', 'Inter', sans-serif",
  inter: "'Inter', system-ui, sans-serif",
};

function mapFont(name: string): string | null {
  const key = name.toLowerCase().trim();
  return FONT_MAP[key] ?? null;
}

async function extractDocxStyle(buffer: ArrayBuffer): Promise<{
  fontName: string | null;
  accentColor: string | null;
  marginIn: number | null;
}> {
  // Dynamically import JSZip to keep chunk sizes reasonable
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(buffer);

  // Font detection from fontTable.xml
  let fontName: string | null = null;
  try {
    const xml = await zip.file('word/fontTable.xml')?.async('text');
    if (xml) {
      // Grab the first font that isn't a symbol/generic font
      const matches = [...xml.matchAll(/w:font\s+w:name="([^"]+)"/g)];
      for (const m of matches) {
        const n = m[1];
        if (!/symbol|wingdings|webdings|emoji/i.test(n)) {
          fontName = n;
          break;
        }
      }
    }
  } catch { /* ignore */ }

  // Accent color from theme1.xml
  let accentColor: string | null = null;
  try {
    const xml = await zip.file('word/theme/theme1.xml')?.async('text');
    if (xml) {
      // accent1 is typically the primary branding color
      const accentMatch = xml.match(/<a:accent1[^>]*>[\s\S]*?<a:srgbClr\s+val="([0-9A-Fa-f]{6})"/);
      if (accentMatch) {
        const hex = accentMatch[1];
        // Skip if it's black/white/near-white
        if (!['000000', 'ffffff', 'eeeeee', 'f0f0f0', 'dddddd'].includes(hex.toLowerCase())) {
          accentColor = `#${hex}`;
        }
      }
    }
  } catch { /* ignore */ }

  // Page margins from document.xml
  let marginIn: number | null = null;
  try {
    const xml = await zip.file('word/document.xml')?.async('text');
    if (xml) {
      const m = xml.match(/w:pgMar[^/]*w:left="(\d+)"/);
      if (m) {
        const twips = parseInt(m[1]);
        // Convert twips to inches (1440 twips = 1 inch), clamp to reasonable range
        const inches = twips / 1440;
        if (inches >= 0.38 && inches <= 1.5) marginIn = Math.round(inches * 100) / 100;
      }
    }
  } catch { /* ignore */ }

  return { fontName, accentColor, marginIn };
}

function buildStyleOverrides(
  fontName: string | null,
  accentColor: string | null,
  marginIn: number | null
): Partial<ResumeTemplate['cssVars']> {
  const overrides: Partial<ResumeTemplate['cssVars']> = {};
  const cssFontStack = fontName ? mapFont(fontName) : null;
  if (cssFontStack) overrides['--resume-font'] = cssFontStack;
  if (accentColor) overrides['--resume-accent'] = accentColor;
  if (marginIn !== null) overrides['--resume-margin'] = `${marginIn}in`;
  return overrides;
}

export async function importDocx(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();

  // Import mammoth dynamically
  const mammoth = await import('mammoth');

  // Extract text as HTML
  const { value: html, messages } = await mammoth.convertToHtml({ arrayBuffer: buffer });
  const resume = parseResumeHtml(html);

  // Extract style
  const { fontName, accentColor, marginIn } = await extractDocxStyle(buffer);
  const styleOverrides = buildStyleOverrides(fontName, accentColor, marginIn);

  // Estimate confidence
  const warnings: string[] = messages
    .filter((m) => m.type === 'warning')
    .map((m) => m.message);

  const hasExperience = resume.experience.length > 0;
  const hasName = !!resume.personalInfo.name;
  const hasContact = !!resume.personalInfo.email || !!resume.personalInfo.phone;
  const confidence: ImportConfidence =
    hasName && hasContact && hasExperience ? 'high' :
    hasName && (hasContact || hasExperience) ? 'moderate' : 'low';

  return { resume, styleOverrides, confidence, warnings, sourceName: file.name };
}

export async function importTxt(file: File): Promise<ImportResult> {
  const text = await file.text();
  const resume = parseResumeText(text);

  const hasName = !!resume.personalInfo.name;
  const hasExperience = resume.experience.length > 0;
  const confidence: ImportConfidence = hasName && hasExperience ? 'moderate' : 'low';

  return {
    resume,
    styleOverrides: {},
    confidence,
    warnings: ['Plain text import: layout style could not be detected.'],
    sourceName: file.name,
  };
}

export async function importFile(file: File): Promise<ImportResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'docx') return importDocx(file);
  if (ext === 'txt') return importTxt(file);
  throw new Error(`Unsupported file type: .${ext}. Please use DOCX or TXT.`);
}
