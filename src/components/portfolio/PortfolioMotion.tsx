'use client';

import { useRef, type ReactNode } from 'react';
import { useTvMotion, initPageCore, introCovered, layoutMetrics, afterReveal, whenRevealed, type TvMotionContext } from '@/lib/motion';
import { FILM_BEATS } from './filmBeats';

/**
 * Portfolio page motion:
 * default intro + reveals, the film story (see buildFilmStory), capability range fill, segment parallax.
 */
export function PortfolioMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useTvMotion(ref, (ctx) => {
    const { gsap, q, scope, reduced } = ctx;
    initPageCore(scope, { parallax: false });

    const video = q<HTMLVideoElement>('[data-tv-video]')[0];
    if (video) video.controls = false;

    if (reduced) {
      // Static fallback: no lock, no autoplay. The poster stays until FilmPlay starts the clip.
      video?.pause();
      return;
    }

    const filmCleanup = buildFilmStory(ctx);

    // Capability range fill
    const range = q('[data-tv-range]')[0];
    const fill = q('[data-tv-range-fill]')[0];
    // Full-width fill slid in from the left inside the clipped pill track (no layout per frame).
    if (range && fill)
      gsap.fromTo(fill, { xPercent: -100 }, { xPercent: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: range, start: 'top 85%', once: true } });

    // Segments: image parallax + settle-in
    q('[data-tv-seg]').forEach((seg) => {
      const img = seg.querySelector('[data-tv-seg-img]');
      if (img)
        gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: seg, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo(seg, { scale: 0.96, opacity: 0.6 }, { scale: 1, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: seg, start: 'top 80%', once: true } });
    });

    return filmCleanup;
  });

  return <div ref={ref}>{children}</div>;
}

/** html class honoured by the Header CSS: slides the nav out while the film holds the page. */
const NAV_HIDDEN = 'tv-nav-hidden';
/** Wait for the hero intro before the card expands on its own (any scroll input starts it sooner). */
const AUTO_ENGAGE_MS = 1600;
/** "Installed base" closing beat after the clip ends, before the card shrinks. */
const CLOSING_MS = 2800;
/** Safety cap: the lock always releases after the clip's duration plus this. */
const CAP_EXTRA_S = 5;
const FALLBACK_DURATION_S = 14;
/** Opening, in seconds from engage: frame fades up from black, then the title card, then beat 01. */
const FADE_UP_AT = 1.1;
const TITLE_IN_AT = 1.2;
const TITLE_OUT_AT = 2.7; // title card holds 1.5s; beat 01 may begin as it fades out
/** Slow push-in on the video across the clip. */
const PUSH_IN = 0.06;
/** Ending: the frame dips to black, holds .4s, then the card shrinks back. */
const UNLOCK_AT = 1.05;

/**
 * FILM STORY (cinematic). On first arrival at the top of the page the card expands to full screen and the
 * frame goes to black; the nav hides and Lenis stops. The frame fades up from black, a title card
 * ("TRUVOLT / Installed base · 1970 to today") holds 1.5s, then the clip plays once, full screen, with large
 * editorial captions alternating lower-left / upper-right, a slow push-in and a light grain. The only
 * on-screen control is Skip (bottom-right).
 * Wheel / touch / key scroll input is swallowed and turned into playback speed:
 * rate = min(4, 1 + |velocity| / 900), easing back to 1 over 1.2s.
 * Release (clip end + closing beat, Skip, Esc, the safety cap, a stall, or route change): the caption
 * dissolves, the frame dips to black for .4s and the card shrinks back, restoring
 * scrolling and the nav. The card then loops the clip muted (paused offscreen) behind a "Play film" button
 * that replays the whole story. The automatic lock runs once per page visit; scrolling back up never
 * relocks, only the button does.
 */
