import { useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';
import type { FitResult } from '../../types/tailor';
import { measureFit } from '../../services/fitService';
import styles from './DocxPreviewPage.module.css';

type Props = {
  buffer: ArrayBuffer;
  onFitChange: (result: FitResult) => void;
};

export function DocxPreviewPage({ buffer, onFitChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendered = useRef<ArrayBuffer | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || rendered.current === buffer) return;
    rendered.current = buffer;
    el.innerHTML = '';

    renderAsync(buffer, el, undefined, {
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      useBase64URL: true,
      className: 'docx',
    }).then(() => {
      if (!containerRef.current) return;
      patchFontStacks(containerRef.current);
      containerRef.current.setAttribute('contenteditable', 'true');
      onFitChange(measureFit(containerRef.current));
    }).catch((err) => {
      console.error('[docx-preview] render failed', err);
    });
  }, [buffer, onFitChange]);

  return <div ref={containerRef} className={styles.host} suppressContentEditableWarning />;
}

// Metric-compatible open-source substitutes for common Word/Windows fonts.
// Also append a symbol-capable fallback so Wingdings/Symbol bullets don't
// render as tofu boxes.
const FONT_ALIASES: Record<string, string> = {
  calibri: 'Carlito',
  'calibri light': 'Carlito',
  'segoe ui': 'Carlito',
  arial: 'Arimo',
  helvetica: 'Arimo',
  'helvetica neue': 'Arimo',
  'times new roman': 'Tinos',
  times: 'Tinos',
  cambria: 'Tinos',
  georgia: 'Tinos',
};
const SYMBOL_FALLBACK = '"Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Symbols", sans-serif';

function patchFontStacks(root: HTMLElement) {
  const all = root.querySelectorAll<HTMLElement>('[style*="font-family"]');
  all.forEach((el) => {
    const style = el.getAttribute('style') ?? '';
    const patched = style.replace(/font-family\s*:\s*([^;]+)/gi, (_m, stack) => {
      const parts = String(stack)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''));
      const aliased = parts.map((name) => {
        const alias = FONT_ALIASES[name.toLowerCase()];
        return alias ? `"${alias}", "${name}"` : `"${name}"`;
      });
      return `font-family: ${aliased.join(', ')}, ${SYMBOL_FALLBACK}`;
    });
    if (patched !== style) el.setAttribute('style', patched);
  });
}
