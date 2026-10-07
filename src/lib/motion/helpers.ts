'use client';

import { gsap, ScrollTrigger } from './gsap';
import { isReduced, onRevert } from './state';

/**
 * Scoped motion helpers, ported 1:1 from the mockups' data-dc-script.
 * Each takes (scope, opts), must be called inside a useTvMotion setup (so the
 * tweens/ScrollTriggers are reverted on unmount), and is idempotent.
 * Under reduced motion every helper leaves its content fully visible.
 */

type Scope = HTMLElement;

const qa = <T extends Element = HTMLElement>(scope: ParentNode, sel: string) =>
  Array.from(scope.querySelectorAll<T>(sel) as NodeListOf<T>);

/** Elements pre-hidden by CSS (html.tv-motion) until their intro state is set. */
export const PREHIDDEN = '[data-tv-split], #top [data-tv-reveal]';

/** Make CSS-prehidden elements visible again (call after setting intro "from" states). */
export function showPrehidden(scope: Scope, selector: string = PREHIDDEN): void {
  qa(scope, selector).forEach((el) => {
    el.style.visibility = 'visible';
  });
}

/* ------------------------------------------------------------------ split */

export type SplitOptions = { selector?: string };

/**
 * Split `[data-tv-split]` headings into words:
 * <span (mask)><span data-tv-word style="transform:translateY(110%)">word</span></span>
 * The original child nodes are restored on revert.
 * Under reduced motion nothing is split.
 */
export function splitWords(scope: Scope, opts: SplitOptions = {}): HTMLElement[] {
  const sel = opts.selector ?? '[data-tv-split]';
  const heads = qa(scope, sel);
  if (isReduced()) {
    heads.forEach((h) => (h.style.visibility = 'visible'));
    return [];
  }
  heads.forEach((h) => {
    if (h.dataset.tvSplitDone) return;
    const original = Array.from(h.childNodes);
    const words = (h.textContent ?? '').trim().split(/\s+/).filter(Boolean);
    const frag = document.createDocumentFragment();
    words.forEach((w, i) => {
      const outer = document.createElement('span');
      outer.style.cssText =
        'display:inline-block;overflow:hidden;white-space:nowrap;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em';
      const inner = document.createElement('span');
      inner.setAttribute('data-tv-word', '');
      inner.style.cssText = 'display:inline-block;white-space:nowrap;transform:translateY(110%)';
      inner.textContent = w;
      outer.appendChild(inner);
      frag.appendChild(outer);
      if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    h.setAttribute('aria-label', words.join(' '));
    h.replaceChildren(frag);
    h.dataset.tvSplitDone = '1';
    h.style.visibility = 'visible';
    onRevert(() => {
      h.replaceChildren(...original);
      h.removeAttribute('aria-label');
      delete h.dataset.tvSplitDone;
    });
  });
  return qa(scope, `${sel} [data-tv-word]`);
}

/* ------------------------------------------------------------------ intro */

export type IntroOptions = {
  /** Delay before the words start (s). Default 0.1 */
  delay?: number;
  /** Word stagger. Default 0.04 (inner pages); Home uses 0.06 */
  stagger?: number;
  /** Extra elements to fade in with the #top reveals (selector, scoped) */
  also?: string;
};

/**
 * The inner-page intro from About/Quality/Portfolio/Contact:
 * words → y:0 (1.1s, stagger .04, power4.out) at 0.1s, then
 * `#top [data-tv-reveal]` from {y:20, opacity:0} (0.9s, stagger .1) at 0.3s.
 */
export function defaultIntro(scope: Scope, opts: IntroOptions = {}): gsap.core.Timeline | null {
  splitWords(scope);
  const reveals = qa(scope, `#top [data-tv-reveal]${opts.also ? `, ${opts.also}` : ''}`);
  if (isReduced()) {
    reveals.forEach((el) => (el.style.visibility = 'visible'));
    return null;
  }
  const words = qa(scope, '[data-tv-word]');
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  if (words.length) tl.to(words, { y: 0, duration: 1.1, stagger: opts.stagger ?? 0.04 }, opts.delay ?? 0.1);
  if (reveals.length)
    tl.fromTo(reveals, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.1 }, (opts.delay ?? 0.1) + 0.2);
  showPrehidden(scope);
  return tl;
}

/* ------------------------------------------------------------------ reveal */

export type RevealOptions = { selector?: string; y?: number; start?: string };

/** `[data-tv-reveal]` outside `#top`: from {y:36, opacity:0}, 1s power3.out, at `top 88%`. */
export function initReveal(scope: Scope, opts: RevealOptions = {}): void {
  if (isReduced()) return;
  qa(scope, opts.selector ?? '[data-tv-reveal]')
    .filter((el) => !el.closest('#top') && !el.dataset.tvRevealDone)
    .forEach((el) => {
      el.dataset.tvRevealDone = '1';
      onRevert(() => delete el.dataset.tvRevealDone);
      gsap.fromTo(
        el,
        { y: opts.y ?? 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: opts.start ?? 'top 88%' } },
      );
    });
}

