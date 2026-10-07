'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';
import { BP, isFine, isReduced, motionState } from './state';
import { scheduleRefresh } from './helpers';

/* ------------------------------------------------------------------ context */

export type MotionContextValue = {
  /** Live Lenis instance (null under reduced motion or before mount). Read at use time. */
  readonly lenis: Lenis | null;
  /** prefers-reduced-motion, evaluated at read time */
  readonly reduced: boolean;
  /** (pointer: fine), evaluated at read time */
  readonly fine: boolean;
  /** Mobile menu sheet state (owned here so route changes can close it) */
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  /** Smooth-scroll to a target (selector, element or y) honouring Lenis + reduced motion */
  scrollTo: (target: string | HTMLElement | number, opts?: { offset?: number; immediate?: boolean }) => void;
};

const MotionContext = createContext<MotionContextValue | null>(null);

export function useMotion(): MotionContextValue {
  const ctx = useContext(MotionContext);
  if (!ctx) throw new Error('useMotion must be used inside <MotionProvider>');
  return ctx;
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// flat shadows for the solid ruled pill (no inset highlights)
const NAV_SHADOW = '0 10px 30px rgba(22, 24, 25, .08)';
const NAV_SHADOW_SCROLLED = '0 14px 36px rgba(22, 24, 25, .16)';

function safeDecode(h: string): string {
  try {
    return decodeURIComponent(h);
  } catch {
    return h;
  }
}

function scrollToTarget(target: string | HTMLElement | number, opts: { offset?: number; immediate?: boolean; force?: boolean } = {}) {
  const offset = opts.offset ?? -100;
  const lenis = motionState.lenis;
  let el: HTMLElement | null = null;
  if (typeof target === 'string') {
    try {
      el = document.querySelector<HTMLElement>(target);
    } catch {
      el = null;
    }
    if (!el) return false;
  } else if (typeof target !== 'number') el = target;

  if (lenis) {
    lenis.scrollTo(el ?? (target as number), { offset: el ? offset : 0, immediate: opts.immediate, force: opts.force });
  } else {
    const top = el ? el.getBoundingClientRect().top + window.scrollY + offset : (target as number);
    window.scrollTo({ top, behavior: opts.immediate || isReduced() ? 'auto' : 'smooth' });
  }
  return true;
}

/* ------------------------------------------------------------------ provider */

export function MotionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpenState] = useState(false);
  const menuOpenRef = useRef(false);
  const firstRoute = useRef(true);

  const setMenuOpen = useCallback((open: boolean) => {
    menuOpenRef.current = open;
    setMenuOpenState(open);
  }, []);

  /* ---- Lenis + ticker (layout effect: must exist before any page setup runs) ---- */
  useIsoLayoutEffect(() => {
    if (isReduced()) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    motionState.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      motionState.lenis = null;
    };
  }, []);

  /* ---- nav: first-load intro, hide on scroll, scrolled shadow ---- */
  useIsoLayoutEffect(() => {
    const nav = document.querySelector<HTMLElement>('[data-tv-nav]');
    if (!nav) return;
    const ctx = gsap.context(() => {
      if (!isReduced()) {
        gsap.fromTo(nav, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power4.out', delay: 0.2 });
      }
      nav.style.visibility = 'visible';
      let lastY = 0;
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const y = self.scroll();
          const down = y > lastY + 4;
          const up = y < lastY - 4;
          if (menuOpenRef.current) {
            gsap.to(nav, { yPercent: 0, duration: 0.3, overwrite: 'auto' });
          } else if (down && y > 160) {
            gsap.to(nav, { yPercent: -140, duration: 0.5, ease: 'power3.inOut', overwrite: 'auto' });
          } else if (up || y < 80) {
            gsap.to(nav, { yPercent: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
          }
          nav.style.boxShadow = y > 80 ? NAV_SHADOW_SCROLLED : NAV_SHADOW;
          if (Math.abs(y - lastY) > 4) lastY = y;
        },
      });
    });
    return () => ctx.revert();
  }, []);

  /* ---- magnet + fill sweep + arrow nudge (event delegation) ---- */
  useEffect(() => {
    if (!window.matchMedia(BP.fine).matches) return;
    const reduced = isReduced();
    let active: HTMLElement | null = null;

    const ensureFill = (b: HTMLElement) => {
      let fill = b.querySelector<HTMLElement>(':scope > [data-tv-magnet-fill]');
      if (!fill) {
        b.style.position = b.style.position || 'relative';
        b.style.overflow = 'hidden';
        Array.from(b.children).forEach((c) => {
          (c as HTMLElement).style.position = 'relative';
          (c as HTMLElement).style.zIndex = '1';
        });
        fill = document.createElement('span');
        fill.setAttribute('aria-hidden', 'true');
        fill.setAttribute('data-tv-magnet-fill', '');
        fill.style.cssText =
          'position:absolute;left:0;top:0;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;transform:scale(0);pointer-events:none;z-index:0';
        b.insertBefore(fill, b.firstChild);
      }
      const cs = getComputedStyle(b);
      // an element can pick its fill with --tv-magnet-fill (the nav CONTACT cap on its accent skin)
      const custom = cs.getPropertyValue('--tv-magnet-fill').trim();
      const light = cs.backgroundColor === 'rgb(220, 231, 243)';
      fill.style.background = custom || (light ? 'oklch(0.78 0.14 258)' : 'oklch(0.52 0.19 258)');
      return fill;
    };
    const place = (b: HTMLElement, fill: HTMLElement, e: PointerEvent) => {
      const r = b.getBoundingClientRect();
      gsap.set(fill, { x: e.clientX - r.left, y: e.clientY - r.top });
    };
    const arrowOf = (el: Element) =>
      Array.from(el.children).find(
        (c) => c.tagName === 'SPAN' && (c.hasAttribute('data-tv-arrow') || c.textContent?.trim() === '→'),
      ) as HTMLElement | undefined;

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const t = e.target as Element;
      const from = e.relatedTarget as Element | null;
      // arrow nudge
      const link = t.closest?.('a, button');
      if (link && !(from && link.contains(from))) {
        const ar = arrowOf(link);
        if (ar) {
          if (getComputedStyle(ar).display === 'inline') ar.style.display = 'inline-block';
          gsap.to(ar, { x: 4, duration: 0.35, ease: 'power3.out' });
        }
      }
      // magnet enter
      const b = t.closest?.<HTMLElement>('[data-tv-magnet]');
      if (b && b !== active && !(from && b.contains(from))) {
        active = b;
        if (reduced) return;
        const fill = ensureFill(b);
        place(b, fill, e);
        gsap.to(fill, { scale: 30, duration: 0.6, ease: 'power3.out', overwrite: true });
      }
    };
    const onOut = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const t = e.target as Element;
      const to = e.relatedTarget as Element | null;
      const link = t.closest?.('a, button');
      if (link && !(to && link.contains(to))) {
        const ar = arrowOf(link);
        if (ar) gsap.to(ar, { x: 0, duration: 0.35, ease: 'power3.out' });
      }
      const b = t.closest?.<HTMLElement>('[data-tv-magnet]');
      if (b && !(to && b.contains(to))) {
        if (active === b) active = null;
        if (reduced) return;
        const fill = b.querySelector<HTMLElement>(':scope > [data-tv-magnet-fill]');
        if (fill) {
          place(b, fill, e);
          gsap.to(fill, { scale: 0, duration: 0.5, ease: 'power3.in', overwrite: true });
        }
        gsap.to(b, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' });
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!active || reduced || e.pointerType !== 'mouse') return;
      const b = active;
      const r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4 });
    };
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerout', onOut, { passive: true });
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      document.removeEventListener('pointermove', onMove);
    };
  }, []);

  /* ---- same-page anchors through Lenis ----
   * Capture phase on window: React (and next/link's onClick, which calls
   * preventDefault for every local href) listens on the document root, so a
   * bubble-phase listener would always see defaultPrevented. Running first and
   * calling preventDefault makes next/link stand down (it checks defaultPrevented).
   * Handles '#x' and same-path '/path#x' hrefs. */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('data-native')) return;
      const href = a.getAttribute('href') ?? '';
      let hash = '';
      if (href.startsWith('#')) hash = href;
      else {
        const url = new URL(a.href, location.href);
        if (url.origin === location.origin && url.pathname === location.pathname && url.hash) hash = url.hash;
      }
      if (!hash || hash === '#') return;
      const offset = a.dataset.offset !== undefined ? Number(a.dataset.offset) : -100;
      if (scrollToTarget(safeDecode(hash), { offset })) {
        e.preventDefault();
        if (location.hash !== hash) history.pushState(history.state, '', hash);
      }
    };
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, []);

  /* ---- global refresh: window load, image loads, main resize ---- */
  useEffect(() => {
    const onLoad = () => ScrollTrigger.refresh();
    const onImg = (e: Event) => {
      if ((e.target as Element)?.tagName === 'IMG') scheduleRefresh(150);
    };
    window.addEventListener('load', onLoad);
    document.addEventListener('load', onImg, true);
    let ro: ResizeObserver | undefined;
    const main = document.querySelector('main');
    if (main && 'ResizeObserver' in window) {
      let t: ReturnType<typeof setTimeout>;
      ro = new ResizeObserver(() => {
        clearTimeout(t);
        t = setTimeout(() => ScrollTrigger.refresh(), 120);
      });
      ro.observe(main);
    }
    return () => {
      window.removeEventListener('load', onLoad);
      document.removeEventListener('load', onImg, true);
      ro?.disconnect();
    };
  }, []);

  /* ---- route change: top (or hash), close sheet, refresh ---- */
  useIsoLayoutEffect(() => {
    const first = firstRoute.current;
    firstRoute.current = false;
    if (first) {
      // A reload mid-page would restore the scroll offset before the pin spacers exist and
      // land in the wrong place (Quality bay, Home range). Start every full load at the top
      // (or at the hash, below) instead of letting the browser restore it.
      // Through ScrollTrigger: it restores its remembered value after every refresh.
      ScrollTrigger.clearScrollMemory('manual');
      if (!location.hash) {
        if (motionState.lenis) motionState.lenis.scrollTo(0, { immediate: true, force: true });
        window.scrollTo(0, 0);
      }
    } else {
      setMenuOpen(false);
      if (motionState.lenis) motionState.lenis.scrollTo(0, { immediate: true, force: true });
      else window.scrollTo(0, 0);
    }
    // Hash target (/#range): jump there now, then follow it while the new page's pins are
    // still being created (each refresh moves everything below a pin), until the user
    // takes over or 1.5s pass. A smooth scroll here would aim at a stale position.
    const hash = location.hash ? safeDecode(location.hash) : '';
    const goHash = () => {
      if (hash) scrollToTarget(hash, { offset: -100, immediate: true, force: true });
    };
    const stopFollow = () => {
      ScrollTrigger.removeEventListener('refresh', goHash);
      window.removeEventListener('wheel', stopFollow);
      window.removeEventListener('touchstart', stopFollow);
      window.removeEventListener('keydown', stopFollow);
    };
    let follow: ReturnType<typeof setTimeout> | undefined;
    if (hash) {
      ScrollTrigger.addEventListener('refresh', goHash);
      window.addEventListener('wheel', stopFollow, { passive: true });
      window.addEventListener('touchstart', stopFollow, { passive: true });
      window.addEventListener('keydown', stopFollow);
      follow = setTimeout(stopFollow, 1500);
    }
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        goHash();
      });
    });
    const late = setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(late);
      clearTimeout(follow);
      stopFollow();
    };
  }, [pathname, setMenuOpen]);

  /* ---- menu open: stop scrolling ---- */
  useEffect(() => {
    const lenis = motionState.lenis;
    const root = document.documentElement;
    if (menuOpen) {
      lenis?.stop();
      if (!lenis) root.style.overflow = 'hidden';
    } else {
      lenis?.start();
      root.style.overflow = '';
    }
  }, [menuOpen]);

  const value = useMemo<MotionContextValue>(
    () => ({
      get lenis() {
        return motionState.lenis;
      },
      get reduced() {
        return isReduced();
      },
      get fine() {
        return isFine();
      },
      menuOpen,
      setMenuOpen,
      scrollTo: (target, opts) => {
        scrollToTarget(target, opts);
      },
    }),
    [menuOpen, setMenuOpen],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
