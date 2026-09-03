import { useState } from 'react';
import { useResumeEditor } from './hooks/useResumeEditor';
import { JDPanel } from './components/JDPanel/JDPanel';
import { ResumePage } from './components/Editor/ResumePage';
import { ReviewPanel } from './components/ReviewPanel/ReviewPanel';
import { PasteImport } from './components/PasteImport/PasteImport';
import { ToolPanel } from './components/ToolPanel/ToolPanel';
import { ImportDrawer } from './components/ImportDrawer/ImportDrawer';
import { RawResumePage } from './components/Editor/RawResumePage';
import { DocxPreviewPage } from './components/Editor/DocxPreviewPage';
import type { LayoutSchema } from './types/layout';
import { LandingPage } from './components/LandingPage/LandingPage';
import { TypographyPanel, DEFAULT_TYPOGRAPHY } from './components/TypographyPanel/TypographyPanel';
import type { TypographySettings } from './components/TypographyPanel/TypographyPanel';
import { ExportControls } from './components/ExportControls/ExportControls';
import { VersionSwitcher } from './components/VersionSwitcher/VersionSwitcher';
import { FontsPanel } from './components/FontsPanel/FontsPanel';
import type { DetectedFonts } from './services/fontDetector';
import { TemplatesPanel } from './components/TemplatesPanel/TemplatesPanel';
import { analyzeResume, type ResumeSignals } from './services/resumeAnalyzer';
import type { TemplatePreset } from './services/templates';
import { CompareView } from './components/CompareView/CompareView';
import type { OriginalSnapshot } from './components/CompareView/CompareView';
import styles from './App.module.css';

type DrawerType = 'import' | 'jd' | 'changes' | 'paste' | 'type' | 'fonts' | 'templates' | 'more' | null;
type AppPhase = 'landing' | 'editor';

