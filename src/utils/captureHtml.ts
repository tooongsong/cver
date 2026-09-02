export function captureResumeHtml(filename?: string): string {
  const pageEl = document.querySelector<HTMLElement>('.resume-page');
  if (!pageEl) throw new Error('Resume page element not found');

  // Collect all injected stylesheet rules (CSS Modules are in <style> tags)
  const css = Array.from(document.styleSheets)
    .flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((r) => r.cssText);
      } catch {
        return [];
      }
    })
    .join('\n');

  const safeName = (filename ?? 'resume').replace(/"/g, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${safeName}</title>
<style>
*, *::before, *::after { box-sizing: border-box; }
html { width: 816px; }
body { margin: 0; padding: 0; background: white; }
${css}
</style>
</head>
<body>${pageEl.outerHTML}</body>
</html>`;
}
