import type { Experience } from '../../types/resume';
import { EditableText } from '../EditableText/EditableText';
import { BulletList } from './BulletList';
import entryStyles from './EntryRow.module.css';

type Props = {
  experience: Experience;
  onChange: (updates: Partial<Experience>) => void;
  onBulletChange: (bulletId: string, text: string) => void;
  highlightedBulletIds?: string[];
};

export function ExperienceEntry({
  experience,
  onChange,
  onBulletChange,
  highlightedBulletIds = [],
}: Props) {
  return (
    <div className={entryStyles.entry} data-section="experience">
      <EditableText
        value={experience.title}
        onChange={(v) => onChange({ title: v })}
        className={`${entryStyles.entryTitle} entry-title`}
        tag="span"
      />
      <EditableText
        value={`${experience.startDate} – ${experience.endDate}`}
        onChange={(v) => {
          const parts = v.split('–').map((s) => s.trim());
          onChange({ startDate: parts[0] ?? experience.startDate, endDate: parts[1] ?? experience.endDate });
        }}
        className={`${entryStyles.entryDate} entry-date`}
        tag="span"
      />
      <EditableText
        value={experience.company}
        onChange={(v) => onChange({ company: v })}
        className={entryStyles.entryCompany}
        tag="span"
      />
      <EditableText
        value={experience.location}
        onChange={(v) => onChange({ location: v })}
        className={entryStyles.entryLocation}
        tag="span"
      />
      <div className={entryStyles.entryBullets}>
        <BulletList
          bullets={experience.bullets}
          onChange={onBulletChange}
          highlightedBulletIds={highlightedBulletIds}
        />
      </div>
    </div>
  );
}
