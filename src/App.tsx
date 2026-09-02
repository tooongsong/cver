import { useState } from 'react';
import { useResumeEditor } from './hooks/useResumeEditor';
import { JDPanel } from './components/JDPanel/JDPanel';
import { ResumePage } from './components/Editor/ResumePage';
import { ReviewPanel } from './components/ReviewPanel/ReviewPanel';
import { PasteImport } from './components/PasteImport/PasteImport';
import { VersionSwitcher } from './components/VersionSwitcher/VersionSwitcher';
import { ExportControls } from './components/ExportControls/ExportControls';
import { TemplatePicker } from './components/TemplatePicker/TemplatePicker';
import { Drawer } from './components/Drawer/Drawer';
import { ImportDrawer } from './components/ImportDrawer/ImportDrawer';
import styles from './App.module.css';

type DrawerType = 'import' | 'jd' | 'changes' | 'paste' | null;

export default function App() {
  const editor = useResumeEditor();
  const [openDrawer, setOpenDrawer] = useState<DrawerType>(null);

  const pendingCount = editor.proposedChanges.filter((c) => c.status === 'pending').length;
  const totalChanges = editor.proposedChanges.length;

  const highlightedBulletIds = editor.proposedChanges
    .filter((c) => c.status === 'pending' && c.field.startsWith('bullet:'))
    .map((c) => c.field.replace('bullet:', ''));

  const displayScale =
    editor.fitResult.scale < 1 && editor.fitResult.scale >= 0.82
      ? editor.fitResult.scale
      : 1;

  const fitPct = Math.round(editor.fitResult.scale * 100);
  const fitOk = editor.fitResult.fits || editor.fitResult.scale >= 0.82;

  function toggleDrawer(d: DrawerType) {
    setOpenDrawer((prev) => (prev === d ? null : d));
  }

  return (
    <div className={styles.app}>
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <header className={styles.toolbar} data-print="hide">
        <div className={styles.toolbarBrand}>
          <span className={styles.logo}>
            <span className={styles.logoMark}>●</span>cver
          </span>
        </div>

        <div className={styles.toolbarActions}>
          <button
            className={`${styles.toolBtn} ${openDrawer === 'import' ? styles.toolBtnActive : ''}`}
            onClick={() => toggleDrawer('import')}
          >
            Import
          </button>
          <button
            className={`${styles.toolBtn} ${openDrawer === 'jd' ? styles.toolBtnActive : ''}`}
            onClick={() => toggleDrawer('jd')}
          >
            Job description
            {editor.isTailoring && <span className={styles.toolBtnSpinner} />}
          </button>
          <button
            className={`${styles.toolBtn} ${openDrawer === 'paste' ? styles.toolBtnActive : ''}`}
            onClick={() => toggleDrawer('paste')}
          >
            Paste text
          </button>
          <TemplatePicker
            activeId={editor.activeTemplate.id}
            onChange={editor.changeTemplate}
          />
        </div>

        <div className={styles.toolbarStatus}>
          <button
            className={`${styles.fitStatus} ${fitOk ? styles.fitOk : styles.fitWarn}`}
            onClick={() => totalChanges > 0 ? toggleDrawer('changes') : undefined}
            disabled={totalChanges === 0}
          >
            <span className={styles.fitDot} />
            {editor.fitResult.fits ? '1 page' : `${fitPct}% fit`}
            {totalChanges > 0 && (
              <span className={styles.changesBadge}>
                {pendingCount > 0 ? `${pendingCount}` : '✓'}
              </span>
            )}
          </button>
        </div>

        <div className={styles.toolbarRight}>
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

      {/* ── Workspace — resume is the entire view ──────────────── */}
      <main className={styles.workspace}>
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
            styleOverrides={editor.importedStyleOverrides}
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
      </main>

      {/* ── Drawers ───────────────────────────────────────────────── */}
      {openDrawer === 'import' && (
        <Drawer title="Import resume" onClose={() => setOpenDrawer(null)} width={420}>
          <ImportDrawer
            onLoad={(resume, styleOverrides) => {
              editor.loadNewResume(resume, styleOverrides);
              setOpenDrawer(null);
            }}
          />
        </Drawer>
      )}

      {openDrawer === 'jd' && (
        <Drawer title="Job description" onClose={() => setOpenDrawer(null)}>
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
            onTailor={() => { editor.runTailoring(); setOpenDrawer('changes'); }}
            originalResume={editor.originalResume}
            onAddChange={editor.addChange}
          />
        </Drawer>
      )}

      {openDrawer === 'paste' && (
        <Drawer title="Paste text" onClose={() => setOpenDrawer(null)}>
          <PasteImport resume={editor.originalResume} onAddChange={editor.addChange} />
        </Drawer>
      )}

      {openDrawer === 'changes' && (
        <Drawer title="Suggested changes" onClose={() => setOpenDrawer(null)}>
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
        </Drawer>
      )}
    </div>
  );
}
