import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';
import type { ImageAsset } from '@/data/assets';
import { contact } from '@/data/site';
import { Button } from './Button';
import styles from './CtaBand.module.css';

export type CtaBandProps = {
  image: ImageAsset;
  alt: string;
  eyebrow: ReactNode;
  heading: ReactNode;
  button: { label: string; href: string; arrow?: boolean };
  /** Mono lines under the button. Default: email + "+91 33 2236 0314 / 0316" */
  contactLines?: ReactNode[];
  /** Card min-height in px. Default 480 (Home: 520) */
  minHeight?: number;
  /** Image opacity. Default .5 (Home: .55) */
  imageOpacity?: number;
  /** Section id. Default "contact" */
  id?: string;
  /** Add 120px top padding (Home). Default false (About/Quality: 0 top). */
  padTop?: boolean;
  /** Magnetic button. Default true */
  magnet?: boolean;
  className?: string;
};

/**
 * Dark image CTA card (About/Quality/Home `#contact`). Server component: its
 * data-tv-reveal and data-tv-parallax hooks animate when it sits inside a page
 * motion scope (useTvMotion + initPageCore, or <MotionScope>).
 */
export function CtaBand({
  image,
  alt,
  eyebrow,
  heading,
  button,
  contactLines = [contact.email, contact.phonesShort],
  minHeight = 480,
  imageOpacity = 0.5,
  id = 'contact',
  padTop = false,
  magnet = true,
  className,
}: CtaBandProps) {
  const style = { '--cta-min-h': `${minHeight}px`, '--cta-img-o': imageOpacity } as CSSProperties;
  return (
    <section id={id} className={[styles.section, padTop && styles.padTop, className].filter(Boolean).join(' ')}>
      <div data-tv-reveal="" className={`${styles.card} tv-dark`} style={style}>
        <Image
          data-tv-parallax="0.1"
          src={image.src}
          width={image.width}
          height={image.height}
          alt={alt}
          sizes="(min-width: 2400px) 2010px, 92vw"
          className={styles.img}
        />
        <div className={styles.overlay} aria-hidden="true" />
        <div className={styles.grid}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h2 className={styles.heading}>{heading}</h2>
          </div>
          <div className={styles.actions}>
            <Button href={button.href} variant="light" size="lg" magnet={magnet} arrow={button.arrow}>
              {button.label}
            </Button>
            {contactLines.length > 0 && (
              <p className={styles.lines}>
                {contactLines.map((l, i) => (
                  <span key={i}>
                    {l}
                    {i < contactLines.length - 1 && <br />}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
