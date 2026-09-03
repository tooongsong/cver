import type { ResumeSignals } from '../../services/resumeAnalyzer';
import { TEMPLATE_PRESETS, recommendTemplate, type TemplatePreset } from '../../services/templates';
import styles from './TemplatesPanel.module.css';

type Props = {
  signals: ResumeSignals | null;
  onApply: (preset: TemplatePreset) => void;
  hasImportedOriginal: boolean;    // true when docxBuffer / rawHtml is present
  onKeepOriginal: () => void;      // switches back to imported rendering
  activeTemplateId: string | null;
};

export function TemplatesPanel({ signals, onApply, hasImportedOriginal, onKeepOriginal, activeTemplateId }: Props) {
  const recommendation = signals ? recommendTemplate(signals) : null;

  return (
    <div className={styles.wrapper}>
      {signals && (
        <div className={styles.signals}>
          <div className={styles.signalRow}>
            <span className={styles.signalLabel}>Detected</span>
            <span className={styles.signalValue}>{recommendation?.reason}</span>
          </div>
          {recommendation && (
            <p className={styles.recommendation}>
              Best fit: <strong>{recommendation.top.name}</strong>
            </p>
          )}
        </div>
      )}

      {hasImportedOriginal && (
        <button className={styles.keepOriginal} onClick={onKeepOriginal}>
          ← Keep original imported layout
        </button>
      )}

      <ul className={styles.list}>
        {TEMPLATE_PRESETS.map((preset) => {
          const isRecommended = recommendation?.top.id === preset.id;
          const isActive = activeTemplateId === preset.id;
          return (
            <li
              key={preset.id}
              className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
            >
              <div className={styles.preview} style={{ '--swatch-accent': preset.previewSwatch.accent } as React.CSSProperties}>
                <div className={styles.swatchName} style={{ fontFamily: preset.previewSwatch.bgFont === 'serif' ? 'Tinos, serif' : 'Arimo, sans-serif' }}>
                  Aa
                </div>
                {preset.previewSwatch.dividers && <div className={styles.swatchDivider} />}
                <div className={styles.swatchLines}>
                  <div className={styles.swatchLine} style={{ width: '90%' }} />
                  <div className={styles.swatchLine} style={{ width: '75%' }} />
                  <div className={styles.swatchLine} style={{ width: '85%' }} />
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHead}>
                  <span className={styles.cardName}>{preset.name}</span>
                  {isRecommended && <span className={styles.tagRecommend}>PICK</span>}
                  {isActive && <span className={styles.tagActive}>ACTIVE</span>}
                </div>
                <p className={styles.cardTag}>{preset.tagline}</p>
                <p className={styles.cardSuited}>{preset.suitedFor}</p>
                <button className={styles.applyBtn} onClick={() => onApply(preset)}>
                  {isActive ? 'Re-apply' : 'Apply'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className={styles.footNote}>
        Applying a template replaces layout but keeps all your text. You can go back to the original at any time.
      </p>
    </div>
  );
}
