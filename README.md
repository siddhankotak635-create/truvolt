# Truvolt Engineering website

Marketing site for Truvolt Engineering Co. Pvt. Ltd., a transformer manufacturer in Kolkata.

## Stack

- [Next.js 15](https://nextjs.org/) (App Router, TypeScript, `src/` directory), statically prerendered
- React 19
- CSS Modules plus global design tokens (no CSS framework)
- [GSAP](https://gsap.com/) with ScrollTrigger for scroll motion, and [Lenis](https://lenis.darkroom.engineering/) for smooth scrolling
- D3 and topojson-client for the export map (`public/map.html`)

## Prerequisites

- Node.js 20 or newer
- npm

## Getting started

```bash
npm install
npm run dev            # http://localhost:3000
```

Production build:

```bash
npm run build && npm start   # serves on http://localhost:3000
```

Type check only: `npm run typecheck`.

Run only one `next dev` server at a time, and never run `next build` while `next dev` is running. They share the `.next` folder and will corrupt it.

## Routes

| Route | Page |
|---|---|
| `/` | Home |
| `/about` | Company |
| `/products` | All six product lines on one page. The hash picks the product: `#distribution` (default), `#power`, `#furnace`, `#dry`, `#auto`, `#turnkey` |
| `/products/:slug` | Redirects (307) to `/products?type=:slug`, which the page turns into `/products#slug` |
| `/portfolio` | Portfolio |
| `/quality` | Quality and policy (test sequence, standards matrix) |
| `/contact` | Contact form, office details and map |
| anything else | 404 page |

## Project structure

```
src/
  app/                  routes (layout.tsx, page.tsx per route, not-found.tsx, fonts.ts)
  components/
    home/ about/ product/ portfolio/ quality/ contact/
                        sections and motion components owned by each page
    shared/             Header, Footer (+ FooterDoodle), Button, Eyebrow, CtaBand,
                        ProductCard, StandardsMatrix
  lib/motion/           MotionProvider, useTvMotion hook, motion helpers, breakpoints
  data/                 site content (see below)
  styles/
    tokens.css          colours, type scale, spacing and layout tokens
    global.css          reset, utilities, keyframes
public/
  images/               all photos and client logos
  map.html              D3 export map, embedded on Home as an iframe
docs/
  FOUNDATION.md         component, token and motion API reference
```

## Editing content

Most copy lives in typed data files, so content changes rarely need component edits:

- `src/data/site.ts`: company details, contact info, navigation, footer links, client logo rails, countries served, standards matrix
- `src/data/products.ts`: the six product lines (hero copy, specs, features, construction notes) and the Home range cards
- `src/data/assets.ts`: the image registry (path plus intrinsic width and height) and the hero video URL

Page-specific copy that is not in `src/data` sits in that page's components under `src/components/<page>/`.

Images go in `public/images/`. Register a new image in `src/data/assets.ts` with its real pixel width and height, because `next/image` uses them to reserve space.

House style: no em or en dashes in copy (use a full stop, comma or colon), and eyebrow labels have no leading dash.

## Motion conventions

All scroll motion goes through `useTvMotion(ref, setup)` from `@/lib/motion`. Tweens and ScrollTriggers created inside `setup` are reverted automatically when the route changes. Pins run on desktop only (1100px and up). Reduced motion turns off Lenis, pins and scrubs, and all content stays visible. The full rules, the helper list and the `data-tv-*` hooks are in [docs/FOUNDATION.md](docs/FOUNDATION.md).

## Known content gaps for the client

- Some product stage and Home bento images are infographics standing in for photography. Replace them with real works photos when available.
- The Portfolio film is Pexels stock footage: "Electricians Working at Substation" by Videas Cl (Pexels id 10151854, free Pexels licence), self-hosted as `public/video/substation-1080.mp4` (desktop) and `substation-720.mp4` (below 1100px) with the poster `public/images/film-poster.jpg`, wired through `media` in `src/data/assets.ts`. Replace them with Truvolt footage (faststart H.264 mp4, 1080p and 720p). The storytelling captions are spread across the clip by fraction of its duration (`src/components/portfolio/filmBeats.ts`), so a new clip of any length keeps them in step.
- The contact and quote forms open the visitor's mail client (a `mailto:` addressed to contact@truvolt.com) until a mail service or form backend is connected.
- The footer's LinkedIn link and the Terms, Privacy and Cookies links are placeholders (`#`), waiting for a real URL and legal pages.
