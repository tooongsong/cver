// Detect fonts used in a rendered DOM tree and check which are actually
// available in the browser. Also load custom fonts via the FontFace API.

export type DetectedFonts = {
  used: string[];        // unique primary fonts referenced in DOM
  missing: string[];     // fonts the browser cannot render
};

const isGeneric = (name: string) =>
  ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
   'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'inherit', 'initial'].includes(
    name.toLowerCase()
  );

function primaryFontName(stack: string): string {
  return stack
    .split(',')[0]
    .trim()
    .replace(/^["']|["']$/g, '');
}

export function detectFonts(root: HTMLElement): DetectedFonts {
  const usedSet = new Set<string>();
  root.querySelectorAll<HTMLElement>('[style*="font-family"]').forEach((el) => {
    const style = el.getAttribute('style') ?? '';
    const match = style.match(/font-family\s*:\s*([^;]+)/i);
    if (!match) return;
    const name = primaryFontName(match[1]);
    if (name && !isGeneric(name)) usedSet.add(name);
  });

  const used = Array.from(usedSet).sort();
  const missing = used.filter((name) => !document.fonts.check(`12px "${name}"`));
  return { used, missing };
}

export async function registerLocalFont(name: string, buffer: ArrayBuffer): Promise<void> {
  const face = new FontFace(name, buffer);
  await face.load();
  document.fonts.add(face);
}
