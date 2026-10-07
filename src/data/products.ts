import { images, type ImageAsset } from './assets';

/**
 * The six product lines. `PRODUCTS` is copied verbatim from the
 * `PRODUCTS` array in `Truvolt Product.dc.html` (image URLs swapped for
 * local paths). `CARDS` holds the Home `#range` card copy, keyed the same way.
 */
export type ProductKey = 'distribution' | 'power' | 'furnace' | 'dry' | 'auto' | 'turnkey';

export type Product = {
  key: ProductKey;
  num: string;
  short: string;
  eyebrow: string;
  title: string;
  lead: string;
  rating: string;
  voltage: string;
  standard: string;
  cooling: string;
  tap: string;
  /** Local path, e.g. /images/distribution-transformers.jpg */
  image: string;
  appTitle: string;
  applications: string;
  sectors: string[];
  features: string[];
  construction: string[];
  /** false for auto + turnkey (no construction list in the mockup) */
  hasConstruction?: boolean;
};

export const PRODUCTS: Product[] = 
[
  { key: 'distribution', num: '01', short: 'Distribution', eyebrow: 'Products · 01 of 06', title: 'Distribution Transformers', lead: 'Auxiliary power and lighting loads for plants and utility feeders, with high factor of safety and low losses.', rating: 'Up to 5 MVA', voltage: '11 kV / 33 kV', standard: 'IS 2026', cooling: 'ONAN', tap: 'Off-circuit / OLTC', image: images.distribution.src, appTitle: 'Where Plant Power Meets the Grid', applications: 'Distribution transformers are used for auxiliary power supply in steel plants, rolling mills, material handling systems, industrial facilities and utility distribution networks. They cater to both power and lighting loads with high reliability.', sectors: ['Steel plants', 'Rolling mills', 'Material handling', 'Utility networks'], features: ['High factor of safety', 'Robust mechanical design', 'Low losses and efficient voltage regulation', 'High short-circuit withstand capability', 'Optimised winding and oil temperature rise'], construction: ['CRGO laminated core as per IS 2026', 'Electrolytic grade copper windings (99.9% purity)', 'MS fabricated tank with sand blasting and epoxy painting', 'Stainless steel flitch plates and insulated core bolts', 'Off-circuit tap changer / OLTC as required'] },
  { key: 'power', num: '02', short: 'Power', eyebrow: 'Products · 02 of 06', title: 'Power Transformers', lead: 'Step-up and step-down transformation for generating stations, grid substations and industrial power systems.', rating: 'Up to 36 MVA', voltage: '33 kV class', standard: 'IS 2026 · IEC', cooling: 'ONAN / ONAF', tap: 'OLTC', image: images.power.src, appTitle: 'Between Generation, Grid and Plant', applications: 'Power transformers are used for step-up and step-down voltage transformation in generating stations, grid substations and industrial power systems. They enable bidirectional power flow between plant loads and utility grids.', sectors: ['Generating stations', 'Grid substations', 'Industrial power systems', 'DISCOMs'], features: ['High efficiency and low losses', 'Strong short-circuit withstand capability', 'Excellent thermal and voltage regulation performance'], construction: ['CRGO laminated core as per IS 2026', 'Electrolytic grade copper windings (99.9% purity)', 'MS fabricated tank with radiators, sand-blasted and epoxy painted', 'On-load tap changer for continuous regulation'] },
  { key: 'furnace', num: '03', short: 'Furnace duty', eyebrow: 'Products · 03 of 06', title: 'Furnace Duty Transformers', lead: 'Heavy-duty design for arc, induction and ladle refining furnaces. Built for frequent switching and 24/7 operation.', rating: 'Up to 30 MVA', voltage: '33 kV', standard: 'IS 2026', cooling: 'ONAN / ONAF / OFWF', tap: 'OLTC, wide range', image: images.furnace.src, appTitle: 'Built for the Hardest Duty Cycle in Industry', applications: 'Furnace duty transformers feed electric arc furnaces, induction furnaces, ladle refining furnaces and ferro-alloy operations. They are designed for frequent switching, repeated short circuits and continuous heavy-load operation.', sectors: ['Steel', 'Ferro alloys', 'Foundries', 'Ladle refining'], features: ['Heavy bracing for repeated short-circuit forces', 'High thermal margins for 24/7 duty', 'Wide-range on-load tap changing', 'Low-impedance secondary for high-current output'], construction: ['CRGO laminated core as per IS 2026', 'Electrolytic grade copper windings (99.9% purity)', 'Reinforced tank with forced cooling options', 'High-current LV bushings and bus arrangement'] },
  { key: 'dry', num: '04', short: 'Dry type', eyebrow: 'Products · 04 of 06', title: 'Dry Type Transformers', lead: 'Fire-resistant, oil-free and low maintenance. For indoor and outdoor installations where oil is not acceptable.', rating: '25 kVA to 2.5 MVA', voltage: 'Up to 12 kV', standard: 'IS 11171', cooling: 'AN / AF', tap: 'Off-circuit', image: images.dry.src, appTitle: 'Safe Power Inside the Building', applications: 'Dry type transformers are suited to basements, high-rises, hospitals, metro stations, data rooms and any indoor or outdoor installation where fire risk or environmental rules rule out oil. Environment-friendly and compliant with IS 2026 / IS 11171.', sectors: ['Commercial buildings', 'Hospitals', 'Metro & rail', 'Infrastructure'], features: ['Fire-resistant, self-extinguishing insulation', 'Oil-free: no bund, no fire-wall', 'Low maintenance', 'Suitable for indoor and outdoor installation'], construction: ['CRGO laminated core', 'Copper windings with Class F / H insulation', 'Enclosure to IP rating as specified', 'Off-circuit tap links'] },
  { key: 'auto', num: '05', short: 'Auto', eyebrow: 'Products · 05 of 06', title: 'Auto Transformers', lead: 'Voltage regulation and control for rural distribution networks and industrial systems.', rating: 'Per feeder design', voltage: '11 kV / 33 kV', standard: 'IS 2026', cooling: 'ONAN', tap: 'Automatic tap changing', image: images.auto.src, appTitle: 'Holding Voltage on Long Lines', applications: 'Auto transformers are used for voltage regulation in rural distribution networks and industrial systems where long feeders cause voltage drop. Automatic tap changing keeps the supply within limits.', sectors: ['Rural distribution', 'State DISCOMs', 'Industrial networks'], features: ['Automatic tap changing', 'Robust mechanical construction', 'Low losses', 'Compact footprint'], construction: [], hasConstruction: false },
  { key: 'turnkey', num: '06', short: 'Turnkey', eyebrow: 'Products · 06 of 06', title: 'Turnkey Substations', lead: 'End-to-end execution of electrical substations: design, supply, erection, testing and commissioning.', rating: 'Project-defined', voltage: 'Up to 132 kV', standard: 'IS / IEC · utility spec', cooling: 'As specified', tap: 'As specified', image: images.turnkey.src, appTitle: 'One Contract From Survey to Energisation', applications: 'Turnkey substation solutions reduce coordination complexity for EPC and infrastructure projects. Truvolt takes single-point responsibility for design, supply, civil interface, erection, testing and commissioning up to 132 kV.', sectors: ['EPC contractors', 'Infrastructure', 'Industrial campuses', 'Utilities'], features: ['Single-point responsibility', 'Design, supply, erection, testing, commissioning', 'Full compliance with regulatory and safety standards', 'Delivered through L&T, NCC, IL&FS, Sterling & Wilson'], construction: [], hasConstruction: false }
];

