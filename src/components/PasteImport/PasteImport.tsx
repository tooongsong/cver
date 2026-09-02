import { useState } from 'react';
import type { ResumeData } from '../../types/resume';
import type { ResumeChange } from '../../types/tailor';
import { matchPastedText } from '../../services/pasteMatchService';
import { DiffViewer } from '../ReviewPanel/DiffViewer';
import styles from './PasteImport.module.css';

type Props = {
  resume: ResumeData;
  onAddChange: (change: ResumeChange) => void;
};

const CONFIDENCE_LABEL = {
  high: { label: 'Strong match', color: 'var(--ai-add-text)', bg: 'var(--ai-add-bg)' },
  medium: { label: 'Possible match', color: 'var(--accent-hover)', bg: 'var(--accent-light)' },
  low: { label: 'Weak match — verify', color: 'var(--ai-remove-text)', bg: 'var(--ai-remove-bg)' },
};

export function PasteImport({ resume, onAddChange }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState<ReturnType<typeof matchPastedText>>(null);
  const [applied, setApplied] = useState(false);

  const handleMatch = () => {
    const r = matchPastedText(text, resume);
    setResult(r);
    setApplied(false);
  };

  const handleApply = () => {
    if (!result) return;
    onAddChange(result.change);
    setApplied(true);
    setText('');
    setResult(null);
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.trigger} onClick={() => { setOpen((o) => !o); setResult(null); setApplied(false); }}>
        {open ? 'Close' : 'Paste edited text'}
      </button>

      {open && (
        <div className={styles.panel}>
          <p className={styles.hint}>
            Paste text edited outside cver. The closest resume field is matched automatically and added as a tracked change.
          </p>

          <textarea
            className={styles.textarea}
            placeholder="Paste your edited summary, bullet point, or skill list here…"
            value={text}
            onChange={(e) => { setText(e.target.value); setResult(null); setApplied(false); }}
            rows={5}
          />

          <button
            className={styles.btnMatch}
            onClick={handleMatch}
            disabled={!text.trim()}
          >
            Match to resume
          </button>

          {result && (
            <div className={styles.result}>
              <div className={styles.resultHeader}>
                <span
                  className={styles.confidence}
                  style={{ color: CONFIDENCE_LABEL[result.confidence].color, background: CONFIDENCE_LABEL[result.confidence].bg }}
                >
                  {CONFIDENCE_LABEL[result.confidence].label}
                </span>
                <span className={styles.matchedField}>→ {result.matchedLabel}</span>
              </div>

              <DiffViewer before={result.change.before} after={result.change.after} />

              <div className={styles.actions}>
                <button className={styles.btnApply} onClick={handleApply}>
                  Add as tracked change
                </button>
                <button className={styles.btnDiscard} onClick={() => { setResult(null); setText(''); }}>
                  Discard
                </button>
              </div>
            </div>
          )}

          {!result && text.trim() && (
            <p className={styles.noMatch}>Click Match to resume to continue.</p>
          )}

          {applied && (
            <p className={styles.success}>Added to Suggested changes. Review it in the right panel.</p>
          )}

          {result === null && text.trim() === '' && (
            <p className={styles.noMatch}>No text pasted yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
