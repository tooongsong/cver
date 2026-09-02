import { useState } from 'react';
import type { ResumeVersion } from '../../types/tailor';
import styles from './VersionSwitcher.module.css';

type Props = {
  versions: ResumeVersion[];
  onRestore: (version: ResumeVersion) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onSaveCurrent: () => void;
};

export function VersionSwitcher({ versions, onRestore, onDuplicate, onRename, onSaveCurrent }: Props) {
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.trigger} onClick={() => setOpen((o) => !o)}>
        <span>Versions</span>
        <span className={styles.badge}>{versions.length}</span>
        <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
      </button>
      <button className={styles.saveCurrent} onClick={onSaveCurrent}>
        Save snapshot
      </button>

      {open && (
        <div className={styles.dropdown}>
          {versions.length === 0 ? (
            <p className={styles.empty}>No saved versions yet.</p>
          ) : (
            versions.map((v) => (
              <div key={v.id} className={styles.versionRow}>
                {renamingId === v.id ? (
                  <input
                    className={styles.renameInput}
                    value={renameDraft}
                    autoFocus
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onBlur={() => {
                      if (renameDraft.trim()) onRename(v.id, renameDraft.trim());
                      setRenamingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (renameDraft.trim()) onRename(v.id, renameDraft.trim());
                        setRenamingId(null);
                      }
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                  />
                ) : (
                  <div className={styles.versionInfo}>
                    <span className={styles.versionName}>{v.name}</span>
                    <span className={styles.versionMeta}>
                      {formatDate(v.createdAt)}
                      {v.targetCompany ? ` · ${v.targetCompany}` : ''}
                    </span>
                  </div>
                )}
                <div className={styles.versionActions}>
                  <button
                    className={styles.versionBtn}
                    onClick={() => { onRestore(v); setOpen(false); }}
                  >
                    Restore
                  </button>
                  <button
                    className={styles.versionBtn}
                    onClick={() => onDuplicate(v.id)}
                  >
                    Duplicate
                  </button>
                  <button
                    className={styles.versionBtn}
                    onClick={() => { setRenamingId(v.id); setRenameDraft(v.name); }}
                  >
                    Rename
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
