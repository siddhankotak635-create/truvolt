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

/**
 * About page motion (ported from Truvolt About.dc.html data-dc-script):
 * split-headline intro, the pinned Legacy year counter (1970 → 2026 with line
 * highlight), then reveals / word scrub / parallax.
 *
 * The server markup is the reduced-motion end state ("2026", every line lit);
 * the pinned scene sets its start state here and restores the markup on revert.
 */
export function AboutMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useTvMotion(ref, ({ gsap, q, mm, scope, reduced }) => {
    defaultIntro(scope);

    if (!reduced) {
      const legacy = q('[data-tv-legacy]')[0];
      const yearEl = q('[data-tv-year]')[0];
      const lines = q('[data-tv-legacy-line]');
      const img = q('[data-tv-legacy-img]');

      if (legacy && yearEl && lines.length) {
        const legacyScene = (end: string) => () => {
          const finalYear = yearEl.textContent;
          const o = { y: 1970 };
          const light = (idx: number) => lines.forEach((l, i) => (l.style.opacity = i === idx ? '1' : '0.6'));
          yearEl.textContent = '1970';
          light(0);

          gsap
            .timeline({
              scrollTrigger: {
                trigger: legacy,
                start: 'top top',
                end,
                pin: true,
                scrub: 0.6,
                anticipatePin: 1,
                onUpdate: (self) => light(Math.min(lines.length - 1, Math.floor(self.progress * lines.length))),
              },
            })
            .to(o, { y: 2026, ease: 'none', duration: 1, onUpdate: () => { yearEl.textContent = String(Math.round(o.y)); } }, 0)
            .to(img, { yPercent: 6, scale: 1.06, ease: 'none', duration: 1 }, 0);

          return () => {
            yearEl.textContent = finalYear;
            lines.forEach((l) => (l.style.opacity = ''));
          };
        };
        mm.add('(min-width: 768px)', legacyScene('+=220%'));
        mm.add(BP.mobile, legacyScene('+=150%'));
      }
    }

    // Created after the pin so their start positions account for its spacer.
    initReveal(scope);
    initWords(scope);
    initParallax(scope);
    initCounters(scope);
  });

  return <div ref={ref}>{children}</div>;
}
