import { parseResumeHtmlFull, parseResumeText } from './resumeParser';
import type { ResumeData } from '../types/resume';
import type { LayoutSchema } from '../types/layout';
import { DEFAULT_LAYOUT } from '../types/layout';

export type ImportConfidence = 'high' | 'moderate' | 'low';

export type ImportResult = {
  resume: ResumeData;
  layout: LayoutSchema;
  styleOverrides: Record<string, string>;
  rawHtml?: string;
  docxBuffer?: ArrayBuffer;  // original DOCX bytes — rendered via docx-preview
  confidence: ImportConfidence;
  warnings: string[];
  sourceName: string;
};

// Maps common font names to CSS font stacks
const FONT_MAP: Record<string, string> = {
  calibri: "'Calibri', 'Inter', Arial, sans-serif",
  'calibri light': "'Calibri Light', 'Calibri', Arial, sans-serif",
  arial: "Arial, 'Helvetica Neue', sans-serif",
  'helvetica neue': "'Helvetica Neue', Helvetica, Arial, sans-serif",
  helvetica: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  'times new roman': "Georgia, 'Times New Roman', serif",
  georgia: 'Georgia, serif',
  garamond: "Georgia, 'Garamond', 'EB Garamond', serif",
  'eb garamond': "Georgia, 'EB Garamond', 'Garamond', serif",
  cambria: "Georgia, 'Cambria', serif",
  'trebuchet ms': "'Trebuchet MS', system-ui, sans-serif",
  verdana: "Verdana, system-ui, sans-serif",
  palatino: "Georgia, 'Palatino Linotype', serif",
  'palatino linotype': "Georgia, 'Palatino Linotype', serif",
  'gill sans': "system-ui, 'Gill Sans', sans-serif",
  futura: "'Trebuchet MS', system-ui, sans-serif",
  'century gothic': "system-ui, 'Century Gothic', sans-serif",
  tahoma: "Tahoma, system-ui, sans-serif",
  'book antiqua': 'Georgia, serif',
  lato: "'Lato', 'Inter', sans-serif",
  'open sans': "'Open Sans', 'Inter', sans-serif",
  roboto: "'Roboto', 'Inter', sans-serif",
  inter: "'Inter', system-ui, sans-serif",
  'source sans pro': "'Source Sans Pro', 'Inter', sans-serif",
  'source sans 3': "'Source Sans 3', 'Inter', sans-serif",
  raleway: "'Raleway', system-ui, sans-serif",
  montserrat: "'Montserrat', system-ui, sans-serif",
  'pt sans': "'PT Sans', system-ui, sans-serif",
  'merriweather': "'Merriweather', Georgia, serif",
  'playfair display': "'Playfair Display', Georgia, serif",
  'cormorant garamond': "Georgia, 'Cormorant Garamond', serif",
  nunito: "'Nunito', system-ui, sans-serif",
  'josefin sans': "system-ui, sans-serif",
};

function mapFont(name: string): string | null {
  return FONT_MAP[name.toLowerCase().trim()] ?? null;
}

// ── OOXML helpers ─────────────────────────────────────────────────

function getStyleBlock(xml: string, styleName: string): string {
  const nameTag = `w:val="${styleName}"`;
  let searchFrom = 0;
  while (true) {
    const idx = xml.indexOf(nameTag, searchFrom);
    if (idx === -1) return '';

    // Make sure this is inside a <w:name> element
    const lineStart = xml.lastIndexOf('<', idx);
    if (xml.slice(lineStart, lineStart + 7) === '<w:name') {
      const blockStart = xml.lastIndexOf('<w:style', idx);
      if (blockStart !== -1) {
        const blockEnd = xml.indexOf('</w:style>', idx);
        if (blockEnd !== -1) return xml.slice(blockStart, blockEnd + 10);
      }
    }
    searchFrom = idx + 1;
  }
}

function getAttr(block: string, element: string, attr: string): string | null {
  const re = new RegExp(`<w:${element}\\b[^>]*\\bw:${attr}="([^"]*)"`, 'i');
  return block.match(re)?.[1] ?? null;
}

function hasTag(block: string, tag: string): boolean {
  return new RegExp(`<w:${tag}\\b`, 'i').test(block);
}

function twipsToIn(t: string | null | undefined, min = 0.25, max = 1.75): string | null {
  if (!t) return null;
  const v = parseInt(t) / 1440;
  return v >= min && v <= max ? `${Math.round(v * 100) / 100}in` : null;
}

function halfPtToPt(v: string | null | undefined, min = 8, max = 36): number | null {
  if (!v) return null;
  const pt = parseInt(v) / 2;
  return pt >= min && pt <= max ? pt : null;
}

// ── Main layout extractor ─────────────────────────────────────────

