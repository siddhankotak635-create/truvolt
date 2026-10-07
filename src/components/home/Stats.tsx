import styles from './Stats.module.css';

const STATS: { n: number; suffix?: string; unit?: string; label: string }[] = [
  { n: 55, suffix: '+', label: 'Years in operation' },
  { n: 36, unit: 'MVA', label: 'Max transformer capacity' },
  { n: 66, unit: 'kV', label: 'Highest voltage class' },
  { n: 9, label: 'Countries served' },
  { n: 100, suffix: '+', label: 'Organisations supplied' },
];

/** Five counters (initCounters counts 0 → N; the final value is in the markup). */
export function Stats() {
  return (
    <section className={styles.section} aria-label="Truvolt in numbers">
      <div className={styles.grid}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.cell}>
            <p className={styles.value}>
              <span data-tv-count={s.n}>{s.n}</span>
              {s.suffix}
              {s.unit && (
                <>
                  {' '}
                  <span className={styles.unit}>{s.unit}</span>
                </>
              )}
            </p>
            <p className={styles.label}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
