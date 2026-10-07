import { Eyebrow } from '@/components/shared/Eyebrow';
import styles from './ContactHero.module.css';

export function ContactHero() {
  return (
    <section id="top" className={styles.hero} aria-labelledby="contact-title">
      <div className={styles.copy}>
        <Eyebrow data-tv-reveal="" className={styles.eyebrow}>
          Contact
        </Eyebrow>
        <h1 id="contact-title" data-tv-split="" className={`h1 ${styles.title}`}>
          Send the specification. We return a proposal in 48 to 72 hours.
        </h1>
      </div>
      <p data-tv-reveal="" className={styles.lead}>
        Rating, voltage class, application and site conditions are enough to start. Our engineers reply with a detailed
        technical proposal.
      </p>
    </section>
  );
}
