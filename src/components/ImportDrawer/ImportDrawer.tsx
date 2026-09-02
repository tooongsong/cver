import { useState, useRef } from 'react';
import type { ResumeData } from '../../types/resume';
import type { LayoutSchema } from '../../types/layout';
import type { ImportResult } from '../../services/importService';
import { importFile } from '../../services/importService';
import styles from './ImportDrawer.module.css';

type Props = {
  onLoad: (resume: ResumeData, styleOverrides: Record<string, string>, layout: LayoutSchema, rawHtml?: string) => void;
};

type State =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'preview'; result: ImportResult }
  | { phase: 'error'; message: string };

export function ImportDrawer({ onLoad }: Props) {
  const [state, setState] = useState<State>({ phase: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setState({ phase: 'loading' });
    try {
      const result = await importFile(file);
      setState({ phase: 'preview', result });
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleApply() {
    if (state.phase !== 'preview') return;
    onLoad(state.result.resume, state.result.styleOverrides, state.result.layout, state.result.rawHtml);
  }

  const confidenceLabel: Record<string, string> = {
    high: 'High confidence',
    moderate: 'Moderate confidence',
    low: 'Low confidence — review each section',
  };
  const confidenceClass: Record<string, string> = {
    high: styles.confHigh,
    moderate: styles.confMod,
    low: styles.confLow,
  };

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.dropZone}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".docx,.txt,.pdf,.jpg,.jpeg,.png,.webp"
          className={styles.hiddenInput}
          onChange={handleInputChange}
        />
        {state.phase === 'loading' ? (
          <span className={styles.spinner} />
        ) : (
          <>
            <span className={styles.dropIcon}>↑</span>
            <p className={styles.dropLabel}>
              {state.phase === 'preview'
                ? 'Drop another file to replace'
                : 'Drop your resume here, or click to browse'}
            </p>
            <p className={styles.dropHint}>DOCX · PDF · JPG · PNG</p>
          </>
        )}
      </div>

      {state.phase === 'error' && (
        <p className={styles.error}>{state.message}</p>
      )}

      {state.phase === 'preview' && (
        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <span className={styles.fileName}>{state.result.sourceName}</span>
            <span className={`${styles.confidence} ${confidenceClass[state.result.confidence]}`}>
              {confidenceLabel[state.result.confidence]}
            </span>
          </div>

          <div className={styles.previewContent}>
            <PreviewRow label="Name" value={state.result.resume.personalInfo.name} />
            <PreviewRow label="Email" value={state.result.resume.personalInfo.email} />
            <PreviewRow label="Phone" value={state.result.resume.personalInfo.phone} />
            <PreviewRow label="Location" value={state.result.resume.personalInfo.location} />
            <PreviewRow
              label="Experience"
              value={
                state.result.resume.experience.length > 0
                  ? `${state.result.resume.experience.length} ${state.result.resume.experience.length === 1 ? 'role' : 'roles'} detected`
                  : undefined
              }
            />
            <PreviewRow
              label="Education"
              value={
                state.result.resume.education.length > 0
                  ? `${state.result.resume.education.length} ${state.result.resume.education.length === 1 ? 'entry' : 'entries'} detected`
                  : undefined
              }
            />
            <PreviewRow
              label="Skills"
              value={
                state.result.resume.skills.length > 0
                  ? `${state.result.resume.skills.reduce((n, g) => n + g.skills.length, 0)} items`
                  : undefined
              }
            />
            <PreviewRow
              label="Layout"
              value={[
                `${state.result.layout.columns === 2 ? '2-column' : '1-column'}`,
                state.result.layout.bodySize,
                state.result.layout.margins.left !== '0.55in' ? `${state.result.layout.margins.left} margins` : null,
                state.result.layout.showDividers ? 'dividers' : 'no dividers',
              ].filter(Boolean).join(' · ')}
            />
          </div>

          {state.result.warnings.length > 0 && (
            <ul className={styles.warnings}>
              {state.result.warnings.slice(0, 3).map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}

          <button className={styles.btnApply} onClick={handleApply}>
            Load this resume
          </button>
          <p className={styles.applyHint}>
            You can edit everything directly on the resume after loading.
          </p>
        </div>
      )}

      {state.phase === 'idle' && (
        <div className={styles.tips}>
          <p className={styles.tipTitle}>What gets preserved</p>
          <ul className={styles.tipList}>
            <li>Font family, size, and line height</li>
            <li>Page margins (all four sides)</li>
            <li>Section order as it appears in your file</li>
            <li>Section spacing and entry gaps</li>
            <li>Heading style (uppercase, dividers)</li>
            <li>Accent color from document theme</li>
          </ul>
          <p className={styles.tipNote}>
            DOCX: full layout extraction from document XML.<br />
            PDF / image: AI-powered layout detection (requires API key).
          </p>
        </div>
      )}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className={styles.previewRow}>
      <span className={styles.previewLabel}>{label}</span>
      <span className={styles.previewValue}>{value}</span>
    </div>
  );
}
