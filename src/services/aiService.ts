/**
 * AI Service — Resume Tailoring
 *
 * MVP: deterministic mock that produces keyword-aware change proposals.
 * The mock varies output based on which JD keywords appear, so different
 * JDs produce meaningfully different results without a real model call.
 *
 * ─────────────────────────────────────────────────────────────────────
 * PRODUCTION INTEGRATION POINT
 * ─────────────────────────────────────────────────────────────────────
 * Replace `mockTailorResume` with an HTTP call to your server:
 *
 *   async function apiTailorResume(
 *     resume: ResumeData,
 *     jd: string,
 *     options: TailoringOptions
 *   ): Promise<TailoringResponse> {
 *     const res = await fetch('/api/tailor', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ resume, jobDescription: jd, options }),
 *     });
 *     if (!res.ok) throw new Error('Tailoring request failed');
 *     return res.json();
 *   }
 *
 * The server-side handler calls Anthropic via:
 *   import Anthropic from '@anthropic-ai/sdk';
 *   const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
 *
 * NEVER put ANTHROPIC_API_KEY in:
 *   - Client-side source code
 *   - .env files committed to the repo
 *   - localStorage or sessionStorage
 * ─────────────────────────────────────────────────────────────────────
 */

import type { ResumeData } from '../types/resume';
import type {
  TailoringOptions,
  TailoringResponse,
  ResumeChange,
  JDAnalysis,
  JDKeyword,
} from '../types/tailor';

// ── Keyword vocabulary used for JD extraction ──────────────────────────────

const FRONTEND_TERMS = [
  'react', 'typescript', 'javascript', 'next.js', 'nextjs', 'vue', 'angular',
  'css', 'html', 'tailwind', 'storybook', 'design system', 'component library',
  'accessibility', 'wcag', 'a11y', 'performance', 'lighthouse', 'core web vitals',
  'webpack', 'vite', 'graphql', 'rest api', 'redux', 'zustand',
];

const BACKEND_TERMS = [
  'node.js', 'nodejs', 'python', 'go', 'rust', 'postgresql', 'mysql', 'mongodb',
  'redis', 'kafka', 'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'microservices',
];

const TESTING_TERMS = [
  'jest', 'testing library', 'react testing library', 'cypress', 'playwright',
  'unit test', 'integration test', 'e2e', 'tdd', 'coverage',
];

const COLLAB_TERMS = [
  'cross-functional', 'agile', 'scrum', 'mentoring', 'mentor', 'code review',
  'product', 'design', 'stakeholder', 'leadership',
];

const DATA_TERMS = [
  'd3', 'd3.js', 'recharts', 'chart', 'visualization', 'data visualization',
  'analytics', 'dashboard', 'metrics',
];

function containsAny(text: string, terms: string[]): string[] {
  const lower = text.toLowerCase();
  return terms.filter((t) => lower.includes(t));
}

function uuid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ── JD Analysis ───────────────────────────────────────────────────────────

function analyzeJD(jd: string, resumeText: string): JDAnalysis {
  const jdLower = jd.toLowerCase();

  const matchKeyword = (term: string): JDKeyword['match'] => {
    const inResume = resumeText.toLowerCase().includes(term.toLowerCase());
    const inJD = jdLower.includes(term.toLowerCase());
    if (!inJD) return 'unsupported';
    if (inResume) return 'supported';
    // Transferable heuristic: if resume mentions a closely related concept
    const relatedPairs: Record<string, string[]> = {
      graphql: ['api', 'rest', 'query'],
      'design system': ['component', 'library', 'ui'],
      accessibility: ['wcag', 'a11y', 'screen reader'],
      playwright: ['cypress', 'e2e', 'testing'],
      storybook: ['component', 'design system'],
    };
    const related = relatedPairs[term] ?? [];
    if (related.some((r) => resumeText.toLowerCase().includes(r))) return 'transferable';
    return 'unsupported';
  };

  const allTerms = [...FRONTEND_TERMS, ...BACKEND_TERMS, ...TESTING_TERMS, ...COLLAB_TERMS, ...DATA_TERMS];
  const presentInJD = allTerms.filter((t) => jdLower.includes(t));

  const keywords: JDKeyword[] = presentInJD.map((term) => ({
    term,
    match: matchKeyword(term),
  }));

  const requiredBlock = jd.match(/required qualifications?([\s\S]*?)(?:preferred qualifications?|tech stack|$)/i)?.[1] ?? '';
  const preferredBlock = jd.match(/preferred qualifications?([\s\S]*?)(?:tech stack|$)/i)?.[1] ?? '';

  const extractBullets = (block: string) =>
    block
      .split('\n')
      .map((l) => l.replace(/^[-•*]\s*/, '').trim())
      .filter((l) => l.length > 10);

  const missing = keywords
    .filter((k) => k.match === 'unsupported')
    .map((k) => k.term);

  return {
    coreResponsibilities: extractBullets(jd.match(/responsibilities?([\s\S]*?)(?:required|qualifications|$)/i)?.[1] ?? '').slice(0, 5),
    requiredSkills: extractBullets(requiredBlock).slice(0, 6),
    preferredSkills: extractBullets(preferredBlock).slice(0, 5),
    hardSkills: containsAny(jd, FRONTEND_TERMS).concat(containsAny(jd, BACKEND_TERMS)),
    softSkills: containsAny(jd, COLLAB_TERMS),
    tools: containsAny(jd, [...TESTING_TERMS, ...DATA_TERMS]),
    keywords,
    missingQualifications: missing,
  };
}

