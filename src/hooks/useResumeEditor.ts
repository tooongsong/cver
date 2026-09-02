import { useCallback, useEffect, useState } from 'react';
import type { ResumeData, Experience, Education, SkillGroup, ResumeBullet } from '../types/resume';
import type {
  ResumeChange,
  TailoringOptions,
  JDAnalysis,
  TruthfulnessWarning,
  ResumeVersion,
  FitResult,
} from '../types/tailor';
import { tailorResume, analyzeJobDescription } from '../services/aiService';
import { validateChanges } from '../services/validationService';
import { loadSession, saveSession } from '../services/storageService';
import { sampleResume } from '../data/sampleResume';
import { sampleJD, sampleCompany, sampleRole } from '../data/sampleJD';
import { getTemplate, DEFAULT_TEMPLATE_ID } from '../data/templates';
import type { ResumeTemplate } from '../data/templates';

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function uuid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_OPTIONS: TailoringOptions = {
  intensity: 'balanced',
  prioritizeATS: true,
  keepAllExperiences: false,
  keepEducationUnchanged: true,
  preserveJobTitles: true,
  forceOnePage: true,
};

const EMPTY_FIT: FitResult = {
  fits: true,
  scale: 1,
  overflowingSections: [],
  suggestedShortening: [],
  readabilityScore: 100,
  message: '',
};

function applyChange(resume: ResumeData, change: ResumeChange): ResumeData {
  const next = deepClone(resume);

  if (change.section === 'summary') {
    next.summary = change.after;
    return next;
  }

  if (change.section === 'experience') {
    const idx = next.experience.findIndex((e) => e.id === change.targetId);
    if (idx === -1) return next;
    if (change.field === 'title') {
      next.experience[idx].title = change.after;
    } else if (change.field === 'company') {
      next.experience[idx].company = change.after;
    } else if (change.field.startsWith('bullet:')) {
      const bulletId = change.field.replace('bullet:', '');
      const bIdx = next.experience[idx].bullets.findIndex((b) => b.id === bulletId);
      if (bIdx !== -1) next.experience[idx].bullets[bIdx].text = change.after;
    }
    return next;
  }

  if (change.section === 'projects') {
    const idx = next.projects.findIndex((p) => p.id === change.targetId);
    if (idx === -1) return next;
    if (change.field.startsWith('bullet:')) {
      const bulletId = change.field.replace('bullet:', '');
      const bIdx = next.projects[idx].bullets.findIndex((b) => b.id === bulletId);
      if (bIdx !== -1) next.projects[idx].bullets[bIdx].text = change.after;
    }
    return next;
  }

  if (change.section === 'skills') {
    const idx = next.skills.findIndex((g) => g.id === change.targetId);
    if (idx === -1) return next;
    if (change.field === 'skills') {
      next.skills[idx].skills = change.after.split(', ').map((s) => s.trim());
    }
    return next;
  }

  return next;
}

function revertChange(resume: ResumeData, change: ResumeChange): ResumeData {
  // Use `before` value instead of `after`
  return applyChange(resume, { ...change, after: change.before, before: change.after });
}

