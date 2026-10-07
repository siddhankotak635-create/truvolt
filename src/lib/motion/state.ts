import type Lenis from 'lenis';

/**
 * Module-level motion state, written by MotionProvider and read lazily by
 * useTvMotion setups and helpers. Lenis is created in a layout effect, so it is
 * available by the time any setup runs (setups wait for document.fonts.ready).
 */
export const motionState: { lenis: Lenis | null } = { lenis: null };

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
