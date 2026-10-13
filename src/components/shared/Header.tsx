'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/motion/gsap';
import { useMotion } from '@/lib/motion/MotionProvider';
import { BP, isReduced } from '@/lib/motion/state';
import { images } from '@/data/assets';
import { contact, nav } from '@/data/site';
import { Button } from './Button';
import styles from './Header.module.css';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
/** Layout width of the indicator box (Header.module.css .ind); its visible width is scaleX × this. */
const IND_BASE = 100;

/** Relative luminance (0–1) of an `rgb()/rgba()` string, or null when mostly transparent. */
function lumaOf(color: string): number | null {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  if (a < 0.5) return null;
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * True when the page surface under the pill's resting position is dark. Walks up from the topmost
 * page element at the pill's centre (skipping the header and media) to the first opaque background.
 * Needs no page markup: dark panels (Flagship/Range, Footprint, Process, Portfolio segments, footer)
 * are detected from their own background colour. Only run when the surface under the pill can have
 * changed (see the skin effect below), never per scroll frame.
 */
function surfaceIsDark(nav: HTMLElement): boolean | null {
  const x = window.innerWidth / 2;
  const y = nav.offsetTop + nav.offsetHeight / 2; // offsetTop ignores the hide-on-scroll transform
  const stack = document.elementsFromPoint(x, y);
  // skip the header and the page-transition shutter (it covers the page while a route loads)
  const below = stack.find((el) => !el.closest('header') && !el.closest('[data-tv-transition]'));
  if (!below) return null;
  for (let el: Element | null = below; el; el = el.parentElement) {
    const l = lumaOf(getComputedStyle(el).backgroundColor);
    if (l !== null) return l < 0.2;
  }
  return false;
}

/**
 * Fixed "ruled pill" navigation ([data-tv-nav]), mockup refs/mockups/pill-p1-ruled.html.
 * Solid light pill split into hairline cells: logo (+ EST. plate ≥1280) | uppercase links with a
 * 3px accent bar on the pill's bottom edge | phone (≥1280) | ink CONTACT end-cap (magnet).
 * Over dark surfaces (and while the sheet is open) it switches to the ink skin.
 * <1100px: logo | menu button (| CONTACT cap ≥600px), opening a full-screen dark sheet.
 */
export function Header() {
  const pathname = usePathname();
  const { menuOpen, setMenuOpen } = useMotion();
  const navRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const indRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetShown, setSheetShown] = useState(false);
  const wasOpen = useRef(false);

  /* ---------------- desktop indicator ---------------- */
  const activeLink = useCallback(
    () => wrapRef.current?.querySelector<HTMLAnchorElement>('[data-tv-navlink][aria-current]') ?? null,
    [],
  );
  const moveTo = useCallback((el: HTMLElement, immediate = false) => {
    const wrap = wrapRef.current;
    const ind = indRef.current;
    if (!wrap || !ind) return;
    const r = el.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    if (!r.width) return;
    // the bar spans the label, not the link's padding
    const cs = getComputedStyle(el);
    const pl = parseFloat(cs.paddingLeft) || 0;
    const pr = parseFloat(cs.paddingRight) || 0;
    // .ind is a fixed 100px box scaled from its left edge (scaleX, not width: no layout per frame)
    const vars = { x: r.left - w.left + pl, scaleX: Math.max(0, r.width - pl - pr) / IND_BASE, opacity: 1 };
    if (immediate || isReduced()) gsap.set(ind, vars);
    else gsap.to(ind, { ...vars, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
  }, []);
  const rest = useCallback(
    (immediate = false) => {
      const a = activeLink();
      if (a) moveTo(a, immediate);
      else if (indRef.current) gsap.to(indRef.current, { opacity: 0, duration: immediate ? 0 : 0.3, overwrite: 'auto' });
    },
    [activeLink, moveTo],
  );

  // initial placement (and after webfonts change link widths)
  useIsoLayoutEffect(() => {
    rest(true);
    document.fonts?.ready.then(() => rest(true));
    const onResize = () => rest(true);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [rest]);

  // re-rest on route change
  const firstPath = useRef(true);
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    rest();
  }, [pathname, rest]);

  /* ---------------- light / dark skin from the surface under the pill ----------------
   * The answer can only change when an opaque surface starts or stops crossing the pill's centre
   * line. One IntersectionObserver, rooted on that 1px line, watches every element with an opaque
   * background (found once per route / refresh); any crossing schedules the exact hit test above
   * for the next frame. Pins, transforms, the leaving preloader and the film card are all seen by
   * the observer, so there is no per-frame scroll work and no polling. */
  const [onDark, setOnDark] = useState(false);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    let raf = 0;
    let io: IntersectionObserver | null = null;
    let scanTimer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      raf = 0;
      const d = surfaceIsDark(nav);
      if (d !== null) setOnDark(d);
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    const opaque = (el: Element) => {
      const bg = getComputedStyle(el).backgroundColor;
      const m = bg.match(/rgba?\(([^)]+)\)/);
      if (!m) return false;
      const parts = m[1].split(/[ ,/]+/).filter(Boolean);
      return parts.length < 4 || Number(parts[3]) >= 0.5;
    };
    const watch = () => {
      io?.disconnect();
      const y = Math.round(nav.offsetTop + nav.offsetHeight / 2);
      const h = window.innerHeight;
      io = new IntersectionObserver(queue, { rootMargin: `${-y}px 0px ${-(h - y - 1)}px 0px`, threshold: 0 });
      const roots = [document.getElementById('main'), ...Array.from(document.querySelectorAll('footer'))];
      for (const root of roots) {
        if (!root) continue;
        if (opaque(root)) io.observe(root);
        root.querySelectorAll('*').forEach((el) => {
          if (!(el instanceof SVGElement) && opaque(el)) io!.observe(el);
        });
      }
      queue();
    };
    const rescan = () => {
      clearTimeout(scanTimer);
      scanTimer = setTimeout(watch, 60);
    };
    watch();
    const t = window.setTimeout(queue, 700); // after route-change scroll reset and late layout
    // Layout changes (pins created, product switch, fonts) end in a refresh: re-collect surfaces.
    ScrollTrigger.addEventListener('refresh', rescan);
    window.addEventListener('resize', rescan);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(scanTimer);
      window.clearTimeout(t);
      io?.disconnect();
      ScrollTrigger.removeEventListener('refresh', rescan);
      window.removeEventListener('resize', rescan);
    };
  }, [pathname]);

  /* ---------------- mobile sheet ---------------- */
  const close = useCallback(() => setMenuOpen(false), [setMenuOpen]);

  // close when crossing into desktop
  useEffect(() => {
    const mq = window.matchMedia(BP.desktop);
    const onChange = () => mq.matches && setMenuOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [setMenuOpen]);

  useEffect(() => {
    if (menuOpen) setSheetShown(true);
  }, [menuOpen]);

  // open / close animation
  useIsoLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const reduced = isReduced();
    if (menuOpen && sheetShown) {
      wasOpen.current = true;
      if (navRef.current) gsap.to(navRef.current, { yPercent: 0, duration: 0.3, overwrite: 'auto' });
      const links = sheet.querySelectorAll('[data-tv-sheet-link]');
      const foot = sheet.querySelectorAll('[data-tv-sheet-foot]');
      const tl = gsap.timeline();
      // visible immediately (so focus can land), faded in via opacity
      gsap.set(sheet, { visibility: 'visible' });
      if (reduced) {
        gsap.set(sheet, { opacity: 1 });
      } else {
        tl.fromTo(sheet, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' })
          .fromTo(links, { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: 'power4.out' }, 0.05)
          .fromTo(foot, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out' }, 0.3);
      }
      const first = sheet.querySelector<HTMLElement>('[data-tv-sheet-link]');
      first?.focus({ preventScroll: true });
      return () => {
        tl.kill();
      };
    }
    if (!menuOpen && sheetShown) {
      const done = () => setSheetShown(false);
      const tw = reduced ? (done(), null) : gsap.to(sheet, { autoAlpha: 0, duration: 0.3, ease: 'power2.in', onComplete: done });
      if (wasOpen.current) {
        wasOpen.current = false;
        btnRef.current?.focus({ preventScroll: true });
      }
      return () => {
        tw?.kill();
      };
    }
  }, [menuOpen, sheetShown]);

  // Esc + focus trap while open
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab' || !sheetRef.current || !btnRef.current) return;
      const items = [btnRef.current, ...Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))];
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && (i <= 0)) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && (i === items.length - 1 || i === -1)) {
        e.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen, close]);

  return (
    <header className={styles.header}>
      <nav
        ref={navRef}
        data-tv-nav=""
        aria-label="Primary"
        data-tv-nav-theme={menuOpen || onDark ? 'dark' : 'light'}
        className={`${styles.nav} ${menuOpen || onDark ? styles.dark : ''} ${menuOpen ? styles.navOpen : ''}`}
      >
        <div className={styles.brand}>
          <Link href="/" aria-label="Truvolt home" className={styles.logo}>
            <Image
              src={images.logoWhite.src}
              width={110}
              height={30}
              alt="Truvolt"
              priority
              className={styles.logoImg}
            />
          </Link>
          <span className={styles.plate}>
            EST. 1970
            <br />
            KOLKATA · ISO 9001
          </span>
        </div>

        <div ref={wrapRef} data-tv-navlinks="" className={styles.links} onMouseLeave={() => rest()}>
          <span ref={indRef} data-tv-nav-ind="" aria-hidden="true" className={styles.ind} />
          {nav.filter((item) => item.href !== '/contact').map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-tv-navlink=""
                aria-current={active ? (pathname === item.href ? 'page' : 'true') : undefined}
                className={`${styles.link} ${active ? styles.active : ''}`}
                onMouseEnter={(e) => moveTo(e.currentTarget)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <a href={`tel:${contact.phones[0].tel}`} className={styles.phone}>
          {contact.phones[0].label}
        </a>

        <button
          ref={btnRef}
          type="button"
          className={styles.menuBtn}
          aria-expanded={menuOpen}
          aria-controls="tv-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={styles.menuLabel} aria-hidden="true">
            {menuOpen ? 'Close' : 'Menu'}
          </span>
          <span className={styles.burger} aria-hidden="true">
            <span />
            <span />
          </span>
        </button>

        <Button
          href="/contact"
          size="sm"
          magnet
          arrow
          className={styles.cta}
          aria-current={isNavActive(pathname, '/contact') ? 'page' : undefined}
        >
          Contact
        </Button>
      </nav>

      <div
        id="tv-menu"
        ref={sheetRef}
        className={`${styles.sheet} tv-dark`}
        hidden={!sheetShown}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        data-lenis-prevent=""
      >
        <div className={styles.sheetInner}>
          <ul className={styles.sheetLinks}>
            {nav.map((item, i) => {
              const active = isNavActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    data-tv-sheet-link=""
                    aria-current={active ? (pathname === item.href ? 'page' : 'true') : undefined}
                    className={`${styles.sheetLink} ${active ? styles.sheetActive : ''}`}
                    onClick={close}
                  >
                    <span className={styles.sheetNum} aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className={styles.sheetFoot}>
            <div data-tv-sheet-foot="">
              <Button href="/contact" variant="light" size="lg" arrow onClick={close}>
                Get in Touch
              </Button>
            </div>
            <div data-tv-sheet-foot="" className={styles.sheetContact}>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
              {contact.phones.map((p) => (
                <a key={p.tel} href={`tel:${p.tel}`}>
                  {p.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
