'use client';

import { useEffect, useRef, useState } from 'react';
import type { Client } from '@/data/site';
import styles from './Clients.module.css';

/**
 * Client logo with the mockup's error fallback: if the image fails, show the
 * short name as text. Plain <img> (not next/image) so onError can swap it; the files are already
 * sized for the logo box at 2x (see assets.ts `logos`), with fixed width/height to reserve space.
 */
export function ClientLogo({ client }: { client: Client }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // The error may fire before hydration attaches onError.
  useEffect(() => {
    const im = ref.current;
    if (im && im.complete && im.naturalWidth === 0) setFailed(true);
  }, []);

  if (!client.logo || failed) {
    return <span className={failed ? styles.logoFallback : styles.logoText}>{client.short}</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={client.logo.src}
      width={client.logo.width}
      height={client.logo.height}
      alt={client.logoAlt ?? `${client.name} logo`}
      loading="lazy"
      decoding="async"
      data-tv-logo-name={client.short}
      className={styles.logoImg}
      onError={() => setFailed(true)}
    />
  );
}
