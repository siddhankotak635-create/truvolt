import Image from 'next/image';
import { Eyebrow, StandardsMatrix } from '@/components/shared';
import { images } from '@/data/assets';
import { STATUS_WORKS, TESTS } from './tests';
import styles from './Quality.module.css';

export function QualityHero() {
  return (
    <section id="top" className={styles.hero} aria-labelledby="quality-title">
      <div className={styles.heroMain}>
        <Eyebrow data-tv-reveal="" className={styles.heroEyebrow}>
          Quality &amp; Policy
        </Eyebrow>
        <h1 id="quality-title" data-tv-split="" className={styles.heroTitle}>
          Quality is not an add-on. It is built into every step.
        </h1>
      </div>
      <p data-tv-reveal="" className={styles.heroLede}>
        Every Truvolt transformer is built under a rigorous, ISO-aligned quality system and tested to IS / IEC
        standards, at our works or at accredited third-party laboratories, before it leaves our gates.
      </p>
    </section>
  );
}

const first = TESTS[0];

export function TestBay() {
  return (
    <div className={styles.bayWrap}>
      <section data-tv-bay="" className={`${styles.bay} tv-dark`} aria-labelledby="bay-title">
        <div className={styles.bayGrid}>
          <div className={styles.bayCopy}>
            <Eyebrow data-tv-reveal="" tone="dark" className={styles.bayLabel}>
              Test sequence · every unit
            </Eyebrow>
            <h2 id="bay-title" data-tv-reveal="" className={styles.bayTitle}>
              Tested to the Standard. Proven in the Field.
            </h2>
            <p data-tv-reveal="" className={styles.bayLede}>
              The routine sequence every transformer goes through before dispatch. Each reading is logged to the
              unit&apos;s test certificate.
            </p>
            <div data-tv-reveal="" className={styles.reading}>
              <p className={styles.readingLabel}>
                Live reading · <span data-tv-bay-name="">{first.name}</span>
              </p>
              <p className={styles.readingValue}>
                <span data-tv-bay-val="">
                  {first.val.toLocaleString('en-US', { minimumFractionDigits: first.fmt, maximumFractionDigits: first.fmt })}
                </span>
                <span data-tv-bay-unit="" className={styles.readingUnit}>
                  {first.unit}
                </span>
              </p>
              <div className={styles.barTrack}>
                <div data-tv-bay-bar="" className={styles.bar} />
              </div>
              <p data-tv-bay-status="" className={styles.status}>
                {STATUS_WORKS}
              </p>
            </div>
          </div>
          <div className={styles.listClip}>
            <ol data-tv-bay-list="" className={styles.list}>
              {TESTS.map((t, i) => (
                <li key={t.title} data-tv-test="" className={styles.test}>
                  <span className={styles.testN}>T{String(i + 1).padStart(2, '0')}</span>
                  <div className={styles.testBody}>
                    <h3 className={styles.testTitle}>{t.title}</h3>
                    <p className={styles.testText}>{t.body}</p>
                  </div>
                  <span className={styles.testWhere}>{t.where}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}

const STATS: { n: number; suffix?: string; label: string }[] = [
  { n: 8, label: 'Tests in the standard sequence' },
  { n: 4, label: 'Standards complied with: IS 2026, IS 11171, IEC, BS' },
  { n: 5, label: 'Industry sectors with active installed base' },
  { n: 100, suffix: '%', label: 'Stage-wise inspection coverage' },
];

export function Stats() {
  return (
    <section className={styles.stats} aria-label="Quality in numbers">
      <div className={styles.statsGrid}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.stat}>
            <p className={styles.statNum}>
              {/* Final value in the markup; initCounters counts it up from 0. */}
              <span data-tv-count={s.n}>{s.n}</span>
              {s.suffix}
            </p>
            <p className={styles.statLabel}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const PILLARS = ['ISO-aligned practices', 'In-house design validation', 'Full material traceability'];

export function QualitySystem() {
  return (
    <section className={styles.system} aria-labelledby="system-title">
      <div className={styles.systemCopy}>
        <Eyebrow data-tv-reveal="" className={styles.label}>
          Manufacturing &amp; quality systems
        </Eyebrow>
        <h2 id="system-title" data-tv-reveal="" className={styles.h2}>
          From Raw Material to Final Dispatch
        </h2>
        <p data-tv-words="" className={styles.wordsPara}>
          Every unit can be tracked back to its source: core laminations, copper conductors, insulation systems.
        </p>
        <p data-tv-reveal="" className={styles.body}>
          Truvolt operates under ISO-aligned quality management practices that govern every stage of manufacturing.
          In-house design validation ensures every product meets its specification before physical manufacturing
          begins. Stage-wise inspections at each production milestone catch and correct defects before they progress.
        </p>
      </div>
      <div className={styles.systemMedia}>
        <div data-tv-reveal="" className={styles.photo}>
          <Image
            data-tv-parallax="0.12"
            src={images.home1.src}
            width={images.home1.width}
            height={images.home1.height}
            alt="Inspection on the shop floor"
            sizes="(min-width: 1100px) 50vw, 100vw"
            className={styles.parallaxImg}
          />
        </div>
        <ul className={styles.pillars}>
          {PILLARS.map((p, i) => (
            <li key={p} data-tv-reveal="" className={`${styles.pillar} ${i === 2 ? styles.pillarDark : ''}`}>
              <p className={styles.pillarN}>{String(i + 1).padStart(2, '0')}</p>
              <h3 className={styles.pillarTitle}>{p}</h3>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function StandardsSection() {
  return (
    <section className={styles.standards} aria-labelledby="standards-title">
      <div className={styles.standardsHead}>
        <h2 id="standards-title" data-tv-reveal="" className={`${styles.h2} ${styles.standardsTitle}`}>
          Which Standard Governs Which Unit
        </h2>
        <p data-tv-reveal="" className={styles.standardsLede}>
          Compliant: designed and tested to the standard. On request: documented to the standard for export projects.
          Beyond standards, Truvolt meets utility and PSU specifications from WBSEDCL, SBPDCL, NBPDCL, MSEDCL, CSPDCL
          and APSPDCL.
        </p>
      </div>
      <StandardsMatrix data-tv-reveal="" />
    </section>
  );
}
