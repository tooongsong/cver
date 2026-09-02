import { useEffect, useRef } from 'react';
import type { FitResult } from '../../types/tailor';
import { measureFit } from '../../services/fitService';
import styles from './RawResumePage.module.css';

type Props = {
  html: string;
  onChange: (html: string) => void;
  onFitChange: (result: FitResult) => void;
};

export function RawResumePage({ html, onChange, onFitChange }: Props) {
  const pageRef = useRef<HTMLDivElement>(null);
  // Track the last html we pushed into the DOM so we can skip user-edit echoes
  const domHtml = useRef('');

  useEffect(() => {
    if (!pageRef.current) return;
    if (domHtml.current === html) return; // came from user edit, skip
    pageRef.current.innerHTML = html;
    domHtml.current = html;
  }, [html]);

  useEffect(() => {
    if (!pageRef.current) return;
    onFitChange(measureFit(pageRef.current));
  });

  return (
    <div className={styles.wrapper}>
      <div
        ref={pageRef}
        className={`${styles.page} resume-page`}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => {
          const updated = e.currentTarget.innerHTML;
          domHtml.current = updated;
          onChange(updated);
        }}
      />
    </div>
  );
}
