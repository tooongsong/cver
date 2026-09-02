import type { ResumeData } from '../types/resume';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const SECTION_KEYS: Record<string, string[]> = {
  experience: ['experience', 'work experience', 'professional experience', 'employment', 'career', 'work history'],
  education: ['education', 'academic', 'qualifications', 'academic background'],
  skills: ['skills', 'technical skills', 'competencies', 'expertise', 'technologies', 'tools', 'core competencies'],
  projects: ['projects', 'portfolio', 'personal projects', 'selected projects', 'key projects'],
  summary: ['summary', 'profile', 'objective', 'professional summary', 'about', 'overview', 'career objective'],
  certifications: ['certifications', 'certificates', 'licenses', 'credentials'],
  languages: ['languages', 'language skills'],
};

// Matches "Jan 2020 – Present", "June 2018 - Dec 2020", "2019 – 2022", "01/2020 – Present"
const DATE_RANGE =
  /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,.]?\s+\d{2,4}|\d{1,2}\/\d{4}|\d{4})\s*[-–—]\s*(?:Present|Current|Now|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,.]?\s+\d{2,4}|\d{1,2}\/\d{4}|\d{4})/i;

const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE = /(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const LINKEDIN = /linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i;
const GITHUB = /github\.com\/([a-zA-Z0-9_-]+)/i;
const LOCATION = /[A-Z][a-zA-Z\s]+,\s*(?:[A-Z]{2}|[A-Z][a-zA-Z\s]{1,20})(?:\s|$)/;
const BULLET_START = /^[•◦▪▸▹◆◇★\-\*]\s+/;

interface Block {
  text: string;
  bold: boolean;
  heading: boolean;
}

function htmlToBlocks(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks: Block[] = [];
  for (const el of Array.from(doc.body.children)) {
    const text = (el.textContent ?? '').trim();
    if (!text) continue;
    const tag = el.tagName.toLowerCase();
    const heading = /^h[1-6]$/.test(tag);
    const strongLen = Array.from(el.querySelectorAll('strong, b'))
      .reduce((n, e) => n + (e.textContent?.length ?? 0), 0);
    const bold = heading || strongLen >= text.length * 0.5;
    blocks.push({ text, bold, heading });
  }
  return blocks;
}

function detectSection(b: Block): string | null {
  if (!b.bold && !b.heading) return null;
  if (b.text.length > 70) return null;
  const clean = b.text.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  for (const [sec, keys] of Object.entries(SECTION_KEYS)) {
    if (keys.some((k) => clean === k || clean.startsWith(k + ' ') || clean.endsWith(' ' + k))) {
      return sec;
    }
  }
  return null;
}

function extractDates(text: string): { start: string; end: string } | null {
  const m = text.match(DATE_RANGE);
  if (!m) return null;
  const [a, b] = m[0].split(/[-–—]/);
  return { start: a.trim(), end: b.trim() };
}

function stripDates(text: string): string {
  return text.replace(DATE_RANGE, '').replace(/\s*[|·,;]\s*$/, '').replace(/^\s*[|·,;]\s*/, '').trim();
}

function parseExperience(blocks: Block[]): ResumeData['experience'] {
  const out: ResumeData['experience'] = [];
  let cur: ResumeData['experience'][0] | null = null;

  for (const b of blocks) {
    const text = b.text;

    if (BULLET_START.test(text)) {
      if (!cur) {
        cur = { id: uid(), company: '', title: '', location: '', startDate: '', endDate: '', bullets: [] };
        out.push(cur);
      }
      cur.bullets.push({ id: uid(), text: text.replace(BULLET_START, '').trim() });
      continue;
    }

    const dates = extractDates(text);
    const stripped = dates ? stripDates(text) : text;

    if ((b.bold || dates) && !detectSection(b)) {
      // New entry header
      cur = { id: uid(), company: '', title: '', location: '', startDate: dates?.start ?? '', endDate: dates?.end ?? '', bullets: [] };
      out.push(cur);

      // Parse title and company from stripped text
      // Common patterns: "Title | Company | Location" or "Title — Company" or "Title, Company"
      const parts = stripped.split(/\s*[|·–—,]\s*/).filter(Boolean);
      cur.title = parts[0]?.trim() ?? '';
      cur.company = parts[1]?.trim() ?? '';
      if (parts[2] && LOCATION.test(parts[2])) cur.location = parts[2].trim();
      continue;
    }

    if (cur) {
      // Could be location or continuation of entry header
      const locM = text.match(LOCATION);
      if (locM && !cur.location && text.length < 60) {
        cur.location = locM[0].trim();
      } else if (!cur.company && text.length < 60 && !BULLET_START.test(text)) {
        cur.company = text;
      }
    }
  }

  return out.filter((e) => e.title || e.company || e.bullets.length);
}

function parseEducation(blocks: Block[]): ResumeData['education'] {
  const out: ResumeData['education'] = [];
  let cur: ResumeData['education'][0] | null = null;

  for (const b of blocks) {
    if (BULLET_START.test(b.text)) continue;
    const dates = extractDates(b.text);
    const stripped = dates ? stripDates(b.text) : b.text;

    if ((b.bold || b.heading) && !detectSection(b)) {
      cur = { id: uid(), institution: stripped, degree: '', field: '', location: '', startDate: dates?.start ?? '', endDate: dates?.end ?? '' };
      out.push(cur);
      continue;
    }

    if (cur) {
      if (dates && !cur.startDate) {
        cur.startDate = dates.start;
        cur.endDate = dates.end;
      }
      // Degree / field line
      if (!cur.degree && stripped) {
        const degMatch = stripped.match(/(?:Bachelor|Master|Ph\.?D|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|B\.?Sc|M\.?Sc|Associate)[a-zA-Z\s\.]*/i);
        if (degMatch) {
          cur.degree = degMatch[0].trim();
          cur.field = stripped.replace(degMatch[0], '').replace(/^[\s,;|]+/, '').trim();
        } else {
          cur.degree = stripped.split(/[|,;]/)[0].trim();
          cur.field = stripped.split(/[|,;]/)[1]?.trim() ?? '';
        }
      }
    }
  }

  return out.filter((e) => e.institution);
}

function parseSkills(blocks: Block[]): ResumeData['skills'] {
  const out: ResumeData['skills'] = [];

  for (const b of blocks) {
    const text = b.text.replace(BULLET_START, '');

    // "Category: item1, item2, item3"
    const catMatch = text.match(/^([A-Za-z\s&\/\-]+):\s*(.+)$/);
    if (catMatch) {
      out.push({
        id: uid(),
        category: catMatch[1].trim(),
        skills: catMatch[2].split(/[,;]/).map((s) => s.trim()).filter(Boolean),
      });
      continue;
    }

    // Plain comma list — group into one
    if (text.includes(',')) {
      const items = text.split(',').map((s) => s.trim()).filter((s) => s && s.length < 50);
      if (items.length >= 2) {
        out.push({ id: uid(), category: 'Skills', skills: items });
        continue;
      }
    }

    // Single line — add as one item in generic group
    if (text.length < 150) {
      out.push({ id: uid(), category: 'Skills', skills: [text] });
    }
  }

  // Collapse adjacent "Skills" groups
  return out.reduce<ResumeData['skills']>((acc, g) => {
    const prev = acc[acc.length - 1];
    if (g.category === 'Skills' && prev?.category === 'Skills') {
      prev.skills.push(...g.skills);
    } else {
      acc.push(g);
    }
    return acc;
  }, []);
}

export function parseResumeHtml(html: string): ResumeData {
  const blocks = htmlToBlocks(html);

  // ── Name ───────────────────────────────────────────────
  const nameBlock =
    blocks.find((b) => b.heading) ??
    blocks.find((b) => b.bold && !detectSection(b) && b.text.length < 70 && !EMAIL.test(b.text));
  const name = nameBlock?.text ?? '';
  const nameIdx = nameBlock ? blocks.indexOf(nameBlock) : -1;

  // ── Contact info ───────────────────────────────────────
  const contactBlocks = blocks.slice(nameIdx + 1, nameIdx + 6).filter(
    (b) => !b.heading && (EMAIL.test(b.text) || PHONE.test(b.text) || b.text.includes('|') || LINKEDIN.test(b.text))
  );
  const contactText = contactBlocks.map((b) => b.text).join(' ');

  const email = contactText.match(EMAIL)?.[0] ?? '';
  const phone = contactText.match(PHONE)?.[0] ?? '';
  const linkedinM = contactText.match(LINKEDIN);
  const githubM = contactText.match(GITHUB);
  const locationM = contactText.match(LOCATION) ?? contactBlocks.flatMap((b) => b.text.split(/[|·,]/).map((s) => s.trim())).find((s) => LOCATION.test(s + ' '));
  const location = typeof locationM === 'string' ? locationM : (locationM?.[0] ?? '');

  // ── Title (line between name and contact) ──────────────
  let title = '';
  if (nameIdx >= 0 && nameIdx + 1 < blocks.length) {
    const candidate = blocks[nameIdx + 1];
    if (!contactBlocks.includes(candidate) && !detectSection(candidate) && candidate.text.length < 80) {
      title = candidate.text;
    }
  }

  // ── Section split ──────────────────────────────────────
  const sections: Record<string, Block[]> = { header: [] };
  let cur = 'header';
  for (const b of blocks) {
    const sec = detectSection(b);
    if (sec) { cur = sec; sections[cur] = sections[cur] ?? []; }
    else { (sections[cur] = sections[cur] ?? []).push(b); }
  }

  // ── Summary ────────────────────────────────────────────
  let summary = '';
  if (sections.summary) {
    summary = sections.summary.filter((b) => !b.bold).map((b) => b.text).join(' ').trim();
  }
  if (!summary && sections.header) {
    // Look for a long non-contact paragraph in header area
    const s = sections.header.find(
      (b) => b !== nameBlock && b.text.length > 60 && !EMAIL.test(b.text) && !PHONE.test(b.text)
    );
    if (s) summary = s.text;
  }

  // ── Languages ──────────────────────────────────────────
  const languages: ResumeData['languages'] = [];
  if (sections.languages) {
    const raw = sections.languages.map((b) => b.text.replace(BULLET_START, '')).join(', ');
    for (const part of raw.split(/[,;]/)) {
      const t = part.trim();
      if (!t) continue;
      const lvlM = t.match(/^(.+?)\s*[\(\[–\-]\s*(.+?)[\)\]]?\s*$/);
      if (lvlM) languages.push({ id: uid(), name: lvlM[1].trim(), proficiency: lvlM[2].trim() });
      else languages.push({ id: uid(), name: t, proficiency: '' });
    }
  }

  return {
    personalInfo: {
      name,
      title,
      email,
      phone,
      location,
      linkedin: linkedinM ? `linkedin.com/in/${linkedinM[1]}` : undefined,
      website: githubM ? `github.com/${githubM[1]}` : undefined,
    },
    summary,
    experience: sections.experience ? parseExperience(sections.experience) : [],
    projects: [],
    education: sections.education ? parseEducation(sections.education) : [],
    skills: sections.skills ? parseSkills(sections.skills) : [],
    languages,
  };
}

// Parse plain text by inserting fake HTML tags based on heuristics
export function parseResumeText(text: string): ResumeData {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Wrap bold-looking lines (short, all caps, or first line) in <strong>
  const html = lines
    .map((line, i) => {
      const isAllCaps = line === line.toUpperCase() && line.length > 2 && /[A-Z]/.test(line);
      const isShortBold = i === 0 || (line.length < 60 && isAllCaps);
      return isShortBold ? `<p><strong>${line}</strong></p>` : `<p>${line}</p>`;
    })
    .join('');

  return parseResumeHtml(html);
}
