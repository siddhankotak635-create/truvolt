'use client';

import { useRef, type ReactNode } from 'react';
import {
  BP,
  defaultIntro,
  initCounters,
  initParallax,
  initReveal,
  initWords,
  useTvMotion,
} from '@/lib/motion';
import { LAB_FROM, STATUS_LAB, STATUS_WORKS, TESTS } from './tests';

/**
 * Quality page motion (ported from Truvolt Quality.dc.html data-dc-script).
 *
 * Test bay:
 * - >=768px: the bay pins for tests.length × 70% of the viewport; the list
 *   translates and the active test follows scroll progress.
 * - <768px: no pin. The reading card is CSS-sticky and each test card activates
 *   when it crosses the viewport centre.
 * The server markup is the reduced-motion state (all tests visible, bar full).
 */
export function QualityMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useTvMotion(ref, ({ gsap, ScrollTrigger, q, mm, scope, reduced, fine }) => {
    defaultIntro(scope);

    const cleanups: (() => void)[] = [];

    const bay = q('[data-tv-bay]')[0];
    const tests = q('[data-tv-test]');
    const nameEl = q('[data-tv-bay-name]')[0];
    const valEl = q('[data-tv-bay-val]')[0];
    const unitEl = q('[data-tv-bay-unit]')[0];
    const bar = q('[data-tv-bay-bar]')[0];
    const status = q('[data-tv-bay-status]')[0];
    const list = q('[data-tv-bay-list]')[0];
    const clip = list?.parentElement;

    if (!reduced && bay && tests.length && nameEl && valEl && unitEl && bar && status && list && clip) {
      const initial = {
        name: nameEl.textContent,
        val: valEl.textContent,
        unit: unitEl.textContent,
        status: status.textContent,
      };
      const reading = { v: TESTS[0].val };
      let active = -1;

      const setActive = (i: number) => {
        if (i === active) return;
        active = i;
        const t = TESTS[i];
        tests.forEach((el, j) => {
          el.style.opacity = j === i ? '1' : j < i ? '.85' : '.75';
          el.style.borderColor = j === i ? 'rgba(220,231,243,.5)' : 'rgba(220,231,243,.14)';
        });
        nameEl.textContent = t.name;
        unitEl.textContent = t.unit;
        status.textContent = i >= LAB_FROM ? STATUS_LAB : STATUS_WORKS;
        gsap.to(reading, {
          v: t.val,
          duration: 0.9,
          ease: 'power2.out',
          overwrite: true,
          onUpdate: () => {
            valEl.textContent = reading.v.toLocaleString('en-US', {
              minimumFractionDigits: t.fmt,
              maximumFractionDigits: t.fmt,
            });
          },
        });
        gsap.fromTo(bar, { width: '0%' }, { width: '100%', duration: 1.6, ease: 'power1.inOut', overwrite: true });
      };

      // Pinned scene (desktop + tablet): each test owns ~70vh of scroll so none is skipped.
      mm.add('(min-width: 768px)', () => {
        const travel = () => Math.max(0, list.scrollHeight - clip.clientHeight);
        gsap.to(list, {
          y: () => -travel(),
          ease: 'none',
          scrollTrigger: {
            trigger: bay,
            start: 'top top',
            end: () => '+=' + tests.length * 70 + '%',
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => setActive(Math.min(tests.length - 1, Math.floor(self.progress * tests.length))),
          },
        });
      });

      // Mobile: plain list, each card takes over as it crosses the viewport centre.
      mm.add(BP.mobile, () => {
        tests.forEach((el, i) =>
          ScrollTrigger.create({
            trigger: el,
            start: 'top 55%',
            end: 'bottom 55%',
            onToggle: (self) => {
              if (self.isActive) setActive(i);
            },
          }),
        );
      });

      if (fine) {
        const handlers = tests.map((el, i) => {
          const h = () => setActive(i);
          el.addEventListener('mouseenter', h);
          return () => el.removeEventListener('mouseenter', h);
        });
        cleanups.push(...handlers);
      }

      setActive(0);

      cleanups.push(() => {
        gsap.killTweensOf(reading);
        gsap.killTweensOf(bar);
        bar.style.width = '';
        tests.forEach((el) => {
          el.style.opacity = '';
          el.style.borderColor = '';
        });
        nameEl.textContent = initial.name;
        valEl.textContent = initial.val;
        unitEl.textContent = initial.unit;
        status.textContent = initial.status;
      });
    }

    // Created after the pin so their start positions account for its spacer.
    initReveal(scope);
    initWords(scope);
    initParallax(scope);
    initCounters(scope);

    if (!reduced) {
      const rows = q('[data-tv-row]');
      if (rows.length)
        gsap.fromTo(
          rows,
          { opacity: 0, x: -12 },
          { opacity: 1, x: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out', scrollTrigger: { trigger: rows[0], start: 'top 85%' } },
        );
    }

    return () => cleanups.forEach((fn) => fn());
  });

  return <div ref={ref}>{children}</div>;
}
