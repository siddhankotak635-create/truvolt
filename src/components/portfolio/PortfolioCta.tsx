import { Button } from '@/components/shared/Button';
import styles from './PortfolioCta.module.css';

/** Imageless dark CTA card (differs from the shared image CtaBand). */
export function PortfolioCta() {
  return (
    <section id="contact" className={styles.section} aria-labelledby="portfolio-cta-title">
      <div data-tv-reveal="" className={`tv-dark ${styles.card}`}>
        <div className={styles.copy}>
          <p className={styles.kicker}>Ready to power your next project?</p>
          <h2 id="portfolio-cta-title" className={styles.title}>
            Share your specifications. A detailed technical proposal follows in 48 to 72 hours.
          </h2>
        </div>
        <div className={styles.actions}>
          <Button href="/contact" variant="light" size="lg" arrow magnet className={styles.btn}>
            Request a Quote
          </Button>
        </div>
      </div>
    </section>
  );
}
