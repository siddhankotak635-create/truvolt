'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './FilmHero.module.css';

/**
 * Static-fallback control for the film (reduced motion). Fixed label + aria-pressed (pressed = playing).
 * The server markup gives the video native `controls` and renders this button hidden, so without JS
 * the browser controls work; once hydrated, the native controls are removed and this button shows.
 * Under html.tv-motion the storytelling sequence owns the video and CSS hides the button.
 */
export function FilmPlay() {
  const btn = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);

  const videoOf = () => btn.current?.closest('[data-tv-film-media]')?.querySelector<HTMLVideoElement>('video') ?? null;

  useEffect(() => {
    setMounted(true);
    const video = videoOf();
    if (!video) return;
    video.controls = false;
    const sync = () => setPlaying(!video.paused && !video.ended);
    sync();
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    video.addEventListener('ended', sync);
    return () => {
      video.removeEventListener('play', sync);
      video.removeEventListener('pause', sync);
      video.removeEventListener('ended', sync);
    };
  }, []);

  const toggle = () => {
    const video = videoOf();
    if (!video) return;
    if (video.paused || video.ended) video.play().catch(() => {});
    else video.pause();
  };

  return (
    <button
      ref={btn}
      type="button"
      data-tv-film-play=""
      className={styles.play}
      onClick={toggle}
      aria-pressed={playing}
      hidden={!mounted}
    >
      <span className={styles.playIcon} aria-hidden="true" />
      Play video
    </button>
  );
}