async function extractDocxLayout(buffer: ArrayBuffer, sectionOrderFromContent: string[]): Promise<LayoutSchema> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(buffer);
  const layout: LayoutSchema = { ...DEFAULT_LAYOUT, sectionOrder: sectionOrderFromContent };

  // ── word/styles.xml ───────────────────────────────────
  try {
    const stylesXml = await zip.file('word/styles.xml')?.async('text') ?? '';

    // Normal / default style → body font, size, line height
    const normalBlock = getStyleBlock(stylesXml, 'Normal') || getStyleBlock(stylesXml, 'normal');
    if (normalBlock) {
      const fontAscii = getAttr(normalBlock, 'rFonts', 'w:ascii')
                     ?? getAttr(normalBlock, 'rFonts', 'w:hAnsi');
      if (fontAscii) {
        const mapped = mapFont(fontAscii);
        if (mapped) layout.fontFamily = mapped;
      }
      const szVal = getAttr(normalBlock, 'sz', 'w:val');
      const pt = halfPtToPt(szVal, 7, 13);
      if (pt) layout.bodySize = `${pt}pt`;

      const lineVal = getAttr(normalBlock, 'spacing', 'w:line');
      if (lineVal) {
        const lh = Math.round(parseInt(lineVal) / 240 * 100) / 100;
        if (lh >= 1.0 && lh <= 2.5) layout.lineHeight = lh;
      }
    }

    // Heading 1 → likely the name (large) or section headers
    const h1Block = getStyleBlock(stylesXml, 'heading 1');
    if (h1Block) {
      const h1Pt = halfPtToPt(getAttr(h1Block, 'sz', 'w:val'), 12, 40);
      if (h1Pt) {
        // If heading 1 is very large it's the name, otherwise it's section heading
        if (h1Pt >= 16) layout.nameSize = `${h1Pt}pt`;
        else layout.headingSize = `${h1Pt}pt`;
      }
      // Font from heading if body didn't provide one
      if (layout.fontFamily === DEFAULT_LAYOUT.fontFamily) {
        const h1Font = getAttr(h1Block, 'rFonts', 'w:ascii') ?? getAttr(h1Block, 'rFonts', 'w:hAnsi');
        if (h1Font) { const m = mapFont(h1Font); if (m) layout.fontFamily = m; }
      }
      layout.headingUppercase = hasTag(h1Block, 'caps') || hasTag(h1Block, 'smallCaps');
      layout.showDividers = hasTag(h1Block, 'pBdr') || hasTag(h1Block, 'bottom');

      // Section spacing from heading 1 spacing before
      const spaceBefore = getAttr(h1Block, 'spacing', 'w:before');
      if (spaceBefore) {
        const pt = parseInt(spaceBefore) / 20;
        if (pt >= 4 && pt <= 36) layout.sectionGap = `${Math.round(pt)}pt`;
      }
    }

    // Heading 2 → section headers (if heading 1 is used for name)
    const h2Block = getStyleBlock(stylesXml, 'heading 2');
    if (h2Block) {
      const h2Pt = halfPtToPt(getAttr(h2Block, 'sz', 'w:val'), 8, 16);
      if (h2Pt) layout.headingSize = `${h2Pt}pt`;
      if (!layout.headingUppercase) {
        layout.headingUppercase = hasTag(h2Block, 'caps') || hasTag(h2Block, 'smallCaps');
      }
      if (!layout.showDividers) {
        layout.showDividers = hasTag(h2Block, 'pBdr') || hasTag(h2Block, 'bottom');
      }
      const h2SpaceBefore = getAttr(h2Block, 'spacing', 'w:before');
      if (h2SpaceBefore) {
        const pt = parseInt(h2SpaceBefore) / 20;
        if (pt >= 4 && pt <= 36) layout.sectionGap = `${Math.round(pt)}pt`;
      }
    }

    // List Paragraph / List Bullet → bullet indent
    const listBlock = getStyleBlock(stylesXml, 'List Paragraph')
                   || getStyleBlock(stylesXml, 'List Bullet')
                   || getStyleBlock(stylesXml, 'list paragraph');
    if (listBlock) {
      const leftInd = getAttr(listBlock, 'ind', 'w:left');
      if (leftInd) {
        const pt = parseInt(leftInd) / 1440 * 72;
        if (pt >= 0 && pt <= 36) layout.bulletIndent = `${Math.round(pt)}pt`;
      }
      const entrySpaceAfter = getAttr(listBlock, 'spacing', 'w:after');
      if (entrySpaceAfter) {
        const pt = parseInt(entrySpaceAfter) / 20;
        if (pt >= 0 && pt <= 24) layout.entryGap = `${Math.round(pt)}pt`;
      }
    }

    // Font fallback from fontTable if still default
    if (layout.fontFamily === DEFAULT_LAYOUT.fontFamily) {
      const fontXml = await zip.file('word/fontTable.xml')?.async('text') ?? '';
      for (const m of fontXml.matchAll(/w:font\s+w:name="([^"]+)"/g)) {
        const n = m[1];
        if (!/symbol|wingdings|webdings|emoji/i.test(n)) {
          const mapped = mapFont(n);
          if (mapped) { layout.fontFamily = mapped; break; }
        }
      }
    }

  } catch { /* ignore — use defaults */ }

  // ── word/document.xml ─────────────────────────────────
  try {
    const docXml = await zip.file('word/document.xml')?.async('text') ?? '';

    // Page size
    const pgWMatch = docXml.match(/w:pgSz\b[^>]*\bw:w="(\d+)"/);
    if (pgWMatch) {
      const wIn = parseInt(pgWMatch[1]) / 1440;
      layout.pageSize = wIn > 8.3 ? 'letter' : 'a4';
    }

    // All 4 margins
    const pgMarMatch = docXml.match(/w:pgMar\b([^/]+)\//);
    if (pgMarMatch) {
      const mar = pgMarMatch[1];
      const top = twipsToIn(mar.match(/\bw:top="(\d+)"/)?.[1]);
      const right = twipsToIn(mar.match(/\bw:right="(\d+)"/)?.[1]);
      const bottom = twipsToIn(mar.match(/\bw:bottom="(\d+)"/)?.[1]);
      const left = twipsToIn(mar.match(/\bw:left="(\d+)"/)?.[1]);
      if (top) layout.margins.top = top;
      if (right) layout.margins.right = right;
      if (bottom) layout.margins.bottom = bottom;
      if (left) layout.margins.left = left;
    }

    // Column count
    const colsMatch = docXml.match(/w:cols\b[^>]*\bw:num="(\d+)"/);
    if (colsMatch) layout.columns = parseInt(colsMatch[1]) >= 2 ? 2 : 1;

    // Date alignment via right-aligned tab stops
    layout.dateAlignment = /w:tab\b[^>]*\bw:val="right"/.test(docXml) ? 'right' : 'inline';

  } catch { /* ignore */ }

  // ── word/theme/theme1.xml ─────────────────────────────
  try {
    const themeXml = await zip.file('word/theme/theme1.xml')?.async('text') ?? '';
    const accentM = themeXml.match(/<a:accent1\b[\s\S]*?<a:srgbClr\s+val="([0-9A-Fa-f]{6})"/);
    if (accentM) {
      const hex = accentM[1].toLowerCase();
      if (!['000000', 'ffffff', 'eeeeee', 'f0f0f0', 'dddddd', '1f1f1f'].includes(hex)) {
        layout.accentColor = `#${hex}`;
      }
    }
  } catch { /* ignore */ }

  return layout;
}

