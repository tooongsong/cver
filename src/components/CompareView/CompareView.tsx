import { useEffect, useRef, useState, type ReactNode } from 'react';
import { renderAsync } from 'docx-preview';
import styles from './CompareView.module.css';

export type OriginalSnapshot =
  | { kind: 'image'; base64: string; mime: string }   // PDF / JPG / PNG
  | { kind: 'docx'; buffer: ArrayBuffer };            // DOCX rendered via docx-preview

type Props = {
  snapshot: OriginalSnapshot;
  currentPane: ReactNode;   // caller renders the current editor state here
  onExit: () => void;
};

export function CompareView({ snapshot, currentPane, onExit }: Props) {
  const [mode, setMode] = useState<'split' | 'overlay'>('split');
  const [opacity, setOpacity] = useState(50);   // for overlay: how visible the current pane is

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${mode === 'split' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('split')}
          >
            SPLIT
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'overlay' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('overlay')}
          >
            OVERLAY
          </button>
        </div>

        {mode === 'overlay' && (
          <div className={styles.opacityControl}>
            <span className={styles.opacityLabel}>ORIGINAL</span>
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value, 10))}
              className={styles.slider}
            />
            <span className={styles.opacityLabel}>EDITED</span>
          </div>
        )}

        <button className={styles.exitBtn} onClick={onExit}>
          ✕ EXIT COMPARE
        </button>
      </div>

      {mode === 'split' ? (
        <div className={styles.splitCanvas}>
          <div className={styles.pane}>
            <div className={styles.paneLabel}>ORIGINAL</div>
            <div className={styles.paneBody}>
              <OriginalRenderer snapshot={snapshot} />
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.pane}>
            <div className={styles.paneLabel}>EDITED</div>
            <div className={styles.paneBody}>{currentPane}</div>
          </div>
        </div>
      ) : (
        <div className={styles.overlayCanvas}>
          <div className={styles.overlayLayer} style={{ opacity: (100 - opacity) / 100 }}>
            <OriginalRenderer snapshot={snapshot} />
          </div>
          <div className={styles.overlayLayer} style={{ opacity: opacity / 100 }}>
            {currentPane}
          </div>
        </div>
      )}
    </div>
  );
}

function OriginalRenderer({ snapshot }: { snapshot: OriginalSnapshot }) {
  if (snapshot.kind === 'image') {
    return (
      <img
        src={`data:${snapshot.mime};base64,${snapshot.base64}`}
        className={styles.originalImage}
        alt="Original resume"
      />
    );
  }
  return <DocxReadOnly buffer={snapshot.buffer} />;
}

function DocxReadOnly({ buffer }: { buffer: ArrayBuffer }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    renderAsync(buffer, el, undefined, {
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      useBase64URL: true,
      className: 'docx',
    }).catch((err) => console.error('[compare] docx render failed', err));
  }, [buffer]);
  return <div ref={ref} className={styles.docxHost} />;
}
