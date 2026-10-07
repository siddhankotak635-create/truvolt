import type { Metadata } from 'next';
import { MotionScope } from '@/lib/motion/MotionScope';
import { Button } from '@/components/shared/Button';
import { Eyebrow } from '@/components/shared/Eyebrow';
import styles from './not-found.module.css';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you were looking for does not exist.',
};

export default function NotFound() {
  return (
    <MotionScope>
      <section id="top" className={styles.hero}>
        <div className={`container grid12 ${styles.grid}`}>
          <div className={styles.copy}>
            <Eyebrow data-tv-reveal="" className={styles.eyebrow}>
              Error 404
            </Eyebrow>
            <h1 data-tv-split="" className={`h1 ${styles.title}`}>
              This circuit is open. The page you wanted is not here.
            </h1>
          </div>
          <div data-tv-reveal="" className={styles.aside}>
            <Button href="/" arrow magnet>
              Back to Home
            </Button>
          </div>
        </div>
      </section>
    </MotionScope>
  );
}
