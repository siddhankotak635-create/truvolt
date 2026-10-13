'use client';

import { useState } from 'react';
import styles from './MapFacade.module.css';

export type MapFacadeProps = {
  /** Google Maps embed URL, loaded only after the visitor asks for it. */
  src: string;
  title: string;
  /** Class for the iframe once loaded (the parent's absolute-fill frame style). */
  frameClassName?: string;
  /** Address lines shown on the static card. */
  lines: string[];
  /** Optional Google Maps directions link shown next to "Load map". */
  directions?: string;
  /** Leave room at the bottom for overlaid pills (Contact MapCard). */
  padBottom?: boolean;
};

/**
 * Click-to-load facade for a Google Maps embed. The embed pulls ~1 MB of third-party JS, tiles and
 * fonts, so the page shows a styled static card until the visitor presses "Load map".
 */
export function MapFacade({ src, title, frameClassName, lines, directions, padBottom }: MapFacadeProps) {
  const [loaded, setLoaded] = useState(false);
  if (loaded) {
    return <iframe title={title} src={src} className={frameClassName} referrerPolicy="no-referrer-when-downgrade" />;
  }
  return (
    <div className={`${styles.facade} ${padBottom ? styles.padBottom : ''}`}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.roads} aria-hidden="true" />
      <div className={styles.body}>
        <span className={styles.pin} aria-hidden="true" />
        <p className={styles.address}>
          {lines.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.load} onClick={() => setLoaded(true)} aria-label={`Load map: ${title}`}>
            Load map
          </button>
          {directions && (
            <a href={directions} target="_blank" rel="noopener noreferrer" className={styles.link}>
              Directions
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
