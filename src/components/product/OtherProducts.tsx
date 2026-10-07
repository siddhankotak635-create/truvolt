import Link from 'next/link';
import { ProductCard } from '@/components/shared';
import { CARDS, type ProductKey } from '@/data/products';
import styles from './OtherProducts.module.css';

/**
 * "Also in the Range": the five other product lines as shared ProductCards.
 * Each card links to /products#key; ProductsExplorer catches the click and
 * switches the product in place.
 */
export function OtherProducts({ current }: { current: ProductKey }) {
  return (
    <section className={styles.section} aria-labelledby="others-title">
      <div className={styles.head}>
        <h2 id="others-title" data-tv-reveal="" className={styles.title}>
          Also in the Range
        </h2>
        <Link data-tv-reveal="" href="/#range" className={styles.all}>
          All six lines <span aria-hidden="true">→</span>
        </Link>
      </div>
      <ul className={styles.grid}>
        {CARDS.filter((c) => c.key !== current).map((c) => (
          <li key={c.key} data-tv-reveal="">
            <ProductCard
              product={c}
              className={styles.card}
              sizes="(min-width: 1100px) 20vw, (min-width: 768px) 50vw, 100vw"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
