import type { ResumeData } from '../types/resume';

export type Seniority = 'junior' | 'mid' | 'senior' | 'executive';
export type Field = 'tech' | 'design' | 'finance' | 'marketing' | 'operations' | 'other';

export type ResumeSignals = {
  seniority: Seniority;
  yearsOfExperience: number;
  field: Field;
  hasMultipleRoles: boolean;
  skillsCount: number;
  bulletCount: number;
};

const FIELD_KEYWORDS: Record<Field, string[]> = {
  tech: [
    'engineer', 'developer', 'programmer', 'software', 'backend', 'frontend',
    'full stack', 'fullstack', 'devops', 'sre', 'data scientist', 'machine learning',
    'ml', 'ai', 'ios', 'android', 'mobile', 'cloud', 'architect', 'sdet', 'qa',
    'python', 'javascript', 'typescript', 'java', 'react', 'aws', 'kubernetes',
  ],
  design: [
    'designer', 'ux', 'ui', 'creative', 'art director', 'illustrator',
    'motion', 'brand designer', 'figma', 'sketch', 'photoshop',
  ],
  finance: [
    'analyst', 'banker', 'trader', 'accountant', 'cpa', 'cfa',
    'investment', 'private equity', 'venture', 'audit', 'controller', 'treasurer',
    'financial', 'quant', 'risk',
  ],
  marketing: [
    'marketing', 'brand manager', 'growth', 'seo', 'sem', 'content',
    'social media', 'campaign', 'digital marketing', 'copywriter',
  ],
  operations: [
    'operations', 'ops', 'supply chain', 'logistics', 'project manager',
    'program manager', 'consultant', 'business analyst', 'strategy',
  ],
  other: [],
};

function parseYear(dateStr: string): number | null {
  if (!dateStr) return null;
  if (/present|current|now/i.test(dateStr)) return new Date().getFullYear();
  const m = dateStr.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
}

function calcYearsOfExperience(resume: ResumeData): number {
  const years: number[] = [];
  const now = new Date().getFullYear();
  for (const exp of resume.experience) {
    const start = parseYear(exp.startDate);
    const end = parseYear(exp.endDate) ?? now;
    if (start && end >= start) years.push(end - start);
  }
  return years.reduce((a, b) => a + b, 0);
}

function classifyField(resume: ResumeData): Field {
  const haystack = [
    ...resume.experience.map((e) => `${e.title} ${e.company}`),
    ...resume.skills.flatMap((g) => [g.category, ...g.skills]),
    resume.personalInfo.title ?? '',
    resume.summary ?? '',
  ]
    .join(' ')
    .toLowerCase();

  const scores: Record<Field, number> = {
    tech: 0, design: 0, finance: 0, marketing: 0, operations: 0, other: 0,
  };
  (Object.keys(FIELD_KEYWORDS) as Field[]).forEach((field) => {
    for (const kw of FIELD_KEYWORDS[field]) {
      // Count occurrences (word-boundary-ish)
      const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      const matches = haystack.match(re);
      if (matches) scores[field] += matches.length;
    }
  });

  let best: Field = 'other';
  let bestScore = 0;
  (Object.keys(scores) as Field[]).forEach((f) => {
    if (scores[f] > bestScore) { best = f; bestScore = scores[f]; }
  });
  return best;
}

export function analyzeResume(resume: ResumeData): ResumeSignals {
  const yearsOfExperience = calcYearsOfExperience(resume);
  const seniority: Seniority =
    yearsOfExperience >= 15 ? 'executive'
    : yearsOfExperience >= 7 ? 'senior'
    : yearsOfExperience >= 3 ? 'mid'
    : 'junior';

  return {
    seniority,
    yearsOfExperience,
    field: classifyField(resume),
    hasMultipleRoles: resume.experience.length >= 2,
    skillsCount: resume.skills.reduce((n, g) => n + g.skills.length, 0),
    bulletCount: resume.experience.reduce((n, e) => n + e.bullets.length, 0),
  };
}
