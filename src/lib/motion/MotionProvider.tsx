'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap';
import { BP, holdReveal, isFine, isReduced, motionState, releaseReveal } from './state';
import { flushRefresh, scheduleRefresh } from './helpers';
import { preloadRoute, warmFilm, warmRoutes } from './preload';

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
  /** Navigate to another route through the page transition (internal links already do this on click). */
  navigate: (href: string) => void;
};

const MotionContext = createContext<MotionContextValue | null>(null);

export function useMotion(): MotionContextValue {
  const ctx = useContext(MotionContext);
  if (!ctx) throw new Error('useMotion must be used inside <MotionProvider>');
  return ctx;
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Longest a page transition holds the shutter for the destination's images (from the click). */
const ASSET_CAP_MS = 1500;

function safeDecode(h: string): string {
  try {
    return decodeURIComponent(h);
  } catch {
    return h;
  }
}

const frames = (n: number) =>
  new Promise<void>((resolve) => {
    const step = (left: number) => (left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
    step(n);
  });
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Let the freshly mounted route settle under the cover: two frames (useTvMotion setups run after
 *  fonts), then webfonts, the route's critical images (`assets`, preloaded since hover / close) and
 *  the in-view images of <main>, all decoded. Capped so a slow image never holds the shutter shut:
 *  ASSET_CAP_MS from the click, and never less than 250ms after the commit. */
async function settleRoute(assets: Promise<void> = Promise.resolve(), startedAt = performance.now()): Promise<void> {
  await frames(2);
  const cap = Math.max(250, ASSET_CAP_MS - (performance.now() - startedAt));
  const main = document.getElementById('main');
  const vh = window.innerHeight;
  const imgs = main
    ? Array.from(main.querySelectorAll('img')).filter((img) => {
        if (img.complete) return false;
        const r = img.getBoundingClientRect();
        return r.bottom > 0 && r.top < vh;
      })
    : [];
  const waits: Promise<unknown>[] = imgs.map((img) => img.decode().catch(() => undefined));
  waits.push(assets);
  if (document.fonts?.ready) waits.push(document.fonts.ready);
  await Promise.race([Promise.all(waits), wait(cap)]);
}

/** An internal route a click should transition to, or null when the browser / other handlers own it. */
function transitionTarget(e: MouseEvent): URL | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href]');
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-native')) return null;
  let url: URL;
  try {
    url = new URL(a.href, location.href);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol) || url.origin !== location.origin) return null; // external, mailto:, tel:
  if (url.pathname === location.pathname) return null; // same page: #hash, /products#key switch, no-op
  if (/\.[a-z0-9]+$/i.test(url.pathname)) return null; // static files (/map.html, PDFs)
  return url;
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
  const router = useRouter();
  const [menuOpen, setMenuOpenState] = useState(false);
  const menuOpenRef = useRef(false);
  const firstRoute = useRef(true);
  /** Last committed pathname, and resolvers waiting for the next commit (page transition). */
  const committedPath = useRef(pathname);
  const commitWaiters = useRef<(() => void)[]>([]);
  /** A page transition is running; `queued` holds the latest click made meanwhile. */
  const busy = useRef(false);
  const queued = useRef<string | null>(null);
  /** The nav is slid out (hide-on-scroll); the menu sheet shows it again (Header). */
  const navHidden = useRef(false);

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
    // (lag smoothing is set once in gsap.ts; Lenis reads the same smoothed ticker time)
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      motionState.lenis = null;
    };
  }, []);

  /* ---- nav: first-load intro, hide on scroll, scrolled shadow; scroll velocity ----
   * The page's one global (start 0, end max) trigger: it also publishes the scroll velocity
   * (motionState.velocity, read by the Home client rails). The hide/show tween is only created
   * when the state flips, and the scrolled shadow is a [data-scrolled] attribute (Header CSS). */
  useIsoLayoutEffect(() => {
    const nav = document.querySelector<HTMLElement>('[data-tv-nav]');
    if (!nav) return;
    const ctx = gsap.context(() => {
      if (!isReduced()) {
        gsap.fromTo(nav, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power4.out', delay: 0.2 });
      }
      nav.style.visibility = 'visible';
      let lastY = 0;
      let menuWasOpen = false;
      let scrolled: boolean | null = null;
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          motionState.velocity = self.getVelocity();
          const y = self.scroll();
          const down = y > lastY + 4;
          const up = y < lastY - 4;
          if (menuOpenRef.current) {
            if (!menuWasOpen || navHidden.current) gsap.to(nav, { yPercent: 0, duration: 0.3, overwrite: 'auto' });
            menuWasOpen = true;
            navHidden.current = false;
          } else {
            menuWasOpen = false;
            if (down && y > 160) {
              if (!navHidden.current) gsap.to(nav, { yPercent: -140, duration: 0.5, ease: 'power3.inOut', overwrite: 'auto' });
              navHidden.current = true;
            } else if (up || y < 80) {
              if (navHidden.current) gsap.to(nav, { yPercent: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
              navHidden.current = false;
            }
          }
          const s = y > 80;
          if (s !== scrolled) {
            scrolled = s;
            nav.toggleAttribute('data-scrolled', s);
          }
          if (Math.abs(y - lastY) > 4) lastY = y;
        },
      });
      // onUpdate only fires while scrolling, so after a jump-scroll the last velocity would stick.
      // Decay it toward 0 every frame (about 90% gone in 350ms); active scrolling keeps refreshing it.
      const decay = (_t: number, dt: number) => {
        const v = motionState.velocity;
        if (v) motionState.velocity = Math.abs(v) < 1 ? 0 : v * Math.pow(0.9, dt / 16.67);
      };
      gsap.ticker.add(decay);
      return () => {
        gsap.ticker.remove(decay);
        motionState.velocity = 0;
        nav.removeAttribute('data-scrolled');
      };
    });
    return () => ctx.revert();
  }, []);

  /* ---- magnet + fill sweep + arrow nudge (event delegation) ---- */
  useEffect(() => {
    if (!window.matchMedia(BP.fine).matches) return;
    const reduced = isReduced();
    let active: HTMLElement | null = null;
    /** Magnet follow for the active element: quickTo setters and its layout box (without the magnet
     *  offset) cached on enter; re-measured after a scroll or resize moves it. */
    let follow: { b: HTMLElement; x: gsap.QuickToFunc; y: gsap.QuickToFunc; box: DOMRect | null } | null = null;
    const boxOf = (b: HTMLElement) => {
      const r = b.getBoundingClientRect();
      const dx = Number(gsap.getProperty(b, 'x')) || 0;
      const dy = Number(gsap.getProperty(b, 'y')) || 0;
      return new DOMRect(r.left - dx, r.top - dy, r.width, r.height);
    };
    const invalidate = () => {
      if (follow) follow.box = null;
    };

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
        follow = { b, x: gsap.quickTo(b, 'x', { duration: 0.4 }), y: gsap.quickTo(b, 'y', { duration: 0.4 }), box: null };
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
        if (follow?.b === b) {
          follow = null;
          gsap.killTweensOf(b, 'x,y'); // the follow tweens; the elastic return takes over
        }
        gsap.to(b, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' });
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!active || reduced || e.pointerType !== 'mouse' || !follow || follow.b !== active) return;
      const f = follow;
      if (!f.box) f.box = boxOf(f.b);
      // Same as measuring the live rect each move: the target is taken from the element's
      // current (offset) position, read from GSAP's cache instead of layout.
      const cx = f.box.left + (Number(gsap.getProperty(f.b, 'x')) || 0) + f.box.width / 2;
      const cy = f.box.top + (Number(gsap.getProperty(f.b, 'y')) || 0) + f.box.height / 2;
      f.x((e.clientX - cx) * 0.25);
      f.y((e.clientY - cy) * 0.35);
    };
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerout', onOut, { passive: true });
    document.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate);
    return () => {
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      document.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', invalidate);
      window.removeEventListener('resize', invalidate);
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

  /* ---- global refresh: <main> resize (late layout: fonts, lazy media, accordions) ----
   * Images carry their intrinsic size, so neither window load nor image loads move anything; the
   * pins' own spacers resize <main> on every refresh, so a height equal to the one measured right
   * after the last refresh is that refresh's echo and is ignored. */
  useEffect(() => {
    const main = document.querySelector<HTMLElement>('main');
    if (!main || !('ResizeObserver' in window)) return;
    let settled = -1;
    const onRefresh = () => {
      settled = main.offsetHeight;
    };
    ScrollTrigger.addEventListener('refresh', onRefresh);
    const ro = new ResizeObserver((entries) => {
      const h = entries[entries.length - 1].target instanceof HTMLElement ? (entries[entries.length - 1].target as HTMLElement).offsetHeight : -1;
      if (Math.abs(h - settled) < 1) return;
      scheduleRefresh(120);
    });
    ro.observe(main);
    return () => {
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      ro.disconnect();
    };
  }, []);

  /* ---- idle warm-up: once the first page has loaded, warm the other routes' critical images ---- */
  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (!cancelled) warmRoutes(location.pathname);
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener('load', start);
    };
  }, []);

  /* ---- route change: top (or hash), close sheet, refresh ---- */
  useIsoLayoutEffect(() => {
    const first = firstRoute.current;
    firstRoute.current = false;
    committedPath.current = pathname;
    if (first) {
      // First load: server HTML is on screen before any intro runs (CSS reads html.tv-initial).
      document.documentElement.classList.add('tv-initial');
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
    // One refresh once the new page's scopes have mounted (they schedule the same debounced
    // refresh); the hash follow above runs after each refresh.
    scheduleRefresh();
    goHash();
    // A page transition waiting for this commit can now settle and open (scroll is already reset).
    commitWaiters.current.splice(0).forEach((fn) => fn());
    return () => {
      clearTimeout(follow);
      stopFollow();
    };
  }, [pathname, setMenuOpen]);

  /* ---- menu open: stop scrolling ---- */
  useEffect(() => {
    const lenis = motionState.lenis;
    const root = document.documentElement;
    if (menuOpen) {
      navHidden.current = false; // Header slides the nav back in while the sheet is open
      lenis?.stop();
      if (!lenis) root.style.overflow = 'hidden';
    } else {
      // A page transition closes the sheet as it starts; it restarts Lenis itself after the reveal.
      if (!motionState.transitioning) lenis?.start();
      root.style.overflow = '';
    }
  }, [menuOpen]);

  /* ---- page transitions (Ruled Shutter, src/components/shared/PageTransition.tsx) ----
   * Click on an internal link to another pathname: close the shutter, router.push, wait for the
   * new route to commit (the route effect above resets scroll / jumps to the hash under the cover),
   * let it settle, open the shutter. Lenis is stopped throughout; page intros are held by the
   * reveal gate (state.ts) and start as the slats begin to open. Back/forward: reveal only. */
  const waitForCommit = useCallback(
    (from: string) =>
      new Promise<void>((resolve) => {
        if (committedPath.current !== from) return resolve();
        const done = () => {
          clearTimeout(t);
          resolve();
        };
        const t = setTimeout(done, 8000); // never leave the page covered
        commitWaiters.current.push(done);
      }),
    [],
  );

  const runTransition = useCallback(
    async (to: URL | null, revealOnly: boolean) => {
      const from = committedPath.current;
      const target = to ? to.pathname : location.pathname;
      const startedAt = performance.now();
      // The destination's above-the-fold images (already warming since hover / idle): decoded
      // before the shutter opens, capped at ASSET_CAP_MS.
      const assetsReady = preloadRoute(target);
      if (target === '/portfolio') warmFilm();
      const shutter = motionState.shutter;
      const reduced = isReduced();
      const main = document.getElementById('main');
      let lenisStarted = false;
      const reveal = () => {
        motionState.transitioning = false;
        if (!lenisStarted) {
          lenisStarted = true;
          motionState.lenis?.start();
        }
        releaseReveal();
      };
      busy.current = true;
      motionState.transitioning = true;
      document.documentElement.classList.remove('tv-initial'); // intros now play under the cover
      holdReveal();
      motionState.lenis?.stop();
      setMenuOpen(false);
      try {
        const push = () => {
          const committed = waitForCommit(from);
          if (to) router.push(to.pathname + to.search + to.hash, { scroll: false });
          return committed;
        };
        if (reduced || !shutter) {
          // Reduced motion: a plain crossfade of <main>.
          if (main) {
            if (revealOnly) gsap.set(main, { opacity: 0 });
            else await gsap.to(main, { opacity: 0, duration: 0.15, ease: 'none' });
          }
          await push();
          await settleRoute(assetsReady, startedAt);
          flushRefresh();
          reveal();
          if (main) await gsap.to(main, { opacity: 1, duration: 0.2, ease: 'none', clearProps: 'opacity' });
        } else {
          if (revealOnly) shutter.cover(target);
          else await shutter.close(target);
          await push();
          await settleRoute(assetsReady, startedAt);
          flushRefresh(); // pins measured before the slats open
          await shutter.open(reveal);
        }
      } finally {
        reveal();
        busy.current = false;
        if (committedPath.current !== from) {
          document.getElementById('main')?.focus({ preventScroll: true });
          shutter?.announce(committedPath.current);
        }
        const next = queued.current;
        queued.current = null;
        if (next) {
          const url = new URL(next);
          if (url.pathname !== location.pathname) void runTransition(url, false);
        }
      }
    },
    [router, setMenuOpen, waitForCommit],
  );

  const navigate = useCallback(
    (href: string) => {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) {
        router.push(href);
        return;
      }
      if (busy.current) {
        queued.current = url.href;
        return;
      }
      void runTransition(url, false);
    },
    [router, runTransition],
  );
  const navigateRef = useRef(navigate);
  useIsoLayoutEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    // Registered after the same-page anchor handler (also window capture), so a handled
    // '#x' click arrives here defaultPrevented and is skipped. preventDefault makes next/link stand down.
    const onClick = (e: MouseEvent) => {
      const url = transitionTarget(e);
      if (!url) return;
      e.preventDefault();
      navigateRef.current(url.href);
    };
    // Warm the route while the pointer is on its way (next/link only prefetches links in view).
    const prefetched = new Set<string>();
    const onOver = (e: Event) => {
      const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href]');
      if (!a) return;
      try {
        const url = new URL(a.href, location.href);
        if (url.origin !== location.origin || url.pathname === location.pathname || prefetched.has(url.pathname)) return;
        if (/\.[a-z0-9]+$/i.test(url.pathname)) return;
        prefetched.add(url.pathname);
        router.prefetch(url.pathname);
        void preloadRoute(url.pathname);
        if (url.pathname === '/portfolio') warmFilm();
      } catch {
        /* ignore */
      }
    };
    // Back/forward: Next commits the route itself, so there is no time to close; cover at once and reveal.
    const onPop = () => {
      if (location.pathname === committedPath.current || busy.current) return; // hash-only (products switcher)
      void runTransition(null, true);
    };
    window.addEventListener('click', onClick, true);
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('focusin', onOver);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('click', onClick, true);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('focusin', onOver);
      window.removeEventListener('popstate', onPop);
    };
  }, [router, runTransition]);

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
      navigate,
    }),
    [menuOpen, setMenuOpen, navigate],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