// ── Change generation ─────────────────────────────────────────────────────

function generateChanges(
  resume: ResumeData,
  _jdAnalysis: JDAnalysis,
  jd: string,
  options: TailoringOptions
): ResumeChange[] {
  const changes: ResumeChange[] = [];
  const jdLower = jd.toLowerCase();

  // ── 1. Summary rewrite ──────────────────────────────────────────────
  const hasDesignSystem = jdLower.includes('design system') || jdLower.includes('component library');
  const hasGraphQL = jdLower.includes('graphql');
  const hasMentoring = jdLower.includes('mentor') || jdLower.includes('senior');
  const hasSaaS = jdLower.includes('saas') || jdLower.includes('b2b') || jdLower.includes('enterprise');
  const hasPerf = jdLower.includes('performance') || jdLower.includes('core web vitals');
  const hasA11y = jdLower.includes('accessibility') || jdLower.includes('wcag');

  const summaryParts: string[] = [];
  summaryParts.push(
    `Frontend-focused software engineer with 4+ years of experience building performant, accessible React and TypeScript applications.`
  );
  if (hasDesignSystem)
    summaryParts.push(`Experienced in building and maintaining design systems and shared component libraries.`);
  if (hasGraphQL)
    summaryParts.push(`Comfortable working with both REST and GraphQL APIs in full-stack environments.`);
  if (hasMentoring)
    summaryParts.push(`Experienced mentoring junior engineers and driving frontend engineering standards.`);
  if (hasSaaS)
    summaryParts.push(`Background in SaaS products serving thousands of monthly active users.`);
  if (hasPerf)
    summaryParts.push(`Track record of measurable performance improvements — including 38% API latency reduction and Lighthouse score gains.`);

  const tailoredSummary = summaryParts.join(' ');

  if (tailoredSummary !== resume.summary) {
    changes.push({
      id: `chg-${uuid()}`,
      section: 'summary',
      targetId: 'summary',
      field: 'summary',
      before: resume.summary,
      after: tailoredSummary,
      reason: 'Rewritten to emphasize React/TypeScript depth and match the seniority and focus of this role.',
      jdEvidence: [
        hasMentoring ? 'Mentor junior engineers' : '',
        hasDesignSystem ? 'Design system / component library' : '',
        hasPerf ? 'Performance improvements' : '',
      ].filter(Boolean),
      resumeEvidence: ['Software engineer with 4 years of experience', '38% API response time reduction'],
      changeType: 'rewrite',
      riskLevel: 'safe',
      status: 'pending',
    });
  }

  // ── 2. Experience bullet rewrites ──────────────────────────────────
  const exp1 = resume.experience[0];
  if (exp1) {
    // Bullet: React dashboard → emphasize design system if relevant
    if (hasDesignSystem) {
      const b = exp1.bullets.find((b) => b.id === 'exp-1-b3');
      if (b) {
        changes.push({
          id: `chg-${uuid()}`,
          section: 'experience',
          targetId: exp1.id,
          field: `bullet:${b.id}`,
          before: b.text,
          after: `Led implementation of a shared design system used across 6 product areas, standardizing component APIs and reducing design-to-dev handoff friction.`,
          reason: 'The JD specifically requires design system experience. This bullet is strengthened to highlight ownership.',
          jdEvidence: ['Build and maintain a shared component library and design system'],
          resumeEvidence: [b.text],
          changeType: 'rewrite',
          riskLevel: 'safe',
          status: 'pending',
        });
      }
    }

    // Bullet: Testing — emphasize if JD stresses it
    if (jdLower.includes('test') || jdLower.includes('jest')) {
      const b = exp1.bullets.find((b) => b.id === 'exp-1-b4');
      if (b) {
        changes.push({
          id: `chg-${uuid()}`,
          section: 'experience',
          targetId: exp1.id,
          field: `bullet:${b.id}`,
          before: b.text,
          after: `Championed testing practices using Jest and React Testing Library; raised test coverage from 52% to 81%, reducing regression incidents by an estimated 40%.`,
          reason: 'The JD calls for championing frontend testing practices. This bullet is reframed to show initiative.',
          jdEvidence: ['Champion frontend testing practices (unit, integration, and end-to-end)'],
          resumeEvidence: [b.text],
          changeType: 'rewrite',
          riskLevel: 'review',
          status: 'pending',
        });
      }
    }

    // Bullet: on-call → shorten if options.forceOnePage
    if (options.intensity !== 'conservative') {
      const b = exp1.bullets.find((b) => b.id === 'exp-1-b5');
      if (b) {
        changes.push({
          id: `chg-${uuid()}`,
          section: 'experience',
          targetId: exp1.id,
          field: `bullet:${b.id}`,
          before: b.text,
          after: `Participated in on-call rotation; maintained 99.7% uptime over 12 months.`,
          reason: 'Shortened to save vertical space while retaining the key metric.',
          jdEvidence: [],
          resumeEvidence: [b.text],
          changeType: 'shorten',
          riskLevel: 'safe',
          status: 'pending',
        });
      }
    }
  }

  const exp2 = resume.experience[1];
  if (exp2 && options.intensity !== 'conservative') {
    // Bullet: Migrated jQuery → highlight performance, align with JD
    const b = exp2.bullets.find((b) => b.id === 'exp-2-b3');
    if (b) {
      changes.push({
        id: `chg-${uuid()}`,
        section: 'experience',
        targetId: exp2.id,
        field: `bullet:${b.id}`,
        before: b.text,
        after: `Migrated a legacy jQuery application to React, reducing bundle size by 22% and improving Lighthouse performance score from 61 to 88.`,
        reason: "The JD emphasizes performance. This bullet's Lighthouse result is a concrete, relevant metric.",
        jdEvidence: ['Drive performance improvements across key user flows'],
        resumeEvidence: [b.text],
        changeType: 'rewrite',
        riskLevel: 'safe',
        status: 'pending',
      });
    }
  }

  // ── 3. Skills reorder ──────────────────────────────────────────────
  if (hasGraphQL) {
    const backendGroup = resume.skills.find((g) => g.id === 'skill-2');
    if (backendGroup && !backendGroup.skills.includes('GraphQL')) {
      // GraphQL is already in the resume (it's in skill-2); just flag it's supported
    } else if (backendGroup && backendGroup.skills.includes('GraphQL')) {
      const reordered = ['GraphQL', ...backendGroup.skills.filter((s) => s !== 'GraphQL')];
      changes.push({
        id: `chg-${uuid()}`,
        section: 'skills',
        targetId: backendGroup.id,
        field: 'skills',
        before: backendGroup.skills.join(', '),
        after: reordered.join(', '),
        reason: 'GraphQL is in the required qualifications. Moving it to the front of the Backend skill group increases ATS visibility.',
        jdEvidence: ['Experience with GraphQL APIs'],
        resumeEvidence: ['GraphQL (already in resume)'],
        changeType: 'reorder',
        riskLevel: 'safe',
        status: 'pending',
      });
    }
  }

  if (hasA11y) {
    const frontendGroup = resume.skills.find((g) => g.id === 'skill-1');
    if (frontendGroup && !frontendGroup.skills.some((s) => s.toLowerCase().includes('accessibility'))) {
      // Accessibility not in resume → mark as gap, don't add it
    }
  }

  // ── 4. Storybook gap ──────────────────────────────────────────────
  if (jdLower.includes('storybook')) {
    changes.push({
      id: `chg-${uuid()}`,
      section: 'skills',
      targetId: 'skill-3',
      field: 'skills',
      before: resume.skills.find((g) => g.id === 'skill-3')?.skills.join(', ') ?? '',
      after: resume.skills.find((g) => g.id === 'skill-3')?.skills.join(', ') ?? '',
      reason:
        'The JD lists Storybook in its tech stack, but Storybook is not mentioned in your resume. This change has been blocked — do not add it unless you have genuine experience with it.',
      jdEvidence: ['Tech Stack: Storybook'],
      resumeEvidence: [],
      changeType: 'rewrite',
      riskLevel: 'blocked',
      status: 'pending',
    });
  }

  return changes;
}

// ── Public API ────────────────────────────────────────────────────────────

export async function tailorResume(
  resume: ResumeData,
  jobDescription: string,
  options: TailoringOptions
): Promise<TailoringResponse> {
  // Simulate network latency so loading states are exercisable
  await new Promise((r) => setTimeout(r, 1800));

  const resumeText = JSON.stringify(resume);
  const jdAnalysis = analyzeJD(jobDescription, resumeText);
  const changes = generateChanges(resume, jdAnalysis, jobDescription, options);

  const matchedKeywords = jdAnalysis.keywords
    .filter((k) => k.match === 'supported')
    .map((k) => k.term);

  const unsupportedKeywords = jdAnalysis.keywords
    .filter((k) => k.match === 'unsupported')
    .map((k) => k.term);

  return {
    changes,
    jdAnalysis,
    truthfulnessWarnings: [],  // populated by validationService after generation
    matchedKeywords,
    missingQualifications: jdAnalysis.missingQualifications,
    unsupportedKeywords,
  };
}

export async function analyzeJobDescription(jd: string, resume: ResumeData): Promise<JDAnalysis> {
  await new Promise((r) => setTimeout(r, 600));
  return analyzeJD(jd, JSON.stringify(resume));
}