export default function App() {
  const editor = useResumeEditor();
  const [openDrawer, setOpenDrawer] = useState<DrawerType>(null);
  const [appPhase, setAppPhase] = useState<AppPhase>('landing');
  const [typography, setTypography] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY);
  const [importedLayout, setImportedLayout] = useState<LayoutSchema | null>(null);
  const [rawHtml, setRawHtml] = useState<string | null>(null);
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [detectedFonts, setDetectedFonts] = useState<DetectedFonts>({ used: [], missing: [] });
  const [fontOverrides, setFontOverrides] = useState<Record<string, string>>({});
  const [fontReloadKey, setFontReloadKey] = useState(0);
  const [resumeSignals, setResumeSignals] = useState<ResumeSignals | null>(null);
  const [templateOverrides, setTemplateOverrides] = useState<Record<string, string>>({});
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [savedDocxBuffer, setSavedDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [savedRawHtml, setSavedRawHtml] = useState<string | null>(null);
  const [originalSnapshot, setOriginalSnapshot] = useState<OriginalSnapshot | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  const pendingCount = editor.proposedChanges.filter((c) => c.status === 'pending').length;
  const totalChanges = editor.proposedChanges.length;

  const highlightedBulletIds = editor.proposedChanges
    .filter((c) => c.status === 'pending' && c.field.startsWith('bullet:'))
    .map((c) => c.field.replace('bullet:', ''));

  const fitPct = Math.round(editor.fitResult.scale * 100);
  const fitOk = editor.fitResult.fits || editor.fitResult.scale >= 0.82;

  function toggleDrawer(d: DrawerType) {
    setOpenDrawer((prev) => (prev === d ? null : d));
  }

  function getPanelWidth(d: DrawerType): number {
    if (d === 'type' || d === 'more' || d === 'fonts') return 320;
    if (d === 'templates') return 360;
    return 420;
  }

  function applyImportedStyle(
    styleOverrides: Record<string, string>,
    layout?: LayoutSchema,
    html?: string,
    buffer?: ArrayBuffer,
    resume?: import('./types/resume').ResumeData,
    originalImage?: { base64: string; mime: string },
  ) {
    const fontRaw = styleOverrides['--resume-font'] ?? '';
    const detFont = fontRaw.replace(/['"]/g, '').split(',')[0].trim();
    const detColor = styleOverrides['--resume-accent'];
    const detSize = styleOverrides['--resume-font-size'];
    const detLineH = styleOverrides['--resume-line-height'];
    setTypography({
      ...DEFAULT_TYPOGRAPHY,
      nameFont: detFont || DEFAULT_TYPOGRAPHY.nameFont,
      headingFont: detFont || DEFAULT_TYPOGRAPHY.headingFont,
      bodyFont: detFont || DEFAULT_TYPOGRAPHY.bodyFont,
      dateFont: detFont || DEFAULT_TYPOGRAPHY.dateFont,
      accentColor: detColor || DEFAULT_TYPOGRAPHY.accentColor,
      baseFontSize: detSize ? parseFloat(detSize) || DEFAULT_TYPOGRAPHY.baseFontSize : DEFAULT_TYPOGRAPHY.baseFontSize,
      lineHeight: detLineH ? parseFloat(detLineH) || DEFAULT_TYPOGRAPHY.lineHeight : DEFAULT_TYPOGRAPHY.lineHeight,
    });
    if (layout) setImportedLayout(layout);
    setRawHtml(html ?? null);
    setDocxBuffer(buffer ?? null);
    // Fresh import → clear any previously applied template + reset template state
    setSavedDocxBuffer(buffer ?? null);
    setSavedRawHtml(html ?? null);
    setTemplateOverrides({});
    setActiveTemplateId(null);
    setResumeSignals(resume ? analyzeResume(resume) : null);
    // Capture snapshot of the original for the Compare view
    if (originalImage) {
      setOriginalSnapshot({ kind: 'image', base64: originalImage.base64, mime: originalImage.mime });
    } else if (buffer) {
      setOriginalSnapshot({ kind: 'docx', buffer });
    } else {
      setOriginalSnapshot(null);
    }
    setCompareMode(false);
  }

  function applyTemplate(preset: TemplatePreset) {
    // Switching to a template hides the imported original renderer and shows
    // the structured ResumePage template with the preset's overrides.
    setTemplateOverrides(preset.styleOverrides);
    setActiveTemplateId(preset.id);
    setDocxBuffer(null);
    setRawHtml(null);
  }

  function keepImportedOriginal() {
    setTemplateOverrides({});
    setActiveTemplateId(null);
    setDocxBuffer(savedDocxBuffer);
    setRawHtml(savedRawHtml);
  }

  // Build typography CSS overrides
  const typographyOverrides: Record<string, string> = {
    '--resume-name-font': `"${typography.nameFont}", sans-serif`,
    '--resume-heading-font': `"${typography.headingFont}", sans-serif`,
    '--resume-font': `"${typography.bodyFont}", sans-serif`,
    '--resume-date-font': `"${typography.dateFont}", sans-serif`,
    '--resume-font-size': `${typography.baseFontSize}pt`,
    '--resume-line-height': String(typography.lineHeight),
    '--resume-accent': typography.accentColor,
  };

  // Precedence: imported doc → user typography → applied template (highest, since user just picked it)
  const combinedOverrides = { ...editor.importedStyleOverrides, ...typographyOverrides, ...templateOverrides };

  const detectedFont = (() => {
    const raw = editor.importedStyleOverrides['--resume-font'] ?? '';
    return raw.replace(/['"]/g, '').split(',')[0].trim() || undefined;
  })();
  const detectedColor = editor.importedStyleOverrides['--resume-accent'];

  function renderCurrentDoc() {
    if (docxBuffer) {
      return (
        <DocxPreviewPage
          buffer={docxBuffer}
          onFitChange={editor.setFitResult}
          fontOverrides={fontOverrides}
          onFontsDetected={setDetectedFonts}
          reRenderKey={fontReloadKey}
        />
      );
    }
    if (rawHtml) {
      return (
        <RawResumePage
          html={rawHtml}
          onChange={setRawHtml}
          onFitChange={editor.setFitResult}
        />
      );
    }
    return (
      <ResumePage
        resume={editor.currentResume}
        template={editor.activeTemplate}
        layout={importedLayout ?? undefined}
        onUpdatePersonalInfo={editor.updatePersonalInfo}
        onUpdateSummary={editor.updateSummary}
        onUpdateExperience={editor.updateExperience}
        onUpdateBullet={editor.updateBullet}
        onUpdateEducation={editor.updateEducation}
        onUpdateSkillGroup={editor.updateSkillGroup}
        onFitChange={editor.setFitResult}
        highlightedBulletIds={highlightedBulletIds}
        scale={1}
        styleOverrides={combinedOverrides}
      />
    );
  }

  if (appPhase === 'landing') {
    return (
      <LandingPage
        onLoad={(resume, styleOverrides, layout, html, buffer, originalImage) => {
          editor.loadNewResume(resume, styleOverrides);
          applyImportedStyle(styleOverrides, layout, html, buffer, resume, originalImage);
          setAppPhase('editor');
        }}
        onUseSample={() => setAppPhase('editor')}
      />
    );
  }

  return (
    <div className={styles.app}>
      {/* ── Toolbar ──────────────────────────── */}
      <header className={styles.toolbar} data-print="hide">
        <div className={styles.toolbarBrand}>
          <span className={styles.logo}>CVER_</span>
        </div>

        <nav className={styles.toolbarActions}>
          <button
            className={`${styles.toolBtn} ${openDrawer === 'import' ? styles.toolBtnActive : ''}`}
            onClick={() => toggleDrawer('import')}
          >
            /01 IMPORT
          </button>
          <button
            className={`${styles.toolBtn} ${openDrawer === 'templates' ? styles.toolBtnActive : ''}`}
            onClick={() => toggleDrawer('templates')}
          >
            /02 TEMPLATES
          </button>
          <button
            className={`${styles.toolBtn} ${openDrawer === 'fonts' ? styles.toolBtnActive : ''}`}
            onClick={() => toggleDrawer('fonts')}
          >
            /03 FONTS
            {detectedFonts.missing.length > 0 && (
              <span className={styles.toolBtnBadge}>{detectedFonts.missing.length}</span>
            )}
          </button>
          <button
            className={`${styles.toolBtn} ${openDrawer === 'type' ? styles.toolBtnActive : ''}`}
            onClick={() => toggleDrawer('type')}
          >
            /04 TYPE
          </button>
          <button
            className={`${styles.toolBtn} ${openDrawer === 'jd' ? styles.toolBtnActive : ''}`}
            onClick={() => toggleDrawer('jd')}
          >
            /05 TAILOR
            {editor.isTailoring && <span className={styles.toolBtnSpinner} />}
          </button>
          <button
            className={`${styles.toolBtn} ${openDrawer === 'paste' ? styles.toolBtnActive : ''}`}
            onClick={() => toggleDrawer('paste')}
          >
            /06 PASTE
          </button>
          <button
            className={`${styles.toolBtn} ${compareMode ? styles.toolBtnActive : ''} ${!originalSnapshot ? styles.toolBtnDisabled : ''}`}
            onClick={() => originalSnapshot && setCompareMode((v) => !v)}
            disabled={!originalSnapshot}
            title={originalSnapshot ? 'Compare with imported original' : 'No original captured — compare needs an import'}
          >
            COMPARE
          </button>
          <button
            className={`${styles.toolBtn} ${openDrawer === 'more' ? styles.toolBtnActive : ''}`}
            onClick={() => toggleDrawer('more')}
          >
            MORE
          </button>
        </nav>

        <div className={styles.toolbarSpacer} />

        <div className={styles.toolbarStatus}>
          <button
            className={`${styles.fitBadge} ${fitOk ? styles.fitOk : styles.fitWarn}`}
            onClick={() => totalChanges > 0 ? toggleDrawer('changes') : undefined}
            disabled={totalChanges === 0}
          >
            <span className={styles.fitDot} />
            {editor.fitResult.fits ? 'ONE PAGE' : `${fitPct}% FIT`}
            {totalChanges > 0 && (
              <span className={styles.changesBadge}>
                {pendingCount > 0 ? pendingCount : '✓'}
              </span>
            )}
          </button>
        </div>

        <div className={styles.toolbarRight}>
          <ExportControls
            resume={editor.currentResume}
            proposedChanges={editor.proposedChanges}
            warnings={editor.warnings}
          />
        </div>
      </header>

      {/* ── Workspace ────────────────────────── */}
      <main className={`${styles.workspace} app-workspace`}>

        {/* ── Left tool panel slot ── */}
        <div
          className={`${styles.toolPanelSlot} ${openDrawer ? styles.toolPanelSlotOpen : ''}`}
          style={openDrawer ? ({ '--slot-width': `${getPanelWidth(openDrawer)}px` } as React.CSSProperties) : {}}
        >
          {openDrawer === 'import' && (
            <ToolPanel title="/01 IMPORT" onClose={() => setOpenDrawer(null)}>
              <ImportDrawer
                onLoad={(resume, styleOverrides, layout, html, buffer, originalImage) => {
                  editor.loadNewResume(resume, styleOverrides);
                  applyImportedStyle(styleOverrides, layout, html, buffer, resume, originalImage);
                  setOpenDrawer(null);
                }}
              />
            </ToolPanel>
          )}
          {openDrawer === 'paste' && (
            <ToolPanel title="/02 PASTE REVISION" onClose={() => setOpenDrawer(null)}>
              <PasteImport resume={editor.originalResume} onAddChange={editor.addChange} />
            </ToolPanel>
          )}
          {openDrawer === 'type' && (
            <ToolPanel title="/03 TYPE" onClose={() => setOpenDrawer(null)}>
              <TypographyPanel
                value={typography}
                onChange={setTypography}
                detectedFont={detectedFont}
                detectedColor={detectedColor}
                onReset={() => setTypography(DEFAULT_TYPOGRAPHY)}
              />
            </ToolPanel>
          )}
          {openDrawer === 'fonts' && (
            <ToolPanel title="FONTS" onClose={() => setOpenDrawer(null)}>
              <FontsPanel
                detected={detectedFonts.used}
                missing={detectedFonts.missing}
                overrides={fontOverrides}
                onOverride={(orig, sub) => {
                  setFontOverrides((prev) => {
                    const next = { ...prev };
                    if (sub) next[orig] = sub; else delete next[orig];
                    return next;
                  });
                }}
                onFontLoaded={() => setFontReloadKey((k) => k + 1)}
              />
            </ToolPanel>
          )}
          {openDrawer === 'templates' && (
            <ToolPanel title="TEMPLATES" onClose={() => setOpenDrawer(null)}>
              <TemplatesPanel
                signals={resumeSignals}
                onApply={applyTemplate}
                hasImportedOriginal={!!(savedDocxBuffer || savedRawHtml)}
                onKeepOriginal={keepImportedOriginal}
                activeTemplateId={activeTemplateId}
              />
            </ToolPanel>
          )}
          {openDrawer === 'jd' && (
            <ToolPanel title="/04 TAILOR WORDING" onClose={() => setOpenDrawer(null)}>
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
            </ToolPanel>
          )}
          {openDrawer === 'changes' && (
            <ToolPanel title="CHANGES" onClose={() => setOpenDrawer(null)}>
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
            </ToolPanel>
          )}
          {openDrawer === 'more' && (
            <ToolPanel title="MORE" onClose={() => setOpenDrawer(null)}>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <VersionSwitcher
                  versions={editor.versionHistory}
                  onRestore={editor.restoreVersion}
                  onDuplicate={editor.duplicateVersion}
                  onRename={editor.renameVersion}
                  onSaveCurrent={() =>
                    editor.saveVersion(
                      `${editor.targetCompany || 'Version'} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    )
                  }
                />
                <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '4px 0' }} />
                <button
                  onClick={() => { setAppPhase('landing'); setOpenDrawer(null); }}
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    background: 'none',
                    border: '1px solid var(--line)',
                    color: 'var(--muted)',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    borderRadius: '2px',
                    transition: 'all var(--transition)',
                  }}
                >
                  ← BACK TO IMPORT
                </button>
              </div>
            </ToolPanel>
          )}
        </div>

        {/* ── Canvas ── */}
        <div className={`${styles.resumeScroller} resume-scroller`}>
          {compareMode && originalSnapshot ? (
            <CompareView
              snapshot={originalSnapshot}
              onExit={() => setCompareMode(false)}
              currentPane={renderCurrentDoc()}
            />
          ) : (
            <>
              <div className={styles.workspaceGrid} aria-hidden />
              <div className={styles.pageDecorations}>
                <div className={`${styles.cornerMark} ${styles.tl}`} aria-hidden />
                <div className={`${styles.cornerMark} ${styles.tr}`} aria-hidden />
                <div className={`${styles.cornerMark} ${styles.bl}`} aria-hidden />
                <div className={`${styles.cornerMark} ${styles.br}`} aria-hidden />
                {renderCurrentDoc()}
              </div>
            </>
          )}

          {editor.isTailoring && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingCard}>
                <span className={styles.spinner} />
                <p>Analyzing job description…</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Status bar ───────────────────────── */}
      <div className={`${styles.statusBar} app-status-bar`} data-print="hide" aria-hidden>
        <div className={styles.statusLeft}>
          <span>DOC_01</span>
          {editor.currentResume.personalInfo.name && (
            <span>{editor.currentResume.personalInfo.name.toUpperCase()}</span>
          )}
        </div>
        <div className={styles.statusRight}>
          {fitOk && <span className={styles.statusFit}>● ONE PAGE</span>}
          <span>LETTER / 8.5 × 11</span>
        </div>
      </div>
    </div>
  );
}
