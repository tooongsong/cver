import type { SkillGroup } from '../../types/resume';
import { EditableText } from '../EditableText/EditableText';
import styles from './SkillsSection.module.css';

type Props = {
  groups: SkillGroup[];
  onChange: (id: string, updates: Partial<SkillGroup>) => void;
};

export function SkillsSection({ groups, onChange }: Props) {
  return (
    <div className={styles.grid}>
      {groups.map((group) => (
        <div key={group.id} className={styles.group}>
          <span className={styles.category}>
            <EditableText
              value={group.category}
              onChange={(v) => onChange(group.id, { category: v })}
              tag="span"
            />
            :
          </span>{' '}
          <EditableText
            value={group.skills.join(', ')}
            onChange={(v) =>
              onChange(group.id, { skills: v.split(',').map((s) => s.trim()).filter(Boolean) })
            }
            className={styles.skills}
            tag="span"
          />
        </div>
      ))}
    </div>
  );
}