export function useResumeEditor() {
  const stored = loadSession();

  const [originalResume, setOriginalResume] = useState<ResumeData>(
    stored?.originalResume ?? sampleResume
  );
  const [currentResume, setCurrentResume] = useState<ResumeData>(
    stored?.currentResume ?? deepClone(sampleResume)
  );
  const [jobDescription, setJobDescription] = useState(stored?.jobDescription ?? sampleJD);
  const [targetCompany, setTargetCompany] = useState(stored?.targetCompany ?? sampleCompany);
  const [targetRole, setTargetRole] = useState(stored?.targetRole ?? sampleRole);
  const [jdAnalysis, setJdAnalysis] = useState<JDAnalysis | null>(stored?.jdAnalysis ?? null);
  const [proposedChanges, setProposedChanges] = useState<ResumeChange[]>(
    stored?.proposedChanges ?? []
  );
  const [warnings, setWarnings] = useState<TruthfulnessWarning[]>(
    stored?.truthfulnessWarnings ?? []
  );
  const [versionHistory, setVersionHistory] = useState<ResumeVersion[]>(
    stored?.versionHistory ?? []
  );
  const [tailoringOptions, setTailoringOptions] = useState<TailoringOptions>(DEFAULT_OPTIONS);
  const [isTailoring, setIsTailoring] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fitResult, setFitResult] = useState<FitResult>(EMPTY_FIT);
  const [activeView, setActiveView] = useState<'jd' | 'editor' | 'review'>('editor');
  const [importedStyleOverrides, setImportedStyleOverrides] = useState<Record<string, string>>({});
  const [activeTemplate, setActiveTemplate] = useState<ResumeTemplate>(
    getTemplate(localStorage.getItem('resume-template-id') ?? DEFAULT_TEMPLATE_ID)
  );

  // Persist to localStorage on state changes
  useEffect(() => {
    saveSession({
      originalResume,
      currentResume,
      targetCompany,
      targetRole,
      jobDescription,
      jdAnalysis,
      proposedChanges,
      truthfulnessWarnings: warnings,
      versionHistory,
    });
  }, [originalResume, currentResume, targetCompany, targetRole, jobDescription, jdAnalysis, proposedChanges, warnings, versionHistory]);

  // ── Resume direct editing ──────────────────────────────────────────

  const updatePersonalInfo = useCallback(
    (updates: Partial<ResumeData['personalInfo']>) => {
      setCurrentResume((prev) => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, ...updates },
      }));
    },
    []
  );

  const updateSummary = useCallback((text: string) => {
    setCurrentResume((prev) => ({ ...prev, summary: text }));
  }, []);

  const updateExperience = useCallback(
    (id: string, updates: Partial<Experience>) => {
      setCurrentResume((prev) => ({
        ...prev,
        experience: prev.experience.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      }));
    },
    []
  );

  const updateBullet = useCallback(
    (section: 'experience' | 'projects', parentId: string, bulletId: string, text: string) => {
      setCurrentResume((prev) => {
        const next = deepClone(prev);
        const items = section === 'experience' ? next.experience : next.projects;
        const parent = items.find((i) => i.id === parentId);
        if (!parent) return prev;
        const bullet = parent.bullets.find((b: ResumeBullet) => b.id === bulletId);
        if (bullet) bullet.text = text;

        // If this bullet was an accepted change, mark it as edited
        setProposedChanges((chgs) =>
          chgs.map((c) =>
            c.field === `bullet:${bulletId}` && c.status === 'accepted'
              ? { ...c, status: 'edited' }
              : c
          )
        );
        return next;
      });
    },
    []
  );

  const updateEducation = useCallback(
    (id: string, updates: Partial<Education>) => {
      setCurrentResume((prev) => ({
        ...prev,
        education: prev.education.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      }));
    },
    []
  );

  const updateSkillGroup = useCallback(
    (id: string, updates: Partial<SkillGroup>) => {
      setCurrentResume((prev) => ({
        ...prev,
        skills: prev.skills.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      }));
    },
    []
  );

  // ── AI operations ──────────────────────────────────────────────────

  const analyzeJD = useCallback(async () => {
    if (!jobDescription.trim()) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeJobDescription(jobDescription, originalResume);
      setJdAnalysis(analysis);
    } finally {
      setIsAnalyzing(false);
    }
  }, [jobDescription, originalResume]);

  const runTailoring = useCallback(async () => {
    if (!jobDescription.trim()) return;
    setIsTailoring(true);
    try {
      const response = await tailorResume(originalResume, jobDescription, tailoringOptions);
      const validationWarnings = validateChanges(response.changes, originalResume);

      // Merge validation warnings into changes' riskLevel
      const enrichedChanges = response.changes.map((c) => {
        const hasBlock = validationWarnings.some(
          (w) => w.changeId === c.id && w.severity === 'blocked'
        );
        return hasBlock ? { ...c, riskLevel: 'blocked' as const } : c;
      });

      setProposedChanges(enrichedChanges);
      setJdAnalysis(response.jdAnalysis);
      setWarnings(validationWarnings);

      // Save a version snapshot of current state before applying changes
      const version: ResumeVersion = {
        id: uuid(),
        name: `Before tailoring — ${targetCompany || 'General'}`,
        createdAt: new Date().toISOString(),
        targetCompany,
        targetRole,
        resume: deepClone(currentResume),
        changes: [],
        fitStatus: fitResult,
      };
      setVersionHistory((prev) => [version, ...prev.slice(0, 9)]);
      setActiveView('review');
    } finally {
      setIsTailoring(false);
    }
  }, [jobDescription, originalResume, tailoringOptions, targetCompany, targetRole, currentResume, fitResult]);

  // ── Change operations ─────────────────────────────────────────────

  const acceptChange = useCallback((changeId: string) => {
    setProposedChanges((prev) => {
      const change = prev.find((c) => c.id === changeId);
      if (!change || change.status !== 'pending') return prev;
      setCurrentResume((resume) => applyChange(resume, change));
      return prev.map((c) => (c.id === changeId ? { ...c, status: 'accepted' } : c));
    });
  }, []);

  const rejectChange = useCallback((changeId: string) => {
    setProposedChanges((prev) =>
      prev.map((c) => (c.id === changeId && c.status === 'pending' ? { ...c, status: 'rejected' } : c))
    );
  }, []);

  const undoChange = useCallback((changeId: string) => {
    setProposedChanges((prev) => {
      const change = prev.find((c) => c.id === changeId);
      if (!change || (change.status !== 'accepted' && change.status !== 'edited')) return prev;
      setCurrentResume((resume) => revertChange(resume, change));
      return prev.map((c) => (c.id === changeId ? { ...c, status: 'pending' } : c));
    });
  }, []);

  const editChange = useCallback((changeId: string, newValue: string) => {
    setProposedChanges((prev) => {
      const change = prev.find((c) => c.id === changeId);
      if (!change) return prev;
      const updated = { ...change, after: newValue, status: 'edited' as const };
      setCurrentResume((resume) => applyChange(resume, updated));
      return prev.map((c) => (c.id === changeId ? updated : c));
    });
  }, []);

  const acceptAll = useCallback(() => {
    setProposedChanges((prev) => {
      let resume = currentResume;
      const next = prev.map((c) => {
        if (c.status === 'pending' && c.riskLevel !== 'blocked') {
          resume = applyChange(resume, c);
          return { ...c, status: 'accepted' as const };
        }
        return c;
      });
      setCurrentResume(resume);
      return next;
    });
  }, [currentResume]);

  const rejectAll = useCallback(() => {
    setProposedChanges((prev) =>
      prev.map((c) => (c.status === 'pending' ? { ...c, status: 'rejected' as const } : c))
    );
  }, []);

  const restoreOriginal = useCallback(() => {
    setCurrentResume(deepClone(originalResume));
    setProposedChanges([]);
    setWarnings([]);
    setJdAnalysis(null);
  }, [originalResume]);

  // ── Import ─────────────────────────────────────────────────────────

  const loadNewResume = useCallback((resume: ResumeData, styleOverrides: Record<string, string> = {}) => {
    setOriginalResume(deepClone(resume));
    setCurrentResume(deepClone(resume));
    setProposedChanges([]);
    setWarnings([]);
    setJdAnalysis(null);
    setImportedStyleOverrides(styleOverrides);
  }, []);

  // ── Version history ────────────────────────────────────────────────

  const saveVersion = useCallback(
    (name: string) => {
      const version: ResumeVersion = {
        id: uuid(),
        name,
        createdAt: new Date().toISOString(),
        targetCompany,
        targetRole,
        resume: deepClone(currentResume),
        changes: deepClone(proposedChanges),
        fitStatus: fitResult,
      };
      setVersionHistory((prev) => [version, ...prev.slice(0, 9)]);
    },
    [currentResume, proposedChanges, targetCompany, targetRole, fitResult]
  );

  const restoreVersion = useCallback((version: ResumeVersion) => {
    setCurrentResume(deepClone(version.resume));
    setProposedChanges(deepClone(version.changes));
  }, []);

  const duplicateVersion = useCallback(
    (versionId: string) => {
      const version = versionHistory.find((v) => v.id === versionId);
      if (!version) return;
      const dup: ResumeVersion = {
        ...deepClone(version),
        id: uuid(),
        name: `${version.name} (copy)`,
        createdAt: new Date().toISOString(),
      };
      setVersionHistory((prev) => [dup, ...prev]);
    },
    [versionHistory]
  );

  const renameVersion = useCallback((versionId: string, name: string) => {
    setVersionHistory((prev) => prev.map((v) => (v.id === versionId ? { ...v, name } : v)));
  }, []);

  const changeTemplate = useCallback((t: ResumeTemplate) => {
    setActiveTemplate(t);
    localStorage.setItem('resume-template-id', t.id);
  }, []);

  // Add a single externally-created change (e.g. from paste-to-match)
  const addChange = useCallback((change: ResumeChange) => {
    setProposedChanges((prev) => {
      // Replace if same field already has a pending change
      const existing = prev.findIndex(
        (c) => c.field === change.field && c.targetId === change.targetId && c.status === 'pending'
      );
      if (existing !== -1) {
        const next = [...prev];
        next[existing] = change;
        return next;
      }
      return [change, ...prev];
    });
  }, []);

  return {
    // State
    originalResume,
    currentResume,
    importedStyleOverrides,
    jobDescription,
    targetCompany,
    targetRole,
    jdAnalysis,
    proposedChanges,
    warnings,
    versionHistory,
    tailoringOptions,
    isTailoring,
    isAnalyzing,
    fitResult,
    activeView,
    activeTemplate,

    // Setters
    setJobDescription,
    setTargetCompany,
    setTargetRole,
    setTailoringOptions,
    setFitResult,
    setActiveView,
    changeTemplate,

    // Resume editing
    updatePersonalInfo,
    updateSummary,
    updateExperience,
    updateBullet,
    updateEducation,
    updateSkillGroup,

    // AI
    analyzeJD,
    runTailoring,

    // Changes
    acceptChange,
    rejectChange,
    undoChange,
    editChange,
    acceptAll,
    rejectAll,
    restoreOriginal,

    // Import / paste
    loadNewResume,
    addChange,

    // Versions
    saveVersion,
    restoreVersion,
    duplicateVersion,
    renameVersion,
  };
}
