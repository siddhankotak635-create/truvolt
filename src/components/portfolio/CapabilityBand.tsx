import styles from './CapabilityBand.module.css';

export function CapabilityBand() {
  return (
    <section className={styles.band} aria-labelledby="capability-title">
      <div className={styles.intro}>
        <p data-tv-reveal="" className={styles.kicker}>
          Capability band
        </p>
        <h2 id="capability-title" data-tv-reveal="" className={`h2 ${styles.title}`}>
          A Full-Spectrum Range, Engineered for Dependable Performance
        </h2>
        <p data-tv-reveal="" className={styles.body}>
          From compact distribution units to high-capacity power transformers for grid and generation, backed by five
          decades of application experience across power, steel, cement, infrastructure and utilities.
        </p>
      </div>

      <div className={styles.cards}>
        <div data-tv-reveal="" className={styles.card}>
          <div>
            <p className={styles.label}>Voltage class</p>
            <p className={styles.value}>Up to 66 kV</p>
          </div>
          <p className={styles.note}>Substations up to 132 kV on a turnkey basis</p>
        </div>
        <div data-tv-reveal="" className={styles.card}>
          <div>
            <p className={styles.label}>Capacity range</p>
            <p className={styles.value}>25 kVA to 36 MVA</p>
          </div>
          <div data-tv-range="" className={styles.range} aria-hidden="true">
            <div data-tv-range-fill="" className={styles.fill} />
          </div>
        </div>
        <div data-tv-reveal="" className={styles.card}>
          <div>
            <p className={styles.label}>Cooling types</p>
            <p className={styles.value}>ONAN · ONAF · Dry</p>
          </div>
          <p className={styles.note}>Indoor, outdoor and space-constrained installations</p>
        </div>
        <div data-tv-reveal="" className={`${styles.card} ${styles.dark}`}>
          <div>
            <p className={styles.label}>Tap changers</p>
            <p className={styles.value}>Off-circuit &amp; OLTC</p>
          </div>
          <p className={styles.note}>Precise voltage regulation under load</p>
        </div>
      </div>
    </section>
  );
}
