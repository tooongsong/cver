export type SectionHeaderStyle = 'rule' | 'border-left' | 'plain' | 'overline';

export type ResumeTemplate = {
  id: string;
  name: string;
  description: string;
  cssVars: Record<string, string>;
  sectionHeaderStyle: SectionHeaderStyle;
};

export const TEMPLATES: ResumeTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean sans-serif with thin horizontal rules',
    sectionHeaderStyle: 'rule',
    cssVars: {
      '--resume-font': "'Inter', 'Calibri', Arial, sans-serif",
      '--resume-font-size': '10pt',
      '--resume-line-height': '1.45',
      '--resume-margin': '0.55in',
      '--resume-name-size': '18pt',
      '--resume-name-weight': '700',
      '--resume-section-title-size': '9pt',
      '--resume-section-title-transform': 'uppercase',
      '--resume-section-title-spacing': '0.08em',
      '--resume-section-title-color': '#1a1a1a',
      '--resume-accent': '#c47a2b',
      '--resume-rule-color': 'rgba(26,26,26,0.25)',
    },
  },
  {
    id: 'serif',
    name: 'Serif',
    description: 'Elegant serif type with left-border section markers',
    sectionHeaderStyle: 'border-left',
    cssVars: {
      '--resume-font': "Georgia, 'Times New Roman', serif",
      '--resume-font-size': '10.5pt',
      '--resume-line-height': '1.5',
      '--resume-margin': '0.6in',
      '--resume-name-size': '20pt',
      '--resume-name-weight': '400',
      '--resume-section-title-size': '9.5pt',
      '--resume-section-title-transform': 'none',
      '--resume-section-title-spacing': '0.02em',
      '--resume-section-title-color': '#2c2c2c',
      '--resume-accent': '#4a6fa5',
      '--resume-rule-color': 'rgba(74,111,165,0.5)',
    },
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Tighter spacing, more content on one page',
    sectionHeaderStyle: 'overline',
    cssVars: {
      '--resume-font': "'Inter', 'Helvetica Neue', Arial, sans-serif",
      '--resume-font-size': '9.5pt',
      '--resume-line-height': '1.38',
      '--resume-margin': '0.45in',
      '--resume-name-size': '16pt',
      '--resume-name-weight': '700',
      '--resume-section-title-size': '8pt',
      '--resume-section-title-transform': 'uppercase',
      '--resume-section-title-spacing': '0.12em',
      '--resume-section-title-color': '#444',
      '--resume-accent': '#2d6a4f',
      '--resume-rule-color': 'rgba(45,106,79,0.35)',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'No decorations, pure whitespace hierarchy',
    sectionHeaderStyle: 'plain',
    cssVars: {
      '--resume-font': "'Inter', system-ui, sans-serif",
      '--resume-font-size': '10pt',
      '--resume-line-height': '1.48',
      '--resume-margin': '0.6in',
      '--resume-name-size': '17pt',
      '--resume-name-weight': '600',
      '--resume-section-title-size': '8.5pt',
      '--resume-section-title-transform': 'uppercase',
      '--resume-section-title-spacing': '0.1em',
      '--resume-section-title-color': '#888',
      '--resume-accent': '#555',
      '--resume-rule-color': 'transparent',
    },
  },
];

export const DEFAULT_TEMPLATE_ID = 'classic';

export function getTemplate(id: string): ResumeTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
