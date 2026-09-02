import { useResumeEditor } from './hooks/useResumeEditor';
import { JDPanel } from './components/JDPanel/JDPanel';
import { ResumePage } from './components/Editor/ResumePage';
import { ReviewPanel } from './components/ReviewPanel/ReviewPanel';
import { VersionSwitcher } from './components/VersionSwitcher/VersionSwitcher';
import { ExportControls } from './components/ExportControls/ExportControls';
import { TemplatePicker } from './components/TemplatePicker/TemplatePicker';
import styles from './App.module.css';

export default function App() {
  const editor = useResumeEditor();

  const highlightedBulletIds = editor.proposedChanges
    .filter((c) => c.status === 'pending' && c.field.startsWith('bullet:'))
    .map((c) => c.field.replace('bullet:', ''));

  const displayScale =
    editor.fitResult.scale < 1 && editor.fitResult.scale >= 0.82
      ? editor.fitResult.scale
      : 1;

  const fitPct = Math.round(editor.fitResult.scale * 100);
  const fitOk = editor.fitResult.fits || editor.fitResult.scale >= 0.82;

  return (
    <div className={styles.app}>
      <header className={styles.topBar} data-print="hide">
        <div className={styles.topBarLeft}>
          <span className={styles.logo}>
            <span className={styles.logoMark}>●</span>
            cver
          </span>
          <span className={styles.mockBadge}>mock mode</span>
        </div>
        <div className={styles.topBarCenter}>
          <span className={styles.tagline}>role-specific resume editor</span>
        </div>
        <div className={styles.topBarRight}>
          <TemplatePicker
            activeId={editor.activeTemplate.id}
            onChange={editor.changeTemplate}
          />
          <VersionSwitcher
            versions={editor.versionHistory}
            onRestore={editor.restoreVersion}
            onDuplicate={editor.duplicateVersion}
            onRename={editor.renameVersion}
            onSaveCurrent={() =>
              editor.saveVersion(
                `${editor.targetCompany || 'Version'} — ${new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              )
            }
          />
          <ExportControls
            resume={editor.currentResume}
            proposedChanges={editor.proposedChanges}
            warnings={editor.warnings}
          />
        </div>
      </header>

      <div className={styles.mobileTabs} data-print="hide">
        {(['jd', 'editor', 'review'] as const).map((tab) => (
          <button
            key={tab}
            className={`${styles.mobileTab} ${editor.activeView === tab ? styles.mobileTabActive : ''}`}
            onClick={() => editor.setActiveView(tab)}
          >
            {tab === 'jd' ? 'Job description' : tab === 'editor' ? 'Resume' : 'AI changes'}
          </button>
        ))}
      </div>

      <main className={styles.workspace}>
        <aside
          className={`${styles.sidePanel} ${styles.panelLeft} ${editor.activeView !== 'jd' ? styles.hiddenMobile : ''}`}
          data-print="hide"
        >
          <div className={styles.sectionMark}>
            <span className={styles.sectionNum}>01</span>
            <span className={styles.sectionLabel}>Job description</span>
          </div>
          <JDPanel
            jobDescription={editor.jobDescription}
            targetCompany={editor.targetCompany}
            targetRole={editor.targetRole}
            jdAnalysis={editor.jdAnalysis}
            tailoringOptions={editor.tailoringOptions}
            isAnalyzing={editor.isAnalyzing}
            isTailoring={editor.isTailoring}
            onJobDescriptionChange={editor.setJobDescription}
            onTargetCompanyChange={editor.setTargetCompany}
            onTargetRoleChange={editor.setTargetRole}
            onOptionsChange={(opts) =>
              editor.setTailoringOptions((prev) => ({ ...prev, ...opts }))
            }
            onAnalyze={editor.analyzeJD}
            onTailor={editor.runTailoring}
            originalResume={editor.originalResume}
            onAddChange={editor.addChange}
          />
        </aside>

        <div
          className={`${styles.editorArea} ${editor.activeView !== 'editor' ? styles.hiddenMobile : ''}`}
        >
          <div className={styles.metaStrip} data-print="hide">
            <span className={styles.metaItem}>
              RESUME{editor.targetCompany ? ` / ${editor.targetCompany.toUpperCase()}` : ''}
            </span>
            <span className={styles.metaDivider} />
            <span className={styles.metaItem}>01 PAGE</span>
            <span className={styles.metaDivider} />
            <span className={`${styles.metaFit} ${fitOk ? styles.metaFitOk : styles.metaFitWarn}`}>
              {editor.fitResult.fits ? '100%' : `${fitPct}%`} FIT
            </span>
          </div>

          <div className={styles.resumeScroller}>
            <ResumePage
              resume={editor.currentResume}
              template={editor.activeTemplate}
              onUpdatePersonalInfo={editor.updatePersonalInfo}
              onUpdateSummary={editor.updateSummary}
              onUpdateExperience={editor.updateExperience}
              onUpdateBullet={editor.updateBullet}
              onUpdateEducation={editor.updateEducation}
              onUpdateSkillGroup={editor.updateSkillGroup}
              onFitChange={editor.setFitResult}
              highlightedBulletIds={highlightedBulletIds}
              scale={displayScale}
            />
          </div>

          {editor.isTailoring && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingCard}>
                <span className={styles.spinner} />
                <p>Comparing the job description with your resume…</p>
                <p className={styles.mockLabel}>Mock mode · connect Claude API for real results</p>
              </div>
            </div>
          )}
        </div>

        <aside
          className={`${styles.sidePanel} ${styles.panelRight} ${editor.activeView !== 'review' ? styles.hiddenMobile : ''}`}
          data-print="hide"
        >
          <div className={styles.sectionMark}>
            <span className={styles.sectionNum}>02</span>
            <span className={styles.sectionLabel}>Suggested changes</span>
          </div>
          <ReviewPanel
            proposedChanges={editor.proposedChanges}
            warnings={editor.warnings}
            fitResult={editor.fitResult}
            onAccept={editor.acceptChange}
            onReject={editor.rejectChange}
            onUndo={editor.undoChange}
            onEdit={editor.editChange}
            onAcceptAll={editor.acceptAll}
            onRejectAll={editor.rejectAll}
            onRestoreOriginal={editor.restoreOriginal}
          />
        </aside>
      </main>
    </div>
  );
}
