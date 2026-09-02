import type { FitResult, PreflightResult } from '../types/tailor';
import type { ResumeChange } from '../types/tailor';

const MIN_SCALE = 0.82;

export function measureFit(containerEl: HTMLElement): FitResult {
  // Remove any existing fit-class overrides for a clean measurement
  const scrollH = containerEl.scrollHeight;
  const clientH = containerEl.clientHeight;
  const scrollW = containerEl.scrollWidth;
  const clientW = containerEl.clientWidth;

  const fits = scrollH <= clientH && scrollW <= clientW;
  const overflowRatio = scrollH / clientH;

  // Compute suggested scale needed
  const scale = fits ? 1 : Math.max(MIN_SCALE, 1 / overflowRatio);
  const readabilityScore = Math.round(Math.min(100, scale * 100 * (scale >= MIN_SCALE ? 1 : 0)));

  // Find overflowing sections
  const sections: string[] = [];
  containerEl.querySelectorAll('[data-section]').forEach((el) => {
    const rect = el.getBoundingClientRect();
    const parentRect = containerEl.getBoundingClientRect();
    if (rect.bottom > parentRect.bottom + 2) {
      sections.push((el as HTMLElement).dataset.section ?? 'unknown');
    }
  });

  // Find bullets that are long and could be shortened
  const suggestedShortening: string[] = [];
  containerEl.querySelectorAll('[data-bullet-id]').forEach((el) => {
    const text = el.textContent ?? '';
    if (text.length > 120) {
      suggestedShortening.push((el as HTMLElement).dataset.bulletId ?? '');
    }
  });

  let message = 'Resume fits within one page.';
  if (!fits && scale >= MIN_SCALE) {
    message = `Content is slightly over — applying ${Math.round(scale * 100)}% scale to fit.`;
  } else if (!fits && scale < MIN_SCALE) {
    message = 'Content is too dense for a readable one-page resume. Consider shortening long bullet points.';
  }

  return {
    fits,
    scale,
    overflowingSections: [...new Set(sections)],
    suggestedShortening,
    readabilityScore,
    message,
  };
}

export function runPreflight(
  containerEl: HTMLElement,
  proposedChanges: ResumeChange[],
  warnings: import('../types/tailor').TruthfulnessWarning[]
): PreflightResult {
  const fitResult = measureFit(containerEl);

  const pendingChanges = proposedChanges.filter((c) => c.status === 'pending');
  const blockedWarnings = warnings.filter((w) => w.severity === 'blocked');

  // Check date alignment
  const dateCells = Array.from(containerEl.querySelectorAll('.entry-date'));
  const dateRights = dateCells.map((el) => Math.round(el.getBoundingClientRect().right));
  const uniqueRights = [...new Set(dateRights)];
  const datesAligned = uniqueRights.length <= 1 || Math.max(...dateRights) - Math.min(...dateRights) <= 2;

  const titleCells = Array.from(containerEl.querySelectorAll('.entry-title'));
  const titleLefts = titleCells.map((el) => Math.round(el.getBoundingClientRect().left));
  const uniqueLefts = [...new Set(titleLefts)];
  const titlesAligned = uniqueLefts.length <= 1 || Math.max(...titleLefts) - Math.min(...titleLefts) <= 2;

  // Check horizontal overflow on children
  let hasHorizontalOverflow = false;
  containerEl.querySelectorAll('*').forEach((el) => {
    if ((el as HTMLElement).scrollWidth > (el as HTMLElement).clientWidth + 2) {
      hasHorizontalOverflow = true;
    }
  });

  const checks = [
    {
      name: 'Content fits Letter page',
      passed: fitResult.fits || fitResult.scale >= MIN_SCALE,
      detail: fitResult.message,
    },
    {
      name: 'No horizontal overflow',
      passed: !hasHorizontalOverflow,
      detail: hasHorizontalOverflow ? 'Some content extends beyond the page width.' : undefined,
    },
    {
      name: 'Date columns aligned',
      passed: datesAligned,
      detail: !datesAligned ? 'Date right-edges are misaligned.' : undefined,
    },
    {
      name: 'Title columns aligned',
      passed: titlesAligned,
      detail: !titlesAligned ? 'Title left-edges are misaligned.' : undefined,
    },
    {
      name: 'Scale above readability threshold',
      passed: fitResult.scale >= MIN_SCALE,
      detail:
        fitResult.scale < MIN_SCALE
          ? `Current scale ${Math.round(fitResult.scale * 100)}% is below the ${Math.round(MIN_SCALE * 100)}% minimum.`
          : undefined,
    },
    {
      name: 'No blocked truthfulness warnings',
      passed: blockedWarnings.length === 0,
      detail:
        blockedWarnings.length > 0
          ? `${blockedWarnings.length} blocked warning(s) must be resolved before export.`
          : undefined,
    },
    {
      name: 'No unresolved AI changes',
      passed: pendingChanges.length === 0,
      detail:
        pendingChanges.length > 0
          ? `${pendingChanges.length} change(s) are still pending. Accept or reject all changes before exporting.`
          : undefined,
    },
  ];

  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
}
