import Image from 'next/image';
import Link from 'next/link';
import { images } from '@/data/assets';
import styles from './NameSection.module.css';

/** #name: the name / definition section. */
export function NameSection() {
  return (
    <section id="name" className={styles.section}>
      <div className={styles.copy}>
        <h2 data-tv-reveal="" className={styles.title}>
          The Name Reflects Our Standard
        </h2>
        <p data-tv-words="" className={styles.words}>
          A transformer is judged by one thing: whether the voltage it delivers is true to specification, year after year,
          under fault, under heat, under load.
        </p>
        <p data-tv-reveal="" className={styles.body}>
          Truvolt Engineering Co. Pvt. Ltd. was established in Kolkata in 1970 to build machines that hold that line. Five
          decades on, our units run in steel plants, DISCOM substations and refineries across India, Nepal, Bangladesh,
          Bhutan, Zambia, Kenya, Nigeria, Ethiopia and Iraq.
        </p>
        <Link data-tv-reveal="" href="/about" className={styles.link}>
          Discover Our Story <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className={styles.side}>
        <div data-tv-reveal="" className={styles.media}>
          <Image
            data-tv-parallax="0.12"
            src={images.industrialPlantNight.src}
            width={images.industrialPlantNight.width}
            height={images.industrialPlantNight.height}
            alt="Industrial plant at night"
            sizes="(min-width: 1100px) 50vw, 100vw"
            className={styles.img}
          />
        </div>
        <div data-tv-reveal="" className={`${styles.card} tv-dark`}>
          <div>
            <p className={styles.word}>Truvolt</p>
            <p className={styles.pron}>\ ˈtruː-ˌvōlt \</p>
          </div>
          <p className={styles.def}>
            <em>noun.</em> True voltage. Output that matches the nameplate, at the terminals, for the life of the asset.
          </p>
        </div>
      </div>
    </section>
  );
}
