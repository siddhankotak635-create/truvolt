import Image from 'next/image';
import Link from 'next/link';
import { CARDS, productHref, type ProductCardData, type ProductKey } from '@/data/products';
import styles from './ProductCard.module.css';

export type ProductCardProps = {
  /** Card data (from CARDS) or a product key to look it up */
  product: ProductCardData | ProductKey;
  /** rail: flex:none, width set by the caller (Home #range) · grid: fills its cell (default) */
  size?: 'rail' | 'grid';
  /** next/image sizes. Defaults suit the chosen size. */
  sizes?: string;
  priority?: boolean;
  /** Heading level for the title. Default 'h3'. */
  headingAs?: 'h2' | 'h3' | 'h4';
  className?: string;
};

/** 4:5 product card from Home #range. Links to /products#<key>. */
export function ProductCard({ product, size = 'grid', sizes, priority, headingAs: H = 'h3', className }: ProductCardProps) {
  const p = typeof product === 'string' ? CARDS.find((c) => c.key === product)! : product;
  const cls = [styles.card, size === 'rail' ? styles.rail : styles.grid, className].filter(Boolean).join(' ');
  return (
    <Link href={productHref(p.key)} data-tv-card="" className={cls}>
      <Image
        src={p.image.src}
        width={p.image.width}
        height={p.image.height}
        alt={p.alt}
        priority={priority}
        sizes={sizes ?? (size === 'rail' ? '(min-width: 2534px) 760px, (min-width: 1734px) 30vw, (min-width: 1100px) 520px, (min-width: 768px) 440px, (min-width: 440px) 360px, 82vw' : '(min-width: 1100px) 33vw, (min-width: 768px) 50vw, 100vw')}
        className={styles.img}
      />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.body}>
        <p className={styles.spec}>{p.spec}</p>
        <H className={styles.title}>{p.title}</H>
        <p className={styles.copy}>{p.copy}</p>
      </div>
    </Link>
  );
}
