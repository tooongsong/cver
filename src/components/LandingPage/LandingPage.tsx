import { useRef, useState } from 'react';
import type { ResumeData } from '../../types/resume';
import type { LayoutSchema } from '../../types/layout';
import { importFile } from '../../services/importService';
import styles from './LandingPage.module.css';

type Props = {
  onLoad: (resume: ResumeData, styleOverrides: Record<string, string>, layout: LayoutSchema, rawHtml?: string, docxBuffer?: ArrayBuffer) => void;
  onUseSample: () => void;
};

export function LandingPage({ onLoad, onUseSample }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const result = await importFile(file);
      onLoad(result.resume, result.styleOverrides, result.layout, result.rawHtml, result.docxBuffer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Try a .docx or .txt file.');
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className={styles.landing}>
      <div className={styles.grid} aria-hidden />

      <div className={styles.content}>
        <div className={styles.brand}>CVER_</div>

        <div className={styles.headline}>
          <h1 className={styles.title}>
            REBUILD YOUR RESUME<br />AS EDITABLE HTML
          </h1>
          <p className={styles.subtitle}>
            Import your existing resume. Cver will preserve its visual
            identity and rebuild it as a one-page, editable document.
          </p>
        </div>

        <div
          className={`${styles.dropZone} ${dragging ? styles.dragOver : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !loading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".docx,.txt,.pdf,.jpg,.jpeg,.png,.webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          {loading ? (
            <div className={styles.loadingState}>
              <span className={styles.spinner} />
              <span>PARSING RESUME…</span>
            </div>
          ) : (
            <>
              <div className={styles.dropIcon}>↑</div>
              <div className={styles.dropLabel}>IMPORT DOCX / PDF / IMAGE</div>
              <div className={styles.dropHint}>DRAG &amp; DROP OR CLICK TO BROWSE</div>
            </>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.secondaryRow}>
          <button className={styles.secondaryBtn} onClick={onUseSample}>
            OPEN SAMPLE RESUME
          </button>
        </div>

        <p className={styles.note}>
          DOCX · PDF · Image &nbsp;·&nbsp; Files processed locally &nbsp;·&nbsp; No account required
        </p>
      </div>

      <div className={styles.statusBar} aria-hidden>
        <span>DOC_00</span>
        <span>LETTER / 8.5 × 11</span>
      </div>
    </div>
  );
}
