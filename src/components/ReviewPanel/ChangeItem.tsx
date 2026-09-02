import { useState } from 'react';
import type { ResumeChange } from '../../types/tailor';
import { DiffViewer } from './DiffViewer';
import styles from './ChangeItem.module.css';

type Props = {
  change: ResumeChange;
  onAccept: () => void;
  onReject: () => void;
  onUndo: () => void;
  onEdit: (newValue: string) => void;
};

const RISK_LABELS: Record<ResumeChange['riskLevel'], string> = {
  safe: 'Safe',
  review: 'Verify before accepting',
  blocked: 'Blocked: adds a claim not in your resume',
};

const CHANGE_TYPE_LABELS: Record<ResumeChange['changeType'], string> = {
  rewrite: 'Rewrite',
  shorten: 'Shorten',
  reorder: 'Reorder',
  remove: 'Remove',
};

const STATUS_LABELS: Record<ResumeChange['status'], string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  edited: 'Edited',
};

export function ChangeItem({ change, onAccept, onReject, onUndo, onEdit }: Props) {
  const [expanded, setExpanded] = useState(change.status === 'pending');
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(change.after);

  const commitEdit = () => {
    onEdit(editDraft);
    setEditing(false);
  };

  const fieldLabel = change.field === 'summary'
    ? 'Summary'
    : change.field === 'title'
    ? 'Job Title'
    : change.field === 'skills'
    ? 'Skills'
    : change.field.startsWith('bullet:')
    ? 'Bullet point'
    : change.field;

  return (
    <div
      className={`${styles.item} ${styles[`risk_${change.riskLevel}`]} ${styles[`status_${change.status}`]}`}
      aria-label={`Change: ${fieldLabel}`}
    >
      {/* Header row */}
      <button
        className={styles.headerBtn}
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div className={styles.headerLeft}>
          <span className={`${styles.riskDot} ${styles[`dot_${change.riskLevel}`]}`} aria-hidden />
          <span className={styles.fieldLabel}>{fieldLabel}</span>
          <span className={styles.typeChip}>{CHANGE_TYPE_LABELS[change.changeType]}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={`${styles.statusChip} ${styles[`statusChip_${change.status}`]}`}>
            {STATUS_LABELS[change.status]}
          </span>
          <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className={styles.body}>
          {/* Risk warning */}
          {change.riskLevel !== 'safe' && (
            <p className={`${styles.riskBanner} ${styles[`riskBanner_${change.riskLevel}`]}`}>
              {RISK_LABELS[change.riskLevel]}
            </p>
          )}

          {/* Reason */}
          <p className={styles.reason}>{change.reason}</p>

          {/* JD evidence */}
          {change.jdEvidence.length > 0 && (
            <div className={styles.evidenceGroup}>
              <p className={styles.evidenceLabel}>From the job description</p>
              {change.jdEvidence.map((e, i) => (
                <p key={i} className={styles.evidenceText}>"{e}"</p>
              ))}
            </div>
          )}

          {/* Diff */}
          {!editing ? (
            <DiffViewer before={change.before} after={change.after} />
          ) : (
            <div className={styles.editArea}>
              <p className={styles.evidenceLabel}>Edit suggestion</p>
              <textarea
                className={styles.editTextarea}
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                rows={4}
              />
              <div className={styles.editActions}>
                <button className={styles.btnSave} onClick={commitEdit}>Save</button>
                <button className={styles.btnCancel} onClick={() => { setEditing(false); setEditDraft(change.after); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            {change.status === 'pending' && (
              <>
                <button
                  className={styles.btnAccept}
                  onClick={onAccept}
                  disabled={change.riskLevel === 'blocked'}
                  title={change.riskLevel === 'blocked' ? 'This suggestion adds a claim not in your original resume.' : undefined}
                >
                  Accept
                </button>
                <button className={styles.btnReject} onClick={onReject}>
                  Reject
                </button>
                {!editing && (
                  <button className={styles.btnEdit} onClick={() => { setEditing(true); setEditDraft(change.after); }}>
                    Edit
                  </button>
                )}
              </>
            )}
            {(change.status === 'accepted' || change.status === 'edited') && (
              <button className={styles.btnUndo} onClick={onUndo}>
                Undo
              </button>
            )}
            {change.status === 'rejected' && (
              <button className={styles.btnUndo} onClick={onUndo}>
                Restore
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
