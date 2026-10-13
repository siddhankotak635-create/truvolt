import Image from 'next/image';
import { Eyebrow } from '@/components/shared/Eyebrow';
import { images, type ImageAsset } from '@/data/assets';
import { STAGE_CAPTIONS } from './captions';
import styles from './Flagship.module.css';


const STAGES: { image: ImageAsset; alt: string; chip: string }[] = [
  { image: images.engineeringProcess, alt: 'Transformer core stacking', chip: '01 · Core stacking' },
  { image: images.qualityProcess3, alt: 'Winding and insulation', chip: '02 · Winding' },
  { image: images.qualityProcess6, alt: 'Tanking and test bay', chip: '03 · Test bay' },
];

const SPECS: [string, string][] = [
  ['Core', 'CRGO laminated, IS 2026'],
  ['Windings', 'Electrolytic copper, 99.9%'],
  ['Tank', 'MS fabricated, sand-blasted, epoxy'],
  ['Tap changer', 'Off-circuit / OLTC'],
  ['Cooling', 'ONAN · ONAF · Dry'],
  ['Standards', 'IS 2026 · IS 11171 · IEC · BS'],
];

/**
 * Flagship / Engineering. Desktop: sticky spec column + 260vh sticky stage whose
 * image, chip, caption and bar are driven by HomeMotion. Below 1100px: three
 * stacked cards (no sticky).
 */
export function Flagship() {
  return (
    <section className={`${styles.section} tv-dark`} aria-labelledby="engineering-title">
      <div className={styles.inner}>
        <div className={styles.spec}>
          <Eyebrow data-tv-reveal="" tone="dark" className={styles.eyebrow}>
            Engineering
          </Eyebrow>
          <h2 data-tv-reveal="" id="engineering-title" className={styles.title}>
            Built From the Core Outward
          </h2>
          <p data-tv-reveal="" className={styles.lead}>
            Every unit starts with CRGO laminated steel and 99.9% electrolytic copper. Type-tested at CPRI, ERDA, IIT and
            Jadavpur University before the design is ever released to the shop floor.
          </p>
          <dl data-tv-reveal="" className={styles.list}>
            {SPECS.map(([k, v]) => (
              <div key={k} className={styles.row}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Desktop: sticky stage */}
        <div data-tv-stages="" className={styles.stages}>
          <div data-tv-reveal="" className={styles.stage}>
            <div className={styles.stageImgs}>
            {STAGES.map((s, i) => (
              <Image
                key={s.chip}
                data-tv-stage={i}
                src={s.image.src}
                alt={s.alt}
                fill
                sizes="(min-width: 1100px) 50vw, 1px"
                className={styles.stageImg}
              />
            ))}
            </div>
            <div className={styles.stageShade} aria-hidden="true" />
            <div className={styles.chips}>
              {STAGES.map((s, i) => (
                <span key={s.chip} data-tv-stage-chip={i} data-active={i === 0 ? '' : undefined} className={styles.chip}>
                  {s.chip}
                </span>
              ))}
            </div>
            <div className={styles.stageFoot}>
              <p data-tv-stage-caption="" className={styles.caption}>
                {STAGE_CAPTIONS[0]}
              </p>
              <div className={styles.bar} aria-hidden="true">
                <div data-tv-stage-bar="" className={styles.barFill} />
              </div>
            </div>
          </div>
        </div>

        {/* Below desktop (and at every width under reduced motion / no JS): stacked cards */}
        <ol className={styles.cards}>
          {STAGES.map((s, i) => (
            <li key={s.chip} data-tv-reveal="" className={styles.card}>
              <Image
                src={s.image.src}
                alt={s.alt}
                fill
                sizes="(min-width: 1100px) 45vw, (min-width: 768px) 90vw, 100vw"
                className={styles.stageImg}
              />
              <div className={styles.stageShade} aria-hidden="true" />
              <span className={`${styles.chip} ${styles.cardChip}`} data-active="">
                {s.chip}
              </span>
              <p className={`${styles.caption} ${styles.cardCaption}`}>{STAGE_CAPTIONS[i]}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
