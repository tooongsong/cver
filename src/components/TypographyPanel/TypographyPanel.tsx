import styles from './TypographyPanel.module.css';

export type TypographySettings = {
  nameFont: string;
  headingFont: string;
  bodyFont: string;
  dateFont: string;
  baseFontSize: number;
  lineHeight: number;
  accentColor: string;
};

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  nameFont: 'Inter',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  dateFont: 'Inter',
  baseFontSize: 10,
  lineHeight: 1.45,
  accentColor: '#1a1a1a',
};

const FONT_OPTIONS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Garamond',
  'Inter',
  'IBM Plex Sans',
  'IBM Plex Mono',
  'Roboto',
  'Roboto Condensed',
  'Source Sans 3',
  'Source Serif 4',
];

type Props = {
  value: TypographySettings;
  onChange: (v: TypographySettings) => void;
  detectedFont?: string;
  detectedColor?: string;
  onReset: () => void;
  isDocxPreviewActive?: boolean;
  onSwitchToTemplate?: () => void;
};

export function TypographyPanel({ value, onChange, detectedFont, detectedColor, onReset, isDocxPreviewActive, onSwitchToTemplate }: Props) {
  function set<K extends keyof TypographySettings>(k: K, v: TypographySettings[K]) {
    onChange({ ...value, [k]: v });
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.sectionLabel}>/04 TYPE</span>
        <button className={styles.resetBtn} onClick={onReset}>RESET</button>
      </div>

      {isDocxPreviewActive && (
        <div className={styles.warningBanner}>
          <p className={styles.warningText}>
            You're viewing the original DOCX render. Font & size controls only apply to templated layouts.
          </p>
          {onSwitchToTemplate && (
            <button className={styles.switchBtn} onClick={onSwitchToTemplate}>
              Apply recommended template →
            </button>
          )}
        </div>
      )}

      {detectedFont && (
        <div className={styles.detected}>
          <span className={styles.detectedBadge}>DETECTED</span>
          <span className={styles.detectedVal}>{detectedFont}</span>
        </div>
      )}

      <div className={styles.group}>
        <FontRow label="NAME" value={value.nameFont} onChange={(v) => set('nameFont', v)} />
        <FontRow label="HEADING" value={value.headingFont} onChange={(v) => set('headingFont', v)} />
        <FontRow label="BODY" value={value.bodyFont} onChange={(v) => set('bodyFont', v)} />
        <FontRow label="DATE / META" value={value.dateFont} onChange={(v) => set('dateFont', v)} />
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <NumRow label="SIZE" value={value.baseFontSize} min={8} max={14} step={0.5} unit="pt" onChange={(v) => set('baseFontSize', v)} />
        <NumRow label="LINE HEIGHT" value={value.lineHeight} min={1.1} max={2.0} step={0.05} onChange={(v) => set('lineHeight', v)} />
      </div>

      <div className={styles.divider} />

      <div className={styles.colorRow}>
        <span className={styles.rowLabel}>ACCENT</span>
        <input type="color" value={value.accentColor} onChange={(e) => set('accentColor', e.target.value)} className={styles.colorInput} />
        <input
          type="text"
          value={value.accentColor}
          onChange={(e) => set('accentColor', e.target.value)}
          className={styles.hexInput}
          maxLength={7}
          placeholder="#000000"
        />
        {detectedColor && detectedColor !== value.accentColor && (
          <button
            className={styles.detectedColorChip}
            style={{ background: detectedColor }}
            title={`Use detected: ${detectedColor}`}
            onClick={() => set('accentColor', detectedColor)}
          />
        )}
      </div>
    </div>
  );
}

function FontRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className={styles.fontRow}>
      <span className={styles.rowLabel}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={styles.select}>
        {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
    </div>
  );
}

function NumRow({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.numRow}>
      <span className={styles.rowLabel}>{label}</span>
      <button className={styles.nudge} onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}>−</button>
      <span className={styles.numVal}>{value}{unit ?? ''}</span>
      <button className={styles.nudge} onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))}>+</button>
    </div>
  );
}
