import type { PersonalInfo } from '../../types/resume';
import { EditableText } from '../EditableText/EditableText';
import styles from './PersonalInfoHeader.module.css';

type Props = {
  info: PersonalInfo;
  onChange: (updates: Partial<PersonalInfo>) => void;
};

export function PersonalInfoHeader({ info, onChange }: Props) {
  return (
    <header className={styles.header}>
      <EditableText
        value={info.name}
        onChange={(v) => onChange({ name: v })}
        className={styles.name}
        tag="h1"
      />
      <EditableText
        value={info.title}
        onChange={(v) => onChange({ title: v })}
        className={styles.jobTitle}
        tag="p"
      />
      <div className={styles.contact}>
        <EditableText
          value={info.email}
          onChange={(v) => onChange({ email: v })}
          className={styles.contactItem}
        />
        <span className={styles.sep}>·</span>
        <EditableText
          value={info.phone}
          onChange={(v) => onChange({ phone: v })}
          className={styles.contactItem}
        />
        <span className={styles.sep}>·</span>
        <EditableText
          value={info.location}
          onChange={(v) => onChange({ location: v })}
          className={styles.contactItem}
        />
        {info.linkedin && (
          <>
            <span className={styles.sep}>·</span>
            <EditableText
              value={info.linkedin}
              onChange={(v) => onChange({ linkedin: v })}
              className={styles.contactItem}
            />
          </>
        )}
        {info.website && (
          <>
            <span className={styles.sep}>·</span>
            <EditableText
              value={info.website}
              onChange={(v) => onChange({ website: v })}
              className={styles.contactItem}
            />
          </>
        )}
      </div>
    </header>
  );
}
