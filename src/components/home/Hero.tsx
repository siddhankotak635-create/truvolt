import Image from 'next/image';
import { Button, Eyebrow } from '@/components/shared';
import { images } from '@/data/assets';
import styles from './Hero.module.css';

const STATS = [
  { value: '36', unit: 'MVA', space: true, label: 'Max capacity' },
  { value: '66', unit: 'kV', space: true, label: 'Voltage class' },
  { value: '55', unit: '+ yrs', space: false, label: 'Since 1970' },
];

/** Pinned hero (#top). Motion: HomeMotion (intro timeline + pinned media expansion). */
export function Hero() {
  return (
    <section id="top" data-tv-hero="" className={styles.hero} aria-label="Truvolt Engineering">
      <div data-tv-hero-copy="" className={styles.copy}>
        <div className={styles.grid}>
          <div className={styles.head}>
            <Eyebrow data-tv-reveal="" className={styles.eyebrow}>
              Power &amp; Transformer Manufacturing · Kolkata · Est. 1970
            </Eyebrow>
            <h1 data-tv-split="" className={styles.title}>
              Reliable Power for a World of Industrial Applications
            </h1>
          </div>
          <div className={styles.intro}>
            <p data-tv-reveal="" className={styles.lead}>
              Power, distribution and furnace-duty transformers from 25 kVA to 36 MVA, up to 66 kV. Designed, tested and
              commissioned for utilities and industry across 9 countries.
            </p>
            <div data-tv-reveal="" className={styles.actions}>
              <Button href="#range">Explore Our Range</Button>
              <Button href="/contact" variant="outline">
                Request a Proposal
              </Button>
            </div>
          </div>
          <div data-tv-reveal="" data-tv-hero-stats="" className={styles.stats}>
            {STATS.map((s) => (
              <div key={s.label}>
                <p className={styles.statValue}>
                  {s.value}
                  {s.space ? ' ' : ''}
                  <span>{s.unit}</span>
                </p>
                <p className={styles.statLabel}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div data-tv-hero-media="" className={styles.media}>
        <Image
          src={images.heroTransformer.src}
          alt="Truvolt power transformer in the test bay"
          fill
          priority
          sizes="100vw"
          className={styles.img}
        />
        <div className={styles.shade} aria-hidden="true" />
        <div data-tv-hero-caption="" className={styles.caption}>
          <span>Fig. 01 · 36 MVA / 33 kV power transformer</span>
          <span>ONAN / ONAF · IS 2026</span>
        </div>
      </div>

      <div data-tv-hero-statement="" className={styles.statement}>
        <p>Every unit leaves Kolkata only after it has proven itself under fault, heat and load.</p>
      </div>
    </section>
  );
}
