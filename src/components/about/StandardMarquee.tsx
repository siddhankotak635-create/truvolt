'use client';

import { useState, type PointerEvent } from 'react';
import { POINTS } from './points';
import styles from './About.module.css';

const points = POINTS.map(([t, d], i) => ({ n: String(i + 1).padStart(2, '0'), t, d }));

/**
 * Nine point cards on the CSS `tv-marquee` (60s). Hover pauses it on hover-capable
 * pointers; on touch a tap toggles the paused class. The second copy of the cards
 * only exists to make the loop seamless, so it is hidden from assistive tech.
 */
export function StandardMarquee() {
  const [paused, setPaused] = useState(false);
  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') setPaused((p) => !p);
  };

  return (
    <>
      <button type="button" className={styles.marqueeToggle} aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
        Pause
      </button>
    <div data-tv-reveal="" className={styles.marquee}>
      <div
        className={`${styles.track} ${paused ? styles.paused : ''}`}
        onPointerUp={onPointerUp}
        data-paused={paused ? '' : undefined}
      >
        {[0, 1].map((copy) =>
          points.map((pt) => (
            <article
              key={`${copy}-${pt.n}`}
              data-tv-point=""
              className={`${styles.point} ${copy ? styles.dup : ''}`}
              aria-hidden={copy ? true : undefined}
            >
              <span className={styles.pointN}>{pt.n} / 09</span>
              <div>
                <h3 className={styles.pointTitle}>{pt.t}</h3>
                <p className={styles.pointBody}>{pt.d}</p>
              </div>
            </article>
          )),
        )}
      </div>
    </div>
    </>
  );
}
