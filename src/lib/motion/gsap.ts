'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

/**
 * Single registration point for GSAP plugins. Importing from here (rather than
 * from 'gsap' directly) guarantees ScrollTrigger is registered before any page
 * setup runs, even though child effects fire before the provider's.
 */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
  // After a long main-thread stall (tab switch, GC) jump at most 33ms instead of replaying the gap.
  gsap.ticker.lagSmoothing(500, 33);
  // Refresh triggers in page order, not creation order. Helpers (initPageCore) run before a
  // page builds its pins, so without this a trigger below a pin (Home stats under the hero pin)
  // is measured without that pin's spacing and fires early. Runs before every refresh, so pins
  // re-created by matchMedia on a breakpoint change are re-sorted too.
  ScrollTrigger.addEventListener('refreshInit', () => ScrollTrigger.sort());
  // Dev-only handle for debugging (e.g. ScrollTrigger.getAll().length in the console).
  if (process.env.NODE_ENV !== 'production') {
    (window as unknown as { __tv: unknown }).__tv = { gsap, ScrollTrigger };
  }
}

export { gsap, ScrollTrigger, useGSAP };
