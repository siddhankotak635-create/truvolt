import type { CSSProperties } from 'react';
import { Eyebrow } from '@/components/shared/Eyebrow';
import styles from './Capability.module.css';

const BARS: { pct: number; label: string; value: string; accent?: boolean }[] = [
  { pct: 100, label: 'Power Transformers', value: '36 MVA' },
  { pct: 83, label: 'Furnace Duty', value: '30 MVA', accent: true },
  { pct: 14, label: 'Distribution', value: '5 MVA' },
  { pct: 7, label: 'Dry Type', value: '2.5 MVA' },
];

const VOLTAGES: { value: string; label: string; accent?: boolean }[] = [
  { value: '11 kV', label: 'Distribution' },
  { value: '33 kV', label: 'Power / Furnace' },
  { value: '66 kV', label: 'Highest class' },
  { value: '132 kV', label: 'Turnkey substation', accent: true },
];

/** Capability band. Bars render at their final width; HomeMotion animates them in from 0. */
export function Capability() {
  return (
    <section className={styles.section} aria-labelledby="capability-title">
      <div className={styles.copy}>
        <Eyebrow data-tv-reveal="" className={styles.eyebrow}>
          Capability band
        </Eyebrow>
        <h2 data-tv-reveal="" id="capability-title" className={styles.title}>
          One Works. The Full Industrial Spectrum.
        </h2>
        <p data-tv-reveal="" className={styles.lead}>
          From a 25 kVA pole-mount to a 36 MVA grid unit, every rating is designed, wound, tanked and tested under one roof
          in Kolkata.
        </p>
      </div>
      <div className={styles.chart}>
        {BARS.map((b) => (
          <div key={b.label} data-tv-bar={b.pct} className={styles.row}>
            <span className={styles.label}>{b.label}</span>
            <div
              className={styles.track}
              role="img"
              aria-label={`${b.label}: up to ${b.value}`}
            >
              <div
                data-tv-bar-fill=""
                className={`${styles.fill} ${b.accent ? styles.accent : ''}`}
                style={{ '--w': `${b.pct}%` } as CSSProperties}
              />
            </div>
            <span className={styles.value}>{b.value}</span>
          </div>
        ))}
        <div className={styles.volts}>
          {VOLTAGES.map((v) => (
            <div key={v.value}>
              <p className={`${styles.voltValue} ${v.accent ? styles.voltAccent : ''}`}>{v.value}</p>
              <p className={styles.voltLabel}>{v.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
