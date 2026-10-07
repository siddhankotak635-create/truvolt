import { ContactForm } from './ContactForm';
import styles from './InquirySection.module.css';

/** #form: sticky info cards (left) + inquiry form (right). On mobile the form comes first. */
export function InquirySection() {
  return (
    <section id="form" className={styles.section} aria-label="Inquiry form">
      <div data-tv-reveal="" className={styles.formCol}>
        <ContactForm />
      </div>

      <div className={styles.info}>
        <div data-tv-reveal="" className={styles.card}>
          <p className={styles.label}>Head office</p>
          <p className={styles.address}>
            Wellington Apartment
            <br />
            29/1 Nirmal Chandra Street
            <br />
            Kolkata 700012, India
          </p>
        </div>
        <a data-tv-reveal="" href="mailto:contact@truvolt.com" className={`${styles.card} ${styles.cardLink}`}>
          <p className={styles.label}>Email</p>
          <p className={styles.big}>contact@truvolt.com</p>
        </a>
        <div data-tv-reveal="" className={styles.card}>
          <p className={styles.label}>Phone</p>
          <p className={`${styles.big} ${styles.phones}`}>
            <a href="tel:+913322360314">+91 33 2236 0314</a>
            <br />
            <a href="tel:+913322360316">+91 33 2236 0316</a>
          </p>
        </div>
        <div data-tv-reveal="" className={`${styles.card} ${styles.dark}`}>
          <p className={styles.label}>Response time</p>
          <p className={styles.response}>
            48 <span className={styles.to}>to</span> 72 <span className={styles.hrs}>hrs</span>
          </p>
          <p className={styles.gst}>GSTIN 19AABCT1433A1ZW</p>
        </div>
      </div>
    </section>
  );
}
