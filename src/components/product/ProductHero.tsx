'use client';

import Image from 'next/image';
import { Button } from '@/components/shared/Button';
import { Eyebrow } from '@/components/shared/Eyebrow';
import type { Product } from '@/data/products';
import { useMotion } from '@/lib/motion';
import styles from './ProductHero.module.css';

/** next/image sizes of the hero photo; ProductsExplorer warms the other products with the same value. */
export const HERO_SIZES = '(min-width: 1100px) 50vw, 100vw';

/**
 * Product hero (mockup #top). `data-tv-swap` marks the intro targets
 * (eyebrow, title, lead, meta); they also carry data-tv-reveal so the global
 * pre-hide keeps them invisible until ProductMotion sets their "from" state.
 * The two actions scroll through Lenis without touching the URL hash, which
 * belongs to the product switcher (/products#power).
 */
export function ProductHero({ p }: { p: Product }) {
  const { scrollTo } = useMotion();
  return (
    <section id="top" className={styles.hero}>
      <div className={styles.copy}>
        <div>
          <Eyebrow data-tv-reveal="" data-tv-swap="eyebrow" className={styles.eyebrow}>
            {p.eyebrow}
          </Eyebrow>
          <h1 data-tv-reveal="" data-tv-swap="title" className={styles.title}>
            {p.title}
          </h1>
        </div>
        <div className={styles.lower}>
          <p data-tv-reveal="" data-tv-swap="lead" className={styles.lead}>
            {p.lead}
          </p>
          <div className={styles.actions}>
            <Button onClick={() => scrollTo('#quote')} className={styles.btn}>
              Request a Proposal
            </Button>
            <Button onClick={() => scrollTo('#specs')} variant="outline" className={styles.btn}>
              Specifications
            </Button>
          </div>
          <dl data-tv-reveal="" data-tv-swap="meta" className={styles.meta}>
            <div>
              <dt>Rating</dt>
              <dd>{p.rating}</dd>
            </div>
            <div>
              <dt>Voltage class</dt>
              <dd>{p.voltage}</dd>
            </div>
            <div>
              <dt>Standard</dt>
              <dd>{p.standard}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div data-tv-tilt="" className={styles.tilt}>
        <div data-tv-reveal="" data-tv-hero-media="" className={styles.media}>
          <div data-tv-hero-pan="" className={styles.pan}>
            {/* No `priority` / fetchPriority="high" (React turns either into a <link rel=preload>): that
                would preload the server default (distribution) even for a /products#power deep link.
                Eager still fetches the shown product straight from the HTML. */}
            <Image
              src={p.image}
              alt={p.title}
              fill
              loading="eager"
              sizes={HERO_SIZES}
              className={styles.img}
            />
          </div>
          <div className={styles.shade} aria-hidden="true" />
          <p className={styles.caption}>
            Fig. {p.num} · {p.title}
          </p>
        </div>
      </div>
    </section>
  );
}
