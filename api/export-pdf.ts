import { IncomingMessage, ServerResponse } from 'http';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const LETTER_H_PX = 1056; // 11in × 96dpi
const OVERFLOW_TOLERANCE = 1.05;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk.toString();

  const { html, filename = 'resume.pdf' } = JSON.parse(body) as {
    html: string;
    filename?: string;
  };

  const executablePath = await chromium.executablePath();
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 816, height: 1056 }, // 8.5in × 11in @ 96dpi
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 15000 });

    // Validate: content must not overflow Letter height (5% tolerance)
    const contentHeight = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('.resume-page');
      return el?.scrollHeight ?? document.body.scrollHeight;
    });

    if (contentHeight > LETTER_H_PX * OVERFLOW_TOLERANCE) {
      res.writeHead(422, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'overflow',
          message: `Content height ${contentHeight}px exceeds Letter page limit.`,
        })
      );
      return;
    }

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
      'Content-Length': pdf.length,
      'Cache-Control': 'no-store',
    });
    res.end(pdf);
  } finally {
    await browser.close();
  }
}
