import { Eyebrow } from '@/components/shared/Eyebrow';
import { Button } from '@/components/shared/Button';
import { media } from '@/data/assets';
import { FILM_BEATS } from './filmBeats';
import { FilmPlay } from './FilmPlay';
import styles from './FilmHero.module.css';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * FILM CHAPTER. With motion: the card expands to full screen on first arrival and the clip plays once
 * with large editorial captions (alternating lower-left / upper-right) while scroll input only speeds
 * it up; then the card
 * shrinks back (on end, Skip or Esc), loops muted as an ambient background and offers "Play film" to
 * replay the story. Motion lives in PortfolioMotion. Reduced motion / no JS: poster, a Play control
 * and the captions as a static list.
 */
export function FilmHero() {
  return (
    <section id="top" data-tv-film="" className={styles.film} aria-labelledby="portfolio-title">
      <div data-tv-film-copy="" className={styles.copy}>
        <Eyebrow data-tv-reveal="" className={styles.eyebrow}>
          Portfolio · Installed base
        </Eyebrow>
        <h1 id="portfolio-title" data-tv-split="" className={styles.title} tabIndex={-1}>
          Fifty-five years of transformers, still carrying load.
        </h1>
      </div>

      <div data-tv-film-media="" className={styles.media}>
        <video
          data-tv-video=""
          className={styles.video}
          poster={media.heroPoster}
          muted
          playsInline
          preload="metadata"
          controls
          aria-label="Electricians working at a substation (stock footage, no audio)"
        >
          {/* 720p below the desktop breakpoint; PortfolioMotion raises preload only on the motion path. */}
          <source src={media.heroVideoSd} type="video/mp4" media="(max-width: 1099px)" />
          <source src={media.heroVideo} type="video/mp4" />
        </video>
        <div className={styles.shade} aria-hidden="true" />
        <div data-tv-film-grain="" className={styles.grain} aria-hidden="true" />
        <div data-tv-film-dim="" className={styles.dim} aria-hidden="true" />
        <FilmPlay />
        <div data-tv-film-text="" className={styles.text}>
          <div data-tv-film-rule="" className={styles.rule} aria-hidden="true" />
          <div className={styles.textGrid}>
            <div className={styles.term}>
              <p data-tv-film-line="" className={styles.word}>
                Installed base
              </p>
              <p data-tv-film-line="" className={styles.phon}>
                \ in-ˈstȯld ˈbās \
              </p>
            </div>
            <div className={styles.defs}>
              <p data-tv-film-line="" className={styles.def}>
                Every unit Truvolt has shipped since 1970 that is energised today.
              </p>
              <p data-tv-film-line="" className={`${styles.def} ${styles.defSoft}`}>
                Grid substations, steel plants, refineries, EPC projects.
              </p>
              <p data-tv-film-line="" className={`${styles.def} ${styles.defMuted}`}>
                Nine countries. One works in Kolkata.
              </p>
            </div>
          </div>
        </div>
        <div data-tv-film-black="" className={styles.black} aria-hidden="true" />
        {/* Credit + speed readout: static fallback only (the full-screen story stays clean). */}
        <div className={styles.strip}>
          <span className={styles.credit}>Footage · Pexels / Videas Cl</span>
          <span data-tv-film-rate="" className={styles.rate} aria-hidden="true">
            1.0×
          </span>
        </div>
        <Button variant="light" data-tv-film-replay="" className={styles.replay} hidden>
          Play film <span aria-hidden="true">▸</span>
        </Button>
      </div>

      {/* Story beats: a static list by default; PortfolioMotion turns it into timed captions. */}
      <div data-tv-film-story="" className={styles.story}>
        <div data-tv-film-title="" className={styles.titleCard} aria-hidden="true">
          <span className={styles.titleMark}>Truvolt</span>
          <span className={styles.titleRule} />
          <span className={styles.titleSub}>Installed base · 1970 to today</span>
        </div>
        <ol data-tv-film-beats="" className={styles.beats} aria-label="The story in the film">
          {FILM_BEATS.map((b, i) => (
            <li key={b.text} data-tv-film-beat="" data-pos={i % 2 ? 'ur' : 'll'} className={styles.beat}>
              <span className={styles.beatMeta} aria-hidden="true">
                <span className={styles.beatRule} />
                <Eyebrow as="span" className={styles.beatNum}>
                  {pad(i + 1)} / {pad(FILM_BEATS.length)}
                </Eyebrow>
                <span className={styles.beatRule} />
              </span>
              <span data-tv-film-beat-text="" className={styles.beatText}>
                {b.text}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p data-tv-film-live="" className="visually-hidden" aria-live="polite" />
      <button
        type="button"
        data-tv-film-skip=""
        className={styles.skip}
        aria-label="Skip the film"
        aria-keyshortcuts="Escape"
        hidden
      >
        Skip <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
