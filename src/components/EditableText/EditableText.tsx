import React, { useEffect, useRef, useState } from 'react';
import styles from './EditableText.module.css';

type TagName = keyof React.JSX.IntrinsicElements;

type Props = {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  tag?: TagName;
};

export function EditableText({
  value,
  onChange,
  multiline = false,
  placeholder = 'Click to edit…',
  className = '',
  tag = 'span',
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onChange(draft.trim() || value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      setDraft(value);
      setEditing(false);
    }
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          className={`${styles.textarea} ${className}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          rows={3}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        className={`${styles.input} ${className}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    );
  }

  const Tag = tag as TagName;
  return (
    <Tag
      className={`${styles.display} editable-text-display ${className}`}
      onClick={() => setEditing(true)}
      title="Click to edit"
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && setEditing(true)}
    >
      {value || <span className={styles.placeholder}>{placeholder}</span>}
    </Tag>
  );
}
