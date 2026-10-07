import Image from 'next/image';
import { SEGMENTS } from './segments';
import styles from './Segments.module.css';

export function Segments() {
  return (
    <section className={styles.segments} aria-label="Segments">
      {SEGMENTS.map((s, i) => {
        const n = String(i + 1).padStart(2, '0');
        return (
          <article key={s.kicker} data-tv-seg="" className={styles.seg}>
            <Image
              src={s.image.src}
              width={s.image.width}
              height={s.image.height}
              alt={s.title}
              sizes="100vw"
              className={styles.img}
              data-tv-seg-img=""
            />
            <div className={styles.shade} aria-hidden="true" />
            <div className={styles.inner}>
              <div className={styles.head}>
                <p className={styles.kicker}>
                  {n} · {s.kicker}
                </p>
                <h2 className={styles.title}>{s.title}</h2>
              </div>
              <div className={styles.side}>
                <p className={styles.body}>{s.body}</p>
                <ul className={styles.tags} aria-label="Tags">
                  {s.tags.map((t) => (
                    <li key={t} className={styles.tag}>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
