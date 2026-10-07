'use client';

import { useCallback, useEffect, useRef, useState, type FocusEvent, type PointerEvent } from 'react';
import { Eyebrow } from '@/components/shared';
import { countries } from '@/data/site';
import styles from './Footprint.module.css';

type MapMsg = { tvMap?: 'hover' | 'leave'; id?: number; name?: string };

/**
 * #footprint: country list + D3 map iframe (public/map.html).
 * postMessage both ways:
 *   out → iframe: {tvMap:'hot'|'cool', id} on row hover (mouse), tap (touch) and keyboard focus
 *   in  ← iframe: {tvMap:'hover', id, name} shows the tooltip and highlights the row; {tvMap:'leave'} clears it
 */
export function Footprint() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const tapped = useRef<number | null>(null);
  const lastPointer = useRef<string>('mouse');
  const [tip, setTip] = useState<{ id: number; name: string } | null>(null);

  const post = useCallback((msg: { tvMap: 'hot' | 'cool'; id: number }) => {
    frameRef.current?.contentWindow?.postMessage(msg, '*');
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!frameRef.current || e.source !== frameRef.current.contentWindow) return;
      const m = (e.data || {}) as MapMsg;
      if (m.tvMap === 'hover' && typeof m.id === 'number') setTip({ id: m.id, name: m.name ?? '' });
      if (m.tvMap === 'leave') setTip(null);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const onEnter = (id: number) => (e: PointerEvent) => {
    lastPointer.current = e.pointerType;
    if (e.pointerType === 'mouse') post({ tvMap: 'hot', id });
  };
  const onLeave = (id: number) => (e: PointerEvent) => {
    if (e.pointerType === 'mouse') post({ tvMap: 'cool', id });
  };
  // Touch / pen: a tap makes this country hot and the previous one cool.
  const onTap = (id: number) => () => {
    if (lastPointer.current === 'mouse') return;
    if (tapped.current !== null && tapped.current !== id) post({ tvMap: 'cool', id: tapped.current });
    tapped.current = id;
    post({ tvMap: 'hot', id });
  };
  // Keyboard focus mirrors hover.
  const onFocus = (id: number) => (e: FocusEvent<HTMLButtonElement>) => {
    if (e.currentTarget.matches(':focus-visible')) post({ tvMap: 'hot', id });
  };
  const onBlur = (id: number) => () => {
    if (tapped.current !== id) post({ tvMap: 'cool', id });
  };

  return (
    <section id="footprint" className={`${styles.section} tv-dark`} aria-labelledby="footprint-title">
      <div className={styles.inner}>
        <div className={styles.side}>
          <div className={styles.intro}>
            <Eyebrow data-tv-reveal="" tone="dark" className={styles.eyebrow}>
              Footprint
            </Eyebrow>
            <h2 data-tv-reveal="" id="footprint-title" className={styles.title}>
              Every Unit Is Measured From Kolkata.
            </h2>
            <p data-tv-reveal="" className={styles.lead}>
              Nine countries, up to 10,000 km from the works. Designs proven in tropical and extreme climates, shipped with
              full IEC / BS documentation for customs and regulatory clearance.
            </p>
          </div>
          <ul data-tv-reveal="" className={styles.list}>
            {countries.map((c) => (
              <li key={c.id} data-tv-country={c.id} data-hot={tip?.id === c.id ? '' : undefined} className={styles.item}>
                <button
                  type="button"
                  className={styles.country}
                  onPointerEnter={onEnter(c.id)}
                  onPointerLeave={onLeave(c.id)}
                  onPointerDown={(e) => (lastPointer.current = e.pointerType)}
                  onClick={onTap(c.id)}
                  onFocus={onFocus(c.id)}
                  onBlur={onBlur(c.id)}
                >
                  <span className={styles.countryName}>{c.name}</span>
                  <span className={styles.region}>{c.region}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div data-tv-reveal="" className={styles.map}>
          <iframe ref={frameRef} data-tv-map="" src="/map.html" title="Countries served by Truvolt" className={styles.frame} />
          <p data-tv-map-tip="" className={styles.tip} style={{ opacity: tip ? 1 : 0 }} aria-hidden="true">
            {tip?.name || 'India'}
          </p>
          <p className={styles.note}>Distances measured from the Kolkata works · Natural Earth data</p>
        </div>
      </div>
    </section>
  );
}
