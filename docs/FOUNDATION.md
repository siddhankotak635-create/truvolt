# Truvolt site: foundation API

Next.js 15 (App Router, TypeScript, `src/`), CSS Modules, GSAP + ScrollTrigger + Lenis.
Run `npm run dev` (http://localhost:3000) or `npm run build && npm start`.
The mockups in `../Truvolt Site Refactor (1)/*.dc.html` are the source of truth. This file is the API page tasks build on.

## 1. File layout

```
src/
  app/
    layout.tsx            html/fonts, skip link, <MotionProvider><Header/><main/><Footer/><PageTransition/></MotionProvider>
    fonts.ts              next/font: --font-sans (Schibsted Grotesk), --font-mono (JetBrains Mono)
    page.tsx              /
    about/ products/ portfolio/ quality/ contact/   (/products is one page for all six lines; see section 11)
    not-found.tsx         404 (+ not-found.module.css)
  components/shared/      Header, Footer (+ FooterDoodle), Button, Eyebrow, CtaBand, ProductCard, StandardsMatrix, PageTransition (+ index.ts)
  components/<page>/      page-owned sections and motion components (page tasks)
  lib/motion/             MotionProvider, useTvMotion, helpers, MotionScope, state (BP), gsap (+ index.ts)
  data/assets.ts          images (local /images/*, with intrinsic sizes), logos, media.heroVideo
  data/products.ts        PRODUCTS (verbatim from Product.dc.html), CARDS (Home #range copy), getProduct, isProductKey, DEFAULT_PRODUCT, productHref (/products#key)
  data/site.ts            company, contact, nav, footer, clientRails, countries, standardsMatrix/Columns, markLabel
  styles/tokens.css       CSS custom properties
  styles/global.css       reset, Lenis, focus, keyframes, utilities, intro pre-hide
public/
  images/                 30 images (24 photos incl. film-poster.jpg + logos/)
  video/                  Portfolio film (substation-1080.mp4, substation-720.mp4)
  map.html                D3 export map (iframe), postMessage protocol (section 8)
```

Imports: use the `@/` alias, for example `import { CtaBand } from '@/components/shared';` and `import { useTvMotion, initPageCore, BP } from '@/lib/motion';`.

## 2. Shared components

All of these are server components except `Header`. You can render them from server pages.

### Button
```tsx
<Button href="/contact" arrow magnet>Request a Proposal</Button>        // next/link, dark
<Button href="#range" variant="dark">Explore Our Range</Button>          // same-page anchor: Lenis scroll, offset −100
<Button href="/contact" variant="outline">Request a Proposal</Button>
<Button href="mailto:contact@truvolt.com" variant="light" size="lg" magnet>Send Your Specification</Button>  // <a>
<Button onClick={fn} type="submit" block>Send</Button>                   // <button>
```
| prop | values | default | notes |
|---|---|---|---|
| `variant` | `dark` · `light` · `outline` · `outlineLight` | `dark` | `light` = `#DCE7F3` on dark surfaces; `outlineLight` = outline on dark |
| `size` | `sm` (10/18, 14px, nav) · `md` (12/20, 14px) · `lg` (16/24, 15px, CTA bands) | `md` | |
| `arrow` | boolean | false | appends `<span aria-hidden>→</span>`, nudged `x:4` on hover |
| `magnet` | boolean | false | adds `data-tv-magnet`: fill sweep + pointer follow (fine pointers only) |
| `block` | boolean | false | full width |
| `href` | string | | internal → `Link`; `mailto:`/`tel:`/`http(s)` → `<a>` (http opens in a new tab); omitted → `<button>` |

Hover states follow the mockup `style-hover`: dark gets `color:#fff`, `translateY(-1px)` and the CTA glow; light gets the black glow. On coarse pointers, buttons have `min-height: 44px`.

### Eyebrow
```tsx
<Eyebrow data-tv-reveal="">Quality &amp; Policy</Eyebrow>          // mono label, #4c535a
<Eyebrow tone="dark">Footprint</Eyebrow>                             // #9fb2c7 on dark surfaces
```
Props: `tone` (`light` | `dark`), `as` (`p` by default), `className`, plus any HTML attribute. Spacing is set by the caller through `className`.
Eyebrows have **no leading rule** (the user asked for the "— LABEL" dash to go). The `rule` prop was removed, so it cannot come back; do not add a `::before` line either. Copy uses no em or en dashes: write a full stop, comma or colon instead.

### CtaBand (image CTA, `#contact`)
```tsx
// About (defaults: minHeight 480, imageOpacity .5, no top padding, magnet button)
<CtaBand image={images.homeLast} alt="Truvolt works" eyebrow="Get in touch"
  heading="Have a Transformer Requirement? Our Engineers Respond in 48 to 72 Hours."
  button={{ label: 'Send Your Specification', href: 'mailto:contact@truvolt.com' }} />
// Home
<CtaBand padTop minHeight={520} imageOpacity={0.55} magnet={false} image={images.homeLast} ... />
// Quality
<CtaBand image={images.qualityProcess8} alt="Test bay" eyebrow="Test certificates & documentation"
  heading="Need Type-Test Reports or Certification Documents?" button={{ label: 'Request Documents', href: 'mailto:contact@truvolt.com' }} />
```
Other props: `contactLines` (ReactNode[], default email + `+91 33 2236 0314 / 0316`), `id` (default `contact`), `button.arrow`, `className`.
It renders `<section id="contact">` with `max-width: var(--tv-container); padding: 0 var(--tv-gutter) 120px`. The card carries `data-tv-reveal` and the image carries `data-tv-parallax="0.1"`; both animate only when the band sits inside your page's motion scope. Layout: copy spans 7 columns and the actions sit at column 9, span 4. Below 900px they stack.
The Portfolio CTA is a different (imageless) design; build it in the page.

### ProductCard (Home `#range` card)
```tsx
{CARDS.map((c) => <ProductCard key={c.key} product={c} size="rail" />)}   // width min(520px,78vw), flex:none
<ProductCard product="dry" />                                              // size="grid": fills its cell
```
Props: `product` (`ProductCardData` or key), `size` (`rail` | `grid`), `sizes`, `priority`, `headingAs` (default `h3`), `className`.
It is a `Link` to `/products#<key>` (via `productHref`) with `data-tv-card`. On `/products` the click switches the product in place (section 11). On fine pointers the image scales to 1.06 on hover (CSS, .8s). If a page drives the scale with GSAP instead, that is fine.

### StandardsMatrix
```tsx
<StandardsMatrix data-tv-reveal="" />           // data from site.ts standardsMatrix / standardsColumns
```
A real `<table>`: white, radius 24, columns 1.4fr + 4×1fr (via `<colgroup>`). Marks: Compliant is ink, On request is the accent, Not applicable is ink at .4 opacity. Rows (`tr[data-tv-row]`) get a `#DCE7F3` hover. Under 768px each row is a stacked card. To port the Quality row stagger, select the rows in your setup: `gsap.fromTo(q('[data-tv-row]'), {opacity:0,x:-12}, {...})`.

### Header / Footer
These are mounted by the layout; do not render them in pages. The Header active state comes from `usePathname()`; `/products` activates "Products". The footer reveal runs on its own.
A page that holds the viewport (the Portfolio film story) can hide the nav by adding `tv-nav-hidden` to `<html>`. The Header CSS slides the pill out with the `translate` property (it composes with the GSAP hide-on-scroll transform) and sets `visibility:hidden !important` after .5s, so the links leave the tab order. The page must remove the class when it releases and in its setup cleanup.
The footer top sits on a 12-column grid: logo and statement in columns 1–7, and `FooterDoodle` (client, `aria-hidden`) in columns 8–12, bottom-aligned. `FooterDoodle` is an inline-SVG blueprint of an oil-filled transformer. Its paths use `pathLength="1"` and draw on in sequence when the footer enters (2.4s, `power2.inOut`); then a pulse runs along the sine wave every 3s and the bushing tips glow, paused while the footer is offscreen. The dash values are tweened with `attr` because CSSPlugin rounds px values. Reduced motion and no-JS show the finished drawing. Below 1100px it sits under the statement (max-height 260px, right-aligned); below 768px it scales down with a heavier stroke.

### Overriding shared styles
CSS Module order between files is not guaranteed. When you pass `className` to override a shared component's property, use a more specific selector (for example `.section .myBtn`), not a single class.

## 3. Tokens, variables and utilities (`styles/tokens.css`, `styles/global.css`)

| group | variables |
|---|---|
| surfaces | `--tv-bg` #DCE7F3 · `--tv-ink` #161819 · `--tv-placeholder` #c3d3e4 · `--tv-dark-2` #22272c · `--tv-dark-3` #1c2126 |
| text on light | `--tv-text` #2e3337 · `--tv-text-muted` #4c535a |
| text on dark | `--tv-on-dark-muted` #9fb2c7 · `--tv-on-dark-soft` #c7d3e0 · `--tv-on-dark` #e2eaf3 |
| accents | `--tv-accent` oklch(.52 .19 258) · `--tv-accent-light` oklch(.78 .14 258) |
| hairlines | `--tv-line-08/12/18/25` (ink alpha) · `--tv-dline-10/16/18/25` (#DCE7F3 alpha) |
| radii | `--tv-r-pill` 999 · `--tv-r-40` · `-32` · `-28` · `-24` · `-22` · `-20` · `-14` |
| shadows | `--tv-shadow-nav`, `--tv-shadow-nav-scrolled`, `--tv-shadow-nav-ind`, `--tv-glow-cta` (0 10px 24px rgba(40,90,220,.25)), `--tv-glow-light`, `--tv-shadow-card-hover` |
| motion | `--tv-ease` cubic-bezier(.2,.7,.2,1) |
| type | `--tv-sans`, `--tv-mono`, `--tv-h1` clamp(40px,6.4vw,96px), `--tv-h2` clamp(34px,4.2vw,58px), `--tv-h2-cta` clamp(34px,4.6vw,64px), `--tv-lead` 18, `--tv-body` 17 (minimums drop on phones) |
| layout | `--tv-container` 2200 (cap, ultra-wide only) · `--tv-gutter` clamp(16px, 4vw, 96px) · `--tv-content-w` · `--tv-inset` · `--tv-gap` 24 (16 below 768) · `--tv-section` 160 → 112 (<1100) → 80 (<768) |

### Fluid layout
The layout scales with the screen. The side gutter is fluid: 16px on phones, about 58px at 1440, about 77px at 1920 and 96px from 2400px up. The container cap (2200px) only matters on ultra-wide screens. Measure-capped text (`max-width: NNch`) keeps line lengths readable.

| token | value | use |
|---|---|---|
| `--tv-gutter` | `clamp(16px, 4vw, 96px)` | side padding of every content section (`padding-inline: var(--tv-gutter)`) |
| `--tv-container` | `2200px` | `max-width` of content sections |
| `--tv-content-w` | `min(calc(var(--tv-container) - 2*var(--tv-gutter)), calc(100% - 2*var(--tv-gutter)))` | content width relative to the parent; with `margin-inline:auto` the box edges sit on the content edges. Used by the nav pill and the Home hero / Portfolio film cards |
| `--tv-inset` | `max(var(--tv-gutter), calc((100% - var(--tv-container)) / 2 + var(--tv-gutter)))` | side margin or padding that puts a full-width box's edges on the content edges |

Rules:
- **Content edges.** Every section uses `max-width: var(--tv-container); margin: 0 auto; padding-inline: var(--tv-gutter)`. Never hard-code a width (1320/1272/1240) or a 24px side padding.
- **Nav pill.** `width: var(--tv-content-w)`, so its edges line up with the content edges at every width.
- **Inset dark panels** (Footprint, Process, Flagship + Range, About legacy, Quality bay, Portfolio segments) are inset by `--tv-inset`, so their outer edges line up with the content edges and the nav pill (16px from the screen edge on phones). The footer stays full-bleed with a rounded top.
- **Pinned panels.** GSAP pins padded boxes cleanly but not margined ones. Put the inset on a full-width wrapper as `padding-inline: var(--tv-inset)` and pin the panel inside it (About `.legacyWrap`, Quality `.bayWrap`, Home `.wrap`), or pin the padded wrapper itself (Home `#range`). Never put the inset on both.
- **Motion code** reads layout widths with `layoutMetrics(box?)` from `@/lib/motion`. It returns `{ content }` (the `--tv-content-w` width) in px, measured with a probe, because `clamp()` and `%` cannot be parsed. Call it from function-based tween values with `invalidateOnRefresh: true`.
- **Home Range rail.** The pinned panel must fit in `100svh`. Cards are `min(clamp(520px, 30vw, 760px), 78vw, (100svh - --range-chrome) * .8)` wide; HomeMotion measures `--range-chrome` (head height + track padding, `[data-tv-hscroll-head]`) and keeps it current with a ResizeObserver. The scroll distance is `track.scrollWidth - panel.clientWidth`.
- **`next/image` `sizes`** must describe the fluid widths (vw, or a px cap at 2400px and up), not the old 1272px card.

Utility classes (global):
- `.container`: max `--tv-container` with gutter padding.
- `.grid12`: 12 columns with `--tv-gap`. It does **not** collapse automatically; set spans per breakpoint in your module.
- `.section`, `.section-top`, `.section-bottom`: padding from `--tv-section`.
- `.h1`, `.h2`: clamps, weight 600, letter-spacing −.045em / −.04em, line-height .94 / 1, balanced.
- `.lead`, `.mono` (12px, .14em, uppercase), `.tv-dark` (ink background, light text, accent-light focus ring).
- `.visually-hidden`.

Keyframes: `tv-marquee` (translateX 0 → −50%), `tv-kenburns`, `tv-spin`. Global `a` has no underline and turns accent on hover. Override this inside dark cards, as the mockup `style-hover` does.

## 4. Breakpoints

| name | range | CSS | `BP` (for gsap.matchMedia) |
|---|---|---|---|
| desktop | ≥1100 (must match the mockup) | `@media (min-width: 1100px)` | `BP.desktop` |
| tablet | 768–1099 | `@media (min-width: 768px) and (max-width: 1099px)` | `BP.tablet` |
| below desktop | <1100 | `@media (max-width: 1099px)` | `BP.belowDesktop` |
| mobile | <768 | `@media (max-width: 767px)` | `BP.mobile` |
| small | <420 | `@media (max-width: 419px)` | `BP.small` |

Also available: `BP.fine` `(pointer: fine)`, `BP.coarse`, `BP.reduced`, `BP.motionOk`. CSS variables cannot be used inside media queries; use these literals.

## 5. Writing page motion

The rules:
- Each page has one or more client components that call `useTvMotion(ref, setup)`.
- Every tween and ScrollTrigger must be created inside `setup` (or inside an `mm.add` callback).
- Everything is reverted automatically on unmount (route change), so nothing is left stale.
- `setup` runs after `document.fonts.ready`.

```tsx
// src/components/quality/QualityMotion.tsx
'use client';
import { useRef, type ReactNode } from 'react';
import { useTvMotion, initPageCore, BP } from '@/lib/motion';

export function QualityMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useTvMotion(ref, ({ gsap, ScrollTrigger, q, mm, scope, reduced, fine, lenis }) => {
    initPageCore(scope);                       // intro + reveal + words + parallax + counters

    if (reduced) return;                        // helpers already handled reduced motion

    const rows = q('[data-tv-row]');
    if (rows.length) gsap.fromTo(rows, { opacity: 0, x: -12 },
      { opacity: 1, x: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out', scrollTrigger: { trigger: rows[0], start: 'top 85%' } });

    mm.add(BP.desktop, () => {                  // pinned scene on desktop only
      gsap.to(q('[data-tv-bay-list]'), { y: () => -200, ease: 'none',
        scrollTrigger: { trigger: q('[data-tv-bay]')[0], start: 'top top', end: '+=560%', pin: true, scrub: 0.8, invalidateOnRefresh: true } });
    });
    mm.add(BP.belowDesktop, () => { /* simpler variant */ });

    if (fine) { /* pointer-only effects (tilt, spotlight) */ }
    // Optionally return a cleanup for non-GSAP listeners:
    const onResize = () => {}; window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });
  return <div ref={ref}>{children}</div>;
}

// src/app/quality/page.tsx (server component)
export default function QualityPage() {
  return <QualityMotion><Hero /><TestBay /><StandardsSection /><CtaBand ... /></QualityMotion>;
}
```

`setup` receives `{ gsap, ScrollTrigger, lenis, reduced, fine, mm, q, scope }`:
- `mm` is a `gsap.matchMedia()` owned by the hook and reverted with it.
- `q(sel)` is a scoped `querySelectorAll` that returns an array.
- `lenis` is null under reduced motion.

The third argument `deps` re-runs setup (after reverting) when a dependency changes. Prefer remounting with a `key` instead, for example `<ProductMotion key={active}>`.

Helpers called inside an `mm.add` callback are safe: `useTvMotion` wraps `mm.add` so their DOM restorers are collected per callback and run when that match reverts (and on unmount).

Event handlers that animate outside `setup` (for example `onClick={() => gsap.to(...)}`) are not tracked. Keep them short, or add the `ScrollTrigger`/tweens inside setup.

### Helpers (`@/lib/motion`)
Each takes `(scope, opts?)`, must be called inside a setup, and is idempotent. Under reduced motion each one does nothing and leaves the content fully visible.

| helper | hook | behaviour (mockup values) |
|---|---|---|
| `splitWords(scope)` | `[data-tv-split]` | wraps words in mask spans; inner `[data-tv-word]` starts at `translateY(110%)`. Original DOM restored on revert; `aria-label` set to the full text |
| `defaultIntro(scope, {delay, stagger, also})` | `[data-tv-split]`, `#top [data-tv-reveal]` | words → y:0, 1.1s, stagger .04, power4.out at 0.1s; then reveals from {y:20, opacity:0}, .9s, stagger .1. Returns the timeline. Held by the reveal gate after a page transition (section 12) |
| `afterReveal(tween)` | | pauses an intro tween/timeline while a page transition holds the reveal gate and plays it as the shutter opens; no-op otherwise. Use it for any custom hero intro (section 12) |
| `initReveal(scope, {y, start, selector})` | `[data-tv-reveal]` outside `#top` | from {y:36, opacity:0}, 1s power3.out, `top 88%` (Home mockup uses `y: 40`) |
| `initWords(scope)` | `[data-tv-words]` | masked line reveal: the paragraph is split into its rendered lines (word spans grouped by `offsetTop`), each line in an overflow-hidden mask rises `yPercent 100 → 0` with opacity 0 → 1, stagger .08, .9s power3.out, at `top 85%`. Plays once (not scrubbed) and ends fully opaque. Re-splits on resize (debounced 200ms, only when the paragraph width changed; an already-played paragraph re-splits at rest). Inline markup is flattened to text while split; the original nodes are restored on revert. Reduced motion: untouched |
| `initParallax(scope)` | `[data-tv-parallax="0.1"]` | yPercent −amt/2 → +amt/2 (amt = value×100), scrubbed against the **parent** (top bottom → bottom top). Give the image `inset:-8% 0; height:116%` |
| `initCounters(scope)` | `[data-tv-count="55"]` | **render the final number in the markup**; it counts 0 → N, 1.8s power2.out, `top 85%`. A counter already on screen at setup keeps its value (no flash) |
| `initPageCore(scope, opts)` | all of the above | `opts`: `intro` (true \| false \| IntroOptions), `reveal` (RevealOptions \| false), `words`, `parallax`, `counters` |
| `showPrehidden(scope)` | | makes the CSS-prehidden intro targets visible (see below) |
| `onRevert(fn)` | | registers a DOM restorer for the current scope |
| `scheduleRefresh(ms)` | | debounced `ScrollTrigger.refresh()` |

**Readability rule:** text must never sit below full opacity while it is in the reading zone (centred at 25–75% of the viewport). Reveals finish as text enters it; never scrub text opacity. Deliberate "inactive" states in interactive lists (Quality test bay .85 passed / .75 upcoming, About legacy lines .6, Products cutaway labels .75) stay at or above .55 and still meet 4.5:1 (3:1 for text ≥24px).

**`<MotionScope>`** is a client wrapper that runs `initPageCore` on its children. Use it for static sections with no custom motion: `<MotionScope as="section" core={{ intro: false }}>…</MotionScope>`. The 404 page and the footer use it.

### Intro and no-flash rules
- An inline head script adds `html.tv-motion` before first paint, unless reduced motion is set.
- While that class is present, `[data-tv-split]`, `#top [data-tv-reveal]` and `[data-tv-nav]` are `visibility:hidden` until JS reveals them. A CSS fallback shows them after 2.5s if JS never runs.
- `defaultIntro` and `splitWords` handle this for you.
- **A custom intro (Home) must** either animate the `#top [data-tv-reveal]` elements with `autoAlpha` (not `opacity`), or call `showPrehidden(scope)` after setting its "from" states.
- Put the page's hero in `<section id="top">`. Every other `[data-tv-reveal]` is rendered visible on the server and hidden by `initReveal` (below the fold, so it does not flash).
- Home: `initPageCore(scope, { intro: false })`, then build the preloader/hero timeline yourself with `splitWords(scope)` + `q('[data-tv-word]')`. The nav intro (y −20 → 0) runs once per full page load in the provider. Do not animate `[data-tv-nav]` from pages.
- The layout does not pre-hide pinned scenes. Set their initial states inside setup.

### Stopping Lenis (preloader, modals)
```ts
const { lenis } = ctx;  lenis?.stop();  /* … */  lenis?.start();
```
Or from components, use `useMotion().lenis`. `useMotion()` also gives `scrollTo(target, {offset, immediate})`, `menuOpen` and `setMenuOpen`.

## 6. Global `data-tv-*` hooks (handled by MotionProvider; no page code needed)

| hook | behaviour |
|---|---|
| `data-tv-magnet` | fine pointer only. Fill circle sweeps scale 0 → 30 (.6s power3.out) on enter and back (.5s power3.in) on leave. The fill is the accent, or the light accent when the element background is `#DCE7F3`. The element follows the pointer at x·.25 / y·.35 (.4s) and springs back with `elastic.out(1,0.4)` (.6s). Works for nodes added later (event delegation). With `<Button magnet>` the fill span is pre-rendered |
| `→` arrow | any `a`/`button` whose direct child `span` is `→` (or `[data-tv-arrow]`) nudges `x:4` (.35s) on hover |
| `a[href^="#"]` and same-path `/path#x` links | Lenis `scrollTo(target, {offset:-100})`; override with `data-offset="-20"`; opt out with `data-native`. Works for plain `<a>`, `next/link` and `<Button href="#x">`: the handler runs in the window **capture** phase and calls `preventDefault`, so `next/link` stands down (your own `Link onClick` still runs). Cross-page links (`/#range` from `/about`) go through the page transition, then the provider scrolls to the hash with offset −100 under the cover |
| any internal link to **another pathname** | page transition (section 12). Opt out with `data-native` or `target="_blank"` |
| `data-tv-nav`, `data-tv-navlink`, `data-tv-nav-ind` | Header internals (indicator, hide on scroll past 160px, scrolled shadow past 80px) |
| `data-tv-root` | the `<main>` wrapper |

Route change (under the page-transition shutter, section 12):
- scroll to 0 (or to the URL hash, offset −100);
- close the mobile sheet;
- `ScrollTrigger.refresh()` after two frames and again after 600ms.

Global refresh also runs on window `load`, on every `<img>` load (debounced), and through a 120ms-debounced ResizeObserver on `<main>`.

## 7. Images (`next/image` with local `/images/*`)

```tsx
import Image from 'next/image';
import { images } from '@/data/assets';

// sized (intrinsic width/height from assets.ts; style the size in CSS)
<Image src={images.about1.src} width={images.about1.width} height={images.about1.height}
       alt="Truvolt works" sizes="(min-width: 1100px) 50vw, 100vw" className={styles.img} />

// cover inside a positioned box
<div className={styles.media}>   {/* position:relative; aspect-ratio/height; overflow:hidden */}
  <Image src={images.power.src} alt="Power transformer" fill sizes="(min-width:1100px) 60vw, 100vw" style={{ objectFit: 'cover' }} />
</div>
```
- Use `priority` on the above-the-fold hero image only.
- Parallax images need the `inset:-8% 0; height:116%` box. Use width/height mode with a CSS class rather than `fill`, because `fill` forces `inset:0`.
- Use plain `<img>` only where `next/image` cannot work, for example the client-logo error fallback (`onError` → text), or a JS-driven `src`.
- Keys in `assets.ts` map back to the mockup URLs (see the comments there). For example `images.heroTransformer` is `2026/05/Power-Transformers.jpg`, and `images.power` is `2026/06/power-transformers.jpg`.
- `PRODUCTS[i].image` is a plain path string.
- The Portfolio film is self-hosted in `public/video/`: `media.heroVideo` (1080p) and `media.heroVideoSd` (720p, chosen below 1100px with `<source media>`), from Pexels 10151854 "Electricians Working at Substation" by Videas Cl (24fps, about 14s). Poster: `media.heroPoster` (`/images/film-poster.jpg`, 1280x720). The markup uses `preload="metadata"`; the motion path raises it to `auto`.

## 8. `public/map.html` protocol
Embed it with `<iframe data-tv-map src="/map.html" title="Countries served by Truvolt" />`.
- Outgoing (`window.parent.postMessage`):
  - `{tvMap:'hover', id, name}` when a served country is hovered, or tapped on touch;
  - `{tvMap:'leave'}` on mouse leave, or on a tap on empty map space.
- Incoming (`iframe.contentWindow.postMessage(msg,'*')`): `{tvMap:'hot', id}` and `{tvMap:'cool', id}`.

Ids are ISO numeric and match `countries` in `site.ts`. Register `window.addEventListener('message', …)` inside your setup and remove it in the returned cleanup.

## 9. Reduced motion and touch conventions
**Reduced motion** (`prefers-reduced-motion: reduce`):
- no Lenis and no magnet;
- helpers no-op, so content is fully visible and counters show their final values;
- CSS animations and transitions are collapsed;
- in your setup, check `reduced` and skip pins and scrubs entirely. Make sure the final state is the default markup state.

**Touch and coarse pointers:**
- No magnet, tilt or spotlight. Gate them on `fine` or `mm.add(BP.fine, …)`.
- Hover-only affordances need a tap equivalent (for example tap to pause a rail, tap a country `li` to send `hot`).
- Touch targets must be at least 44px (buttons do this already).
- Body text must be at least 15px on mobile.
- No horizontal scroll at 360px. `html`, `body` and `main` use `overflow-x: clip`, but do not rely on it; size rails with `overflow-x: auto` inside their own box.

## 10. Gotchas
- **Global keyframes in modules.** `tv-marquee`, `tv-kenburns` and `tv-spin` are global, but CSS Modules renames `animation-name` references, so they cannot be referenced from a `.module.css`. Define a local `@keyframes` in the module instead (About does this for the marquee).
- **List reset specificity.** The global `ol[class]` / `ul[class]` reset beats single-class module selectors (for example `.list`). Use more specific selectors (`.section .list`, or `ul.list`).
- **One dev server only.** Concurrent `next dev` servers (or a `next build` alongside `next dev`) corrupt the shared `.next` folder. Build from a copy of the repo (rsync without `node_modules`/`.next`, symlink `node_modules`) when another server is running.

## 11. Products page (`/products`)
One route for all six product lines, as in `Truvolt Product.dc.html`. There is no `/products/[slug]` route.

- **URL.** The hash picks the product: `/products#power`. No hash or an unknown one shows `distribution` (`DEFAULT_PRODUCT`). Link to a product with `productHref(key)` (`/products#key`). `next.config.ts` redirects `/products/:slug` to `/products?type=:slug` (307); on mount the page turns `?type=x` into `#x` with `replaceState`.
- **Components** (`src/components/product/`). `app/products/page.tsx` (server, title "Products") renders `ProductsExplorer` (client), which owns the active product and renders, in order: `ProductSwitcher`, then inside `role="tabpanel"` a `<ProductMotion key={active} mode>` with `ProductHero`, `ProductSpecs`, `Cutaway` (not for turnkey; dry gets its own third step) and `OtherProducts`, then `QuoteSection` in its own `MotionScope`, outside the key, so a half-filled form survives a switch.
- **Switching.** `select(key)` calls `pushState('#key')`, fades the hero copy (`#top [data-tv-swap]`) and image (`[data-tv-hero-media]`) out (.3s), swaps the product, lets `ProductMotion mode="swap"` fade the new one in (copy y 18 → 0, image scale 1.08 → 1), and scrolls to the top through Lenis. `hashchange` and `popstate` drive back/forward. A non-product hash (for example `#quote`) keeps the current product. After a switch `document.title` follows the product.
- **Links on the same page.** MotionProvider's anchor handler only scrolls when an element with that id exists, and next/link changes the hash with `pushState` (no `hashchange`). So `ProductsExplorer` listens for clicks in the document capture phase and switches on any same-page `/products#key` link (footer, "Also in the Range" cards). Do not give any element an id equal to a product key.
- **Switcher.** In normal flow, not sticky. `role="tablist"` with `<a role="tab" aria-selected aria-controls="product-panel">` pills (real hrefs, so open-in-new-tab works), roving `tabIndex`, and ← → Home End. It animates its own intro once per page load.
- **Hero actions** ("Request a Proposal", "Specifications") are buttons that call `useMotion().scrollTo('#quote' | '#specs')`. They do not touch the hash, which belongs to the switcher.
- **No Quality content.** The test sequence and the standards matrix live only on `/quality`. Products carries one line in the quote card: "Every unit is routine-tested before dispatch. See our test sequence and standards →" linking to `/quality`.

## 12. Page transitions ("Ruled Shutter")

Chosen in Task 21 (direction A; research, references and prototype in `.superpowers/sdd/transitions/`). Ten ink slats close over the page top to bottom, the destination name and a `000 → 066 kV` readout with an accent hairline play on the closed shutter (the Home preloader in miniature), then the slats open in the same wave and the new page's intro plays. About 1.2s per navigation; back/forward about 0.6s.

**Pieces**
- `components/shared/PageTransition.tsx` (+ `.module.css`): the layer, mounted once in `app/layout.tsx` outside `<main>`. Fixed, `z-index: 150` (above the nav 50 and the preloader 100, below the skip link 200), `aria-hidden`, no focusable content; it takes pointer events only while active. It registers an imperative API on `motionState.shutter` (`close(pathname)`, `cover(pathname)`, `open(onReveal)`, `announce(pathname)`) and owns a visually hidden `aria-live="polite"` region.
- Labels come from `nav` in `data/site.ts` via `routeLabel(pathname)`: nav label + position (`/about` → "Company", "02 / 06"). Unknown paths show "Truvolt".
- `lib/motion/MotionProvider.tsx` runs it: link interception, `router.push`, commit wait, Lenis, focus.
- `lib/motion/state.ts`: `motionState.transitioning` and the **reveal gate** (`holdReveal`, `releaseReveal`, `whenRevealed()`, `isRevealPending()`).

**Which clicks transition.** A window capture-phase handler (registered after the anchor handler) takes plain left clicks, no modifier keys, on a same-origin `http(s)` link whose **pathname differs** from the current one, without `target` (other than `_self`), `download` or `data-native`, and not a static file (`/map.html`, PDFs). It calls `preventDefault`, so `next/link` stands down. Everything else keeps its old behaviour: same-path `#hash` links (Lenis scroll), `/products#key` switches (ProductsExplorer, no transition), `mailto:`/`tel:`/external links. Programmatic: `useMotion().navigate(href)`. A click during a transition is queued; the latest one wins. Hovering or focusing an internal link calls `router.prefetch`.

**Sequence** (`runTransition` in MotionProvider)
1. `motionState.transitioning = true`, `holdReveal()`, `lenis.stop()`, close the mobile sheet. The menu effect does not restart Lenis while `transitioning` is set.
2. `shutter.close(pathname)`: slats `scaleY 0 → 1`, .32s power3.in, stagger .02 (covered at .5s); label from .4s (name rises .36s power4.out, kV + hairline .22s). `close` resolves when covered.
3. `router.push(href, { scroll: false })`, then wait for the commit (the provider's route effect resolves it, after it has reset scroll or jumped to the hash). Safety cap 8s.
4. Settle: two frames (useTvMotion setups run after `fonts.ready`), then fonts and in-view `<img>` decode, capped at 250ms.
5. `shutter.open(reveal)`: waits for the label (.64s), name out, slats `scaleY 1 → 0` from the bottom edge, .34s power3.out, stagger .018. At .18s into the open: `transitioning = false`, `lenis.start()`, `releaseReveal()`, so intros start as the first slats clear.
6. Focus moves to `<main id="main">` (`preventScroll`), the live region announces "<Name> page".

**Back/forward.** Next commits the route itself, so there is no close: on `popstate` to a different pathname the shutter is shown closed at once (`cover`), then steps 3–6 run (reveal only). Hash-only popstate (the products switcher) is ignored.

**First load.** No transition. The Home preloader is unchanged. Arriving at Home *through* a transition skips the preloader (the shutter played its part) and marks it as played for the session.

**Reduced motion.** No shutter: `<main>` fades out (.15s), the route commits, then fades in (.2s). Back/forward: fade in only.

**Page intros must wait for the reveal.** Pages mount under the closed shutter, so anything that plays on mount would be missed.
- `defaultIntro` (and so `initPageCore` / `MotionScope`) is gated automatically.
- Custom intros wrap their tween/timeline in `afterReveal(...)`: done in HomeMotion (hero intro), ProductMotion (intro mode), ProductSwitcher and PortfolioMotion (film card rise). `fromTo` "from" states still render at once, so nothing flashes.
- Anything else that must not start under the cover awaits `whenRevealed()`. PortfolioMotion arms the film's scroll input and its auto-engage timer only after the reveal, so the full-screen film never engages under the shutter (and its `lenis.stop()` cannot be undone by the transition's `lenis.start()`).
- Outside a transition the gate is open: `whenRevealed()` is already resolved and `afterReveal` does nothing.

**ScrollTriggers.** Unchanged: `useTvMotion` reverts on unmount, which now happens under the cover. Verified stable counts per route over repeated navigation (dev handle `__tv.ScrollTrigger.getAll().length`: Home 67, About 17, Products 28, Portfolio 21, Quality 28, Contact 10 at 1440).

**Header.** `surfaceIsDark` skips `[data-tv-transition]`, so the shutter never flips the nav to its dark skin; the active link and indicator update on the pathname change as before.

**Adding a page.** Add it to `nav` in `data/site.ts` for a proper shutter label. Put any custom hero intro through `afterReveal`.

