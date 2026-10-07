import type { Product } from '@/data/products';
import styles from './ProductSpecs.module.css';

const num = (n: number) => String(n + 1).padStart(2, '0');

/** Applications + specs (mockup #specs): sticky left column, scrolling cards on the right. */
export function ProductSpecs({ p }: { p: Product }) {
  const hasConstruction = p.hasConstruction !== false && p.construction.length > 0;
  return (
    <section id="specs" className={styles.section} aria-labelledby="specs-title">
      <div className={styles.aside}>
        <p data-tv-reveal="" className={styles.label}>
          Applications
        </p>
        <h2 id="specs-title" data-tv-reveal="" className={styles.title}>
          {p.appTitle}
        </h2>
        <p data-tv-reveal="" className={styles.copy}>
          {p.applications}
        </p>
        <ul data-tv-reveal="" className={styles.chips} aria-label="Sectors">
          {p.sectors.map((s) => (
            <li key={s} className={styles.chip}>
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.cards}>
        <div data-tv-reveal="" className={styles.card}>
          <h3 className={styles.cardLabel}>Design features</h3>
          <ol className={styles.list}>
            {p.features.map((t, n) => (
              <li key={t}>
                <span className={styles.n} aria-hidden="true">
                  {num(n)}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>

        {hasConstruction && (
          <div data-tv-reveal="" className={`${styles.card} ${styles.dark}`}>
            <h3 className={styles.cardLabel}>Construction highlights</h3>
            <ol className={styles.list}>
              {p.construction.map((t, n) => (
                <li key={t}>
                  <span className={styles.n} aria-hidden="true">
                    {num(n)}
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <dl data-tv-reveal="" className={`${styles.card} ${styles.specGrid}`}>
          <div>
            <dt>Rating range</dt>
            <dd>{p.rating}</dd>
          </div>
          <div>
            <dt>Cooling</dt>
            <dd>{p.cooling}</dd>
          </div>
          <div>
            <dt>Tap changer</dt>
            <dd>{p.tap}</dd>
          </div>
          <div>
            <dt>Compliance</dt>
            <dd>{p.standard}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
