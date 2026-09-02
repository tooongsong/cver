import { useState } from 'react';
import type { ResumeData } from '../../types/resume';
import type { ResumeChange, TruthfulnessWarning } from '../../types/tailor';
import { runPreflight } from '../../services/fitService';
import styles from './ExportControls.module.css';

type Props = {
  resume: ResumeData;
  proposedChanges: ResumeChange[];
  warnings: TruthfulnessWarning[];
};

export function ExportControls({ resume, proposedChanges, warnings }: Props) {
  const [showGuide, setShowGuide] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [printing, setPrinting] = useState(false);

  const handleExport = () => {
    const pageEl = document.querySelector<HTMLElement>('.resume-page');
    if (!pageEl) return;

    const result = runPreflight(pageEl, proposedChanges, warnings);
    const failed = result.checks.filter((c) => !c.passed).map((c) => c.detail ?? c.name);
    setIssues(failed);
    setShowGuide(true);
  };

  const handlePrint = () => {
    setShowGuide(false);
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 60);
  };

  const handleCopy = () => {
    const lines = [
      resume.personalInfo.name,
      resume.personalInfo.title,
      [resume.personalInfo.email, resume.personalInfo.phone, resume.personalInfo.location].filter(Boolean).join(' · '),
      '',
      resume.summary,
      '',
      ...resume.experience.flatMap((e) => [
        `${e.title} — ${e.company} (${e.startDate}–${e.endDate})`,
        ...e.bullets.map((b) => `• ${b.text}`),
        '',
      ]),
      ...resume.education.map((e) =>
        `${e.institution} — ${e.degree} ${e.field} (${e.startDate}–${e.endDate})`
      ),
      '',
      ...resume.skills.map((g) => `${g.category}: ${g.skills.join(', ')}`),
    ].join('\n');
    navigator.clipboard.writeText(lines).catch(() => {});
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.btnCopy} onClick={handleCopy} title="Copy as plain text">COPY</button>
      <button className={styles.btnExport} onClick={handleExport} disabled={printing}>
        {printing ? 'PRINTING…' : 'EXPORT PDF ↗'}
      </button>

      {showGuide && (
        <div className={styles.guide}>
          <div className={styles.guideHead}>
            <span className={styles.guideTitle}>EXPORT PDF</span>
            <button className={styles.closeBtn} onClick={() => setShowGuide(false)}>✕</button>
          </div>

          {issues.length > 0 && (
            <div className={styles.issueList}>
              {issues.map((msg, i) => <p key={i} className={styles.issueItem}>⚠ {msg}</p>)}
            </div>
          )}

          <div className={styles.instructions}>
            <p className={styles.instructLabel}>PRINT SETTINGS</p>
            <ol className={styles.steps}>
              <li>Destination → <strong>Save as PDF</strong></li>
              <li>Paper size → <strong>Letter</strong></li>
              <li>Margins → <strong>None</strong></li>
              <li>Scale → <strong>100%</strong></li>
              <li>Headers &amp; footers → <strong>Off</strong></li>
            </ol>
          </div>

          <button className={styles.printBtn} onClick={handlePrint}>OPEN PRINT DIALOG ↗</button>
        </div>
      )}
    </div>
  );
}
