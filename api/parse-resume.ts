import { IncomingMessage, ServerResponse } from 'http';
import OpenAI from 'openai';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// ── Prompts ───────────────────────────────────────────────────────

const VISION_PROMPT = `You are a precise resume HTML cloner. Analyze this resume image and reproduce it as HTML.

Return ONLY this JSON (no markdown, no explanation):
{
  "html": "<div style=\\"padding:0.6in; font-family:'Times New Roman',serif; font-size:11pt; line-height:1.4;\\">...</div>",
  "content": {
    "personalInfo": { "name": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "" },
    "summary": "",
    "experience": [{ "company": "", "title": "", "location": "", "startDate": "", "endDate": "", "bullets": [{"id":"1","text":""}] }],
    "projects": [],
    "education": [{ "institution": "", "degree": "", "field": "", "location": "", "startDate": "", "endDate": "" }],
    "skills": [{ "category": "", "skills": [""] }],
    "languages": [{ "name": "", "proficiency": "" }]
  }
}

Rules for "html":
- A SINGLE <div> element. No html/head/body tags.
- Padding matches original margins (e.g. style="padding: 0.55in 0.65in")
- DO NOT set width or height — the parent wrapper provides 8.5in × 11in
- Use INLINE CSS ONLY — no classes, no <style> tags, no external resources
- Font family: use the closest CSS font stack you can see:
    serif → "'Times New Roman', Georgia, serif"
    humanist sans → "Arial, 'Helvetica Neue', sans-serif"
    geometric → "'Trebuchet MS', system-ui, sans-serif"
    modern → "system-ui, -apple-system, sans-serif"
- Match font sizes, font weights, line-height from the original
- Match spacing between sections (margin-bottom on section wrappers)
- Match spacing between entries (margin-bottom on entry wrappers)
- Preserve section ORDER exactly as it appears in the resume
- If heading is ALL CAPS — keep it ALL CAPS in the HTML text
- If there are horizontal divider lines between sections — add <hr style="border:none; border-top:1px solid #888; margin:4pt 0 4pt;"> or similar
- If dates are right-aligned — use display:flex; justify-content:space-between on the entry header row
- If two-column layout — use display:grid; grid-template-columns:... or CSS float
- Preserve ALL text exactly — do not paraphrase, abbreviate, or skip any content
- Bullet points: use <ul style="margin:2pt 0; padding-left:14pt; list-style-type:disc;"> or match original bullet style
- Colors: match heading color, rule color, accent color exactly (use hex)

Rules for "content":
- Extract ALL visible text faithfully
- Never fabricate — only what is visible
- IDs: generate simple sequential strings like "e1", "e2", "b1", "b2"`;

const DOCX_PROMPT = (mammothHtml: string, layoutJson: string) =>
  `You are a resume HTML styler. Convert plain resume HTML into a styled, visually accurate resume.

INPUT CONTENT (extracted from DOCX, semantic HTML):
${mammothHtml}

DETECTED LAYOUT PROPERTIES (from DOCX XML):
${layoutJson}

Generate styled HTML that looks like the original DOCX resume.
Return ONLY this JSON:
{ "html": "<div style=\\"...\\">...</div>" }

Rules for "html":
- A SINGLE <div> element
- padding matches the margins in layout properties
- DO NOT set width or height
- Use INLINE CSS ONLY
- Apply font-family, font-size, line-height from layout properties
- Section headings: apply headingSize, headingUppercase, accentColor
- If showDividers=true: add <hr> or border-bottom under section headings
- Date alignment: if dateAlignment="right", use flex row with space-between
- Match sectionGap and entryGap for spacing
- Bullet points: <ul style="padding-left:12pt; margin:2pt 0;">
- Name: large (nameSize), bold, typically centered or left
- Preserve section ORDER from sectionOrder array
- Preserve ALL text from the input exactly
- Make it look like a professional, print-ready resume`;

// ── PDF → image ───────────────────────────────────────────────────

async function pdfToImage(base64Pdf: string): Promise<string> {
  const executablePath = await chromium.executablePath();
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 816, height: 1056 },
    executablePath,
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.goto(`data:application/pdf;base64,${base64Pdf}`, {
      waitUntil: 'load',
      timeout: 15000,
    });
    await new Promise((r) => setTimeout(r, 1800));
    const shot = await page.screenshot({ type: 'jpeg', quality: 90 });
    return Buffer.from(shot).toString('base64');
  } finally {
    await browser.close();
  }
}

// ── Handler ───────────────────────────────────────────────────────

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  console.log('[parse-resume] request received, key present:', !!process.env.OPENAI_API_KEY);
  if (!process.env.OPENAI_API_KEY) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured on the server.' }));
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk.toString();

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    // ── DOCX text mode ──────────────────────────────────────────
    if (parsed.type === 'docx') {
      const { mammothHtml, layoutJson } = parsed;
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: DOCX_PROMPT(mammothHtml ?? '', layoutJson ?? '{}'),
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4096,
      });
      const result = JSON.parse(response.choices[0].message.content ?? '{}');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // ── Vision mode (image / PDF) ───────────────────────────────
    let imageBase64 = parsed.data ?? '';
    let imageMime = parsed.mimeType ?? 'image/jpeg';

    if (parsed.mimeType === 'application/pdf') {
      imageBase64 = await pdfToImage(parsed.data ?? '');
      imageMime = 'image/jpeg';
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageMime};base64,${imageBase64}`,
                detail: 'high',
              },
            },
            { type: 'text', text: VISION_PROMPT },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
    });

    const result = JSON.parse(response.choices[0].message.content ?? '{}');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[parse-resume] handler error:', msg, err instanceof Error ? err.stack : '');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: msg }));
  }
}
