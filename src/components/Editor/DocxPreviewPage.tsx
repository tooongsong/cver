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
      if (containerRef.current) {
        // Make it editable so the user can tweak text
        containerRef.current.setAttribute('contenteditable', 'true');
        onFitChange(measureFit(containerRef.current));
      }
    }).catch((err) => {
      console.error('[docx-preview] render failed', err);
    });
  }, [buffer, onFitChange]);

  return <div ref={containerRef} className={styles.host} suppressContentEditableWarning />;
}
