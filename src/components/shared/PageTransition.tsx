'use client';

import { useEffect, useRef } from 'react';
import { nav } from '@/data/site';
import { gsap, motionState, type ShutterApi } from '@/lib/motion';
import styles from './PageTransition.module.css';

const SLATS = 10;

/** Shutter label for a pathname: nav label + position in the nav ("Company", "02 / 06"). */
export function routeLabel(pathname: string): { name: string; index: string } {
  const path = pathname.replace(/\/+$/, '') || '/';
  const i = nav.findIndex((item) => (item.href === '/' ? path === '/' : path === item.href || path.startsWith(item.href + '/')));
  const pad = (n: number) => String(n).padStart(2, '0');
  if (i >= 0) return { name: nav[i].label, index: `${pad(i + 1)} / ${pad(nav.length)}` };
  return { name: 'Truvolt', index: `00 / ${pad(nav.length)}` };
}

/**
 * Page-transition layer, direction A "Ruled Shutter" (Task 21; prototype
 * .superpowers/sdd/transitions/refs/prototypes/proto-a-ruled-shutter.html).
 * Mounted once in the root layout, outside <main>, so it survives route changes.
 * It only renders and animates; MotionProvider decides when to run it and owns
 * routing, Lenis and the reveal gate (docs/FOUNDATION.md, "Page transitions").
 *
 * Timing (about 1.2s when the route is prefetched):
 *   close  slats scaleY 0 → 1 top to bottom, .32s power3.in, stagger .02; covered at .5s
 *          (close() resolves here so MotionProvider can push the route while the label plays)
 *   label  name rises (.36s power4.out) at .4, kV 000 → 066 + hairline .4 → .62; open may start at .64
 *   commit router.push + mount under the cover (MotionProvider), in parallel with the label
 *   open   waits for the label, then label out .28s, slats scaleY 1 → 0 (origin bottom)
 *          .34s power3.out, stagger .018 from .06 (≈ .56s)
 */
export function PageTransition() {
  const rootRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const slats = Array.from(root.querySelectorAll<HTMLElement>('[data-slat]'));
    const top = root.querySelector<HTMLElement>('[data-top]')!;
    const meter = root.querySelector<HTMLElement>('[data-meter]')!;
    const name = root.querySelector<HTMLElement>('[data-name]')!;
    const idx = root.querySelector<HTMLElement>('[data-idx]')!;
    const kv = root.querySelector<HTMLElement>('[data-kv]')!;
    const bar = root.querySelector<HTMLElement>('[data-bar]')!;
    let tl: gsap.core.Timeline | null = null;
    /** Resolves when the label on the closed shutter has finished (open() waits for it). */
    let labelDone: Promise<void> = Promise.resolve();

    const setLabel = (pathname: string) => {
      const l = routeLabel(pathname);
      name.textContent = l.name;
      idx.textContent = l.index;
    };
    const show = () => root.classList.add(styles.active);
    const hide = () => root.classList.remove(styles.active);

    const api: ShutterApi = {
      close(pathname) {
        tl?.kill();
        setLabel(pathname);
        gsap.set(slats, { scaleY: 0, transformOrigin: '50% 0%' });
        gsap.set(name, { y: 0, yPercent: 110 });
        gsap.set([top, meter], { opacity: 0 });
        gsap.set(bar, { scaleX: 0 });
        kv.textContent = '000';
        show();
        const o = { v: 0 };
        let labelResolve: () => void = () => {};
        labelDone = new Promise<void>((r) => (labelResolve = r));
        return new Promise<void>((covered) => {
          tl = gsap
            .timeline({ onComplete: labelResolve, onInterrupt: labelResolve })
            .to(slats, { scaleY: 1, duration: 0.32, ease: 'power3.in', stagger: 0.02 }, 0)
            .add(covered, 0.5)
            // the label waits for the bottom slats (where the name sits) to close
            .to([top, meter], { opacity: 1, duration: 0.18, ease: 'none' }, 0.38)
            .to(name, { yPercent: 0, duration: 0.36, ease: 'power4.out' }, 0.4)
            .to(bar, { scaleX: 1, duration: 0.22, ease: 'power2.inOut' }, 0.4)
            .to(o, { v: 66, duration: 0.22, ease: 'power2.inOut', onUpdate: () => void (kv.textContent = String(Math.round(o.v)).padStart(3, '0')) }, 0.4)
            // name ~95% risen and the readout at 066: the shutter may open from here
            .add(labelResolve, 0.64);
        });
      },
      cover(pathname) {
        tl?.kill();
        setLabel(pathname);
        gsap.set(slats, { scaleY: 1 });
        gsap.set(name, { y: 0, yPercent: 0 });
        gsap.set([top, meter], { opacity: 1 });
        gsap.set(bar, { scaleX: 1 });
        kv.textContent = '066';
        labelDone = Promise.resolve();
        show();
      },
      async open(onReveal) {
        await labelDone;
        tl?.kill();
        gsap.set(slats, { scaleY: 1, transformOrigin: '50% 100%' });
        return new Promise<void>((resolve) => {
          tl = gsap
            .timeline({
              onComplete: () => {
                hide();
                resolve();
              },
            })
            .to(name, { yPercent: -110, duration: 0.28, ease: 'power3.in' }, 0)
            .to([top, meter], { opacity: 0, duration: 0.18, ease: 'none' }, 0)
            .to(slats, { scaleY: 0, duration: 0.34, ease: 'power3.out', stagger: 0.018 }, 0.06)
            // the first slats have cleared the top of the page: let the intros start
            .add(() => onReveal?.(), 0.18);
        });
      },
      announce(pathname) {
        const live = liveRef.current;
        if (!live) return;
        live.textContent = '';
        // a fresh text node on the next frame so screen readers announce repeats too
        requestAnimationFrame(() => {
          live.textContent = `${routeLabel(pathname).name} page`;
        });
      },
    };
    motionState.shutter = api;
    return () => {
      tl?.kill();
      if (motionState.shutter === api) motionState.shutter = null;
    };
  }, []);

  return (
    <>
      <div ref={rootRef} className={styles.root} aria-hidden="true" data-tv-transition="">
        <div className={styles.slats}>
          {Array.from({ length: SLATS }, (_, i) => (
            <i key={i} data-slat="" />
          ))}
        </div>
        <div className={styles.label}>
          <div className={styles.top} data-top="">
            <span>Truvolt Engineering Co. · Kolkata</span>
            <span data-idx="">01 / 06</span>
          </div>
          <div className={styles.bottom}>
            <p className={styles.mask}>
              <span className={styles.name} data-name="">
                Home
              </span>
            </p>
            <div className={styles.meter} data-meter="">
              <span>
                <b data-kv="">000</b> kV
              </span>
              <span className={styles.bar}>
                <i data-bar="" />
              </span>
            </div>
          </div>
        </div>
      </div>
      <p ref={liveRef} className="visually-hidden" aria-live="polite" aria-atomic="true" />
    </>
  );
}
