/**
 * Every image the site uses, served locally from /public/images.
 * Keys are logical names; the comment gives the original truvolt.com upload
 * the file was downloaded from, so mockup URLs can be mapped back.
 * Intrinsic sizes are included so next/image can be used without `fill`.
 */
export type ImageAsset = { src: string; width: number; height: number };

const img = (src: string, width: number, height: number): ImageAsset => ({ src, width, height });

export const images = {
  /** elementor/thumbs/Logo-white-1-….png (white on transparent; nav renders it black via filter) */
  logoWhite: img('/images/logo-white.png', 154, 42),

  /** 2026/05/Power-Transformers.jpg (Home hero) */
  heroTransformer: img('/images/power-transformers-alt.jpg', 1280, 853),

  /** Product photography (2026/05 + 2026/06 product uploads) */
  distribution: img('/images/distribution-transformers.jpg', 1280, 853),
  /** 2026/06/power-transformers.jpg */
  power: img('/images/power-transformers.jpg', 1280, 853),
  /** 2026/05/furnance-transformers.jpg */
  furnace: img('/images/furnace-transformers.jpg', 1280, 853),
  dry: img('/images/dry-type-transformers.jpg', 1280, 853),
  auto: img('/images/auto-transformers.jpg', 1280, 853),
  /** 2026/05/turn-key-solutions.jpg */
  turnkey: img('/images/turnkey-solutions.jpg', 1280, 853),

  /** 2026/05/home-1.jpg (NOT the 2026/06 one; see home1Truck) */
  home1: img('/images/home-1.jpg', 1280, 853),
  /** 2026/06/home-1.jpg (truck photo; differs from the 2026/05 home1) */
  home1Truck: img('/images/home-1-truck.jpg', 1280, 853),
  /** 2026/05/Home-last-1024x682.jpg (CTA band image) */
  homeLast: img('/images/home-last.jpg', 1024, 682),
  /** 2026/06/about-1.jpg */
  about1: img('/images/about-1.jpg', 1280, 853),
  /** 2026/05/engieering-process.jpg (core stacking) */
  engineeringProcess: img('/images/engineering-process.jpg', 984, 726),
  /** 2026/05/young-successful-technician-or-repairman-of-industrial-machines.jpg */
  technician: img('/images/technician.jpg', 1280, 853),
  industrialPlantNight: img('/images/industrial-plant-at-night.jpg', 1280, 853),

  /** 2026/06/quality-policy-process-{1-1,3,6,8}.jpg */
  qualityProcess1: img('/images/quality-process-1.jpg', 984, 726),
  qualityProcess3: img('/images/quality-process-3.jpg', 984, 726),
  qualityProcess6: img('/images/quality-process-6.jpg', 984, 726),
  qualityProcess8: img('/images/quality-process-8.jpg', 984, 726),

  /** 2026/06/For-*.jpg (Portfolio segments) */
  forPowerUtilities: img('/images/for-power-utilities.jpg', 1280, 853),
  forIndustrialPlants: img('/images/for-industrial-plants.jpg', 1280, 853),
  forInfrastructure: img('/images/for-infrastructure-developers.jpg', 1280, 853),
  forExport: img('/images/for-export-markets.jpg', 1280, 853),
} as const;

/** Client logos (Wikimedia Commons, rasterised to PNG). */
export const logos = {
  sail: img('/images/logos/sail.png', 960, 1008),
  hpcl: img('/images/logos/hpcl.png', 960, 1221),
  indianoil: img('/images/logos/indianoil.png', 960, 1148),
  larsenToubro: img('/images/logos/larsen-toubro.png', 960, 960),
  tataMotors: img('/images/logos/tata-motors.png', 960, 110),
  apspdcl: img('/images/logos/apspdcl.png', 272, 355),
} as const;

/**
 * Portfolio film, self-hosted from /public/video (faststart mp4, no audio, about 14s).
 * Source: Pexels "Electricians Working at Substation" (id 10151854) by Videas Cl, Pexels licence (free to use).
 * https://www.pexels.com/video/electricians-working-at-substation-10151854/
 * Files: 10151854-hd_1920_1080_24fps.mp4 (9.3 MB) and 10151854-hd_1280_720_24fps.mp4 (5.0 MB);
 * poster: images.pexels.com/videos/10151854/pexels-photo-10151854.jpeg?w=1280.
 */
export const media = {
  /** 1920x1080, used from 1100px up */
  heroVideo: '/video/substation-1080.mp4',
  /** 1280x720, used below 1100px */
  heroVideoSd: '/video/substation-720.mp4',
  /** Poster frame for the film (1280x720) */
  heroPoster: '/images/film-poster.jpg',
} as const;

export type ImageKey = keyof typeof images;
export type LogoKey = keyof typeof logos;