// ── CSS var builder ───────────────────────────────────────────────

export function buildStyleOverrides(layout: LayoutSchema): Record<string, string> {
  return {
    '--resume-font': layout.fontFamily,
    '--resume-font-size': layout.bodySize,
    '--resume-line-height': String(layout.lineHeight),
    '--resume-name-size': layout.nameSize,
    '--resume-section-title-size': layout.headingSize,
    '--resume-section-title-transform': layout.headingUppercase ? 'uppercase' : 'none',
    '--resume-section-title-spacing': layout.headingUppercase ? '0.08em' : '0.02em',
    '--resume-margin': layout.margins.left,   // backward compat
    '--resume-margin-top': layout.margins.top,
    '--resume-margin-right': layout.margins.right,
    '--resume-margin-bottom': layout.margins.bottom,
    '--resume-margin-left': layout.margins.left,
    '--resume-section-gap': layout.sectionGap,
    '--resume-entry-gap': layout.entryGap,
    '--resume-bullet-indent': layout.bulletIndent,
    '--resume-accent': layout.accentColor,
  };
}

// ── Client-side HTML builder (no AI needed) ───────────────────────

function buildHtmlFromMammoth(mammothHtml: string, layout: LayoutSchema): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(mammothHtml, 'text/html');
  const body = doc.body;

  const accent = layout.accentColor || '#1a1a1a';
  const dividerCss = layout.showDividers
    ? `border-bottom: 1px solid ${accent}; padding-bottom: 2pt;`
    : '';

  // Style each element in place
  let headingCount = 0;
  body.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6').forEach((h) => {
    if (headingCount === 0 && h.tagName === 'H1') {
      // First H1 is typically the candidate name
      h.style.cssText = [
        `font-size: ${layout.nameSize}`,
        `font-weight: bold`,
        `font-family: ${layout.fontFamily}`,
        `color: #1a1a1a`,
        `margin: 0 0 4pt`,
        `line-height: 1.2`,
      ].join('; ');
    } else {
      h.style.cssText = [
        `font-size: ${layout.headingSize}`,
        `font-weight: bold`,
        `font-family: ${layout.fontFamily}`,
        `color: ${accent}`,
        layout.headingUppercase ? 'text-transform: uppercase' : '',
        layout.headingUppercase ? 'letter-spacing: 0.06em' : '',
        `margin: ${layout.sectionGap} 0 3pt`,
        dividerCss,
      ].filter(Boolean).join('; ');
    }
    headingCount++;
  });

  body.querySelectorAll<HTMLElement>('p').forEach((p) => {
    p.style.cssText = `margin: 0 0 2pt; font-family: ${layout.fontFamily}; font-size: ${layout.bodySize};`;
  });

  body.querySelectorAll<HTMLElement>('ul, ol').forEach((list) => {
    list.style.cssText = `padding-left: ${layout.bulletIndent || '14pt'}; margin: 1pt 0 ${layout.entryGap};`;
  });

  body.querySelectorAll<HTMLElement>('li').forEach((li) => {
    li.style.cssText = `margin-bottom: 1pt; font-family: ${layout.fontFamily}; font-size: ${layout.bodySize};`;
  });

  const containerStyle = [
    `padding: ${layout.margins.top} ${layout.margins.right} ${layout.margins.bottom} ${layout.margins.left}`,
    `font-family: ${layout.fontFamily}`,
    `font-size: ${layout.bodySize}`,
    `line-height: ${layout.lineHeight}`,
    `color: #1a1a1a`,
    `box-sizing: border-box`,
  ].join('; ');

  return `<div style="${containerStyle}">${body.innerHTML}</div>`;
}

