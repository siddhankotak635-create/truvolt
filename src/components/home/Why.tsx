import Image from 'next/image';
import { images } from '@/data/assets';
import styles from './Why.module.css';

const LABS = ['CPRI', 'ERDA', 'IIT', 'Jadavpur University'];

/** Spotlight glow (driven by HomeMotion on fine pointers). */
const Glow = () => <div data-tv-spot-glow="" className={styles.glow} aria-hidden="true" />;

/** #why: 12-column bento (spans 7/5/4/4/4). */
export function Why() {
  return (
    <section id="why" className={styles.section} aria-labelledby="why-title">
      <div className={styles.head}>
        <h2 data-tv-reveal="" id="why-title" className={styles.title}>
          Designed, Manufactured and Tested for Reliable Delivery
        </h2>
        <p data-tv-reveal="" className={styles.lead}>
          Five decades of transformer engineering, ISO-certified processes and type-tested designs, from enquiry to
          commissioning.
        </p>
      </div>
      <div className={styles.grid}>
        <article data-tv-spot="" className={`${styles.card} ${styles.iso} tv-dark`}>
          <Image
            src={images.qualityProcess1.src}
            alt=""
            fill
            sizes="(min-width: 1100px) 60vw, 100vw"
            className={styles.isoImg}
          />
          <div className={styles.isoShade} aria-hidden="true" />
          <p className={`${styles.kicker} ${styles.rel}`}>ISO 9001 · RWTÜV Systems GmbH</p>
          <div className={styles.rel}>
            <h3 className={styles.h3Lg}>ISO-Certified Quality System</h3>
            <p className={styles.textDark}>
              Full material traceability from CRGO coil to dispatched unit, with stage-wise inspection at every production
              milestone.
            </p>
          </div>
          <Glow />
        </article>

        <article data-tv-spot="" className={`${styles.card} ${styles.white} ${styles.span5}`}>
          <p className={styles.kicker}>Type-tested</p>
          <div>
            <div className={styles.labs}>
              {LABS.map((l) => (
                <span key={l} className={styles.lab}>
                  {l}
                </span>
              ))}
            </div>
            <h3 className={styles.h3Md}>Validated Before It Ships</h3>
            <p className={styles.text}>Every design proven at India&apos;s national laboratories before release to production.</p>
          </div>
          <Glow />
        </article>

        <article data-tv-spot="" className={`${styles.card} ${styles.white} ${styles.span4}`}>
          <p className={styles.kicker}>Materials</p>
          <div>
            <p className={styles.big}>
              99.9<span className={styles.pct}>%</span>
            </p>
            <h3 className={styles.h3Sm}>Electrolytic Copper</h3>
            <p className={styles.textSm}>With CRGO cores for low loss and tight voltage regulation.</p>
          </div>
          <Glow />
        </article>

        <article data-tv-spot="" className={`${styles.card} ${styles.accentCard} ${styles.span4}`}>
          <p className={`${styles.kicker} ${styles.kickerAccent}`}>Response</p>
          <div>
            <p className={styles.big}>
              48<span className={styles.small}> to </span>72<span className={styles.small}> hrs</span>
            </p>
            <h3 className={styles.h3Sm}>Detailed Technical Proposal</h3>
            <p className={`${styles.textSm} ${styles.textAccent}`}>
              From receipt of your specification to a priced, compliant design.
            </p>
          </div>
          <Glow />
        </article>

        <article data-tv-spot="" className={`${styles.card} ${styles.white} ${styles.span4}`}>
          <p className={styles.kicker}>Export-proven</p>
          <div>
            <p className={styles.big}>9</p>
            <h3 className={styles.h3Sm}>Countries, Tropical to Extreme</h3>
            <p className={styles.textSm}>Full IEC / BS documentation for customs and regulatory clearance.</p>
          </div>
          <Glow />
        </article>
      </div>
    </section>
  );
}
