import type { ResumeBullet } from '../../types/resume';
import { EditableText } from '../EditableText/EditableText';
import styles from './BulletList.module.css';

type Props = {
  bullets: ResumeBullet[];
  onChange: (bulletId: string, text: string) => void;
  highlightedBulletIds?: string[];
};

export function BulletList({ bullets, onChange, highlightedBulletIds = [] }: Props) {
  return (
    <ul className={styles.list}>
      {bullets.map((b) => (
        <li
          key={b.id}
          className={`${styles.item} ${highlightedBulletIds.includes(b.id) ? styles.highlighted : ''}`}
          data-bullet-id={b.id}
        >
          <span className={styles.bullet}>•</span>
          <EditableText
            value={b.text}
            onChange={(v) => onChange(b.id, v)}
            multiline
            className={styles.text}
            tag="span"
          />
        </li>
      ))}
    </ul>
  );
}
