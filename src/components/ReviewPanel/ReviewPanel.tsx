import type { ResumeChange, TruthfulnessWarning, FitResult } from '../../types/tailor';
import { ChangeItem } from './ChangeItem';
import { FitIndicator } from './FitIndicator';
import styles from './ReviewPanel.module.css';

type Props = {
  proposedChanges: ResumeChange[];
  warnings: TruthfulnessWarning[];
  fitResult: FitResult;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onUndo: (id: string) => void;
  onEdit: (id: string, value: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onRestoreOriginal: () => void;
};

export function ReviewPanel({
  proposedChanges,
  warnings,
  fitResult,
  onAccept,
  onReject,
  onUndo,
  onEdit,
  onAcceptAll,
  onRejectAll,
  onRestoreOriginal,
}: Props) {
  const pendingCount = proposedChanges.filter((c) => c.status === 'pending').length;
  const acceptedCount = proposedChanges.filter((c) => c.status === 'accepted' || c.status === 'edited').length;
  const blockedCount = proposedChanges.filter((c) => c.riskLevel === 'blocked').length;

  const blockedWarnings = warnings.filter((w) => w.severity === 'blocked');
  const reviewWarnings = warnings.filter((w) => w.severity === 'review');

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Suggested changes</h2>
        <span className={styles.count}>
          {proposedChanges.length > 0
            ? `${acceptedCount} accepted · ${pendingCount} pending`
            : 'No suggestions yet'}
        </span>
      </div>

      <FitIndicator fit={fitResult} />

      {proposedChanges.length > 0 && (
        <div className={styles.bulkActions}>
          <button className={styles.btnAcceptAll} onClick={onAcceptAll} disabled={pendingCount === 0}>
            {blockedCount > 0 ? 'Accept safe changes' : 'Accept all'}
          </button>
          <button className={styles.btnRejectAll} onClick={onRejectAll} disabled={pendingCount === 0}>
            Reject all
          </button>
          <button className={styles.btnRestore} onClick={onRestoreOriginal}>
            Restore original
          </button>
        </div>
      )}

      {/* Blocked warnings */}
      {blockedWarnings.length > 0 && (
        <div className={styles.warningBox}>
          <p className={styles.warningTitle}>{blockedWarnings.length === 1 ? '1 suggestion needs evidence' : `${blockedWarnings.length} suggestions need evidence`}</p>
          {blockedWarnings.map((w) => (
            <p key={w.id} className={styles.warningText}>{w.message}</p>
          ))}
        </div>
      )}

      {/* Review warnings */}
      {reviewWarnings.length > 0 && (
        <div className={styles.reviewBox}>
          <p className={styles.warningTitle}>{reviewWarnings.length === 1 ? '1 suggestion to check' : `${reviewWarnings.length} suggestions to check`}</p>
          {reviewWarnings.map((w) => (
            <p key={w.id} className={styles.warningText}>{w.message}</p>
          ))}
        </div>
      )}

      {proposedChanges.length === 0 ? (
        <div className={styles.empty}>
          <p>Paste a job description to start comparing it with this resume.</p>
        </div>
      ) : (
        <div className={styles.changeList}>
          {proposedChanges.map((change) => (
            <ChangeItem
              key={change.id}
              change={change}
              onAccept={() => onAccept(change.id)}
              onReject={() => onReject(change.id)}
              onUndo={() => onUndo(change.id)}
              onEdit={(v) => onEdit(change.id, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
