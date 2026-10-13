import type Lenis from 'lenis';

/**
 * Module-level motion state, written by MotionProvider and read lazily by
 * useTvMotion setups and helpers. Lenis is created in a layout effect, so it is
 * available by the time any setup runs (setups wait for document.fonts.ready).
 */
export const motionState: {
  lenis: Lenis | null;
  /** Page-transition layer (PageTransition), registered on mount. */
  shutter: ShutterApi | null;
  /** True while a page transition owns the screen (cover → commit → reveal start). */
  transitioning: boolean;
  /** Scroll velocity (px/s) from the provider's single global scroll trigger; decays to 0 when scrolling stops. */
  velocity: number;
  /** Webfonts were ready within the setup cap (useTvMotion waits at most FONT_WAIT_MS). */
  fontsReady: boolean;
} = { lenis: null, shutter: null, transitioning: false, velocity: 0, fontsReady: false };

/** Imperative API of the page-transition layer (src/components/shared/PageTransition.tsx). */
export type ShutterApi = {
  /** Close the slats over the page and play the destination label (name + kV readout) for `pathname`;
   *  resolves once fully covered and the label has finished. */
  close: (pathname: string) => Promise<void>;
  /** Show the closed shutter instantly with the label for `pathname` (back/forward: reveal only). */
  cover: (pathname: string) => void;
  /** Announce the page that is now showing (aria-live). */
  announce: (pathname: string) => void;
  /** Open the slats. `onReveal` fires as the new page starts to show; resolves when fully open. */
  open: (onReveal?: () => void) => Promise<void>;
};

/* ------------------------------------------------------------------ reveal gate
 * Page intros must not play under the shutter. A transition holds the gate from
 * the moment it starts covering until the new page starts to show; intros call
 * afterReveal()/whenRevealed() and wait. Outside a transition (first load, product
 * switches) the gate is open and the promise is already resolved. */
let revealPromise: Promise<void> = Promise.resolve();
let releaseFn: (() => void) | null = null;

/** Close the gate (no-op if already closed). */
export function holdReveal(): void {
  if (releaseFn) return;
  revealPromise = new Promise<void>((resolve) => {
    releaseFn = resolve;
  });
}

/** Open the gate: every pending whenRevealed() resolves. */
export function releaseReveal(): void {
  const fn = releaseFn;
  releaseFn = null;
  fn?.();
}

/** True while a transition holds intros back (the new page is mounting under the cover). */
export function isRevealPending(): boolean {
  return releaseFn !== null;
}

/** Resolves when the current transition starts revealing the new page (immediately when none is running). */
export function whenRevealed(): Promise<void> {
  return revealPromise;
}

export const BP = {
  /** gsap.matchMedia / window.matchMedia queries matching the CSS breakpoints */
  desktop: '(min-width: 1100px)',
  tablet: '(min-width: 768px) and (max-width: 1099px)',
  belowDesktop: '(max-width: 1099px)',
  mobile: '(max-width: 767px)',
  small: '(max-width: 419px)',
  fine: '(pointer: fine)',
  coarse: '(pointer: coarse)',
  reduced: '(prefers-reduced-motion: reduce)',
  motionOk: '(prefers-reduced-motion: no-preference)',
} as const;

export function isReduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(BP.reduced).matches;
}

export function isFine(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(BP.fine).matches;
}

/* Revert registry: helpers called inside a useTvMotion setup register DOM
 * restorers here (e.g. un-splitting a heading) so React's DOM is left intact. */
let collector: (() => void)[] | null = null;

export function withCollector<T>(list: (() => void)[], fn: () => T): T {
  const prev = collector;
  collector = list;
  try {
    return fn();
  } finally {
    collector = prev;
  }
}

/** Register a function to run when the current useTvMotion scope reverts. No-op outside a setup. */
export function onRevert(fn: () => void): void {
  if (collector) collector.push(fn);
}