// ── Importers ─────────────────────────────────────────────────────

export async function importDocx(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const mammoth = await import('mammoth');
  const { value: mammothHtml, messages } = await mammoth.convertToHtml({ arrayBuffer: buffer });

  const { resume, sectionOrder } = parseResumeHtmlFull(mammothHtml);
  const layout = await extractDocxLayout(buffer, sectionOrder);
  const styleOverrides = buildStyleOverrides(layout);

  const warnings: string[] = messages
    .filter((m) => m.type === 'warning')
    .map((m) => m.message);

  const hasExperience = resume.experience.length > 0;
  const hasName = !!resume.personalInfo.name;
  const hasContact = !!resume.personalInfo.email || !!resume.personalInfo.phone;
  const confidence: ImportConfidence =
    hasName && hasContact && hasExperience ? 'high' :
    hasName && (hasContact || hasExperience) ? 'moderate' : 'low';

  return { resume, layout, styleOverrides, docxBuffer: buffer, confidence, warnings, sourceName: file.name };
}

export async function importTxt(file: File): Promise<ImportResult> {
  const text = await file.text();
  const resume = parseResumeText(text);
  const layout = { ...DEFAULT_LAYOUT };
  const styleOverrides = buildStyleOverrides(layout);

  const hasName = !!resume.personalInfo.name;
  const hasExperience = resume.experience.length > 0;
  const confidence: ImportConfidence = hasName && hasExperience ? 'moderate' : 'low';

  return {
    resume,
    layout,
    styleOverrides,
    confidence,
    warnings: ['Plain text import: layout could not be detected.'],
    sourceName: file.name,
  };
}

export async function importViaAI(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  // Use Uint8Array chunk approach for large files to avoid stack overflow
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const base64 = btoa(binary);
  const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

  const res = await fetch('/api/parse-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: base64, mimeType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `AI import failed (${res.status})`);
  }

  const ai = await res.json() as {
    html?: string;
    content?: Partial<ResumeData>;
    layout?: Partial<LayoutSchema>;
  };

  const layout: LayoutSchema = { ...DEFAULT_LAYOUT, ...ai.layout };
  const KNOWN = ['summary', 'experience', 'projects', 'education', 'skills', 'languages'];
  if (!layout.sectionOrder?.length) layout.sectionOrder = DEFAULT_LAYOUT.sectionOrder;
  for (const s of KNOWN) {
    if (!layout.sectionOrder.includes(s)) layout.sectionOrder.push(s);
  }

  const resume: ResumeData = {
    personalInfo: { name: '', title: '', email: '', phone: '', location: '' },
    summary: '',
    experience: [],
    projects: [],
    education: [],
    skills: [],
    languages: [],
    ...ai.content,
  };

  const styleOverrides = buildStyleOverrides(layout);

  return {
    resume,
    layout,
    styleOverrides,
    rawHtml: ai.html,    // AI-generated faithful HTML
    confidence: 'moderate',
    warnings: [],
    sourceName: file.name,
  };
}

export async function importFile(file: File): Promise<ImportResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'docx') return importDocx(file);
  if (ext === 'txt') return importTxt(file);
  if (ext === 'pdf' || ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') {
    return importViaAI(file);
  }
  throw new Error(`Unsupported file type: .${ext}. Please use DOCX, TXT, PDF, or image.`);
}
