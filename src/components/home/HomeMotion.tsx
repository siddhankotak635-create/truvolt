'use client';

import { useRef, type ReactNode } from 'react';
import {
  afterReveal,
  BP,
  initPageCore,
  isRevealPending,
  layoutMetrics,
  motionState,
  REVEAL_OFFSET,
  scheduleRefresh,
  showPrehidden,
  splitWords,
  useTvMotion,
} from '@/lib/motion';
import { STAGE_CAPTIONS } from './captions';
import { LOADED_CLASS, LOADED_KEY } from './Preloader';

/**
 * All Home page motion, ported from the data-dc-script of Truvolt Home.dc.html:
 * preloader + custom hero intro, pinned hero, engineering stage, client rails,
 * capability bars, range scrub, process timeline and bento spotlight.
 * (Footprint map wiring lives in Footprint.tsx; it is not motion.)
 */
export function HomeMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useTvMotion(ref, ({ gsap, ScrollTrigger: ST, q, mm, scope, reduced, fine, lenis }) => {
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
      el.addEventListener(type, fn);
      cleanups.push(() => el.removeEventListener(type, fn));
    };
    const onWin = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void) => {
      window.addEventListener(type, fn);
      cleanups.push(() => window.removeEventListener(type, fn));
    };
    const one = <T extends HTMLElement = HTMLElement>(sel: string) => q<T>(sel)[0] as T | undefined;
    const markLoaded = () => {
      try {
        sessionStorage.setItem(LOADED_KEY, '1');
      } catch {
        /* ignore */
      }
      document.documentElement.classList.add(LOADED_CLASS);
    };

    // Reveals use y:40 on Home; the hero intro is custom (below).
    initPageCore(scope, { intro: false, reveal: { y: 40 } });

    /* ------------------------------------------------ range: card size budget (all modes)
     * Desktop cards are sized so the whole panel fits in 100svh. --range-chrome is the
     * panel height minus the card height: the head (whose title may wrap) plus the track's
     * vertical padding. Measured, not guessed, and kept current as the head reflows. */
    const rangePanel = one('[data-tv-hscroll-panel]');
    const rangeHead = one('[data-tv-hscroll-head]');
    const rangeTrack = one('[data-tv-hscroll-track]');
    if (rangePanel && rangeHead && rangeTrack) {
      let last = '';
      const setChrome = () => {
        const cs = getComputedStyle(rangeTrack);
        const v = Math.ceil(rangeHead.offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)) + 'px';
        if (v === last) return;
        last = v;
        rangePanel.style.setProperty('--range-chrome', v);
        scheduleRefresh();
      };
      setChrome();
      const ro = new ResizeObserver(setChrome);
      ro.observe(rangeHead);
      cleanups.push(() => {
        ro.disconnect();
        rangePanel.style.removeProperty('--range-chrome');
      });
    }

    /* ------------------------------------------------ process: three-phase braid geometry (shared)
     * One backbone x(y) sweeps behind the photos and through every node: between nodes k and
     * k+1 it swings out behind photo k, crosses the panel in the gap, swings behind photo k+1
     * and returns into node k+1 with a vertical tangent. Its swing is the widest that keeps
     * the braid clear of every text block (measured). Three phase conductors weave around it
     * along its normal, 120° apart, with an envelope that is 0 at each node, so they converge
     * where the unit is transformed and fan out again. Everything is sampled per backbone
     * index, so drawn lengths, the tip and node arrivals are exact lookups (no per-frame
     * getPointAtLength). Layout boxes come from offsets, so reveal transforms do not skew them. */
    const tlWrap = one('[data-tv-tl-step]')?.parentElement?.parentElement;
    const svgEl = <T extends Element>(sel: string) => one(sel) as unknown as T | undefined;
    const svg = svgEl<SVGSVGElement>('[data-tv-tl-svg]');
    /** Overlay with the moving parts (current pulses, arrival surges) on its own layer. */
    const svgFx = svgEl<SVGSVGElement>('[data-tv-tl-fx]');
    /** Clip rect: pulses only show on the drawn part of the route (top of the timeline → drawn tip). */
    const drawnClip = svgEl<SVGRectElement>('[data-tv-tl-cliprect]');
    const track = svgEl<SVGPathElement>('[data-tv-tl-track]');
    const ticks = svgEl<SVGPathElement>('[data-tv-tl-ticks]');
    const glow = svgEl<SVGPathElement>('[data-tv-tl-glow]');
    const phaseEls = q('[data-tv-tl-phase]') as unknown as SVGPathElement[];
    const pulseEls = q('[data-tv-tl-pulse]') as unknown as SVGPathElement[];
    const surgeEls = q('[data-tv-tl-surge]') as unknown as SVGPathElement[];
    const nodes = q('[data-tv-tl-node]');
    const chip = one('[data-tv-tl-chip]');
    const chipStage = one('[data-tv-tl-chip-stage]');
    const chipKv = one('[data-tv-tl-chip-kv]');
    const STAGES: [string, number][] = [
      ['Enquiry', 0],
      ['Design', 11],
      ['Build', 33],
      ['Energised', 66],
    ];
    /** Main conductor hugs the backbone; the two thin phases weave wider; tips trail a little. */
    const PHASES = [
      { amp: 0.42, ph: 0, lag: 0 },
      { amp: 1, ph: (2 * Math.PI) / 3, lag: 34 },
      { amp: 1, ph: (4 * Math.PI) / 3, lag: 68 },
    ];
    type Box = { l: number; t: number; r: number; b: number };
    type Line = { lens: number[]; scale: number; total: number };
    type Wave = {
      ys: number[];
      xs: number[];
      env: number[];
      bb: Line;
      lines: Line[];
      nodeYs: number[];
      nodeIdx: number[];
      endY: number;
      cx: number;
      media: Box[];
      desktop: boolean;
    };
    /** Normalised lobe: 0 at t=0 and t=1 (zero slope), +1 near t=.3, -1 near t=.7. */
    const lobe = (t: number) => {
      const s = Math.sin(Math.PI * t);
      return (s * s * Math.cos(Math.PI * t)) / 0.3849;
    };
    /** Layout box of `el` in timeline coordinates (offsets ignore transforms). */
    const boxIn = (el: HTMLElement): Box => {
      let l = 0;
      let t = 0;
      let n: HTMLElement | null = el;
      while (n && n !== tlWrap) {
        l += n.offsetLeft;
        t += n.offsetTop;
        n = n.offsetParent as HTMLElement | null;
      }
      return { l, t, r: l + el.offsetWidth, b: t + el.offsetHeight };
    };
    /** Index i with ys[i] <= y < ys[i+1] (ys strictly increasing). */
    const seek = (ys: number[], y: number) => {
      let lo = 0;
      let hi = ys.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (ys[mid] <= y) lo = mid;
        else hi = mid;
      }
      return lo;
    };
    const polyline = (xs: number[], ys: number[]): { d: string; lens: number[] } => {
      const lens: number[] = [0];
      let d = 'M' + xs[0].toFixed(1) + ',' + ys[0].toFixed(1);
      for (let i = 1; i < xs.length; i++) {
        lens.push(lens[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]));
        d += 'L' + xs[i].toFixed(1) + ',' + ys[i].toFixed(1);
      }
      return { d, lens };
    };
    const asLine = (el: SVGPathElement, d: string, lens: number[], dash = true): Line => {
      el.setAttribute('d', d);
      const total = el.getTotalLength();
      if (dash) el.style.strokeDasharray = total + ' ' + total;
      return { lens, scale: total / (lens[lens.length - 1] || 1), total };
    };
    const buildWave = (desktop: boolean): Wave | null => {
      if (!tlWrap || !svg || !track || !glow || phaseEls.length < 3 || !nodes.length) return null;
      const W = tlWrap.clientWidth;
      const H = tlWrap.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svgFx?.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const nb = nodes.map(boxIn);
      const nodeYs = nb.map((r) => (r.t + r.b) / 2);
      const cx = desktop ? W / 2 : (nb[0].l + nb[0].r) / 2;
      const media = q('[data-tv-tl-media]').map(boxIn);
      const texts = q('[data-tv-tl-text]').map(boxIn);
      const W0 = desktop ? 17 : 6;
      const side = (k: number) => (k % 2 === 0 ? 1 : -1);
      const knots = [0, ...nodeYs];
      const endY = nodeYs[nodeYs.length - 1];
      const xAt = (A: number, y: number) => {
        let j = 0;
        while (j < knots.length - 2 && y > knots[j + 1]) j++;
        if (j === 0) return cx; // lead-in: straight down into node 01
        const y0 = knots[j];
        const y1 = knots[j + 1];
        return cx + side(j - 1) * A * lobe(y1 > y0 ? (y - y0) / (y1 - y0) : 1);
      };
      // Route: the widest swing that keeps the braid clear of every text block.
      let A = desktop ? Math.min(W * 0.36, W / 2 - W0 - 28) : Math.max(4, Math.min(14, cx - W0 - 8));
      if (desktop) {
        const pad = W0 + 22;
        const hits = (a: number) => {
          for (let y = 0; y < endY; y += 6) {
            const x = xAt(a, y);
            for (const r of texts) if (x > r.l - pad && x < r.r + pad && y > r.t - pad && y < r.b + pad) return true;
          }
          return false;
        };
        while (A > W * 0.1 && hits(A)) A *= 0.95;
      }
      const ys: number[] = [];
      const xs: number[] = [];
      for (let y = 0; y < endY; y += 3) {
        ys.push(y);
        xs.push(xAt(A, y));
      }
      ys.push(endY);
      xs.push(cx);
      const n = ys.length;
      const back = polyline(xs, ys);
      const nodeIdx = nodeYs.map((y) => Math.min(n - 1, seek(ys, y + 0.01)));
      const kIdx = [0, ...nodeIdx];
      // Envelope per segment (0 at the top and at every node), by arc length.
      const env: number[] = new Array(n).fill(0);
      for (let j = 0; j < kIdx.length - 1; j++) {
        const s0 = back.lens[kIdx[j]];
        const s1 = back.lens[kIdx[j + 1]];
        for (let i = kIdx[j]; i <= kIdx[j + 1]; i++) env[i] = Math.sin((Math.PI * (back.lens[i] - s0)) / (s1 - s0 || 1));
      }
      const lam = desktop ? 300 : 140;
      const lines = PHASES.map((p, pi) => {
        const px: number[] = [];
        const py: number[] = [];
        for (let i = 0; i < n; i++) {
          const a = Math.max(0, i - 1);
          const b = Math.min(n - 1, i + 1);
          let tx = xs[b] - xs[a];
          let ty = ys[b] - ys[a];
          const tl = Math.hypot(tx, ty) || 1;
          tx /= tl;
          ty /= tl;
          const o = W0 * p.amp * Math.pow(env[i], 0.65) * Math.sin((2 * Math.PI * back.lens[i]) / lam + p.ph);
          px.push(xs[i] - ty * o);
          py.push(ys[i] + tx * o);
        }
        const pl = polyline(px, py);
        if (pulseEls[pi]) pulseEls[pi].setAttribute('d', pl.d);
        if (surgeEls[pi]) surgeEls[pi].setAttribute('d', pl.d);
        return asLine(phaseEls[pi], pl.d, pl.lens);
      });
      track.setAttribute('d', back.d);
      const bb = asLine(glow, back.d, back.lens);
      // Insulator marks: short paired ticks either side of the route, every 46px.
      if (ticks) {
        let d = '';
        const gap = desktop ? 46 : 34;
        const r0 = W0 + 9;
        const r1 = W0 + (desktop ? 15 : 11);
        let next = gap;
        for (let i = 1; i < n - 1; i++) {
          if (back.lens[i] < next) continue;
          next += gap;
          if (nodeYs.some((ny) => Math.abs(ys[i] - ny) < 44)) continue;
          let tx = xs[i + 1] - xs[i - 1];
          let ty = ys[i + 1] - ys[i - 1];
          const tl = Math.hypot(tx, ty) || 1;
          tx /= tl;
          ty /= tl;
          for (const sg of [1, -1]) {
            d += 'M' + (xs[i] - ty * r0 * sg).toFixed(1) + ',' + (ys[i] + tx * r0 * sg).toFixed(1);
            d += 'L' + (xs[i] - ty * r1 * sg).toFixed(1) + ',' + (ys[i] + tx * r1 * sg).toFixed(1);
          }
        }
        ticks.setAttribute('d', d);
      }
      return { ys, xs, env, bb, lines, nodeYs, nodeIdx, endY, cx, media, desktop };
    };
    /** Draw the braid down to backbone y; returns the backbone tip. */
    const drawTo = (wave: Wave, y: number) => {
      const at = (yy: number) => {
        const c = Math.max(0, Math.min(wave.endY, yy));
        const i = seek(wave.ys, c);
        const j = Math.min(i + 1, wave.ys.length - 1);
        return { i, j, f: j > i ? (c - wave.ys[i]) / (wave.ys[j] - wave.ys[i]) : 0 };
      };
      const lenAt = (ln: Line, k: { i: number; j: number; f: number }) => (ln.lens[k.i] + (ln.lens[k.j] - ln.lens[k.i]) * k.f) * ln.scale;
      const set = (el: SVGPathElement, ln: Line, k: { i: number; j: number; f: number }) => {
        const L = lenAt(ln, k);
        el.style.strokeDashoffset = String(ln.total - L);
        // A zero-length dash still paints its round cap: hide until it has length.
        el.style.opacity = L > 0.5 ? '1' : '0';
      };
      const kb = at(y);
      // Trailing phases lag by less near nodes, so all three tips meet at each node.
      const envY = wave.env[kb.i];
      PHASES.forEach((p, pi) => set(phaseEls[pi], wave.lines[pi], p.lag ? at(y - p.lag * envY) : kb));
      if (glow) set(glow, wave.bb, kb);
      // Drawn part for the pulses: everything above the trailing phase's tip (the route only ever
      // moves down), plus the round cap the old stroked mask had past its end.
      if (drawnClip) {
        const k = at(y - PHASES[2].lag * envY);
        const L = lenAt(wave.bb, k);
        const cy = wave.ys[k.i] + (wave.ys[k.j] - wave.ys[k.i]) * k.f;
        drawnClip.setAttribute('height', L > 0.5 ? String((cy + CLIP_TOP + (wave.desktop ? 32 : 15)).toFixed(1)) : '0');
      }
      return { x: wave.xs[kb.i] + (wave.xs[kb.j] - wave.xs[kb.i]) * kb.f, y: Math.max(0, Math.min(wave.endY, y)) };
    };
    const CLIP_TOP = 400; // the clip rect starts 400px above the timeline (Process.tsx)
    const clearWave = () => {
      [...phaseEls, glow].forEach((el) => {
        if (!el) return;
        el.style.strokeDasharray = '';
        el.style.strokeDashoffset = '';
        el.style.opacity = '';
      });
      drawnClip?.setAttribute('height', '100000'); // static / reduced: the whole route is drawn
    };
    const showStage = (k: number) => {
      if (chipStage) chipStage.textContent = STAGES[k][0];
      if (chipKv) chipKv.textContent = String(STAGES[k][1]);
    };

    /* ------------------------------------------------ reduced motion: final states only */
    if (reduced) {
      showPrehidden(scope);
      const media = one('[data-tv-hero-media]');
      if (media) media.style.visibility = 'visible';
      // Static, fully drawn braid; every node lit; readout at the final stage; no head or
      // pulses (CSS hides them).
      const draw = () => {
        buildWave(window.matchMedia(BP.desktop).matches);
        clearWave();
        nodes.forEach((n) => n.setAttribute('data-active', ''));
        showStage(STAGES.length - 1);
      };
      cleanups.push(() => {
        nodes.forEach((n) => n.removeAttribute('data-active'));
        showStage(0);
      });
      draw();
      let t: ReturnType<typeof setTimeout>;
      onWin('resize', () => {
        clearTimeout(t);
        t = setTimeout(draw, 150);
      });
      onWin('load', draw);
      return () => cleanups.forEach((fn) => fn());
    }

    /* ------------------------------------------------ preloader + hero intro */
    const loader = one('[data-tv-loader]');
    const num = one('[data-tv-loader-num]');
    const heroMedia = one('[data-tv-hero-media]');
    let showLoader = false;
    try {
      showLoader = !!loader && !sessionStorage.getItem(LOADED_KEY);
    } catch {
      showLoader = !!loader;
    }
    // Arriving through a page transition: the shutter has already played the loader's part.
    const underShutter = isRevealPending();
    if (underShutter) {
      if (showLoader) markLoaded();
      showLoader = false;
    }
    // Covered (preloader or shutter): nobody sees the "from" states being applied, so the intro
    // plays exactly as designed. Otherwise the server HTML is already on screen (visible first):
    // the headline only slides up when fonts were ready within the setup cap, and the hero copy
    // and media rise from the offsets CSS painted them at, without hiding them.
    const covered = (showLoader && !!loader && !!num) || underShutter;
    const words = covered || motionState.fontsReady ? splitWords(scope) : [];
    const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
    if (showLoader && loader && num) {
      loader.style.animation = 'none'; // cancel the CSS no-JS fallback
      const o = { v: 0 };
      intro
        .to(o, { v: 66, duration: 1.5, ease: 'power2.inOut', onUpdate: () => void (num.textContent = String(Math.round(o.v))) })
        .to(
          loader,
          {
            yPercent: -100,
            duration: 1,
            ease: 'expo.inOut',
            onComplete: () => {
              loader.style.display = 'none';
              markLoaded();
            },
          },
          '+=0.15',
        );
      if (lenis) {
        lenis.stop();
        intro.add(() => lenis.start(), '-=0.6');
        cleanups.push(() => lenis.start());
      }
    } else {
      showLoader = false;
      if (loader) loader.style.display = 'none';
    }
    if (words.length) intro.to(words, { y: 0, duration: 1.1, stagger: 0.06 }, showLoader ? '-=0.55' : 0.1);
    const heroReveals = q('#top [data-tv-reveal]');
    if (heroReveals.length) {
      const at = words.length ? '-=0.8' : 0.1;
      if (covered) intro.fromTo(heroReveals, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.1 }, at);
      else intro.fromTo(heroReveals, { y: REVEAL_OFFSET }, { y: 0, duration: 0.9, stagger: 0.1 }, at);
    }
    if (heroMedia) {
      heroMedia.style.animation = 'none'; // cancel the CSS no-JS fallback (Hero.module.css)
      if (covered) intro.fromTo(heroMedia, { y: 120, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.4, ease: 'expo.out' }, '-=1');
      else intro.fromTo(heroMedia, { y: 120 }, { y: 0, duration: 1.4, ease: 'expo.out' }, '-=1');
    }
    showPrehidden(scope);
    afterReveal(intro); // after a page transition the intro waits for the shutter to open

    /* ------------------------------------------------ hero pinned: media expands, copy fades, statement appears
     * The card grows from the content-width strip (26svh, 5vh below the fold, radius 28) to the
     * full screen. Instead of tweening its width/height/bottom/radius (layout + a re-raster of the
     * filtered Ken Burns photo every frame), the card is laid out at its full-screen size once and
     * a clip-path window is animated over it. Its children are mapped onto that window with the
     * independent `translate`/`scale` properties (which compose with the Ken Burns `transform`):
     * the photo gets the object-fit: cover scale it would have at the window's size, the shade is
     * stretched onto the window, and the caption is anchored to the window's corners. What is on
     * screen is the same box, frame for frame; the browser only re-clips. */
    const hero = one('[data-tv-hero]');
    if (hero && heroMedia) {
      const heroImg = heroMedia.querySelector<HTMLImageElement>('img');
      const heroShade = heroMedia.querySelector<HTMLElement>(':scope > div:not([data-tv-hero-caption])');
      const heroCaption = one('[data-tv-hero-caption]');
      const imgStyle = heroImg?.getAttribute('style') ?? null; // next/image's inline fill box
      const g = { W: 0, SVH: 0, VH: 0, content: 0, iw: 1280, ih: 853, cap: { l: 28, r: 28, b: 24 }, kb: -1 };
      const probe = (h: string) => {
        const el = document.createElement('div');
        el.style.cssText = `position:absolute;left:0;top:0;width:0;height:${h};visibility:hidden;pointer-events:none`;
        hero.appendChild(el);
        const v = el.getBoundingClientRect().height;
        el.remove();
        return v;
      };
      const measure = () => {
        g.W = document.documentElement.clientWidth;
        g.SVH = probe('100svh');
        g.VH = probe('100vh');
        g.content = layoutMetrics().content;
        if (heroImg?.naturalWidth) {
          g.iw = heroImg.naturalWidth;
          g.ih = heroImg.naturalHeight;
        }
        // Lay the photo out at its full-frame cover size (centred), so object-fit never crops
        // inside the element and scaling it shows exactly the window's cover crop.
        if (heroImg) {
          const c = Math.max(g.W / g.iw, g.SVH / g.ih);
          const iw = g.iw * c;
          const ih = g.ih * c;
          Object.assign(heroImg.style, {
            width: iw + 'px',
            height: ih + 'px',
            left: (g.W - iw) / 2 + 'px',
            top: (g.SVH - ih) / 2 + 'px',
            maxWidth: 'none', // global img/video max-width: 100% would cap it
            right: 'auto',
            bottom: 'auto',
          });
        }
        if (heroCaption) {
          heroCaption.style.left = heroCaption.style.right = heroCaption.style.bottom = '';
          const cs = getComputedStyle(heroCaption);
          g.cap = { l: parseFloat(cs.left) || 0, r: parseFloat(cs.right) || 0, b: parseFloat(cs.bottom) || 0 };
        }
        g.kb = -1;
      };
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const view = { p: 0 };
      /** Paint progress p (0 = strip, 1 = full screen) of the original width/height/bottom/radius tween. */
      const apply = (p: number) => {
        const { W, SVH } = g;
        const w = lerp(g.content, W, p);
        const h = lerp(0.26 * SVH, SVH, p);
        const b = lerp(-0.05 * g.VH, 0, p); // the box's bottom offset (negative: below the fold)
        const r = lerp(28, 0, p);
        const side = (W - w) / 2;
        const top = SVH - h - b;
        // The bottom corners sit below the hero's clipped edge throughout (|b| > r), so the
        // window is cut at the element's bottom with only the top corners rounded.
        heroMedia.style.clipPath = `inset(${top.toFixed(2)}px ${side.toFixed(2)}px ${Math.max(0, b).toFixed(2)}px round ${r.toFixed(2)}px ${r.toFixed(2)}px 0 0)`;
        const ty = top + h / 2 - SVH / 2;
        if (heroImg) {
          const s = Math.max(w / g.iw, h / g.ih) / Math.max(W / g.iw, SVH / g.ih); // window cover / frame cover
          heroImg.style.translate = `0px ${ty.toFixed(2)}px`;
          heroImg.style.scale = s.toFixed(5);
          // Ken Burns drifts by a % of the photo's own height: keep it a % of the window's.
          const kb = h / s / 100;
          if (Math.abs(kb - g.kb) > 0.01) {
            g.kb = kb;
            heroImg.style.setProperty('--kb-u', kb.toFixed(3) + 'px');
          }
        }
        if (heroShade) {
          heroShade.style.translate = `0px ${ty.toFixed(2)}px`;
          heroShade.style.scale = `${(w / W).toFixed(5)} ${(h / SVH).toFixed(5)}`;
        }
        // The caption only shows from p = .5 (it is transparent before), anchored to the window.
        if (heroCaption && p >= 0.45) {
          heroCaption.style.left = (side + g.cap.l).toFixed(2) + 'px';
          heroCaption.style.right = (side + g.cap.r).toFixed(2) + 'px';
          heroCaption.style.bottom = (b + g.cap.b).toFixed(2) + 'px';
        }
      };
      measure();
      // The card's full-screen layout (the tween's end state); the window starts as the strip.
      gsap.set(heroMedia, { width: '100%', height: '100%', bottom: 0, borderRadius: 0 });
      apply(0);
      const onImg = () => {
        measure();
        apply(view.p);
      };
      if (heroImg && !heroImg.complete) on(heroImg, 'load', onImg);
      cleanups.push(() => {
        heroMedia.style.clipPath = '';
        if (heroImg) {
          if (imgStyle === null) heroImg.removeAttribute('style');
          else heroImg.setAttribute('style', imgStyle);
        }
        if (heroShade) heroShade.style.translate = heroShade.style.scale = '';
        if (heroCaption) heroCaption.style.left = heroCaption.style.right = heroCaption.style.bottom = '';
      });
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: '+=160%',
          pin: true,
          scrub: 0.25,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: () => {
            measure();
            apply(view.p);
          },
        },
      });
      heroTl
        .to(one('[data-tv-hero-copy]') ?? [], { y: -120, opacity: 0, ease: 'none', duration: 0.5 }, 0)
        .fromTo(view, { p: 0 }, { p: 1, ease: 'none', duration: 1, onUpdate: () => apply(view.p) }, 0)
        .to(one('[data-tv-hero-caption]') ?? [], { opacity: 1, duration: 0.2 }, 0.5)
        .fromTo(one('[data-tv-hero-statement]') ?? [], { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4 }, 0.75);
    }

    /* ------------------------------------------------ engineering: image swaps in place while scrolling (desktop) */
    mm.add(BP.desktop, () => {
      const stageWrap = one('[data-tv-stages]');
      const stages = q('[data-tv-stage]');
      const chips = q('[data-tv-stage-chip]');
      const cap = one('[data-tv-stage-caption]');
      const sbar = one('[data-tv-stage-bar]');
      if (!stageWrap || !stages.length) return;
      const setChips = (idx: number) => chips.forEach((c, i) => c.toggleAttribute('data-active', i === idx));
      let cur = 0;
      ST.create({
        trigger: stageWrap,
        start: 'top 120px',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          // full-width fill slid in from the left inside the clipped track (no layout per frame)
          if (sbar) sbar.style.transform = `translateX(${((self.progress - 1) * 100).toFixed(3)}%)`;
          const idx = Math.min(stages.length - 1, Math.floor(self.progress * stages.length));
          if (idx !== cur) {
            cur = idx;
            stages.forEach((im, i) =>
              gsap.to(im, { opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.04, duration: 0.7, ease: 'power2.out', overwrite: true }),
            );
            setChips(idx);
            if (cap)
              gsap.fromTo(
                cap,
                { opacity: 0, y: 8 },
                { opacity: 1, y: 0, duration: 0.5, onStart: () => void (cap.textContent = STAGE_CAPTIONS[idx]) },
              );
          }
        },
      });
      // Tweens started from onUpdate are not owned by the matchMedia context: reset by hand.
      return () => {
        gsap.killTweensOf([...stages, ...(cap ? [cap] : [])]);
        gsap.set(stages, { clearProps: 'opacity,transform' });
        if (cap) {
          gsap.set(cap, { clearProps: 'opacity,transform' });
          cap.textContent = STAGE_CAPTIONS[0];
        }
        if (sbar) sbar.style.transform = '';
        setChips(0);
      };
    });

    /* ------------------------------------------------ client rails: drift, accelerate with scroll velocity, pause on hover/tap
     * Velocity comes from the provider's single global trigger (motionState.velocity, decayed
     * there). Each rail only ticks while it is on screen; its loop period is measured once (and
     * again after a refresh / resize), and its x is written through a GSAP quickSetter. */
    const rails = q('[data-tv-rail]');
    if (rails.length) {
      rails.forEach((rail) => {
        let x = 0;
        let paused = false;
        let visible = false;
        let half = 0;
        const dir = Number(rail.dataset.tvRailDir) || 1;
        const box = rail.parentElement ?? rail;
        const lists = Array.from(rail.children) as HTMLElement[];
        const setX = gsap.quickSetter(rail, 'x', 'px') as (v: number) => void;
        const remeasure = () => {
          half = 0;
        };
        on(box, 'pointerenter', (e) => {
          if (e.pointerType === 'mouse') paused = true;
        });
        on(box, 'pointerleave', (e) => {
          if (e.pointerType === 'mouse') paused = false;
        });
        on(box, 'pointerup', (e) => {
          if (e.pointerType !== 'mouse') paused = !paused; // touch: tap toggles the hold
        });
        const io = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        });
        io.observe(box);
        ST.addEventListener('refresh', remeasure);
        onWin('resize', remeasure);
        const tick = (_t: number, dt: number) => {
          if (paused || !visible) return;
          // Loop period = offset of the duplicate list (mockup: scrollWidth / 2).
          if (!half) half = lists.length > 1 ? lists[1].offsetLeft - lists[0].offsetLeft : rail.scrollWidth / 2;
          if (!half) return;
          const speed = 0.04 + Math.min(0.6, Math.abs(motionState.velocity) / 4000);
          x -= dir * speed * dt;
          if (x <= -half) x += half;
          if (x > 0) x -= half;
          setX(x);
        };
        gsap.ticker.add(tick);
        cleanups.push(() => {
          gsap.ticker.remove(tick);
          io.disconnect();
          ST.removeEventListener('refresh', remeasure);
          gsap.set(rail, { clearProps: 'transform' });
        });
      });
    }

    /* ------------------------------------------------ capability bars */
    q('[data-tv-bar]').forEach((row) => {
      const fill = row.querySelector<HTMLElement>('[data-tv-bar-fill]');
      if (!fill) return;
      // The fill keeps its final width (--w) and slides in from the left inside the clipped pill
      // track: the same growing bar as a width tween, without layout per frame.
      gsap.fromTo(
        fill,
        { xPercent: -100 },
        { xPercent: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: row, start: 'top 85%', once: true } },
      );
    });

    /* ------------------------------------------------ range: pinned horizontal scrub (desktop only) */
    mm.add(BP.desktop, () => {
      const hs = one('[data-tv-hscroll]');
      const trackEl = one('[data-tv-hscroll-track]');
      if (!hs || !trackEl) return;
      // The track scrolls inside the inset panel, so travel is measured against the panel.
      const panel = one('[data-tv-hscroll-panel]') ?? hs;
      const dist = () => Math.max(0, trackEl.scrollWidth - panel.clientWidth);
      gsap.to(trackEl, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: { trigger: hs, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.25, invalidateOnRefresh: true, anticipatePin: 1 },
      });
    });

    /* ------------------------------------------------ process timeline: three-phase path follow
     * Skiper19-style path follow with ScrollTrigger (scrub .5): the backbone tip tracks a line
     * at 62% of the viewport, from the timeline top to the last node, and the braid draws with
     * it. The head rides the tip (fading out while the tip is behind a photo; cached rects),
     * the readout ticks up per stage, and each node bursts, lights and surges on arrival. */
    const unit = one('[data-tv-tl-unit]');
    const tlSteps = q('[data-tv-tl-step]');
    const tlSection = one('#process');
    if (unit && tlSteps.length && tlWrap) {
      mm.add({ desktop: BP.desktop, below: BP.belowDesktop }, (c) => {
        const desktop = !!c.conditions?.desktop;
        if (desktop && chip) chip.setAttribute('data-float', '');
        let wave: Wave | null = null;
        let stage = 0;
        let chipW = 0;
        let chipH = 0;
        let chipSide = 1;
        let first = true;
        const kv = { v: 0 };
        const headO = gsap.quickTo(unit, 'opacity', { duration: 0.28, ease: 'power2.out' });
        const chipO = desktop && chip ? gsap.quickTo(chip, 'opacity', { duration: 0.28, ease: 'power2.out' }) : null;
        const chipX = desktop && chip ? gsap.quickTo(chip, 'x', { duration: 0.5, ease: 'power3.out' }) : null;
        const chipY = desktop && chip ? gsap.quickTo(chip, 'y', { duration: 0.18, ease: 'power2.out' }) : null;
        const setStage = (k: number) => {
          if (k === stage) return;
          stage = k;
          const [name, volts] = STAGES[k];
          if (chipStage)
            gsap.fromTo(
              chipStage,
              { yPercent: 110, opacity: 0 },
              {
                yPercent: 0,
                opacity: 1,
                duration: 0.42,
                ease: 'power3.out',
                overwrite: true,
                onStart: () => {
                  chipStage.textContent = name;
                  chipW = 0;
                },
              },
            );
          gsap.to(kv, {
            v: volts,
            duration: 0.6,
            ease: 'power2.out',
            overwrite: true,
            onUpdate: () => {
              if (chipKv) chipKv.textContent = String(Math.round(kv.v));
            },
          });
        };
        const surge = (k: number) => {
          if (!wave) return;
          const seg = desktop ? 170 : 90;
          wave.lines.forEach((ln, pi) => {
            const el = surgeEls[pi];
            if (!el) return;
            const L = ln.lens[wave!.nodeIdx[k]] * ln.scale;
            el.style.strokeDasharray = seg + ' ' + (ln.total + seg);
            el.style.strokeDashoffset = String(-(L - seg));
            gsap
              .timeline()
              .fromTo(el, { opacity: 0 }, { opacity: 0.9, duration: 0.14, ease: 'power2.out', overwrite: true })
              .to(el, { opacity: 0, duration: 0.75, ease: 'power2.in' });
          });
        };
        const render = (y: number) => {
          if (!wave) return;
          const w = wave;
          const tip = drawTo(w, y);
          unit.style.transform = 'translate3d(' + tip.x.toFixed(2) + 'px,' + tip.y.toFixed(2) + 'px,0)';
          // Fade out while the tip is behind a photo (rects cached per refresh, slightly grown
          // so the head fades as it reaches the edge), briefly over a node, and at the start.
          const g = 10;
          const behind = w.media.some((r) => tip.x > r.l - g && tip.x < r.r + g && tip.y > r.t - g && tip.y < r.b + g);
          let near = Infinity;
          let nearK = 0;
          w.nodeYs.forEach((ny, i) => {
            const dd = Math.abs(tip.y - ny);
            if (dd < near) {
              near = dd;
              nearK = i;
            }
          });
          const start = Math.max(0, Math.min(1, (y - 20) / 40));
          const overNode = Math.max(0, Math.min(1, (near - 18) / 26));
          headO(behind ? 0 : Math.min(start, overNode));
          // Nodes: light on arrival (CSS ring burst), surge the converging phases.
          let passed = -1;
          w.nodeYs.forEach((ny, i) => {
            const n = nodes[i];
            // Lights as the head touches the node rim, so the head never sits on a dark node.
            const on = y >= ny - (w.desktop ? 22 : 12);
            if (on) passed = i;
            if (on !== n.hasAttribute('data-active')) {
              n.toggleAttribute('data-active', on);
              if (on && !first) surge(i);
            }
          });
          if (first) {
            stage = Math.max(0, passed);
            showStage(stage);
            kv.v = STAGES[stage][1];
          } else setStage(Math.max(0, passed));
          // Readout beside the head (desktop): toward the panel centre in the gaps, toward
          // the photo side near a node, so it never sits on the text.
          if (chip && chipX && chipY && chipO) {
            // measured once per stage label / refresh, not per frame
            if (!chipW) {
              chipW = chip.offsetWidth;
              chipH = chip.offsetHeight;
            }
            const dx = tip.x - w.cx;
            chipSide = Math.abs(dx) > 48 ? (dx > 0 ? -1 : 1) : nearK % 2 === 0 ? 1 : -1;
            const x = chipSide > 0 ? tip.x + 34 : tip.x - 34 - chipW;
            const cy = tip.y - chipH / 2;
            if (first) gsap.set(chip, { x, y: cy });
            chipX(x);
            chipY(cy);
            chipO(behind ? 0 : start);
          }
          first = false;
        };
        const lastNodeY = () => {
          const last = nodes[nodes.length - 1];
          if (!last) return tlWrap.clientHeight;
          const r = boxIn(last);
          return (r.t + r.b) / 2;
        };
        wave = buildWave(desktop);
        render(0);
        ST.create({
          trigger: tlWrap,
          start: 'top 62%',
          end: () => 'top+=' + lastNodeY() + ' 62%',
          scrub: 0.25,
          invalidateOnRefresh: true,
          onUpdate: (self) => render(self.progress * (wave?.endY ?? 0)),
          onRefresh: (self) => {
            chipW = 0;
            wave = buildWave(desktop);
            render(self.progress * (wave?.endY ?? 0));
          },
        });
        // Halo pulse and current pulses only while the section is on screen.
        ST.create({
          trigger: tlSection ?? tlWrap,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => {
            unit.toggleAttribute('data-live', self.isActive);
            svg?.toggleAttribute('data-live', self.isActive);
            svgFx?.toggleAttribute('data-live', self.isActive);
          },
        });
        tlSteps.forEach((li, i) => {
          const txt = li.querySelector('[data-tv-tl-text]');
          const med = li.querySelector('[data-tv-tl-media]');
          const leftText = i % 2 === 0;
          if (desktop) {
            if (txt) gsap.fromTo(txt, { x: leftText ? -40 : 40, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 75%' , once: true } });
            if (med)
              gsap.fromTo(med, { x: leftText ? 40 : -40, opacity: 0, scale: 0.96 }, { x: 0, opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 75%' , once: true } });
          } else {
            if (txt) gsap.fromTo(txt, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 80%' , once: true } });
            if (med)
              gsap.fromTo(med, { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: li, start: 'top 80%' , once: true } });
          }
        });
        // Tweens started from scroll callbacks are not owned by the matchMedia context.
        return () => {
          gsap.killTweensOf([kv, ...surgeEls, ...(chipStage ? [chipStage] : [])]);
          surgeEls.forEach((el) => {
            el.style.opacity = '';
            el.style.strokeDasharray = '';
            el.style.strokeDashoffset = '';
          });
          if (chipStage) gsap.set(chipStage, { clearProps: 'transform,opacity' });
          if (chip) {
            gsap.set(chip, { clearProps: 'transform,opacity' });
            chip.removeAttribute('data-float');
          }
          showStage(0);
          nodes.forEach((n) => n.removeAttribute('data-active'));
          unit.removeAttribute('data-live');
          svg?.removeAttribute('data-live');
          svgFx?.removeAttribute('data-live');
          unit.style.transform = '';
          gsap.set(unit, { clearProps: 'opacity' });
          clearWave();
        };
      });
    }

    /* ------------------------------------------------ spotlight hover (fine pointers) */
    if (fine) {
      q('[data-tv-spot]').forEach((card) => {
        const glow = card.querySelector<HTMLElement>('[data-tv-spot-glow]');
        if (!glow) return;
        // Card box cached while the pointer is over it; a scroll moves it, so re-measure then.
        let box: DOMRect | null = null;
        const drop = () => {
          box = null;
        };
        on(card, 'mouseenter', drop);
        onWin('scroll', drop);
        on(card, 'mousemove', (e) => {
          if (!box) box = card.getBoundingClientRect();
          glow.style.setProperty('--mx', e.clientX - box.left + 'px');
          glow.style.setProperty('--my', e.clientY - box.top + 'px');
          glow.style.opacity = '1';
        });
        on(card, 'mouseleave', () => {
          glow.style.opacity = '0';
        });
      });
    }

    return () => cleanups.forEach((fn) => fn());
  });

  return <div ref={ref}>{children}</div>;
}
