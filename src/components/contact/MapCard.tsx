import { contact } from '@/data/site';
import { MapFacade } from './MapFacade';
import styles from './MapCard.module.css';

const MAP_SRC =
  'https://maps.google.com/maps?q=29%2F1%20Nirmal%20Chandra%20Street%2C%20Bowbazar%2C%20Kolkata%2C%20West%20Bengal%20700012&t=m&z=17&output=embed&iwloc=near';
const DIRECTIONS =
  'https://www.google.com/maps/dir/?api=1&destination=29%2F1%20Nirmal%20Chandra%20Street%2C%20Bowbazar%2C%20Kolkata%20700012';

export function MapCard() {
  return (
    <section className={styles.section} aria-label="Map">
      <div data-tv-reveal="" className={styles.card}>
        {/* Click-to-load: the Google embed stays off the page until asked for. */}
        <MapFacade
          title="Truvolt Engineering Co. Pvt. Ltd. on Google Maps"
          src={MAP_SRC}
          frameClassName={styles.frame}
          lines={[...contact.addressLines]}
          padBottom
        />
        <div className={styles.pills}>
          <span className={`${styles.pill} ${styles.pillDark}`}>Head office · Kolkata 700012</span>
          <a href={DIRECTIONS} target="_blank" rel="noopener noreferrer" className={`${styles.pill} ${styles.pillLink}`}>
            Directions
          </a>
        </div>
      </div>
    </section>
  );
}
