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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const renderedBuffer = useRef<ArrayBuffer | null>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    if (renderedBuffer.current === buffer) return;
    renderedBuffer.current = buffer;

    wrapperRef.current.innerHTML = '';

    renderAsync(buffer, wrapperRef.current, undefined, {
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      useBase64URL: true,
    }).then(() => {
      if (wrapperRef.current) {
        onFitChange(measureFit(wrapperRef.current));
      }
    });
  }, [buffer, onFitChange]);

  return (
    <div className={styles.scaler}>
      <div ref={wrapperRef} className={styles.docxContainer} />
    </div>
  );
}
