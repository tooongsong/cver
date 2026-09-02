import { useState } from 'react';
import type { ResumeData } from '../../types/resume';
import type { ResumeChange, TruthfulnessWarning, PreflightResult } from '../../types/tailor';
import { runPreflight } from '../../services/fitService';
import styles from './ExportControls.module.css';

type Props = {
  resume: ResumeData;
  proposedChanges: ResumeChange[];
  warnings: TruthfulnessWarning[];
};

export function ExportControls({ resume, proposedChanges, warnings }: Props) {
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [showPreflight, setShowPreflight] = useState(false);

  const getPageEl = (): HTMLElement | null =>
    document.querySelector('.resume-page');

  const handleExport = () => {
    const pageEl = getPageEl();
    if (!pageEl) return;

    const result = runPreflight(pageEl, proposedChanges, warnings);
    setPreflight(result);
    setShowPreflight(true);

    if (result.passed) {
      window.print();
    }
  };

  const handleCopyText = () => {
    const text = [
      resume.personalInfo.name,
      resume.personalInfo.title,
      `${resume.personalInfo.email} | ${resume.personalInfo.phone} | ${resume.personalInfo.location}`,
      '',
      resume.summary,
      '',
      ...resume.experience.flatMap((e) => [
        `${e.title} — ${e.company} (${e.startDate} – ${e.endDate})`,
        ...e.bullets.map((b) => `• ${b.text}`),
        '',
      ]),
      ...resume.education.map(
        (e) => `${e.institution} — ${e.degree} ${e.field} (${e.startDate} – ${e.endDate})`
      ),
      '',
      ...resume.skills.map((g) => `${g.category}: ${g.skills.join(', ')}`),
    ].join('\n');

    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.btnExport} onClick={handleExport}>
        Export PDF
      </button>
      <button className={styles.btnSecondary} onClick={handleCopyText}>
        Copy text
      </button>

      {showPreflight && preflight && (
        <div className={`${styles.preflightPanel} ${preflight.passed ? styles.passed : styles.failed}`}>
          <div className={styles.preflightHeader}>
            <span className={styles.preflightTitle}>
              {preflight.passed ? '✓ One-page preflight passed' : '✗ Export blocked'}
            </span>
            <button className={styles.closeBtn} onClick={() => setShowPreflight(false)}>✕</button>
          </div>
          <ul className={styles.checkList}>
            {preflight.checks.map((check) => (
              <li key={check.name} className={check.passed ? styles.checkPassed : styles.checkFailed}>
                <span className={styles.checkIcon}>{check.passed ? '✓' : '✗'}</span>
                <span className={styles.checkName}>{check.name}</span>
                {check.detail && !check.passed && (
                  <span className={styles.checkDetail}>{check.detail}</span>
                )}
              </li>
            ))}
          </ul>
          {preflight.passed && (
            <p className={styles.printNote}>
              Printing… The exported PDF will contain only the resume page.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
