import Image from 'next/image';
import { Eyebrow } from '@/components/shared/Eyebrow';
import { images } from '@/data/assets';
import { contact } from '@/data/site';
import { MapFacade } from '@/components/contact/MapFacade';
import { StandardMarquee } from './StandardMarquee';
import styles from './About.module.css';

const DIRECTIONS =
  'https://www.google.com/maps/dir/?api=1&destination=29%2F1%20Nirmal%20Chandra%20Street%2C%20Bowbazar%2C%20Kolkata%20700012';
const MAP_SRC =
  'https://maps.google.com/maps?q=29%2F1%20Nirmal%20Chandra%20Street%2C%20Bowbazar%2C%20Kolkata%2C%20West%20Bengal%20700012&t=m&z=17&output=embed&iwloc=near';

export function AboutHero() {
  return (
    <section id="top" className={styles.hero} aria-labelledby="about-title">
      <div className={styles.heroMain}>
        <Eyebrow data-tv-reveal="" className={styles.heroEyebrow}>
          About Truvolt
        </Eyebrow>
        <h1 id="about-title" data-tv-split="" className={styles.heroTitle}>
          We design, manufacture, test and commission the machines that keep industry running.
        </h1>
      </div>
      <p data-tv-reveal="" className={styles.heroMeta}>
        Kolkata, India
        <br />
        Est. 1970
        <br />
        ISO 9001 · RWTÜV
      </p>
    </section>
  );
}

const LEGACY_LINES = [
  'Truvolt Engineering Co. Pvt. Ltd. is established in Kolkata to design and build power and special-purpose transformers.',
  'Designs are type-tested at CPRI, ERDA, IIT and Jadavpur University. The quality system is certified by RWTÜV Systems GmbH.',
  'Units run in nine countries across Asia, the Middle East and Africa, for utilities, steel plants, refineries and EPC contractors.',
];

export function Legacy() {
  return (
    <div className={styles.legacyWrap}>
      <section data-tv-legacy="" className={styles.legacy} aria-label="Legacy">
        <Image
          data-tv-legacy-img=""
          src={images.about1.src}
          width={images.about1.width}
          height={images.about1.height}
          alt="Truvolt works"
          sizes="100vw"
          priority
          className={styles.legacyImg}
        />
        <div className={styles.legacyShade} aria-hidden="true" />
        <div className={styles.legacyInner}>
          <p className={styles.legacyLabel}>Five decades, one standard</p>
          <div className={styles.legacyGrid}>
            {/* Server markup is the end state (reduced motion); AboutMotion counts it up from 1970. */}
            <p data-tv-year="" className={styles.legacyYear}>
              2026
            </p>
            <div className={styles.legacyLines}>
              {LEGACY_LINES.map((l, i) => (
                <p key={i} data-tv-legacy-line={i} className={styles.legacyLine}>
                  {l}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function WhoWeAre() {
  return (
    <section className={styles.who} aria-labelledby="who-title">
      <div className={styles.whoCopy}>
        <Eyebrow data-tv-reveal="" className={styles.label}>
          Who we are
        </Eyebrow>
        <h2 id="who-title" data-tv-reveal="" className={styles.h2}>
          India&apos;s Trusted Transformer Manufacturer Since 1970
        </h2>
        <p data-tv-words="" className={styles.wordsPara}>
          Our reputation is built on robust design, stringent testing and dependable field performance.
        </p>
        <p data-tv-reveal="" className={styles.body}>
          Operating under the brand TRUVOLT, we design, manufacture, test and commission a wide range of power and
          special-purpose transformers for utilities and industries across India and internationally. Proven across
          demanding environments in Nepal, Bangladesh, Bhutan, Zambia, Kenya, Nigeria, Ethiopia and Iraq.
        </p>
      </div>
      <div className={styles.whoMedia}>
        <div data-tv-reveal="" className={styles.photo}>
          <Image
            data-tv-parallax="0.12"
            src={images.home1Truck.src}
            width={images.home1Truck.width}
            height={images.home1Truck.height}
            alt="Transformer assembly"
            sizes="(min-width: 1100px) 50vw, 100vw"
            className={styles.parallaxImg}
          />
        </div>
        <div data-tv-reveal="" className={styles.map}>
          <MapFacade
            title="Truvolt Engineering Co. Pvt. Ltd. on Google Maps"
            src={MAP_SRC}
            frameClassName={styles.mapFrame}
            lines={[...contact.addressLines]}
            directions={DIRECTIONS}
          />
        </div>
      </div>
    </section>
  );
}

export function StandardSection() {
  return (
    <section className={styles.standard} aria-labelledby="standard-title">
      <div className={styles.standardHead}>
        <h2 id="standard-title" data-tv-reveal="" className={`${styles.h2} ${styles.standardTitle}`}>
          Five Decades of Engineering. One Consistent Standard.
        </h2>
        <p data-tv-reveal="" className={styles.standardLede}>
          An unbroken commitment to quality from raw material selection to final commissioning. Hover or tap to pause.
        </p>
      </div>
      <StandardMarquee />
    </section>
  );
}