function buildFilmStory({ gsap, ScrollTrigger, lenis, q }: TvMotionContext): () => void {
  const root = document.documentElement;
  const film = q('[data-tv-film]')[0];
  const copy = q('[data-tv-film-copy]')[0];
  const media = q('[data-tv-film-media]')[0];
  const video = q<HTMLVideoElement>('[data-tv-video]')[0];
  const text = q('[data-tv-film-text]')[0];
  const dim = q('[data-tv-film-dim]')[0];
  const rule = q('[data-tv-film-rule]')[0];
  const lines = q('[data-tv-film-line]');
  const rateEl = q('[data-tv-film-rate]')[0];
  const story = q('[data-tv-film-story]')[0];
  const titleCard = q('[data-tv-film-title]')[0];
  const beatList = q('[data-tv-film-beats]')[0];
  const beats = q('[data-tv-film-beat]');
  const live = q('[data-tv-film-live]')[0];
  const skip = q<HTMLButtonElement>('[data-tv-film-skip]')[0];
  const replay = q<HTMLButtonElement>('[data-tv-film-replay]')[0];
  const grain = q('[data-tv-film-grain]')[0];
  const black = q('[data-tv-film-black]')[0];
  if (!film || !copy || !media || !video || !story || !skip || !grain || !black) return () => {};

  // The markup only preloads metadata; the whole clip is buffered once the story engages
  // (engage() sets preload = 'auto'), never eagerly.
  // A failed <source> fires `error` on the source element, not on the video.
  const lastSource = video.querySelector('source:last-of-type');

  // Intro: media card rises in with the hero (mockup timeline position 0.4)
  // (held until a page transition has opened the shutter, like the other intros). On a first load
  // the card is already painted at the CSS offset (FilmHero.module.css), so it only rises.
  media.style.animation = 'none'; // cancel the CSS no-JS fallback
  if (introCovered())
    afterReveal(gsap.fromTo(media, { y: 100, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.3, ease: 'expo.out', delay: 0.4 }));
  else gsap.fromTo(media, { y: 100 }, { y: 0, duration: 1.3, ease: 'expo.out', delay: 0.4 });

  // In motion mode the live region narrates the current beat; the list itself is visual only.
  beatList?.setAttribute('aria-hidden', 'true');
  gsap.set(beats, { opacity: 0, y: 12 });

  let phase: 'idle' | 'locked' | 'done' = 'idle';
  /** After a release the card loops the clip muted as an ambient background. */
  let ambient = false;
  let mediaVisible = true;
  let closing = false;
  /** Beats wait for the opening title card. */
  let gateOpen = false;
  /** True between release(animate) and the moment the frame comes back from black. */
  let unlockPending = false;
  let current = -1;
  let engagedAt = 0;
  let lastInput = 0;
  let touchY: number | null = null;
  // Deep link further down the page: no lock on load; it engages if the visitor scrolls back to the top.
  let away = !!location.hash && location.hash !== '#top';
  let autoTimer: ReturnType<typeof setTimeout> | undefined;
  let capTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let stallTimer: ReturnType<typeof setTimeout> | undefined;
  let skipHadFocus = false;
  let inerted: HTMLElement[] = [];
  /** While locked, everything behind the film (later sections, footer) leaves the tab order and AT tree. */
  const setInert = (on: boolean) => {
    if (on) {
      const siblings = Array.from(film.parentElement?.children ?? []).filter((el) => el !== film);
      inerted = [...siblings, ...Array.from(document.querySelectorAll('footer'))].filter(
        (el): el is HTMLElement => el instanceof HTMLElement && !el.inert,
      );
      inerted.forEach((el) => (el.inert = true));
    } else {
      inerted.forEach((el) => (el.inert = false));
      inerted = [];
    }
  };
  let rateTween: gsap.core.Tween | null = null;
  let stageTl: gsap.core.Timeline | null = null;

  /* ---------- card ⇄ full screen as a clip window ----------
   * The card (content width, 40svh, 4svh up, radius 28) expands to the full frame and shrinks
   * back. Instead of tweening the card's width/height/bottom/radius (layout + a re-raster of the
   * graded video every frame), the card is laid out full screen for the move and a clip-path
   * window is animated over it with the same ease. The video gets the object-fit: cover scale it
   * would have at the window's size and the shade is stretched onto the window (independent
   * `translate`/`scale` properties, which compose with the push-in transform); "Play film" stays
   * centred on the window. Black, dim, grain and the closing text are flat or hidden during the move. */
  const shade = media.querySelector<HTMLElement>(':scope > [class*="_shade_"]');
  const win = { p: 0, W: 0, H: 0, content: 0 };
  const measureWin = () => {
    win.W = film.clientWidth;
    win.H = film.clientHeight;
    win.content = layoutMetrics(film).content;
  };
  const applyWin = () => {
    const { p, W, H } = win;
    const w = win.content + (W - win.content) * p;
    const h = H * (0.4 + 0.6 * p);
    const b = H * 0.04 * (1 - p);
    const r = 28 * (1 - p);
    const side = (W - w) / 2;
    const top = H - h - b;
    media.style.clipPath = `inset(${top.toFixed(2)}px ${side.toFixed(2)}px ${b.toFixed(2)}px round ${r.toFixed(2)}px)`;
    const ty = top + h / 2 - H / 2;
    const vw = video.videoWidth || 16;
    const vh = video.videoHeight || 9;
    // the video box at its full-frame cover size, so object-fit never crops inside it
    const c = Math.max(W / vw, H / vh);
    Object.assign(video.style, {
      width: vw * c + 'px',
      height: vh * c + 'px',
      left: (W - vw * c) / 2 + 'px',
      top: (H - vh * c) / 2 + 'px',
      maxWidth: 'none', // global img/video max-width: 100% would cap it
      right: 'auto',
      bottom: 'auto',
    });
    video.style.translate = `0px ${ty.toFixed(2)}px`;
    video.style.scale = (Math.max(w / vw, h / vh) / Math.max(W / vw, H / vh)).toFixed(5);
    if (shade) {
      shade.style.translate = `0px ${ty.toFixed(2)}px`;
      shade.style.scale = `${(w / W).toFixed(5)} ${(h / H).toFixed(5)}`;
    }
    if (replay) replay.style.translate = `-50% calc(-50% + ${ty.toFixed(2)}px)`;
  };
  const clearWin = () => {
    media.style.clipPath = '';
    video.style.translate = video.style.scale = '';
    video.style.width = video.style.height = video.style.left = video.style.top = video.style.right = video.style.bottom = video.style.maxWidth = '';
    if (shade) shade.style.translate = shade.style.scale = '';
    if (replay) replay.style.translate = '';
  };
  /** Lay the card out full screen (the move's end state) with the window at its current size. */
  const openWin = () => {
    measureWin();
    gsap.set(media, { width: '100%', height: '100%', bottom: 0, borderRadius: 0 });
    applyWin();
  };

  /** will-change for the length of a tween only (blur on the captions and the title card). */
  const layerDuring = (el: Element) => ({
    onStart: () => void ((el as HTMLElement).style.willChange = 'filter, opacity, transform'),
    onComplete: () => void ((el as HTMLElement).style.willChange = ''),
    onInterrupt: () => void ((el as HTMLElement).style.willChange = ''),
  });
  /** Caption tracking 0 → -.035em, written in .0025em steps (each step re-lays out the text). */
  const tracking = new Map<Element, { v: number; last: number }>();
  const trackIn = (el: HTMLElement, delay: number) => {
    let t = tracking.get(el);
    if (!t) tracking.set(el, (t = { v: 0, last: NaN }));
    gsap.killTweensOf(t);
    t.v = 0;
    t.last = 0;
    el.style.letterSpacing = '0em';
    const tt = t;
    gsap.to(tt, {
      v: -0.035,
      duration: 1.1,
      delay,
      ease: 'power2.out',
      onUpdate: () => {
        const q = Math.round(tt.v / 0.0025) * 0.0025;
        if (q !== tt.last) {
          tt.last = q;
          el.style.letterSpacing = q.toFixed(4) + 'em';
        }
      },
      onComplete: () => void (el.style.letterSpacing = '-0.035em'),
    });
  };

  /* ---------- playback rate ---------- */
  const showRate = () => {
    if (rateEl) rateEl.textContent = video.playbackRate.toFixed(1) + '×';
  };
  // The eased rate is applied in 0.1 steps (what the readout shows): each playbackRate write
  // costs the media pipeline work, and smaller steps are not visible.
  const rate = { v: 1 };
  const setRate = (v: number) => {
    const q = Math.round(v * 10) / 10;
    try {
      if (q !== video.playbackRate) video.playbackRate = q;
    } catch {}
  };
  const bump = (delta: number) => {
    const now = performance.now();
    const dt = Math.min(0.1, Math.max(0.016, (now - lastInput) / 1000));
    lastInput = now;
    const target = Math.min(4, 1 + Math.abs(delta) / dt / 900);
    rateTween?.kill();
    if (target > rate.v) {
      rate.v = target;
      setRate(target);
    }
    showRate();
    rateTween = gsap.to(rate, {
      v: 1,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => {
        setRate(rate.v);
        showRate();
      },
    });
  };

  /* ---------- captions ---------- */
  // Captions cross-dissolve: the outgoing one drifts up and softens; the incoming one starts once the
  // outgoing has mostly cleared and resolves blur 8px -> 0, y 12 -> 0, tracking 0 -> -.035em.
  const showBeat = (idx: number) => {
    const prev = current >= 0 ? beats[current] : undefined;
    if (prev) gsap.to(prev, { opacity: 0, y: -10, filter: 'blur(4px)', duration: 0.6, ease: 'power1.in', overwrite: true, ...layerDuring(prev) });
    current = idx;
    const next = idx >= 0 ? beats[idx] : undefined;
    if (next) {
      const delay = prev ? 0.4 : 0;
      gsap.fromTo(
        next,
        { opacity: 0, y: 12, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, delay, ease: 'power2.out', overwrite: true, ...layerDuring(next) },
      );
      const words = next.querySelector<HTMLElement>('[data-tv-film-beat-text]');
      if (words) trackIn(words, delay);
      if (live) live.textContent = FILM_BEATS[idx].text;
    }
  };
  // One ticker for the push-in and the beats.
  let lastF = -1;
  const tick = () => {
    if (phase !== 'locked') return;
    const d = video.duration;
    if (!Number.isFinite(d) || d <= 0) return;
    const f = Math.min(1, video.currentTime / d);
    if (f !== lastF) {
      lastF = f;
      gsap.set(video, { scale: 1 + PUSH_IN * f });
    }
    if (closing || !gateOpen) return;
    let idx = -1;
    FILM_BEATS.forEach((b, i) => {
      if (f >= b.at) idx = i;
    });
    if (idx !== current) showBeat(idx);
  };

  /* ---------- lock ---------- */
  const play = () => {
    video.muted = true;
    video.defaultMuted = true;
    video.play().catch((err: unknown) => {
      // Autoplay refused (low-power mode), no source, decode failure...: never hold the page on a
      // frozen poster. AbortError only means a later pause()/load() interrupted this play().
      if (phase === 'locked' && (err as { name?: string })?.name !== 'AbortError') release();
    });
  };
  const armCap = () => {
    clearTimeout(capTimer);
    const d = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : FALLBACK_DURATION_S;
    const left = (d + CAP_EXTRA_S + FADE_UP_AT) * 1000 - (performance.now() - engagedAt);
    capTimer = setTimeout(() => release(), Math.max(0, left));
  };
  const startClip = () => {
    if (phase !== 'locked') return;
    play();
    // Still not playable 3s in (blocked, offline, very slow): release instead of holding the frame.
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => {
      if (phase === 'locked' && !closing && video.readyState < 3) release();
    }, 3000);
  };

  /** The clip already failed (error, or NETWORK_NO_SOURCE): skip the story and leave the page alone. */
  const videoFailed = () => !!video.error || video.networkState === 3;

  /** Returns true when the lock engaged. `again` = the explicit "Play film" replay after a release. */
  const engage = (again = false): boolean => {
    if (phase === 'locked' || (phase === 'done' && !again)) return false;
    if (videoFailed()) {
      if (phase === 'idle') {
        phase = 'done';
        clearTimeout(autoTimer);
        removeInput();
      }
      return false;
    }
    const replayFocused = !!replay && replay.contains(document.activeElement);
    if (unlockPending) unlock(); // replay pressed during the ending (defensive; the button is hidden then)
    phase = 'locked';
    closing = false;
    gateOpen = false;
    current = -1;
    ambient = false;
    engagedAt = performance.now();
    clearTimeout(autoTimer);
    video.preload = 'auto'; // buffer the whole clip only now that it will play
    addInput(); // listeners are removed on release; re-arm them for a replay
    setBlocking(true);
    lenis?.scrollTo(0, { immediate: true, force: true });
    lenis?.stop();
    if (window.scrollY !== 0) window.scrollTo(0, 0);
    root.classList.add(NAV_HIDDEN);
    film.setAttribute('data-story', '');
    setInert(true);
    window.addEventListener('scroll', onScrollLocked);

    skip.hidden = false;
    // opacity (not autoAlpha) so a keyboard replay can move focus to Skip straight away
    gsap.fromTo(skip, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, delay: 1.2, ease: 'power2.out' });
    if (replay) {
      gsap.killTweensOf(replay);
      replay.hidden = true;
    }
    if (replayFocused) skip.focus({ preventScroll: true });

    // Reset the stage, then hold the clip on its first frame under black.
    video.pause();
    video.loop = false;
    rate.v = 1;
    try {
      video.currentTime = 0;
      video.playbackRate = 1;
    } catch {}
    showRate();
    lastF = -1;
    gsap.set(video, { scale: 1 });
    gsap.set(beats, { opacity: 0, y: 12, filter: 'blur(8px)' });
    if (text) gsap.set(text, { opacity: 0 });
    if (dim) gsap.set(dim, { opacity: 0 });
    if (titleCard) gsap.set(titleCard, { opacity: 0, filter: 'blur(6px)' });

    stageTl?.kill();
    openWin();
    stageTl = gsap
      .timeline()
      .to(copy, { y: -120, opacity: 0, duration: 0.7, ease: 'power2.in' }, 0)
      .to(
        win,
        {
          p: 1,
          duration: 1,
          ease: 'expo.inOut',
          onUpdate: applyWin,
          onComplete: clearWin, // full screen at 100% / 100%: follows resizes
        },
        0,
      )
      .to(black, { opacity: 1, duration: 0.5, ease: 'power1.in' }, 0.1)
      .to(story, { autoAlpha: 1, duration: 0.6, ease: 'power1.out' }, 0.6)
      .to(grain, { opacity: 0.06, duration: 0.6 }, 0.9)
      .add(startClip, FADE_UP_AT)
      .to(black, { opacity: 0, duration: 1.2, ease: 'power1.inOut' }, FADE_UP_AT);
    if (titleCard)
      stageTl
        .to(titleCard, { opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out', ...layerDuring(titleCard) }, TITLE_IN_AT)
        .to(titleCard, { opacity: 0, y: -8, duration: 0.6, ease: 'power1.in' }, TITLE_OUT_AT - 0.1)
        .set(titleCard, { y: 0 }, TITLE_OUT_AT + 0.6);
    stageTl.add(() => {
      gateOpen = true;
    }, TITLE_OUT_AT);

    armCap();
    gsap.ticker.add(tick);
    return true;
  };

  const onEnded = () => {
    if (phase !== 'locked' || closing) return;
    closing = true;
    showBeat(-1);
    if (live) live.textContent = '';
    stageTl?.kill();
    stageTl = gsap.timeline();
    if (dim) stageTl.to(dim, { opacity: 1, duration: 0.8, ease: 'power1.out' }, 0.1);
    if (text) stageTl.to(text, { opacity: 1, y: 0, duration: 0.3 }, 0.3);
    if (rule) stageTl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power2.inOut' }, 0.35);
    if (lines.length) stageTl.fromTo(lines, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out' }, 0.45);
    closeTimer = setTimeout(() => release(), CLOSING_MS);
  };

  /** Give the page back: scrolling, nav, focus order. Runs when the frame comes back from black. */
  function unlock() {
    unlockPending = false;
    swallowing(false);
    window.removeEventListener('scroll', onScrollLocked);
    root.classList.remove(NAV_HIDDEN);
    film.removeAttribute('data-story');
    setInert(false);
    lenis?.start();
    if (replay && phase === 'done' && ambient) {
      replay.hidden = false;
      if (skipHadFocus) replay.focus({ preventScroll: true });
    } else if (skipHadFocus) film.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    skipHadFocus = false;
  }

  function release(animate = true) {
    if (phase !== 'locked') return;
    phase = 'done';
    closing = false;
    clearTimeout(capTimer);
    clearTimeout(closeTimer);
    clearTimeout(stallTimer);
    gsap.ticker.remove(tick);
    removeInput();

    skipHadFocus = skip.contains(document.activeElement);
    // Keep focus on the page while Skip disappears; unlock() hands it to "Play film".
    if (skipHadFocus) film.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    skip.hidden = true;
    if (live) live.textContent = '';
    rateTween?.kill();
    rate.v = 1;
    try {
      video.playbackRate = 1;
    } catch {}
    showRate();
    if (!animate) {
      video.pause();
      unlock();
      return;
    }
    unlockPending = true;
    swallowing(true);

    // Ending: caption dissolves -> dip to black (.4s hold) -> card shrinks, and the
    // clip comes back as the muted ambient loop under "Play film".
    stageTl?.kill();
    const H = film.clientHeight;
    stageTl = gsap
      .timeline({ onComplete: () => ScrollTrigger.refresh() })
      .to(beats, { opacity: 0, filter: 'blur(4px)', duration: 0.5, ease: 'power1.in', overwrite: true }, 0)
      .to(black, { opacity: 1, duration: 0.35, ease: 'power1.in' }, 0.3)
      .add(() => {
        ambient = true;
        video.loop = true;
        try {
          if (video.ended) video.currentTime = 0;
        } catch {}
        gsap.set(video, { scale: 1 });
        if (mediaVisible) play();
        else video.pause();
        unlock();
      }, UNLOCK_AT)
      .to(story, { autoAlpha: 0, duration: 0.2 }, UNLOCK_AT)
      .to(grain, { opacity: 0, duration: 0.2 }, UNLOCK_AT)
      .to(
        win,
        {
          p: 0,
          duration: 1,
          ease: 'expo.inOut',
          onStart: () => {
            openWin();
            win.H = H;
          },
          onUpdate: applyWin,
          onComplete: () => {
            clearWin();
            gsap.set(media, { clearProps: 'width,height,bottom,borderRadius' });
          },
        },
        UNLOCK_AT + 0.05,
      )
      .to(black, { opacity: 0, duration: 0.8, ease: 'power1.out' }, UNLOCK_AT + 0.2)
      .to(copy, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', onComplete: () => gsap.set(copy, { clearProps: 'transform,opacity' }) }, UNLOCK_AT + 0.45);
    if (titleCard) stageTl.to(titleCard, { opacity: 0, duration: 0.3 }, 0);
    if (text) stageTl.to(text, { opacity: 0, duration: 0.5, ease: 'power1.in' }, 0);
    if (dim) stageTl.to(dim, { opacity: 0, duration: 0.5 }, 0.2);
    if (replay) stageTl.fromTo(replay, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, UNLOCK_AT + 0.9);
  }

  /* ---------- input ---------- */
  const atTop = () => window.scrollY <= 2;
  const isField = (t: EventTarget | null) =>
    t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  // Space activates buttons; on a link it would scroll natively, so it is swallowed like any scroll key.
  const isControl = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest('button, summary');

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey) return; // pinch / browser zoom
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    const delta = (Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * unit;
    if (phase === 'locked') {
      e.preventDefault();
      bump(delta);
    } else if (phase === 'idle' && atTop() && e.deltaY > 0) {
      if (engage()) {
        e.preventDefault();
        bump(delta);
      }
    }
  };
  const onTouchStart = (e: TouchEvent) => {
    touchY = e.touches.length === 1 ? e.touches[0].clientY : null;
    lastInput = performance.now();
  };
  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1 || touchY === null) return; // leave pinch-zoom alone
    const y = e.touches[0].clientY;
    const delta = touchY - y;
    touchY = y;
    if (phase === 'locked') {
      e.preventDefault();
      bump(delta);
    } else if (phase === 'idle' && atTop() && delta > 0) {
      if (engage()) e.preventDefault();
    }
  };
  const keyDelta = (key: string): number => {
    const page = window.innerHeight * 0.9;
    switch (key) {
      case 'ArrowDown':
      case 'ArrowUp':
        return 40;
      case 'PageDown':
      case 'PageUp':
      case ' ':
        return page;
      case 'Home':
      case 'End':
        return page * 2;
      default:
        return 0;
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey || isField(e.target)) return;
    if (phase === 'locked' && e.key === 'Escape') {
      e.preventDefault();
      release();
      return;
    }
    const d = keyDelta(e.key);
    if (!d || (e.key === ' ' && isControl(e.target))) return; // Space still presses buttons
    const down = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'End' || (e.key === ' ' && !e.shiftKey);
    if (phase === 'locked') {
      e.preventDefault();
      bump(d);
    } else if (phase === 'idle' && atTop() && down) {
      if (engage()) e.preventDefault();
    }
  };
  // Any route to the top (Tab focus, scrollbar drag, a smooth scroll) is held at 0 while locked.
  function onScrollLocked() {
    if ((phase === 'locked' || unlockPending) && window.scrollY !== 0) window.scrollTo(0, 0);
  }
  // Deep-linked visit: engage on first arrival back at the top.
  const onScrollIdle = () => {
    if (phase !== 'idle') return;
    setBlocking(atTop());
    if (!atTop()) away = true;
    else if (away) engage();
  };

  // Non-passive wheel/touchmove listeners make every scroll wait for the main thread, so they are
  // attached only while they can cancel something: while locked, and while idle at the very top
  // (where a downward scroll engages the story). Anywhere else on the page they are not attached.
  const opts: AddEventListenerOptions = { passive: false };
  let blocking = false;
  function setBlocking(on: boolean) {
    if (on === blocking) return;
    blocking = on;
    if (on) {
      window.addEventListener('wheel', onWheel, opts);
      window.addEventListener('touchmove', onTouchMove, opts);
    } else {
      window.removeEventListener('wheel', onWheel, opts);
      window.removeEventListener('touchmove', onTouchMove, opts);
    }
  }
  function addInput() {
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScrollIdle, { passive: true });
    setBlocking(phase === 'locked' || atTop());
  }
  function removeInput() {
    setBlocking(false);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('scroll', onScrollIdle);
  }
  // While the ending dips to black, input stays swallowed (Lenis is still stopped; this blocks touch).
  // Attached only for that window (release → unlock).
  const swallow = (e: Event) => {
    if (unlockPending && e.cancelable) e.preventDefault();
  };
  let swallowOn = false;
  function swallowing(on: boolean) {
    if (on === swallowOn) return;
    swallowOn = on;
    if (on) {
      window.addEventListener('wheel', swallow, opts);
      window.addEventListener('touchmove', swallow, opts);
    } else {
      window.removeEventListener('wheel', swallow, opts);
      window.removeEventListener('touchmove', swallow, opts);
    }
  }

  const onSkip = () => release();
  const onReplay = () => {
    engage(true);
  };
  // Pause the ambient loop while the card is offscreen.
  const io = new IntersectionObserver(([entry]) => {
    mediaVisible = entry.isIntersecting;
    if (!ambient || phase !== 'done') return;
    if (mediaVisible && !document.hidden) play();
    else video.pause();
  });
  io.observe(media);
  const onMeta = () => {
    if (phase === 'locked') armCap();
  };
  const onError = () => release();
  const onVisibility = () => {
    if (document.hidden || !video.paused) return;
    if ((phase === 'locked' && !closing && !video.ended && video.currentTime > 0) || (phase === 'done' && ambient && mediaVisible)) play();
  };

  // The film never engages under a page-transition shutter: scroll input and the auto-engage timer
  // start once the shutter opens (immediately on a full page load).
  let disposed = false;
  whenRevealed().then(() => {
    if (disposed) return;
    addInput();
    if (!away)
      autoTimer = setTimeout(() => {
        if (atTop()) engage();
        else away = true;
      }, AUTO_ENGAGE_MS);
  });
  skip.addEventListener('click', onSkip);
  replay?.addEventListener('click', onReplay);
  video.addEventListener('ended', onEnded);
  video.addEventListener('loadedmetadata', onMeta);
  video.addEventListener('error', onError);
  lastSource?.addEventListener('error', onError);
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    disposed = true;
    clearTimeout(autoTimer);
    clearTimeout(stallTimer);
    release(false); // navigating away mid-lock: give scrolling and the nav back
    if (unlockPending) unlock(); // navigating away during the ending
    removeInput();
    swallowing(false);
    window.removeEventListener('scroll', onScrollLocked);
    skip.removeEventListener('click', onSkip);
    replay?.removeEventListener('click', onReplay);
    io.disconnect();
    ambient = false;
    video.loop = false;
    video.pause();
    if (replay) replay.hidden = true;
    video.removeEventListener('ended', onEnded);
    video.removeEventListener('loadedmetadata', onMeta);
    video.removeEventListener('error', onError);
    lastSource?.removeEventListener('error', onError);
    document.removeEventListener('visibilitychange', onVisibility);
    gsap.ticker.remove(tick);
    rateTween?.kill();
    stageTl?.kill();
    clearWin();
    tracking.forEach((t) => gsap.killTweensOf(t));
    beats.forEach((b) => {
      b.style.willChange = '';
      const words = b.querySelector<HTMLElement>('[data-tv-film-beat-text]');
      if (words) words.style.letterSpacing = '';
    });
    if (titleCard) titleCard.style.willChange = '';
    skip.hidden = true;
    film.removeAttribute('data-story');
    beatList?.removeAttribute('aria-hidden');
    if (live) live.textContent = '';
    try {
      video.playbackRate = 1;
    } catch {}
    if (rateEl) rateEl.textContent = '1.0×';
  };
}
