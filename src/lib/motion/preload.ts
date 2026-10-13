'use client';

import { getImageProps } from 'next/image';
import * as assets from '@/data/assets';

/**
 * Asset warm-up for page transitions (MotionProvider):
 * - preloadRoute(path): fetch + decode the destination's above-the-fold images, through the exact
 *   next/image srcset/sizes the page renders, so the browser picks the same candidate and the
 *   page's <img> is a cache hit. Started on link hover/focus and when the shutter closes; the
 *   shutter waits for it (capped) before opening.
 * - warmRoutes(except): the same for every other route, at idle, low priority, after first load.
 * - warmFilm(): the first chunk of the Portfolio film (never the whole file) on Portfolio intent.
 *
 * The route → images map comes from `criticalImages` in src/data/assets.ts when present (read
 * defensively: string, ImageAsset or { src, sizes } entries), else the fallback below.
 */

type Critical = { src: string; sizes?: string; plain?: boolean; width?: number; height?: number; fill?: boolean; poster?: boolean };

const ASSETS = assets as unknown as Record<string, unknown>;

function normalise(entry: unknown): Critical | null {
  if (typeof entry === 'string') return { src: entry };
  if (entry && typeof entry === 'object' && typeof (entry as { src?: unknown }).src === 'string') {
    const e = entry as { src: string; sizes?: unknown; plain?: unknown; width?: unknown; height?: unknown; fill?: unknown };
    const width = typeof e.width === 'number' ? e.width : undefined;
    const height = typeof e.height === 'number' ? e.height : undefined;
    const sizes = typeof e.sizes === 'string' ? e.sizes : undefined;
    return {
      src: e.src,
      sizes,
      plain: e.plain === true,
      width,
      height,
      fill: e.fill === true,
      // width/height without sizes: rendered through props.src (the film poster), not a srcset
      poster: !sizes && !!width && !!height && e.fill !== true,
    };
  }
  return null;
}

function fallbackMap(): Record<string, Critical[]> {
  const images = (ASSETS.images ?? {}) as Record<string, { src: string } | undefined>;
  const media = (ASSETS.media ?? {}) as Record<string, string | undefined>;
  const map: Record<string, Critical[]> = {};
  const add = (path: string, c: Critical | null) => {
    if (c && c.src) (map[path] ??= []).push(c);
  };
  add('/', images.heroTransformer ? { src: images.heroTransformer.src, sizes: '100vw' } : null);
  add('/about', images.about1 ? { src: images.about1.src, sizes: '100vw' } : null);
  add('/products', images.distribution ? { src: images.distribution.src, sizes: '(min-width: 1100px) 50vw, 100vw' } : null);
  add('/portfolio', media.heroPoster ? { src: media.heroPoster, plain: true } : null);
  return map;
}

let routeMap: Record<string, Critical[]> | null = null;
function criticalMap(): Record<string, Critical[]> {
  if (routeMap) return routeMap;
  // Computed keys: read defensively. Specs (with the page's render props) win over bare srcs.
  const raw = ASSETS['criticalImageSpecs'] ?? ASSETS['criticalImages'];
  if (raw && typeof raw === 'object') {
    const map: Record<string, Critical[]> = {};
    for (const [path, v] of Object.entries(raw as Record<string, unknown>)) {
      const list = (Array.isArray(v) ? v : [v]).map(normalise).filter((c): c is Critical => !!c);
      if (list.length) map[path] = list;
    }
    routeMap = map;
  } else routeMap = fallbackMap();
  return routeMap;
}

/** '/products/', '/products?x' → '/products'; unknown sub-paths fall back to their section. */
function routeKey(pathname: string): string {
  const path = pathname.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/';
  const map = criticalMap();
  if (map[path]) return path;
  const section = '/' + (path.split('/')[1] ?? '');
  return map[section] ? section : path;
}

const loaded = new Map<string, Promise<void>>();

function loadImage(c: Critical, low: boolean): Promise<void> {
  // The poster has a single URL (w=1920, no srcset): phones must not pull it during idle/hover warm-up.
  if (low && c.poster && window.innerWidth < 1100) return Promise.resolve();
  let src = c.src;
  let srcSet: string | undefined;
  let sizes: string | undefined;
  if (!c.plain && src.startsWith('/') && !src.endsWith('.svg')) {
    try {
      const { props } = c.poster
        ? getImageProps({ src, alt: '', width: c.width!, height: c.height! })
        : c.width && c.height && !c.fill
          ? getImageProps({ src, alt: '', width: c.width, height: c.height, sizes: c.sizes ?? '100vw' })
          : getImageProps({ src, alt: '', fill: true, sizes: c.sizes ?? '100vw' });
      src = props.src;
      // the poster attribute uses props.src only; everything else goes through srcset + sizes
      srcSet = c.poster ? undefined : props.srcSet;
      sizes = c.poster ? undefined : props.sizes;
    } catch {
      /* keep the plain URL */
    }
  }
  // srcset candidates depend on the viewport, so the cache key includes the chosen inputs + width bucket
  const key = `${srcSet ?? src}|${sizes ?? ''}|${srcSet ? Math.round(window.innerWidth / 100) : 0}`;
  const hit = loaded.get(key);
  if (hit) return hit;
  const img = new Image();
  img.decoding = 'async';
  if (low) img.setAttribute('fetchpriority', 'low');
  if (srcSet) {
    if (sizes) img.sizes = sizes;
    img.srcset = srcSet; // the browser picks the viewport's candidate, as the page's <img> will
  } else img.src = src;
  const p = img.decode().catch(() => undefined);
  loaded.set(key, p);
  return p;
}

/** Fetch + decode the above-the-fold images of `pathname`. Resolves when all decoded (or failed). */
export function preloadRoute(pathname: string, low = false): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const list = criticalMap()[routeKey(pathname)] ?? [];
  return Promise.all(list.map((c) => loadImage(c, low))).then(() => undefined);
}

/** At idle after the first load: warm every other route's critical images (low priority, one per idle slot). */
export function warmRoutes(except: string): void {
  if (typeof window === 'undefined') return;
  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return;
  const current = routeKey(except);
  const paths = Object.keys(criticalMap()).filter((p) => p !== current);
  const idle = (fn: () => void) => {
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) ric(fn, { timeout: 4000 });
    else setTimeout(fn, 400);
  };
  const next = () => {
    const path = paths.shift();
    if (!path) return;
    idle(() => {
      void preloadRoute(path, true).then(next);
    });
  };
  next();
}

let filmWarm = false;
/** First chunk of the film for the current viewport (the source the <video> will pick). Never the whole file. */
export function warmFilm(): void {
  if (filmWarm || typeof window === 'undefined') return;
  filmWarm = true;
  const media = (ASSETS.media ?? {}) as Record<string, string | undefined>;
  const desktop = window.matchMedia('(min-width: 1100px)').matches;
  const src = desktop ? media.heroVideo : (media.heroVideoMobile ?? media.heroVideoSd ?? media.heroVideo);
  if (!src) return;
  try {
    void fetch(src, {
      headers: { Range: 'bytes=0-1048575' },
      priority: 'low',
    } as RequestInit & { priority?: 'low' | 'high' | 'auto' }).catch(() => undefined);
  } catch {
    /* ignore */
  }
  const fp = ASSETS['filmPoster'] as { src?: string; width?: number; height?: number } | undefined;
  if (fp?.src && fp.width && fp.height) void loadImage({ src: fp.src, width: fp.width, height: fp.height, poster: true }, true);
  else if (media.heroPoster) void loadImage({ src: media.heroPoster, plain: true }, true);
}
