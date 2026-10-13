'use client';

import type { RefObject } from 'react';
import type Lenis from 'lenis';
import { gsap, ScrollTrigger, useGSAP } from './gsap';
import { isFine, isReduced, motionState, withCollector } from './state';
import { scheduleRefresh } from './helpers';

/** Longest a setup waits for webfonts. Content is already painted, so intros must not start late. */
const FONT_WAIT_MS = 300;
let fontsSettled = false;
let fontWait: Promise<void> | null = null;

/** Resolves when webfonts are ready or after FONT_WAIT_MS, whichever is first. A late font load
 *  sets motionState.fontsReady, refreshes the triggers once and fires `tv:fontsready` so line splits
 *  measured with the fallback face can re-split. Already resolved after the first load. */
function fontsOrTimeout(): Promise<void> {
  if (fontsSettled) return Promise.resolve();
  if (!fontWait) {
    const ready = typeof document !== 'undefined' && document.fonts?.ready ? document.fonts.ready : Promise.resolve();
    let timedOut = false;
    fontWait = Promise.race([
      ready.then(() => {
        fontsSettled = true;
        motionState.fontsReady = true;
        if (timedOut) {
          window.dispatchEvent(new Event('tv:fontsready'));
          scheduleRefresh();
        }
      }),
      new Promise<void>((resolve) =>
        setTimeout(() => {
          timedOut = true;
          resolve();
        }, FONT_WAIT_MS),
      ),
    ]);
  }
  return fontWait;
}

export type TvMotionContext = {
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
  /** Lenis instance, or null under reduced motion */
  lenis: Lenis | null;
  reduced: boolean;
  fine: boolean;
  /** gsap.matchMedia() owned by this scope; reverted on cleanup */
  mm: gsap.MatchMedia;
  /** Scoped querySelectorAll returning an array */
  q: <T extends HTMLElement = HTMLElement>(selector: string) => T[];
  /** The scope element itself */
  scope: HTMLElement;
};

export type TvMotionSetup = (ctx: TvMotionContext) => void | (() => void);

/**
 * Page/section motion hook. Wraps useGSAP({ scope }) so every tween and
 * ScrollTrigger created in `setup` is reverted on unmount (route change) or
 * when `deps` change. Setup runs after document.fonts.ready, capped at 300ms.
 *
 *   const ref = useRef<HTMLDivElement>(null);
 *   useTvMotion(ref, ({ scope, mm }) => { initPageCore(scope); mm.add(BP.desktop, () => {...}); });
 */
export function useTvMotion(scopeRef: RefObject<HTMLElement | null>, setup: TvMotionSetup, deps: unknown[] = []): void {
  useGSAP(
    (context) => {
      let cancelled = false;
      let mm: gsap.MatchMedia | null = null;
      let userCleanup: void | (() => void);
      const restorers: (() => void)[] = [];

      fontsOrTimeout().then(() => {
        const scope = scopeRef.current;
        if (cancelled || !scope) return;
        context.add(() => {
          mm = gsap.matchMedia();
          // Helpers called inside a later mm.add callback run outside setup's collector;
          // collect their restorers per callback and run them when that match reverts.
          const origAdd = mm.add.bind(mm) as (q: unknown, fn: (c: unknown) => unknown, s?: unknown) => unknown;
          (mm as unknown as { add: typeof origAdd }).add = (query, fn, s) =>
            origAdd(
              query,
              (c) => {
                const local: (() => void)[] = [];
                const result = withCollector(local, () => fn(c));
                return () => {
                  if (typeof result === 'function') (result as () => void)();
                  local.splice(0).reverse().forEach((r) => r());
                };
              },
              s,
            );
          const ctx: TvMotionContext = {
            gsap,
            ScrollTrigger,
            lenis: motionState.lenis,
            reduced: isReduced(),
            fine: isFine(),
            mm,
            q: <T extends HTMLElement = HTMLElement>(sel: string) => Array.from(scope.querySelectorAll<T>(sel)),
            scope,
          };
          userCleanup = withCollector(restorers, () => setup(ctx));
        });
        // New triggers change layout for everything below. One debounced refresh covers every
        // scope that mounts in the same pass (and the provider's route-change refresh).
        scheduleRefresh();
      });

      return () => {
        cancelled = true;
        if (typeof userCleanup === 'function') userCleanup();
        mm?.revert();
        // gsap.Context runs this cleanup after reverting its tweens, so inline styles are
        // already restored; now put back any DOM the helpers rewrote (split headings etc.).
        restorers.splice(0).reverse().forEach((fn) => fn());
      };
    },
    { scope: scopeRef, dependencies: deps, revertOnUpdate: true },
  );
}
