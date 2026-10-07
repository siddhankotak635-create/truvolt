import Image from 'next/image';
import { images, type ImageAsset } from '@/data/assets';
import type { ProductKey } from '@/data/products';
import styles from './Cutaway.module.css';

type Step = { lead: string; text: string; caption: string; image: ImageAsset; alt: string };

const OIL: Step[] = [
  {
    lead: 'Core steel.',
    text: 'Cold-rolled grain-oriented laminations set the no-load loss you pay for every hour the unit is energised.',
    caption: 'CRGO laminations stacked and clamped to IS 2026.',
    image: images.engineeringProcess,
    alt: 'Core stacking',
  },
  {
    lead: 'Winding copper.',
    text: '99.9% electrolytic grade and the bracing around it decide how the unit survives a through-fault.',
    caption: '99.9% electrolytic copper, paper-insulated and braced for short-circuit forces.',
    image: images.qualityProcess3,
    alt: 'Winding',
  },
  {
    lead: 'Tank and cooling.',
    text: 'Sand-blasted, epoxy-coated steel and the ONAN / ONAF radiator set hold temperature rise inside the IS limit.',
    caption: 'Tanked, oil-filled and tested for ratio, loss, impedance and dielectric strength.',
    image: images.qualityProcess6,
    alt: 'Engineering process from inquiry to support',
  },
];

/** Dry type: no tank, no oil, no radiators. The third step covers the enclosure and AN / AF cooling. */
const DRY: Step[] = [
  OIL[0],
  {
    ...OIL[1],
    caption: 'Electrolytic copper windings with Class F / H insulation, cast or vacuum-impregnated and braced for short-circuit forces.',
  },
  {
    lead: 'Enclosure and cooling.',
    text: 'An enclosure built to the specified IP rating and AN / AF cooling, natural air or fan-forced, hold temperature rise inside the IS 11171 limit.',
    caption: 'Enclosed, air-cooled and tested for ratio, loss, impedance and dielectric strength.',
    image: images.qualityProcess6,
    alt: 'Engineering process from inquiry to support',
  },
];

/** Products that get the cutaway (turnkey has none). */
export function hasCutaway(key: ProductKey): boolean {
  return key !== 'turnkey';
}

/**
 * "Inside the unit" (mockup Cutaway). Desktop: the left labels stay sticky while
 * a 240vh column scrubs a sticky stage through three images (ProductMotion).
 * Below 1100px, and under reduced motion, it renders three stacked cards instead.
 */
export function Cutaway({ productKey }: { productKey: ProductKey }) {
  const steps = productKey === 'dry' ? DRY : OIL;
  return (
    <section className={styles.section} aria-labelledby="cutaway-title">
      <div className={styles.aside}>
        <p data-tv-reveal="" className={styles.label}>
          Inside the unit
        </p>
        <h2 id="cutaway-title" data-tv-reveal="" className={styles.title}>
          Three Decisions That Decide a Transformer&apos;s Life
        </h2>
        <ol data-tv-reveal="" className={styles.labels}>
          {steps.map((s, i) => (
            <li key={i} data-tv-cut-label={i} className={styles.cutLabel}>
              <span className={styles.n}>{String(i + 1).padStart(2, '0')}</span>
              <span>
                <strong>{s.lead}</strong> {s.text}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div data-tv-cut="" className={styles.track}>
        <div data-tv-reveal="" className={styles.stage}>
          {steps.map((s, i) => (
            <Image
              key={i}
              data-tv-cut-img={i}
              src={s.image.src}
              width={s.image.width}
              height={s.image.height}
              alt=""
              sizes="(min-width: 1100px) 50vw, 1px"
              className={styles.stageImg}
            />
          ))}
          <div className={styles.stageShade} aria-hidden="true" />
          <div className={styles.stageFoot}>
            <p data-tv-cut-cap="" aria-live="polite" data-caps={JSON.stringify(steps.map((s) => s.caption))} className={styles.cap}>
              {steps[0].caption}
            </p>
            <div className={styles.barTrack} aria-hidden="true">
              <div data-tv-cut-bar="" className={styles.bar} />
            </div>
          </div>
        </div>
      </div>

      <ol className={styles.cards}>
        {steps.map((s, i) => (
          <li key={i} data-tv-reveal="" className={styles.card}>
            <div className={styles.cardMedia}>
              <Image
                src={s.image.src}
                width={s.image.width}
                height={s.image.height}
                alt={s.alt}
                sizes="(min-width: 768px) 33vw, 100vw"
                className={styles.cardImg}
              />
              <p className={styles.cardCap}>{s.caption}</p>
            </div>
            <p className={styles.cardText}>
              <span className={styles.n}>{String(i + 1).padStart(2, '0')}</span>
              <span>
                <strong>{s.lead}</strong> {s.text}
              </span>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
