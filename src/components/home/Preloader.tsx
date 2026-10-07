'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import styles from './Preloader.module.css';

/** sessionStorage key: the preloader runs once per browser session. */
export const LOADED_KEY = 'tv-loaded';
/** Class on <html> that hides the preloader (set before paint when it already ran). */
export const LOADED_CLASS = 'tv-loaded';

/**
 * Runs during HTML parsing on a full page load, before the loader paints, so a
 * repeat visit in the same session never flashes the dark overlay.
 */
const earlyCheck = `try{if(sessionStorage.getItem('${LOADED_KEY}'))document.documentElement.classList.add('${LOADED_CLASS}')}catch(e){}`;

const noop = () => () => {};
/** true while rendering on the server and during hydration, false afterwards and on client navigations. */
const useIsHydrating = () =>
  useSyncExternalStore(
    noop,
    () => false,
    () => true,
  );

/**
 * Fixed preloader overlay (Home only). Counts 0 → 66 kV, then wipes up.
 * The animation itself lives in HomeMotion (it is part of the intro timeline).
 * Visibility rules (Preloader.module.css):
 *   - shown only under html.tv-motion (JS on, no reduced motion);
 *   - hidden by html.tv-loaded (already played this session);
 *   - a CSS fallback hides it after 6s if JS never takes over.
 */
export function Preloader() {
  const hydrating = useIsHydrating();

  // Client-side navigation to Home: the inline script does not run, so mirror it before paint.
  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem(LOADED_KEY)) document.documentElement.classList.add(LOADED_CLASS);
    } catch {
      /* storage unavailable: the loader simply plays */
    }
  }, []);

  return (
    <>
      {/* Rendered only for SSR + hydration (never created on the client, so React does not warn). */}
      {hydrating && <script dangerouslySetInnerHTML={{ __html: earlyCheck }} />}
      <div data-tv-loader="" className={styles.loader} aria-hidden="true">
        <div className={styles.top}>
          <span>Truvolt Engineering Co. Pvt. Ltd.</span>
          <span>Kolkata · Est. 1970</span>
        </div>
        <div className={styles.bottom}>
          <p className={styles.tag}>
            Energising
            <br />
            the test bay
          </p>
          <p className={styles.num}>
            <span data-tv-loader-num="">0</span>
            <span className={styles.unit}>kV</span>
          </p>
        </div>
      </div>
    </>
  );
}
