import { useRef, useState } from 'react';
import { registerLocalFont } from '../../services/fontDetector';
import styles from './FontsPanel.module.css';

export type FontSubstitution = {
  original: string;         // font as declared in the document
  substitute: string;       // font that will actually be used
  isSystem: boolean;        // true if the substitute is available in the browser
  isCustom: boolean;        // true if user uploaded this
};

type Props = {
  detected: string[];           // primary fonts referenced in the rendered doc
  missing: string[];            // subset of detected that browser cannot render
  overrides: Record<string, string>;  // user-chosen substitute per original font
  onOverride: (original: string, substitute: string) => void;
  onFontLoaded: () => void;     // called after a local font is registered so the doc re-renders
};

// Curated web-safe candidates the user can pick from.
const CANDIDATES = [
  'Carlito',            // Calibri metric clone (Google Font)
  'Tinos',              // Times New Roman metric clone
  'Arimo',              // Arial metric clone
  'Georgia',
  'Times New Roman',
  'Arial',
  'Helvetica',
  'Verdana',
  'Tahoma',
  'system-ui',
];

export function FontsPanel({ detected, missing, overrides, onOverride, onFontLoaded }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    if (!uploadingFor) return;
    setUploadError(null);
    try {
      const buffer = await file.arrayBuffer();
      // Register under the ORIGINAL font name — instantly satisfies the missing lookup
      await registerLocalFont(uploadingFor, buffer);
      onFontLoaded();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Font upload failed.');
    } finally {
      setUploadingFor(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className={styles.wrapper}>
      <input
        ref={fileRef}
        type="file"
        accept=".woff,.woff2,.ttf,.otf"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />

      {detected.length === 0 ? (
        <p className={styles.emptyHint}>No fonts detected yet — import a resume first.</p>
      ) : (
        <>
          <p className={styles.header}>
            Detected {detected.length} font{detected.length === 1 ? '' : 's'}
            {missing.length > 0 && (
              <span className={styles.missingBadge}>{missing.length} missing</span>
            )}
          </p>

          <ul className={styles.list}>
            {detected.map((font) => {
              const isMissing = missing.includes(font);
              const override = overrides[font];
              const usingFont = override ?? (isMissing ? 'Fallback' : font);
              return (
                <li key={font} className={styles.row}>
                  <div className={styles.rowTop}>
                    <span className={`${styles.origName} ${isMissing ? styles.origMissing : ''}`}>
                      {font}
                    </span>
                    {isMissing && !override && (
                      <span className={styles.tag}>MISSING</span>
                    )}
                    {override && (
                      <span className={styles.tag}>OVERRIDE</span>
                    )}
                  </div>
                  <div className={styles.rowBottom}>
                    <span className={styles.arrow}>→</span>
                    <select
                      className={styles.select}
                      value={override ?? ''}
                      onChange={(e) => onOverride(font, e.target.value)}
                    >
                      <option value="">Auto ({usingFont})</option>
                      {CANDIDATES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <button
                      className={styles.uploadBtn}
                      onClick={() => { setUploadingFor(font); fileRef.current?.click(); }}
                    >
                      Upload
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {uploadError && <p className={styles.error}>{uploadError}</p>}

          <p className={styles.hint}>
            Upload the original font (.woff / .woff2 / .ttf / .otf) for pixel-accurate
            rendering. Uploaded fonts stay in your browser.
          </p>
        </>
      )}
    </div>
  );
}
