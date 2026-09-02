import type { FitResult } from '../../types/tailor';
import styles from './FitIndicator.module.css';

type Props = {
  fit: FitResult;
};

export function FitIndicator({ fit }: Props) {
  const pct = Math.round(fit.scale * 100);
  const ok = fit.fits || fit.scale >= 0.82;

  return (
    <div className={`${styles.indicator} ${ok ? styles.ok : styles.warn}`}>
      <span className={styles.icon}>{ok ? '◉' : '⚠'}</span>
      <span className={styles.label}>
        {fit.fits
          ? 'One-page fit: 100%'
          : `One-page fit: ${pct}%`}
      </span>
      {fit.message && !fit.fits && (
        <span className={styles.detail}>{fit.message}</span>
      )}
    </div>
  );
}
