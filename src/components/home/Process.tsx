import Image from 'next/image';
import { Eyebrow } from '@/components/shared';
import { images, type ImageAsset } from '@/data/assets';
import styles from './Process.module.css';

const STEPS: { label: string; title: string; copy: string; image: ImageAsset }[] = [
  {
    label: 'Day 0 · Enquiry received',
    title: 'Technical Consultation',
    copy: 'Rating, voltage class, application and site conditions. Our engineers assess the requirement in detail before anything is drawn.',
    image: images.technician,
  },
  {
    label: 'Day 2 to 3 · Proposal issued',
    title: 'Design & Engineering',
    copy: 'A detailed technical proposal and design, compliant with IS / IEC and your project specification.',
    image: images.about1,
  },
  {
    label: 'Works, Kolkata · Core, windings, tank',
    title: 'Manufacturing & Inspection',
    copy: 'In-house build with stage-wise inspection at every milestone and full material traceability under our ISO-certified QMS.',
    image: images.home1,
  },
  {
    label: 'Site · Energised',
    title: 'Testing, Dispatch & Commissioning',
    copy: 'Routine and type tests per IS / IEC, then site installation, commissioning and performance validation with after-sales support.',
    image: images.homeLast,
  },
];

/**
 * #process: timeline journey, drawn as three-phase power. HomeMotion builds one backbone
 * that sweeps behind the photos (routed clear of the text) and braids three phase
 * conductors around it, 120° apart. They converge at every node (where the unit is
 * transformed) and fan out again. The braid draws with the scroll (Skiper19-style path
 * follow), current pulses run along the drawn part, a head rides the tip with a voltage
 * readout, and each node bursts and lights as the head arrives.
 * Desktop alternates text/media around the centre; below 1100px the wave hugs the
 * left edge through the node column.
 */
export function Process() {
  return (
    <div className={styles.wrap}>
      <section id="process" data-tv-tl="" className={`${styles.section} tv-dark`} aria-labelledby="process-title">
        <div className={styles.inner}>
          <div className={styles.head}>
            <div className={styles.headCopy}>
              <Eyebrow data-tv-reveal="" tone="dark" className={styles.eyebrow}>
                Our process
              </Eyebrow>
              <h2 data-tv-reveal="" id="process-title" className={styles.title}>
                One Enquiry. One Team. Energised at Site.
              </h2>
            </div>
            <p data-tv-reveal="" className={styles.lead}>
              The same engineers carry a job from the first specification to the switch-on. Follow one unit down the line.
            </p>
          </div>

          <div className={styles.timeline}>
            <svg data-tv-tl-svg="" aria-hidden="true" className={styles.svg} preserveAspectRatio="none">
              <defs>
                <linearGradient id="tvPhaseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#eef4fb" />
                  <stop offset=".6" stopColor="#DCE7F3" />
                  <stop offset="1" stopColor="#c9d9f3" />
                </linearGradient>
                {/* Pulses only show on the part of the route that is already drawn. */}
                <mask id="tvDrawnMask" maskUnits="userSpaceOnUse" x="-400" y="-400" width="100000" height="100000">
                  <path data-tv-tl-maskpath="" fill="none" stroke="#fff" strokeLinecap="round" className={styles.maskPath} />
                </mask>
              </defs>
              {/* Route ahead: faint backbone track with insulator-like marks either side. */}
              <path data-tv-tl-track="" fill="none" className={styles.track} />
              <path data-tv-tl-ticks="" fill="none" className={styles.ticks} />
              {/* Three phase conductors braided around one backbone (R, Y, B in the site palette). */}
              <path data-tv-tl-glow="" fill="none" className={styles.glow} />
              <path data-tv-tl-phase="0" fill="none" stroke="url(#tvPhaseGrad)" className={`${styles.phase} ${styles.p0}`} />
              <path data-tv-tl-phase="1" fill="none" className={`${styles.phase} ${styles.p1}`} />
              <path data-tv-tl-phase="2" fill="none" className={`${styles.phase} ${styles.p2}`} />
              <g mask="url(#tvDrawnMask)" className={styles.pulses}>
                <path data-tv-tl-pulse="0" fill="none" className={`${styles.pulse} ${styles.u0}`} />
                <path data-tv-tl-pulse="1" fill="none" className={`${styles.pulse} ${styles.u1}`} />
                <path data-tv-tl-pulse="2" fill="none" className={`${styles.pulse} ${styles.u2}`} />
              </g>
              {/* Arrival surge: the last stretch of each phase into a node flashes bright. */}
              <path data-tv-tl-surge="0" fill="none" className={`${styles.surge} ${styles.s0}`} />
              <path data-tv-tl-surge="1" fill="none" className={`${styles.surge} ${styles.s1}`} />
              <path data-tv-tl-surge="2" fill="none" className={`${styles.surge} ${styles.s1}`} />
            </svg>
            <div data-tv-tl-chip="" className={styles.chip} aria-hidden="true">
              <span className={styles.chipDot} />
              <span className={styles.chipMask}>
                <span data-tv-tl-chip-stage="" className={styles.chipStage}>
                  Enquiry
                </span>
              </span>
              <span className={styles.chipSep}>·</span>
              <span className={styles.chipKv}>
                <span data-tv-tl-chip-kv="">0</span> kV
              </span>
            </div>
            <div data-tv-tl-unit="" className={styles.unit} aria-hidden="true">
              <span className={styles.halo} />
            </div>
            <ol className={styles.list}>
              {STEPS.map((s, i) => (
                <li key={s.title} data-tv-tl-step={i} className={`${styles.step} ${i % 2 === 0 ? styles.even : styles.odd}`}>
                  <div className={styles.nodeCol}>
                    <span data-tv-tl-node={i} className={styles.node} aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div data-tv-tl-text="" className={styles.text}>
                    <p className={styles.label}>{s.label}</p>
                    <h3 className={styles.stepTitle}>{s.title}</h3>
                    <p className={styles.copy}>{s.copy}</p>
                  </div>
                  <div data-tv-tl-media="" className={styles.media}>
                    <Image
                      data-tv-parallax="0.1"
                      src={s.image.src}
                      width={s.image.width}
                      height={s.image.height}
                      alt={s.title}
                      sizes="(min-width: 1100px) 40vw, (min-width: 768px) 45vw, 90vw"
                      className={styles.img}
                    />
                    <div className={styles.mediaShade} aria-hidden="true" />
                    <span className={styles.stage}>Stage {String(i + 1).padStart(2, '0')} of 04</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
