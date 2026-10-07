import { ProductCard } from '@/components/shared';
import { CARDS } from '@/data/products';
import styles from './Range.module.css';

/**
 * #range. Desktop: pinned horizontal scrub (HomeMotion).
 * Below 1100px: native horizontal scroll-snap rail, no pin.
 * The full-width section is what gets pinned; the dark panel inside it is inset by the
 * section's padding (GSAP pins padded boxes cleanly, margins it does not).
 */
export function Range() {
  return (
    <section id="range" data-tv-hscroll="" className={styles.section}>
      <div data-tv-hscroll-panel="" className={`${styles.panel} tv-dark`}>
        <div data-tv-hscroll-head="" className={styles.head}>
          <h2 data-tv-reveal="" className={styles.title}>
            A Complete Range of Transformer Solutions
          </h2>
          <p data-tv-reveal="" className={styles.count}>
            06 product lines
          </p>
        </div>
        <div data-tv-hscroll-track="" className={styles.track}>
          {CARDS.map((c) => (
            <ProductCard key={c.key} product={c} size="rail" className={styles.card} />
          ))}
        </div>
      </div>
    </section>
  );
}
