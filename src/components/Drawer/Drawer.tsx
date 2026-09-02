import type { ReactNode } from 'react';
import styles from './Drawer.module.css';

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
};

export function Drawer({ title, onClose, children, width = 440 }: Props) {
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <aside className={styles.drawer} style={{ width }}>
        <header className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className={styles.body}>{children}</div>
      </aside>
    </>
  );
}