/* ------------------------------------------------------------------ words */

const LINE_MASK =
  'display:block;overflow:hidden;padding-bottom:.12em;margin-bottom:-.12em';
const LINE_INNER = 'display:block;white-space:nowrap;will-change:transform';

/**
 * Split a paragraph's text into rendered lines: words are laid out as inline spans,
 * grouped by `offsetTop`, then each line is rebuilt as
 * <span (mask, overflow hidden)><span data-tv-line>words…</span></span>.
 * Inline markup inside the paragraph is flattened to text (the original nodes are
 * restored on revert). Returns the inner line spans.
 */
function splitLines(p: HTMLElement, text: string): HTMLElement[] {
  const words = text.split(' ').filter(Boolean);
  const spans = words.map((w) => {
    const s = document.createElement('span');
    s.textContent = w;
    return s;
  });
  const measure = document.createDocumentFragment();
  spans.forEach((s, i) => {
    measure.appendChild(s);
    if (i < spans.length - 1) measure.appendChild(document.createTextNode(' '));
  });
  p.replaceChildren(measure);

  const lines: string[][] = [];
  let top = -Infinity;
  spans.forEach((s, i) => {
    const t = s.offsetTop;
    if (t > top + 2) {
      lines.push([]);
      top = t;
    }
    lines[lines.length - 1].push(words[i]);
  });

  const frag = document.createDocumentFragment();
  const inners = lines.map((ws, i) => {
    const mask = document.createElement('span');
    mask.style.cssText = LINE_MASK;
    const inner = document.createElement('span');
    inner.setAttribute('data-tv-line', '');
    inner.style.cssText = LINE_INNER;
    // Trailing space keeps words separated for copy/paste and screen readers.
    inner.textContent = i < lines.length - 1 ? ws.join(' ') + ' ' : ws.join(' ');
    mask.appendChild(inner);
    frag.appendChild(mask);
    return inner;
  });
  p.replaceChildren(frag);
  return inners;
}

/**
 * `[data-tv-words]`: masked line reveal. The paragraph is split into its rendered
 * lines; each line rises from `yPercent: 100` with opacity 0 → 1 inside an
 * overflow-hidden mask (stagger .08, .9s, power3.out) when the paragraph's top
 * reaches 85% of the viewport. Plays once, not scrubbed; text ends fully opaque.
 * Re-splits on resize (debounced, only when the paragraph width changed); a
 * paragraph that has already played re-splits at rest. Reduced motion: untouched.
 */
export function initWords(scope: Scope, opts: { selector?: string } = {}): void {
  if (isReduced()) return;
  qa(scope, opts.selector ?? '[data-tv-words]').forEach((p) => {
    if (p.dataset.tvWordsDone) return;
    const original = Array.from(p.childNodes);
    const text = (p.textContent ?? '').trim().replace(/\s+/g, ' ');
    if (!text) return;
    p.dataset.tvWordsDone = '1';

    let played = false;
    let tween: gsap.core.Tween | null = null;
    let width = p.clientWidth;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const kill = () => {
      tween?.scrollTrigger?.kill();
      tween?.kill();
      tween = null;
    };
    const build = () => {
      kill();
      const lines = splitLines(p, text);
      if (played) return;
      tween = gsap.fromTo(
        lines,
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.08,
          ease: 'power3.out',
          onStart: () => {
            played = true;
          },
          scrollTrigger: { trigger: p, start: 'top 85%', once: true },
        },
      );
    };
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // Measure the unsplit width: line masks are blocks, so the paragraph keeps its box.
        const w = p.clientWidth;
        if (w === width) return;
        width = w;
        build();
      }, 200);
    };

    build();
    window.addEventListener('resize', onResize);
    onRevert(() => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
      kill();
      p.replaceChildren(...original);
      delete p.dataset.tvWordsDone;
    });
  });
}