export const PRODUCT_KEYS = PRODUCTS.map((p) => p.key);

export function getProduct(key: string): Product | undefined {
  return PRODUCTS.find((p) => p.key === key);
}

/** Home `#range` card copy (Truvolt Home.dc.html), used by ProductCard. */
export type ProductCardData = {
  key: ProductKey;
  /** Mono spec line, e.g. "01 · Up to 5 MVA · 11 / 33 kV" */
  spec: string;
  title: string;
  copy: string;
  image: ImageAsset;
  alt: string;
};

export const CARDS: ProductCardData[] = [
  { key: 'distribution', spec: '01 · Up to 5 MVA · 11 / 33 kV', title: 'Distribution Transformers', copy: 'Auxiliary power for steel plants, rolling mills and utility networks.', image: images.distribution, alt: 'Distribution transformer' },
  { key: 'power', spec: '02 · Up to 36 MVA · 33 kV class', title: 'Power Transformers', copy: 'Step-up and step-down for generating stations and grid substations.', image: images.power, alt: 'Power transformer' },
  { key: 'furnace', spec: '03 · Up to 30 MVA · 33 kV', title: 'Furnace Duty Transformers', copy: 'Arc, induction and ladle refining. Built for frequent switching and 24/7 duty.', image: images.furnace, alt: 'Furnace duty transformer' },
  { key: 'dry', spec: '04 · 25 kVA to 2.5 MVA · up to 12 kV', title: 'Dry Type Transformers', copy: 'Fire-resistant, oil-free, low maintenance. IS 11171 compliant.', image: images.dry, alt: 'Dry type transformer' },
  { key: 'auto', spec: '05 · Voltage regulation', title: 'Auto Transformers', copy: 'Automatic tap changing for rural distribution and industrial systems.', image: images.auto, alt: 'Auto transformer' },
  { key: 'turnkey', spec: '06 · Up to 132 kV class', title: 'Turnkey Substations', copy: 'Design, supply, erection, testing and commissioning. One point of responsibility.', image: images.turnkey, alt: 'Turnkey substation' },
];

export const DEFAULT_PRODUCT: ProductKey = 'distribution';

export function isProductKey(key: string): key is ProductKey {
  return (PRODUCT_KEYS as string[]).includes(key);
}

/** All six lines live on one page; the hash picks the product (`/products#power`). */
export function productHref(key: ProductKey | string): string {
  return `/products#${key}`;
}
