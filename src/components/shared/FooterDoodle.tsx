'use client';

import { useRef } from 'react';
import { useTvMotion } from '@/lib/motion';
import styles from './FooterDoodle.module.css';

/* Blueprint sketch of an oil-filled power transformer (viewBox 560 × 320).
 * Every drawn path has pathLength="1" so the draw-on tween needs no measuring. */

const BUSHINGS = [240, 280, 320];
const SHEDS = [130, 118, 106, 94, 82];
const FINS = [62, 76, 90, 104, 118, 132];

const bushingPath = (x: number) =>
  [
    `M${x - 9} 142 h18`, // flange
    `M${x - 4} 142 V70 M${x + 4} 142 V70`, // porcelain stem
    ...SHEDS.map((y) => `M${x - 4} ${y} L${x - 10} ${y + 5} H${x + 10} L${x + 4} ${y}`), // sheds
    `M${x - 3} 70 V63 H${x + 3} V70`, // terminal cap
    `M${x} 63 V58`,
  ].join(' ');

const finPath = (x: number) => `M${x} 166 q0 -5 4 -5 q4 0 4 5 V264 q0 5 -4 5 q-4 0 -4 -5 Z`;

// Sine wave leaving the right-hand bushing tip and running out to the right edge.
const WAVE = `M320 58 H348 q12.5 -28 25 0 ${'t25 0 '.repeat(7)}h12`;

/* Idle-loop current flow. These overlays use real user units (no pathLength) so
 * every conductor carries dashes at the same speed: FLOW_SPEED units per second. */
const FLOW_SPEED = 50;
const LEAD_DASH = 5;
const LEAD_PERIOD = 46; // dash + gap along a bushing lead
const WAVE_PERIOD = 90; // dash + gap along the wave; three phase copies share it
const leadPath = (x: number) => `M${x} 150 V58`; // up the porcelain stem from the tank
const PHASES = [0, 1, 2]; // R, Y, B: offset by 1/3 of a cycle each

const TANK =
  'M150 280 V150 H330 V280 Z M146 150 V142 H334 V150 M140 280 H340 V288 H140 Z ' +
  'M150 186 H330 M150 244 H330 M290 198 h26 v18 h-26 Z';
const RAD_HEADERS = 'M58 172 H150 M58 258 H150';
// Oil level inside the conservator; sways gently in the idle loop.
const OIL = 'M154 86 H202';
const CONSERVATOR =
  'M146 70 H208 A9 15 0 0 1 208 100 H146 A9 15 0 0 1 146 70 Z M146 70 A9 15 0 0 0 146 100 ' +
  'M156 100 L160 142 M200 100 L196 142 M178 100 V112 M171 112 h14 v9 h-14 Z M178 121 V142';
const DIMS =
  'M150 292 V312 M330 292 V312 M150 306 H330 M146 310 L154 302 M326 310 L334 302 ' +
  'M338 142 H358 M338 280 H358 M352 142 V280 M348 146 L356 138 M348 284 L356 276';

