import type { JDAnalysis, TailoringOptions, ResumeChange } from '../../types/tailor';
import type { ResumeData } from '../../types/resume';
import { PasteImport } from '../PasteImport/PasteImport';
import styles from './JDPanel.module.css';

type Props = {
  jobDescription: string;
  targetCompany: string;
  targetRole: string;
  jdAnalysis: JDAnalysis | null;
  tailoringOptions: TailoringOptions;
  isAnalyzing: boolean;
  isTailoring: boolean;
  originalResume: ResumeData;
  onJobDescriptionChange: (v: string) => void;
  onTargetCompanyChange: (v: string) => void;
  onTargetRoleChange: (v: string) => void;
  onOptionsChange: (opts: Partial<TailoringOptions>) => void;
  onAnalyze: () => void;
  onTailor: () => void;
  onAddChange: (change: ResumeChange) => void;
};

export function JDPanel({
  jobDescription,
  targetCompany,
  targetRole,
  jdAnalysis,
  tailoringOptions,
  isAnalyzing,
  isTailoring,
  originalResume,
  onJobDescriptionChange,
  onTargetCompanyChange,
  onTargetRoleChange,
  onOptionsChange,
  onAnalyze,
  onTailor,
  onAddChange,
}: Props) {
  const supported = jdAnalysis?.keywords.filter((k) => k.match === 'supported') ?? [];
  const transferable = jdAnalysis?.keywords.filter((k) => k.match === 'transferable') ?? [];
  const unsupported = jdAnalysis?.keywords.filter((k) => k.match === 'unsupported') ?? [];

  return (
    <div className={styles.panel}>
      <div className={styles.fieldRow}>
        <input
          className={styles.input}
          placeholder="Target company"
          value={targetCompany}
          onChange={(e) => onTargetCompanyChange(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Target role"
          value={targetRole}
          onChange={(e) => onTargetRoleChange(e.target.value)}
        />
      </div>

      <textarea
        className={styles.jdTextarea}
        placeholder="Paste the job description here…"
        value={jobDescription}
        onChange={(e) => onJobDescriptionChange(e.target.value)}
      />

      <div className={styles.actions}>
        <button
          className={styles.btnSecondary}
          onClick={onAnalyze}
          disabled={isAnalyzing || !jobDescription.trim()}
        >
          {isAnalyzing ? 'Analyzing…' : 'Analyze job'}
        </button>
        <button
          className={styles.btnPrimary}
          onClick={onTailor}
          disabled={isTailoring || !jobDescription.trim()}
        >
          {isTailoring ? 'Working…' : 'Tailor resume'}
        </button>
      </div>

      {/* Options */}
      <div className={styles.optionsSection}>
        <p className={styles.optionsLabel}>Edit depth</p>
        <div className={styles.intensityRow}>
          {(['conservative', 'balanced', 'aggressive'] as const).map((level) => (
            <button
              key={level}
              className={`${styles.intensityBtn} ${tailoringOptions.intensity === level ? styles.intensityActive : ''}`}
              onClick={() => onOptionsChange({ intensity: level })}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.toggles}>
          {[
            { key: 'prioritizeATS', label: 'Keep ATS keywords' },
            { key: 'keepAllExperiences', label: 'Keep all experience entries' },
            { key: 'keepEducationUnchanged', label: 'Keep education unchanged' },
            { key: 'preserveJobTitles', label: 'Preserve job titles' },
            { key: 'forceOnePage', label: 'Fit to one page' },
          ].map(({ key, label }) => (
            <label key={key} className={styles.toggle}>
              <input
                type="checkbox"
                checked={tailoringOptions[key as keyof TailoringOptions] as boolean}
                onChange={(e) => onOptionsChange({ [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <PasteImport resume={originalResume} onAddChange={onAddChange} />

      {/* Analysis results */}
      {jdAnalysis && (
        <div className={styles.analysisSection}>
          <h3 className={styles.analysisTitle}>Job analysis</h3>

          {jdAnalysis.requiredSkills.length > 0 && (
            <div className={styles.analysisGroup}>
              <p className={styles.groupLabel}>Required</p>
              <ul className={styles.bulletList}>
                {jdAnalysis.requiredSkills.slice(0, 4).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {jdAnalysis.preferredSkills.length > 0 && (
            <div className={styles.analysisGroup}>
              <p className={styles.groupLabel}>Preferred</p>
              <ul className={styles.bulletList}>
                {jdAnalysis.preferredSkills.slice(0, 3).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.keywordGroups}>
            {supported.length > 0 && (
              <div className={styles.kwGroup}>
                <p className={styles.kwLabel}>In your resume</p>
                <div className={styles.kwList}>
                  {supported.map((k) => (
                    <span key={k.term} className={`${styles.kwTag} ${styles.kwSupported}`}>
                      {k.term}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {transferable.length > 0 && (
              <div className={styles.kwGroup}>
                <p className={styles.kwLabel}>Transferable</p>
                <div className={styles.kwList}>
                  {transferable.map((k) => (
                    <span key={k.term} className={`${styles.kwTag} ${styles.kwTransferable}`}>
                      {k.term}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {unsupported.length > 0 && (
              <div className={styles.kwGroup}>
                <p className={styles.kwLabel}>Not in resume</p>
                <div className={styles.kwList}>
                  {unsupported.map((k) => (
                    <span key={k.term} className={`${styles.kwTag} ${styles.kwUnsupported}`}>
                      {k.term}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
