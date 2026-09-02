import type { Education } from '../../types/resume';
import { EditableText } from '../EditableText/EditableText';
import entryStyles from './EntryRow.module.css';

type Props = {
  education: Education;
  onChange: (updates: Partial<Education>) => void;
};

export function EducationEntry({ education, onChange }: Props) {
  const degreeLabel = `${education.degree} ${education.field}${education.gpa ? ` · GPA ${education.gpa}` : ''}${education.honors ? ` · ${education.honors}` : ''}`;
  const dateRange = `${education.startDate} – ${education.endDate}`;

  return (
    <div className={entryStyles.entry} data-section="education">
      <EditableText
        value={education.institution}
        onChange={(v) => onChange({ institution: v })}
        className={`${entryStyles.entryTitle} entry-title`}
        tag="span"
      />
      <EditableText
        value={dateRange}
        onChange={(v) => {
          const parts = v.split('–').map((s) => s.trim());
          onChange({ startDate: parts[0] ?? education.startDate, endDate: parts[1] ?? education.endDate });
        }}
        className={`${entryStyles.entryDate} entry-date`}
        tag="span"
      />
      <EditableText
        value={degreeLabel}
        onChange={(v) => onChange({ degree: v })}
        className={entryStyles.entryCompany}
        tag="span"
      />
      <EditableText
        value={education.location}
        onChange={(v) => onChange({ location: v })}
        className={entryStyles.entryLocation}
        tag="span"
      />
    </div>
  );
}
