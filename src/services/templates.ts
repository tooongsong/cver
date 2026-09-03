import type { ResumeSignals, Seniority, Field } from './resumeAnalyzer';

export type TemplatePreset = {
  id: string;
  name: string;
  tagline: string;
  suitedFor: string;
  styleOverrides: Record<string, string>;
  previewSwatch: {   // used to render a mini card without a full render
    accent: string;
    bgFont: string;
    dividers: boolean;
    columns: 1 | 2;
  };
};

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'compact-classic',
    name: 'Compact Classic',
    tagline: 'Dense, ATS-safe, single column',
    suitedFor: 'Tech · Finance · Mid to senior',
    styleOverrides: {
      '--resume-font': `'Arimo', Arial, 'Helvetica Neue', sans-serif`,
      '--resume-heading-font': `'Arimo', Arial, sans-serif`,
      '--resume-name-font': `'Arimo', Arial, sans-serif`,
      '--resume-font-size': '10.5pt',
      '--resume-line-height': '1.28',
      '--resume-name-size': '18pt',
      '--resume-section-title-size': '10pt',
      '--resume-section-title-transform': 'uppercase',
      '--resume-section-title-spacing': '0.10em',
      '--resume-margin-top': '0.45in',
      '--resume-margin-right': '0.55in',
      '--resume-margin-bottom': '0.45in',
      '--resume-margin-left': '0.55in',
      '--resume-section-gap': '10pt',
      '--resume-entry-gap': '6pt',
      '--resume-bullet-indent': '12pt',
      '--resume-accent': '#1a1a1a',
    },
    previewSwatch: { accent: '#1a1a1a', bgFont: 'sans', dividers: true, columns: 1 },
  },
  {
    id: 'executive-serif',
    name: 'Executive Serif',
    tagline: 'Elegant, spacious, serif type',
    suitedFor: 'Senior · Executive · Consulting',
    styleOverrides: {
      '--resume-font': `'Tinos', 'Times New Roman', Georgia, serif`,
      '--resume-heading-font': `'Tinos', 'Times New Roman', serif`,
      '--resume-name-font': `'Tinos', 'Times New Roman', serif`,
      '--resume-font-size': '11pt',
      '--resume-line-height': '1.4',
      '--resume-name-size': '22pt',
      '--resume-section-title-size': '11pt',
      '--resume-section-title-transform': 'uppercase',
      '--resume-section-title-spacing': '0.14em',
      '--resume-margin-top': '0.7in',
      '--resume-margin-right': '0.75in',
      '--resume-margin-bottom': '0.7in',
      '--resume-margin-left': '0.75in',
      '--resume-section-gap': '14pt',
      '--resume-entry-gap': '8pt',
      '--resume-bullet-indent': '14pt',
      '--resume-accent': '#2a2a2a',
    },
    previewSwatch: { accent: '#2a2a2a', bgFont: 'serif', dividers: true, columns: 1 },
  },
  {
    id: 'modern-accent',
    name: 'Modern Accent',
    tagline: 'Clean sans-serif with color accent',
    suitedFor: 'Design · Junior · Marketing',
    styleOverrides: {
      '--resume-font': `'Carlito', 'Calibri', system-ui, sans-serif`,
      '--resume-heading-font': `'Carlito', 'Calibri', sans-serif`,
      '--resume-name-font': `'Carlito', 'Calibri', sans-serif`,
      '--resume-font-size': '10.5pt',
      '--resume-line-height': '1.35',
      '--resume-name-size': '20pt',
      '--resume-section-title-size': '10.5pt',
      '--resume-section-title-transform': 'uppercase',
      '--resume-section-title-spacing': '0.12em',
      '--resume-margin-top': '0.5in',
      '--resume-margin-right': '0.6in',
      '--resume-margin-bottom': '0.5in',
      '--resume-margin-left': '0.6in',
      '--resume-section-gap': '12pt',
      '--resume-entry-gap': '7pt',
      '--resume-bullet-indent': '12pt',
      '--resume-accent': '#7c3aed',
    },
    previewSwatch: { accent: '#7c3aed', bgFont: 'sans', dividers: false, columns: 1 },
  },
];

export function recommendTemplate(signals: ResumeSignals): { top: TemplatePreset; reason: string } {
  const map: Record<Seniority, Record<Field, string>> = {
    junior:    { tech: 'modern-accent', design: 'modern-accent', finance: 'compact-classic', marketing: 'modern-accent', operations: 'compact-classic', other: 'modern-accent' },
    mid:       { tech: 'compact-classic', design: 'modern-accent', finance: 'compact-classic', marketing: 'modern-accent', operations: 'compact-classic', other: 'compact-classic' },
    senior:    { tech: 'compact-classic', design: 'modern-accent', finance: 'executive-serif', marketing: 'compact-classic', operations: 'executive-serif', other: 'executive-serif' },
    executive: { tech: 'executive-serif', design: 'executive-serif', finance: 'executive-serif', marketing: 'executive-serif', operations: 'executive-serif', other: 'executive-serif' },
  };
  const topId = map[signals.seniority][signals.field];
  const top = TEMPLATE_PRESETS.find((t) => t.id === topId) ?? TEMPLATE_PRESETS[0];

  const reason = `${signals.seniority.toUpperCase()} · ${signals.field.toUpperCase()} · ${signals.yearsOfExperience || 0} yrs`;
  return { top, reason };
}
