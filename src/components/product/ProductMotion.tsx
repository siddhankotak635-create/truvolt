'use client';

import { useRef, type ReactNode } from 'react';
import { afterReveal, BP, initPageCore, introCovered, REVEAL_OFFSET, showPrehidden, useTvMotion } from '@/lib/motion';

/**
 * Product motion, ported from the Product mockup's data-dc-script.
 * mode="intro" (first render): [data-tv-swap] copy and hero media rise in.
 * mode="swap" (after a switcher change): the mockup's swap-in (copy y 18 → 0,
 * stagger .05; image scale 1.08 → 1). Also: hero tilt (fine pointer), hero
 * image drift, the cutaway stage swap (desktop) and scroll reveals.
 * Remount with key={product} so each product gets a fresh scope and no stale
 * ScrollTriggers. The switcher animates its own intro.
 */
export function ProductMotion({ children, mode = 'intro' }: { children: ReactNode; mode?: 'intro' | 'swap' }) {
  const ref = useRef<HTMLDivElement>(null);

  useTvMotion(ref, ({ gsap, ScrollTrigger, q, mm, scope, reduced, fine }) => {
    initPageCore(scope, { intro: false });

    const swaps = q('#top [data-tv-swap]');
    const media = q('[data-tv-hero-media]');

    if (reduced) {
      gsap.set([...swaps, ...media], { autoAlpha: 1, y: 0 });
      return;
    }

    if (mode === 'swap') {
      // A client-side remount: this runs before the new markup is painted, so the fade is unseen.
      gsap.fromTo(swaps, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.05, ease: 'power3.out' });
      gsap.fromTo(media, { y: 0, scale: 1.08, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1, ease: 'power3.out' });
    } else if (introCovered()) {
      // Intro under a page-transition cover (mockup: swaps y 30 stagger .08 at .1, media y 80 expo at .3).
      afterReveal(
        gsap
          .timeline({ defaults: { ease: 'power4.out' } })
          .fromTo(swaps, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.08 }, 0.1)
          .fromTo(media, { y: 80, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.3, ease: 'expo.out' }, 0.3),
      );
    } else {
      // First load: the hero is already painted at the CSS offsets (global.css); rise from there.
      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .fromTo(swaps, { y: REVEAL_OFFSET }, { y: 0, duration: 1, stagger: 0.08 }, 0.1)
        .fromTo(media, { y: 80 }, { y: 0, duration: 1.3, ease: 'expo.out' }, 0.3);
    }
    showPrehidden(scope, '#top [data-tv-reveal]');

    // Hero image drift (on a wrapper so the CSS Ken Burns on the <img> keeps running).
    const pan = q('[data-tv-hero-pan]')[0];
    if (pan && media[0])
      gsap.to(pan, {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: { trigger: media[0], start: 'top top', end: 'bottom top', scrub: true },
      });

    // Cutaway stage swap: desktop only (below 1100px the stacked cards render instead).
    mm.add(BP.desktop, () => {
      const wrap = q('[data-tv-cut]')[0];
      const imgs = q('[data-tv-cut-img]');
      if (!wrap || !imgs.length) return;
      const labels = q('[data-tv-cut-label]');
      const cap = q('[data-tv-cut-cap]')[0];
      const bar = q('[data-tv-cut-bar]')[0];
      const caps: string[] = cap ? JSON.parse(cap.dataset.caps ?? '[]') : [];
      const firstCap = cap?.textContent ?? '';
      let cur = 0;
      if (bar) {
        bar.style.width = '100%';
        bar.style.transform = 'translateX(-100%)'; // = the stylesheet's empty (width 0) bar
      }
      ScrollTrigger.create({
        trigger: wrap,
        start: 'top 130px',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          // full-width bar slid in from the left inside its clipped track (no layout per frame)
          if (bar) bar.style.transform = `translateX(${((self.progress - 1) * 100).toFixed(3)}%)`;
          const idx = Math.min(imgs.length - 1, Math.floor(self.progress * imgs.length));
          if (idx === cur) return;
          cur = idx;
          imgs.forEach((im, i) =>
            gsap.to(im, { opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.04, duration: 0.7, ease: 'power2.out', overwrite: true }),
          );
          labels.forEach((l, i) => (l.style.opacity = i === idx ? '1' : '0.75'));
          if (cap)
            gsap.fromTo(
              cap,
              { opacity: 0, y: 8 },
              { opacity: 1, y: 0, duration: 0.5, onStart: () => void (cap.textContent = caps[idx] ?? '') },
            );
        },
      });
      return () => {
        if (bar) bar.style.transform = bar.style.width = '';
        labels.forEach((l) => (l.style.opacity = ''));
        if (cap) cap.textContent = firstCap;
      };
    });

    // 3D tilt on the hero media (fine pointers only).
    if (fine) {
      const tiltWrap = q('[data-tv-tilt]')[0];
      const tiltEl = media[0];
      if (tiltWrap && tiltEl) {
        const rx = gsap.quickTo(tiltEl, 'rotationX', { duration: 0.6, ease: 'power3' });
        const ry = gsap.quickTo(tiltEl, 'rotationY', { duration: 0.6, ease: 'power3' });
        const onMove = (e: MouseEvent) => {
          const r = tiltWrap.getBoundingClientRect();
          rx(-((e.clientY - r.top) / r.height - 0.5) * 6);
          ry(((e.clientX - r.left) / r.width - 0.5) * 8);
        };
        const onLeave = () => {
          rx(0);
          ry(0);
        };
        tiltWrap.addEventListener('mousemove', onMove);
        tiltWrap.addEventListener('mouseleave', onLeave);
        return () => {
          tiltWrap.removeEventListener('mousemove', onMove);
          tiltWrap.removeEventListener('mouseleave', onLeave);
        };
      }
    }
  });

  return <div ref={ref}>{children}</div>;
}
