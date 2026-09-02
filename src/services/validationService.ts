import type { ResumeData } from '../types/resume';
import type { ResumeChange, TruthfulnessWarning } from '../types/tailor';

function extractNumbers(text: string): string[] {
  return (text.match(/\d[\d,.%$kmKM]+/g) ?? []);
}

function textContains(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function validateChanges(
  changes: ResumeChange[],
  originalResume: ResumeData
): TruthfulnessWarning[] {
  const warnings: TruthfulnessWarning[] = [];

  for (const change of changes) {
    if (change.section === 'experience') {
      const original = originalResume.experience.find((e) => e.id === change.targetId);
      if (!original) continue;

      // Check protected fields
      if (change.field === 'title' && change.after !== original.title) {
        warnings.push({
          id: `warn-${change.id}-title`,
          severity: 'blocked',
          changeId: change.id,
          message: `Job title changed from "${original.title}" to "${change.after}". Protected field.`,
          originalEvidence: original.title,
          proposedValue: change.after,
        });
      }

      if (change.field === 'company' && change.after !== original.company) {
        warnings.push({
          id: `warn-${change.id}-company`,
          severity: 'blocked',
          changeId: change.id,
          message: `Company name changed from "${original.company}" to "${change.after}". Protected field.`,
          originalEvidence: original.company,
          proposedValue: change.after,
        });
      }

      // Check for invented numbers in bullet rewrites
      if (change.field.startsWith('bullet:')) {
        const originalNums = extractNumbers(change.before);
        const proposedNums = extractNumbers(change.after);
        const newNums = proposedNums.filter((n) => !originalNums.includes(n));
        if (newNums.length > 0) {
          warnings.push({
            id: `warn-${change.id}-nums`,
            severity: 'review',
            changeId: change.id,
            message: `New metric "${newNums.join(', ')}" appears in the proposed text but not in the original. Verify this is accurate.`,
            originalEvidence: change.before,
            proposedValue: change.after,
          });
        }

        // Check for fabricated tool names (capitalized words not in original resume)
        const originalResumeText = JSON.stringify(originalResume).toLowerCase();
        const newCapWords = (change.after.match(/\b[A-Z][a-zA-Z0-9.]+\b/g) ?? []).filter(
          (w) => !textContains(change.before, w) && !textContains(originalResumeText, w.toLowerCase())
        );
        if (newCapWords.length > 0) {
          warnings.push({
            id: `warn-${change.id}-tools`,
            severity: 'review',
            changeId: change.id,
            message: `Tool or technology "${newCapWords.join(', ')}" appears in the suggested text but was not found in your original resume.`,
            proposedValue: change.after,
          });
        }
      }
    }

    // Flag changes that AI already marked as blocked
    if (
      change.riskLevel === 'blocked' &&
      !warnings.some((w) => w.changeId === change.id)
    ) {
      warnings.push({
        id: `warn-${change.id}-risk`,
        severity: 'blocked',
        changeId: change.id,
        message: change.reason,
      });
    }
  }

  return warnings;
}
