import { useEffect, useRef } from 'react';
import type { ResumeData } from '../../types/resume';
import type { FitResult } from '../../types/tailor';
import type { ResumeTemplate } from '../../data/templates';
import { PersonalInfoHeader } from './PersonalInfoHeader';
import { ExperienceEntry } from './ExperienceEntry';
import { EducationEntry } from './EducationEntry';
import { SkillsSection } from './SkillsSection';
import { BulletList } from './BulletList';
import { EditableText } from '../EditableText/EditableText';
import { measureFit } from '../../services/fitService';
import styles from './ResumePage.module.css';
import entryStyles from './EntryRow.module.css';

type Props = {
  resume: ResumeData;
  template: ResumeTemplate;
  onUpdatePersonalInfo: (updates: Partial<ResumeData['personalInfo']>) => void;
  onUpdateSummary: (text: string) => void;
  onUpdateExperience: (id: string, updates: any) => void;
  onUpdateBullet: (section: 'experience' | 'projects', parentId: string, bulletId: string, text: string) => void;
  onUpdateEducation: (id: string, updates: any) => void;
  onUpdateSkillGroup: (id: string, updates: any) => void;
  onFitChange: (result: FitResult) => void;
  highlightedBulletIds?: string[];
  scale?: number;
  styleOverrides?: Record<string, string>;
};

export function ResumePage({
  resume,
  template,
  onUpdatePersonalInfo,
  onUpdateSummary,
  onUpdateExperience,
  onUpdateBullet,
  onUpdateEducation,
  onUpdateSkillGroup,
  onFitChange,
  highlightedBulletIds = [],
  scale = 1,
  styleOverrides = {},
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const result = measureFit(contentRef.current);
    onFitChange(result);
  });

  const sectionHeader = (title: string) => {
    const style = template.sectionHeaderStyle;
    return (
      <div className={`${styles.sectionHeader} ${styles[`sectionHeader_${style}`]}`}
           data-header-style={style}>
        <span className={styles.sectionTitle}>{title}</span>
        {style === 'rule' && <div className={styles.sectionRule} />}
      </div>
    );
  };

  const cssVarStyle = { ...template.cssVars, ...styleOverrides } as React.CSSProperties;

  return (
    <div
      className={styles.pageWrapper}
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
      }}
    >
      <div
        className={`${styles.page} resume-page`}
        ref={contentRef}
        data-template={template.id}
        style={cssVarStyle}
      >
        <PersonalInfoHeader info={resume.personalInfo} onChange={onUpdatePersonalInfo} />

        {resume.summary && (
          <section className={styles.section} data-section="summary">
            {sectionHeader('Summary')}
            <EditableText
              value={resume.summary}
              onChange={onUpdateSummary}
              multiline
              className={styles.summary}
              tag="p"
            />
          </section>
        )}

        {resume.experience.length > 0 && (
          <section className={styles.section} data-section="experience">
            {sectionHeader('Experience')}
            {resume.experience.map((exp) => (
              <ExperienceEntry
                key={exp.id}
                experience={exp}
                onChange={(updates) => onUpdateExperience(exp.id, updates)}
                onBulletChange={(bulletId, text) =>
                  onUpdateBullet('experience', exp.id, bulletId, text)
                }
                highlightedBulletIds={highlightedBulletIds}
              />
            ))}
          </section>
        )}

        {resume.projects.length > 0 && (
          <section className={styles.section} data-section="projects">
            {sectionHeader('Projects')}
            {resume.projects.map((proj) => (
              <div key={proj.id} className={entryStyles.entry} data-section="projects">
                <EditableText
                  value={proj.name}
                  onChange={() => {}}
                  className={`${entryStyles.entryTitle} entry-title`}
                  tag="span"
                />
                {proj.startDate && (
                  <span className={`${entryStyles.entryDate} entry-date`}>
                    {proj.startDate}{proj.endDate ? ` – ${proj.endDate}` : ''}
                  </span>
                )}
                <span className={entryStyles.entryCompany}>
                  {proj.technologies.join(', ')}
                </span>
                <div className={entryStyles.entryBullets}>
                  <BulletList
                    bullets={proj.bullets}
                    onChange={(bulletId, text) =>
                      onUpdateBullet('projects', proj.id, bulletId, text)
                    }
                    highlightedBulletIds={highlightedBulletIds}
                  />
                </div>
              </div>
            ))}
          </section>
        )}

        {resume.education.length > 0 && (
          <section className={styles.section} data-section="education">
            {sectionHeader('Education')}
            {resume.education.map((edu) => (
              <EducationEntry
                key={edu.id}
                education={edu}
                onChange={(updates) => onUpdateEducation(edu.id, updates)}
              />
            ))}
          </section>
        )}

        {resume.skills.length > 0 && (
          <section className={styles.section} data-section="skills">
            {sectionHeader('Skills')}
            <SkillsSection groups={resume.skills} onChange={onUpdateSkillGroup} />
          </section>
        )}

        {resume.languages.length > 0 && (
          <section className={styles.section} data-section="languages">
            {sectionHeader('Languages')}
            <p className={styles.languages}>
              {resume.languages.map((l) => `${l.name} (${l.proficiency})`).join('  ·  ')}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
