/**
 * Paste-to-match: user pastes modified text from an external AI tool.
 * We find the closest matching field in the resume and create a ResumeChange.
 */
import type { ResumeData } from '../types/resume';
import type { ResumeChange } from '../types/tailor';

function uuid(): string {
  return Math.random().toString(36).slice(2, 10);
}

type FieldEntry = {
  changeId: string;
  section: ResumeChange['section'];
  targetId: string;
  field: string;
  original: string;
  label: string;
};

function getAllFields(resume: ResumeData): FieldEntry[] {
  const entries: FieldEntry[] = [];

  entries.push({
    changeId: uuid(),
    section: 'summary',
    targetId: 'summary',
    field: 'summary',
    original: resume.summary,
    label: 'Summary',
  });

  for (const exp of resume.experience) {
    for (const bullet of exp.bullets) {
      entries.push({
        changeId: uuid(),
        section: 'experience',
        targetId: exp.id,
        field: `bullet:${bullet.id}`,
        original: bullet.text,
        label: `${exp.company} — bullet`,
      });
    }
  }

  for (const proj of resume.projects) {
    for (const bullet of proj.bullets) {
      entries.push({
        changeId: uuid(),
        section: 'projects',
        targetId: proj.id,
        field: `bullet:${bullet.id}`,
        original: bullet.text,
        label: `${proj.name} — bullet`,
      });
    }
  }

  return entries;
}

// Normalized word-overlap similarity (Jaccard-like)
function similarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export type PasteMatchResult = {
  change: ResumeChange;
  confidence: 'high' | 'medium' | 'low';
  matchedLabel: string;
};

export function matchPastedText(
  pastedText: string,
  resume: ResumeData
): PasteMatchResult | null {
  const trimmed = pastedText.trim();
  if (!trimmed) return null;

  const fields = getAllFields(resume);
  let best: FieldEntry | null = null;
  let bestScore = 0;

  for (const f of fields) {
    const score = similarity(f.original, trimmed);
    if (score > bestScore) {
      bestScore = score;
      best = f;
    }
  }

  if (!best || bestScore < 0.08) return null;  // no reasonable match

  const confidence: PasteMatchResult['confidence'] =
    bestScore >= 0.5 ? 'high' : bestScore >= 0.25 ? 'medium' : 'low';

  const change: ResumeChange = {
    id: best.changeId,
    section: best.section,
    targetId: best.targetId,
    field: best.field,
    before: best.original,
    after: trimmed,
    reason: 'Pasted from external editor. Matched to this field by text similarity.',
    jdEvidence: [],
    resumeEvidence: [best.original.slice(0, 80)],
    changeType: 'rewrite',
    riskLevel: 'review',
    status: 'pending',
  };

  return { change, confidence, matchedLabel: best.label };
}
