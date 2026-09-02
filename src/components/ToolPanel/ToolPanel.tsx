import styles from './ToolPanel.module.css';

type Props = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function ToolPanel({ title, onClose, children }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close panel">✕</button>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
