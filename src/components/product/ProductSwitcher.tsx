'use client';

import { useEffect, useRef, type KeyboardEvent } from 'react';
import { PRODUCTS, productHref, type ProductKey } from '@/data/products';
import { afterReveal, useTvMotion } from '@/lib/motion';
import styles from './ProductSwitcher.module.css';

export const PRODUCT_PANEL_ID = 'product-panel';
export const productTabId = (key: ProductKey) => `product-tab-${key}`;

/**
 * Product switcher (mockup [data-tv-subnav]): a tablist in normal flow above
 * the hero (not sticky). Each tab swaps the product in place on /products and
 * updates the hash; ← → Home End move between tabs. On narrow screens the row
 * scrolls horizontally and the active pill is kept in view (by moving the row
 * only, never the page).
 */
export function ProductSwitcher({ active, onSelect }: { active: ProductKey; onSelect: (key: ProductKey) => void }) {
  const navRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  // Intro once per page mount (mockup: subnav y -16 → 0 at .1s). Not re-run on product switches.
  useTvMotion(navRef, ({ gsap, scope, reduced }) => {
    if (reduced) {
      gsap.set(scope, { autoAlpha: 1 });
      return;
    }
    afterReveal(gsap.fromTo(scope, { y: -16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power4.out', delay: 0.1 }));
  });

  useEffect(() => {
    const row = rowRef.current;
    if (!row || row.scrollWidth <= row.clientWidth) return;
    const pill = row.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!pill) return;
    row.scrollLeft = pill.offsetLeft - (row.clientWidth - pill.offsetWidth) / 2;
  }, [active]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = PRODUCTS.findIndex((p) => p.key === active);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % PRODUCTS.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + PRODUCTS.length) % PRODUCTS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = PRODUCTS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const key = PRODUCTS[next].key;
    onSelect(key);
    document.getElementById(productTabId(key))?.focus();
  }

  return (
    <div ref={navRef} data-tv-subnav="" className={styles.subnav}>
      <div ref={rowRef} role="tablist" aria-label="Products" className={styles.row} onKeyDown={onKeyDown}>
        {PRODUCTS.map((t) => {
          const on = t.key === active;
          return (
            <a
              key={t.key}
              id={productTabId(t.key)}
              href={productHref(t.key)}
              role="tab"
              aria-selected={on}
              aria-controls={PRODUCT_PANEL_ID}
              tabIndex={on ? 0 : -1}
              data-native=""
              onClick={(e) => {
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                onSelect(t.key);
              }}
              className={`${styles.pill} ${on ? styles.on : ''}`}
            >
              {t.short}
            </a>
          );
        })}
      </div>
    </div>
  );
}
