export type LayoutSchema = {
  pageSize: 'letter' | 'a4';
  margins: { top: string; right: string; bottom: string; left: string };
  columns: 1 | 2;
  sectionOrder: string[];

  fontFamily: string;
  bodySize: string;    // e.g. "10pt"
  nameSize: string;    // e.g. "18pt"
  headingSize: string; // e.g. "9pt"
  lineHeight: number;  // e.g. 1.45

  sectionGap: string;    // CSS value, e.g. "0.10in"
  entryGap: string;      // CSS value, e.g. "0.08in"
  bulletIndent: string;  // CSS value, e.g. "10pt"

  accentColor: string;
  headingUppercase: boolean;
  showDividers: boolean;
  dateAlignment: 'right' | 'inline';
};

export const DEFAULT_LAYOUT: LayoutSchema = {
  pageSize: 'letter',
  margins: { top: '0.55in', right: '0.55in', bottom: '0.55in', left: '0.55in' },
  columns: 1,
  sectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'languages'],

  fontFamily: "'Inter', Arial, sans-serif",
  bodySize: '10pt',
  nameSize: '18pt',
  headingSize: '9pt',
  lineHeight: 1.45,

  sectionGap: '0.10in',
  entryGap: '0.08in',
  bulletIndent: '0pt',

  accentColor: '#1a1a1a',
  headingUppercase: true,
  showDividers: true,
  dateAlignment: 'right',
};
