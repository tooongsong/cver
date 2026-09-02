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
  const renderedBuffer = useRef<ArrayBuffer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (renderedBuffer.current === buffer) return;
    renderedBuffer.current = buffer;

    renderAsync(buffer, containerRef.current, undefined, {
      inWrapper: false,
      ignoreWidth: true,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: false,
      renderHeaders: true,
      renderFooters: false,
    }).then(() => {
      if (containerRef.current) {
        onFitChange(measureFit(containerRef.current));
      }
    });
  }, [buffer, onFitChange]);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={`${styles.page} resume-page`} />
    </div>
  );
}