/* ------------------------------------------------------------------ parallax */

/** `[data-tv-parallax="0.1"]`: yPercent −amt/2 → +amt/2 (amt = value×100), scrubbed against the parent. */
export function initParallax(scope: Scope, opts: { selector?: string } = {}): void {
  if (isReduced()) return;
  qa(scope, opts.selector ?? '[data-tv-parallax]').forEach((img) => {
    const amt = parseFloat(img.dataset.tvParallax ?? '0.1') * 100;
    gsap.fromTo(
      img,
      { yPercent: -amt / 2 },
      {
        yPercent: amt / 2,
        ease: 'none',
        scrollTrigger: { trigger: img.parentElement ?? img, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

/* ------------------------------------------------------------------ counters */

/**
 * `[data-tv-count="55"]`: render the final number in the HTML; this counts 0 → N
 * (1.8s, power2.out) at `top 85%`. Reduced motion: the final value stays.
 * No flash: a counter already on screen when setup runs keeps its final value
 * (it has been painted); the others are set to 0 while still off screen.
 */
export function initCounters(scope: Scope, opts: { selector?: string } = {}): void {
  if (isReduced()) return;
  qa(scope, opts.selector ?? '[data-tv-count]').forEach((el) => {
    const end = Number(el.dataset.tvCount);
    if (!Number.isFinite(end)) return;
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < window.innerHeight) return; // above the fold: leave the painted value
    const o = { v: 0 };
    const finalText = el.textContent;
    el.textContent = '0';
    onRevert(() => {
      el.textContent = finalText;
    });
    gsap.fromTo(
      o,
      { v: 0 },
      {
        v: end,
        immediateRender: false,
        duration: 1.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
        onUpdate: () => {
          el.textContent = String(Math.round(o.v));
        },
        onComplete: () => {
          el.textContent = finalText;
        },
      },
    );
  });
}

/* ------------------------------------------------------------------ page core */

export type PageCoreOptions = {
  /** Run defaultIntro (word split + #top reveals). Default true. Pass false when the page has a custom intro. */
  intro?: boolean | IntroOptions;
  reveal?: RevealOptions | false;
  words?: boolean;
  parallax?: boolean;
  counters?: boolean;
};

/** Convenience: intro + reveal + words + parallax + counters for one scope. */
export function initPageCore(scope: Scope, opts: PageCoreOptions = {}): void {
  const { intro = true, reveal = {}, words = true, parallax = true, counters = true } = opts;
  if (intro) defaultIntro(scope, typeof intro === 'object' ? intro : {});
  if (reveal !== false) initReveal(scope, reveal);
  if (words) initWords(scope);
  if (parallax) initParallax(scope);
  if (counters) initCounters(scope);
}

/** Debounced global ScrollTrigger.refresh (shared by provider and pages). */
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
export function scheduleRefresh(delay = 120): void {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), delay);
}

/**
 * Layout tokens resolved to pixels for motion code. `--tv-content-w` is built from a
 * clamp() and depends on the containing box, so it is measured with a probe appended
 * to `box` (default `document.body`) rather than parsed. Call it from function-based
 * tween values with `invalidateOnRefresh` so it recomputes on resize.
 */
export function layoutMetrics(box: HTMLElement = document.body): { content: number } {
  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText =
    'position:static;display:block;height:0;margin:0;padding:0;border:0;visibility:hidden;width:var(--tv-content-w)';
  box.appendChild(probe);
  const content = probe.getBoundingClientRect().width;
  probe.remove();
  return { content };
}
