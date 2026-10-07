'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DEFAULT_PRODUCT, getProduct, isProductKey, type ProductKey } from '@/data/products';
import { gsap, isReduced, MotionScope, useMotion } from '@/lib/motion';
import { Cutaway, hasCutaway } from './Cutaway';
import { OtherProducts } from './OtherProducts';
import { ProductHero } from './ProductHero';
import { ProductMotion } from './ProductMotion';
import { ProductSpecs } from './ProductSpecs';
import { PRODUCT_PANEL_ID, ProductSwitcher, productTabId } from './ProductSwitcher';
import { QuoteSection } from './QuoteSection';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const TITLE_SUFFIX = ' | Truvolt Engineering';

function keyFromHash(): ProductKey {
  const h = decodeURIComponent(location.hash.replace(/^#/, '')).toLowerCase();
  return isProductKey(h) ? h : DEFAULT_PRODUCT;
}

/**
 * The single /products page (Truvolt Product.dc.html). The hash picks the
 * product (`/products#power`; none or invalid → distribution). Switching:
 * pushState the hash, fade the hero copy and image out, swap the product, then
 * fade the new one in (ProductMotion mode="swap") and scroll to the top through
 * Lenis. `/products?type=x` (the old /products/x redirect) becomes `#x`.
 *
 * Any same-page `/products#key` link (footer, "Also in the Range" cards) is
 * caught here; a bare `/products` link (Header) means distribution.
 * MotionProvider's anchor handler only scrolls when an element with that id
 * exists, and next/link changes the hash with pushState (no hashchange), so
 * the click is handled directly.
 */
export function ProductsExplorer() {
  const [active, setActive] = useState<ProductKey>(DEFAULT_PRODUCT);
  const [mode, setMode] = useState<'intro' | 'swap'>('intro');
  const activeRef = useRef(active);
  /** Product a running fade-out will swap to; null when no swap is pending. */
  const pendingRef = useRef<ProductKey | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { scrollTo } = useMotion();

  /** Swap the rendered product (the URL is already updated). */
  const swapTo = useCallback(
    (key: ProductKey) => {
      const outEls = () =>
        panelRef.current?.querySelectorAll<HTMLElement>('#top [data-tv-swap], [data-tv-hero-media]');
      // A swap still fading out: compare against where we are heading, not what is shown.
      if (key === (pendingRef.current ?? activeRef.current)) return;
      if (key === activeRef.current) {
        // Back to the shown product mid fade-out (A → B → A within .3s): cancel the pending
        // swap, otherwise its onComplete would still show B while the URL says A.
        pendingRef.current = null;
        const out = outEls();
        if (out?.length) {
          gsap.killTweensOf(out);
          gsap.to(out, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'opacity,transform' });
        }
        return;
      }
      const done = () => {
        pendingRef.current = null;
        activeRef.current = key;
        setMode('swap');
        setActive(key);
        scrollTo(0);
      };
      const out = outEls();
      if (isReduced() || !out?.length) return done();
      pendingRef.current = key;
      // Mockup: old content out (opacity 0, y -10, .3s power2.in), then swap. A newer
      // switch overwrites this tween, so its onComplete never fires and the latest wins.
      gsap.to(out, { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in', overwrite: true, onComplete: done });
    },
    [scrollTo],
  );

  /** User picked a product: new history entry, then swap. */
  const select = useCallback(
    (key: ProductKey) => {
      if (location.hash !== `#${key}`) history.pushState(history.state, '', `#${key}`);
      swapTo(key);
    },
    [swapTo],
  );

  // Initial product: convert ?type= (redirected /products/:slug) to #slug, then read the hash.
  useIsoLayoutEffect(() => {
    const type = new URLSearchParams(location.search).get('type')?.toLowerCase();
    if (type) {
      history.replaceState(history.state, '', `${location.pathname}${isProductKey(type) ? `#${type}` : location.hash}`);
    }
    const key = keyFromHash();
    if (key !== activeRef.current) {
      activeRef.current = key;
      setActive(key);
    }
  }, []);

  // Back/forward and manual hash edits.
  useEffect(() => {
    const onNav = () => {
      // A non-product hash (e.g. #quote from an in-page anchor) keeps the current product.
      const h = location.hash.replace(/^#/, '');
      if (h && !isProductKey(decodeURIComponent(h).toLowerCase())) return;
      swapTo(keyFromHash());
    };
    window.addEventListener('hashchange', onNav);
    window.addEventListener('popstate', onNav);
    return () => {
      window.removeEventListener('hashchange', onNav);
      window.removeEventListener('popstate', onNav);
    };
  }, [swapTo]);

  // Same-page /products#key links anywhere on the page (footer, cards). Document capture
  // runs after MotionProvider's window-capture handler and before next/link's onClick.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href]');
      if (!a || a.target === '_blank' || a.getAttribute('role') === 'tab') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname) return;
      // A bare /products link (Header "Products") means the default product, so the URL
      // and the product shown stay in sync (it becomes /products#distribution).
      const key = url.hash ? decodeURIComponent(url.hash.replace(/^#/, '')).toLowerCase() : DEFAULT_PRODUCT;
      if (!isProductKey(key)) return;
      e.preventDefault();
      select(key);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [select]);

  const p = getProduct(active)!;

  // The server title stays "Products"; after a switch the tab title follows the product.
  useEffect(() => {
    if (mode === 'swap') document.title = `${p.title}${TITLE_SUFFIX}`;
  }, [mode, p.title]);

  return (
    <>
      <ProductSwitcher active={active} onSelect={select} />
      <div ref={panelRef} id={PRODUCT_PANEL_ID} role="tabpanel" aria-labelledby={productTabId(active)}>
        <ProductMotion key={active} mode={mode}>
          <ProductHero p={p} />
          <ProductSpecs p={p} />
          {hasCutaway(p.key) && <Cutaway productKey={p.key} />}
          <OtherProducts current={p.key} />
        </ProductMotion>
        {/* Outside the keyed scope so a half-filled form survives a product switch. */}
        <MotionScope core={{ intro: false }}>
          <QuoteSection title={p.title} />
        </MotionScope>
      </div>
    </>
  );
}
