export { MotionProvider, useMotion, type MotionContextValue } from './MotionProvider';
export { MotionScope, type MotionScopeProps } from './MotionScope';
export { useTvMotion, type TvMotionContext, type TvMotionSetup } from './useTvMotion';
export {
  splitWords,
  afterReveal,
  defaultIntro,
  initReveal,
  initWords,
  initParallax,
  initCounters,
  initPageCore,
  showPrehidden,
  scheduleRefresh,
  flushRefresh,
  introCovered,
  REVEAL_OFFSET,
  layoutMetrics,
  PREHIDDEN,
  type PageCoreOptions,
  type IntroOptions,
  type RevealOptions,
} from './helpers';
export { BP, onRevert, isReduced, isFine, motionState, whenRevealed, isRevealPending, type ShutterApi } from './state';
export { gsap, ScrollTrigger } from './gsap';
