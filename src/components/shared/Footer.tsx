import Image from 'next/image';
import Link from 'next/link';
import { MotionScope } from '@/lib/motion/MotionScope';
import { images } from '@/data/assets';
import { contact, footer } from '@/data/site';
import { FooterDoodle } from './FooterDoodle';
import styles from './Footer.module.css';

/** Site footer, verbatim from the mockups (dark, radius 40 40 0 0). */
export function Footer() {
  return (
    <footer className={`${styles.footer} tv-dark`}>
      <MotionScope className={styles.inner} core={{ intro: false, words: false, parallax: false, counters: false }}>
        <div className={styles.top}>
          <div className={styles.statement}>
            <Image src={images.logoWhite.src} width={132} height={36} alt="Truvolt" className={styles.logo} />
            <h2 data-tv-reveal="" className={styles.heading}>
              {footer.heading}
            </h2>
          </div>
          <FooterDoodle className={styles.doodle} />
        </div>
        <div className={styles.cols}>
          <div className={styles.col}>
            <span className={styles.label}>Company</span>
            {footer.company.map((l) => (
              <Link key={l.href} href={l.href} className={styles.link}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className={styles.col}>
            <span className={styles.label}>Products</span>
            {footer.products.map((l) => (
              <Link key={l.href} href={l.href} className={styles.link}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className={`${styles.col} ${styles.wide}`}>
            <span className={styles.label}>Head office</span>
            <p className={styles.address}>
              {contact.addressLines.map((line, i) => (
                <span key={line}>
                  {line}
                  {i < contact.addressLines.length - 1 && <br />}
                </span>
              ))}
            </p>
            <p className={styles.gst}>GSTIN {contact.gstin}</p>
          </div>
          <div className={`${styles.col} ${styles.wide}`}>
            <span className={styles.label}>Contact</span>
            <a href={`mailto:${contact.email}`} className={styles.link}>
              {contact.email}
            </a>
            {contact.phones.map((p) => (
              <a key={p.tel} href={`tel:${p.tel}`} className={styles.link}>
                {p.label}
              </a>
            ))}
            <a href={contact.linkedin} className={styles.link}>
              LinkedIn
            </a>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>{footer.copyright}</span>
          <span className={styles.legal}>
            {footer.legal.map((l) => (
              <a key={l} href="#" className={styles.legalLink}>
                {l}
              </a>
            ))}
          </span>
        </div>
      </MotionScope>
    </footer>
  );
}
