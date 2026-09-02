import type { ResumeData } from './resume';

export type ChangeSection = 'summary' | 'experience' | 'projects' | 'skills';
export type ChangeType = 'rewrite' | 'shorten' | 'reorder' | 'remove';
export type RiskLevel = 'safe' | 'review' | 'blocked';
export type ChangeStatus = 'pending' | 'accepted' | 'rejected' | 'edited';

export type ResumeChange = {
  id: string;
  section: ChangeSection;
  targetId: string;
  field: string;        // "summary" | "title" | "bullet:<bulletId>" | "skills"
  before: string;
  after: string;
  reason: string;
  jdEvidence: string[];
  resumeEvidence: string[];
  changeType: ChangeType;
  riskLevel: RiskLevel;
  status: ChangeStatus;
};

export type KeywordMatch = 'supported' | 'transferable' | 'unsupported' | 'ambiguous';

export type JDKeyword = {
  term: string;
  match: KeywordMatch;
  evidence?: string;
};

export type JDAnalysis = {
  coreResponsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  hardSkills: string[];
  softSkills: string[];
  tools: string[];
  keywords: JDKeyword[];
  missingQualifications: string[];
};

export type TruthfulnessWarning = {
  id: string;
  severity: 'info' | 'review' | 'blocked';
  changeId?: string;
  message: string;
  originalEvidence?: string;
  proposedValue?: string;
};

export type TailoringOptions = {
  intensity: 'conservative' | 'balanced' | 'aggressive';
  prioritizeATS: boolean;
  keepAllExperiences: boolean;
  keepEducationUnchanged: boolean;
  preserveJobTitles: boolean;
  forceOnePage: boolean;
};

export type TailoringResponse = {
  changes: ResumeChange[];
  jdAnalysis: JDAnalysis;
  truthfulnessWarnings: TruthfulnessWarning[];
  matchedKeywords: string[];
  missingQualifications: string[];
  unsupportedKeywords: string[];
};

export type FitResult = {
  fits: boolean;
  scale: number;
  overflowingSections: string[];
  suggestedShortening: string[];
  readabilityScore: number;
  message: string;
};

export type PreflightCheck = {
  name: string;
  passed: boolean;
  detail?: string;
};

export type PreflightResult = {
  passed: boolean;
  checks: PreflightCheck[];
};

export type ResumeVersion = {
  id: string;
  name: string;
  createdAt: string;
  targetCompany?: string;
  targetRole?: string;
  resume: ResumeData;
  changes: ResumeChange[];
  fitStatus: FitResult;
};

export type StoredSession = {
  schemaVersion: number;
  originalResume: ResumeData;
  currentResume: ResumeData;
  targetCompany: string;
  targetRole: string;
  jobDescription: string;
  jdAnalysis: JDAnalysis | null;
  proposedChanges: ResumeChange[];
  truthfulnessWarnings: TruthfulnessWarning[];
  versionHistory: ResumeVersion[];
};
