import styles from './DiffViewer.module.css';

type Segment = { type: 'unchanged' | 'removed' | 'added'; text: string };

function wordDiff(before: string, after: string): { before: Segment[]; after: Segment[] } {
  const beforeWords = before.split(/(\s+)/);
  const afterWords = after.split(/(\s+)/);

  // Simple LCS-based word diff
  const m = beforeWords.length;
  const n = afterWords.length;

  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i][j] = beforeWords[i] === afterWords[j]
        ? 1 + lcs[i + 1][j + 1]
        : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const beforeSegs: Segment[] = [];
  const afterSegs: Segment[] = [];

  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && beforeWords[i] === afterWords[j]) {
      beforeSegs.push({ type: 'unchanged', text: beforeWords[i] });
      afterSegs.push({ type: 'unchanged', text: afterWords[j] });
      i++; j++;
    } else if (j < n && (i >= m || lcs[i][j + 1] >= lcs[i + 1][j])) {
      afterSegs.push({ type: 'added', text: afterWords[j] });
      j++;
    } else {
      beforeSegs.push({ type: 'removed', text: beforeWords[i] });
      i++;
    }
  }

  return { before: beforeSegs, after: afterSegs };
}

type Props = {
  before: string;
  after: string;
  compact?: boolean;
};

export function DiffViewer({ before, after, compact = false }: Props) {
  const { before: beforeSegs, after: afterSegs } = wordDiff(before, after);
  const hasChanges = beforeSegs.some((s) => s.type !== 'unchanged') ||
                     afterSegs.some((s) => s.type !== 'unchanged');

  if (!hasChanges) {
    return (
      <div className={styles.noChange}>
        <span className={styles.noChangeText}>No textual difference — ordering or structure changed.</span>
      </div>
    );
  }

  return (
    <div className={`${styles.diff} ${compact ? styles.compact : ''}`}>
      <div className={styles.side}>
        <span className={styles.label} aria-label="Original text">Original</span>
        <p className={styles.text}>
          {beforeSegs.map((seg, i) => (
            <span
              key={i}
              className={seg.type === 'removed' ? styles.removed : styles.unchanged}
            >
              {seg.text}
            </span>
          ))}
        </p>
      </div>
      <div className={styles.side}>
        <span className={styles.label} aria-label="Proposed text">Proposed</span>
        <p className={styles.text}>
          {afterSegs.map((seg, i) => (
            <span
              key={i}
              className={seg.type === 'added' ? styles.added : styles.unchanged}
            >
              {seg.text}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
