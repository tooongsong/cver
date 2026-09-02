import { useState } from 'react';
import { TEMPLATES } from '../../data/templates';
import type { ResumeTemplate } from '../../data/templates';
import styles from './TemplatePicker.module.css';

type Props = {
  activeId: string;
  onChange: (template: ResumeTemplate) => void;
};

export function TemplatePicker({ activeId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const active = TEMPLATES.find((t) => t.id === activeId) ?? TEMPLATES[0];

  return (
    <div className={styles.wrapper}>
      <button className={styles.trigger} onClick={() => setOpen((o) => !o)}>
        <span className={styles.triggerLabel}>Template</span>
        <span className={styles.triggerName}>{active.name}</span>
        <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.dropdown}>
            <p className={styles.dropdownTitle}>Choose a template</p>
            <div className={styles.grid}>
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.card} ${t.id === activeId ? styles.cardActive : ''}`}
                  onClick={() => { onChange(t); setOpen(false); }}
                >
                  <TemplateThumbnail template={t} />
                  <span className={styles.cardName}>{t.name}</span>
                  <span className={styles.cardDesc}>{t.description}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TemplateThumbnail({ template }: { template: ResumeTemplate }) {
  const isSerif = template.id === 'serif';
  const accentColor = template.cssVars['--resume-accent'] ?? '#c47a2b';
  const ruleColor = template.cssVars['--resume-rule-color'] ?? 'rgba(26,26,26,0.2)';
  const style = template.sectionHeaderStyle;

  return (
    <div className={styles.thumb}>
      {/* Name line */}
      <div
        className={styles.thumbName}
        style={{ fontFamily: isSerif ? 'Georgia, serif' : 'Inter, sans-serif' }}
      />
      {/* Contact dots */}
      <div className={styles.thumbContact}>
        <div className={styles.thumbDot} />
        <div className={styles.thumbDot} />
        <div className={styles.thumbDot} />
      </div>

      {/* Section block */}
      <SectionThumb style={style} accentColor={accentColor} ruleColor={ruleColor} />
      {/* Bullet lines */}
      <div className={styles.thumbLine} style={{ width: '85%' }} />
      <div className={styles.thumbLine} style={{ width: '70%' }} />
      <div className={styles.thumbLine} style={{ width: '78%' }} />

      <SectionThumb style={style} accentColor={accentColor} ruleColor={ruleColor} />
      <div className={styles.thumbLine} style={{ width: '90%' }} />
      <div className={styles.thumbLine} style={{ width: '65%' }} />
    </div>
  );
}

function SectionThumb({
  style,
  accentColor,
  ruleColor,
}: {
  style: ResumeTemplate['sectionHeaderStyle'];
  accentColor: string;
  ruleColor: string;
}) {
  if (style === 'rule') {
    return (
      <div className={styles.thumbSectionRule}>
        <div className={styles.thumbSectionLabel} />
        <div className={styles.thumbSectionLine} style={{ background: ruleColor }} />
      </div>
    );
  }
  if (style === 'border-left') {
    return (
      <div
        className={styles.thumbSectionBorderLeft}
        style={{ borderLeftColor: accentColor }}
      >
        <div className={styles.thumbSectionLabel} />
      </div>
    );
  }
  if (style === 'overline') {
    return (
      <div className={styles.thumbSectionOverline} style={{ borderTopColor: accentColor }}>
        <div className={styles.thumbSectionLabel} />
      </div>
    );
  }
  // plain
  return (
    <div className={styles.thumbSectionPlain}>
      <div className={styles.thumbSectionLabel} />
    </div>
  );
}