export function FooterDoodle({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useTvMotion(ref, ({ gsap, ScrollTrigger, q, scope, reduced }) => {
    if (reduced) return; // markup is the finished, static drawing; no idle loop

    const group = (k: string) => q<HTMLElement>(`[data-draw="${k}"]`);
    const all = q<HTMLElement>('[data-draw]');
    const fades = q<HTMLElement>('[data-fade]');
    const flows = q<HTMLElement>('[data-flow]');
    const halos = q<HTMLElement>('[data-halo]');
    const fins = q<HTMLElement>('[data-fin]');

    // attr, not CSS: CSSPlugin rounds px values, which would snap these 0–1 offsets.
    gsap.set(all, { attr: { 'stroke-dasharray': '1 2', 'stroke-dashoffset': 1.01 } });
    gsap.set(fades, { opacity: 0 });

    /* Idle loop: one paused timeline owning every repeat:-1 tween, so the offscreen
     * toggle is a single play()/pause() and the context revert kills all of it. */
    const loop = gsap.timeline({ paused: true });
    const forever = { repeat: -1, ease: 'none' };

    // 1. Current: short bright dashes march along every conductor; R/Y/B a third apart.
    loop.to(flows, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 0);
    flows.forEach((el) => {
      const period = Number(el.dataset.period);
      const phase = Number(el.dataset.phase) / 3;
      const from = -period * phase;
      loop.fromTo(
        el,
        { attr: { 'stroke-dashoffset': from } },
        { attr: { 'stroke-dashoffset': from - period }, duration: period / FLOW_SPEED, ...forever },
        0,
      );
    });

    // 2. Sine wave breathes: amplitude eases down and back about its baseline (y 58).
    loop.fromTo(
      q('[data-breathe]'),
      { scaleY: 1 },
      { scaleY: 0.78, svgOrigin: '0 58', duration: 2.4, ease: 'sine.inOut', repeat: -1, yoyo: true },
      0,
    );

    // 3. Radiator heat shimmer: an opacity ripple running across the fins.
    fins.forEach((el, i) => {
      loop.fromTo(
        el,
        { opacity: 1 },
        { opacity: 0.4, duration: 0.9, ease: 'sine.inOut', repeat: -1, yoyo: true },
        i * 0.3,
      );
    });

    // 4. Bushing coronas: same 3s breath, each a third of a cycle behind the last.
    halos.forEach((el, i) => {
      loop.fromTo(
        el,
        { opacity: 0.15, scale: 1 },
        {
          opacity: 0.45,
          scale: 1.5,
          transformOrigin: '50% 50%',
          duration: 1.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        },
        i,
      );
    });

    // 5. Conservator oil level sways slightly.
    loop.fromTo(
      q('[data-oil]'),
      { rotation: -2.5 },
      { rotation: 2.5, svgOrigin: '178 86', duration: 2.2, ease: 'sine.inOut', repeat: -1, yoyo: true },
      0,
    );

    // 6. Live indicator beside the rating label.
    loop.fromTo(
      q('[data-live]'),
      { opacity: 1 },
      { opacity: 0.15, duration: 0.7, ease: 'power2.inOut', repeat: -1, yoyo: true },
      0,
    );

    let drawn = false;
    const visible = ScrollTrigger.create({
      trigger: scope,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        if (!drawn) return;
        if (self.isActive) loop.play();
        else loop.pause();
      },
    });

    const ease = 'power2.inOut';
    const draw = { attr: { 'stroke-dashoffset': 0 }, ease };
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        drawn = true;
        if (visible.isActive) loop.play();
      },
    });
    tl.to(group('tank'), { ...draw, duration: 0.7 }, 0)
      .to(group('rad'), { ...draw, duration: 0.35, stagger: 0.05 }, 0.5)
      .to(group('bush'), { ...draw, duration: 0.45, stagger: 0.1 }, 1.0)
      .to(group('cons'), { ...draw, duration: 0.5 }, 1.45)
      .to(group('wave'), { ...draw, duration: 0.6 }, 1.8)
      .to(group('dim'), { ...draw, duration: 0.5, stagger: 0.05 }, 1.85)
      .to(fades, { opacity: 1, duration: 0.4, ease }, 2.0);

    ScrollTrigger.create({
      trigger: scope,
      start: 'top 85%',
      onEnter: () => tl.play(),
    });
  });

  const cls = [styles.doodle, className].filter(Boolean).join(' ');
  return (
    <div ref={ref} className={cls} aria-hidden="true">
      <svg
        className={styles.svg}
        viewBox="0 0 560 320"
        preserveAspectRatio="xMaxYMax meet"
        focusable="false"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g className={styles.dim}>
          <path data-draw="dim" pathLength={1} d={DIMS} />
        </g>
        <g className={styles.ink}>
          <path data-draw="tank" pathLength={1} d={TANK} />
          <path data-draw="rad" pathLength={1} d={RAD_HEADERS} />
          {FINS.map((x) => (
            <path key={x} data-draw="rad" data-fin="" pathLength={1} d={finPath(x)} />
          ))}
          {BUSHINGS.map((x) => (
            <path key={x} data-draw="bush" pathLength={1} d={bushingPath(x)} />
          ))}
          <path data-draw="cons" pathLength={1} d={CONSERVATOR} />
          <g data-oil="">
            <path data-draw="cons" className={styles.oil} pathLength={1} d={OIL} />
          </g>
        </g>
        {/* current-flow overlays: hidden until the idle loop fades them in */}
        <g className={styles.flow}>
          {BUSHINGS.map((x, i) => (
            <path
              key={x}
              data-flow=""
              data-period={LEAD_PERIOD}
              data-phase={i}
              strokeDasharray={`${LEAD_DASH} ${LEAD_PERIOD - LEAD_DASH}`}
              d={leadPath(x)}
            />
          ))}
        </g>
        <g data-breathe="">
          <path className={styles.ink} data-draw="wave" pathLength={1} d={WAVE} />
          <g className={styles.flow}>
            {PHASES.map((i) => (
              <path
                key={i}
                data-flow=""
                data-period={WAVE_PERIOD}
                data-phase={i}
                strokeDasharray={`${LEAD_DASH} ${WAVE_PERIOD - LEAD_DASH}`}
                d={WAVE}
              />
            ))}
          </g>
        </g>
        <g data-fade="">
          {BUSHINGS.map((x) => (
            <g key={x}>
              <circle data-halo="" className={styles.halo} cx={x} cy={58} r={6} />
              <circle className={styles.tip} cx={x} cy={58} r={2.2} />
            </g>
          ))}
          <circle data-live="" className={styles.live} cx={364} cy={280.5} r={2} />
          <text className={styles.label} x={372} y={284}>
            33 kV · ONAN
          </text>
        </g>
      </svg>
    </div>
  );
}
