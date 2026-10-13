import { logos, type ImageAsset } from './assets';

/** Site-wide copy and data shared by the layout and several pages. Copy is verbatim from the mockups. */

/**
 * Same as products.ts `productHref`, inlined so the layout bundle (Footer) does not pull in the
 * product dataset.
 */
const productHref = (key: string) => `/products#${key}`;

export const company = {
  name: 'Truvolt',
  legalName: 'Truvolt Engineering Co. Pvt. Ltd.',
  founded: 1970,
  city: 'Kolkata',
  url: 'https://www.truvolt.com',
} as const;

export const contact = {
  email: 'contact@truvolt.com',
  phones: [
    { label: '+91 33 2236 0314', tel: '+913322360314' },
    { label: '+91 33 2236 0316', tel: '+913322360316' },
  ],
  /** Short form used in CTA bands: "+91 33 2236 0314 / 0316" */
  phonesShort: '+91 33 2236 0314 / 0316',
  addressLines: ['Wellington Apartment', '29/1 Nirmal Chandra Street', 'Kolkata 700012, India'],
  gstin: '19AABCT1433A1ZW',
  /** The mockup links LinkedIn to "#"; no URL is known yet. */
  linkedin: '#',
} as const;

export type NavItem = { label: string; href: string };

/** Header links, in mockup order. "Company" is the About page. */
export const nav: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Company', href: '/about' },
  { label: 'Products', href: '/products' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Quality', href: '/quality' },
  { label: 'Contact', href: '/contact' },
];

export const footer = {
  heading: 'Powering Industry with Reliability Since 1970',
  company: [
    { label: 'About', href: '/about' },
    { label: 'Quality & Policy', href: '/quality' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'Contact', href: '/contact' },
  ] as NavItem[],
  products: [
    { label: 'Distribution', href: productHref('distribution') },
    { label: 'Power', href: productHref('power') },
    { label: 'Furnace Duty', href: productHref('furnace') },
    { label: 'Dry Type', href: productHref('dry') },
    { label: 'Auto', href: productHref('auto') },
    { label: 'Turnkey Substations', href: productHref('turnkey') },
  ] as NavItem[],
  legal: ['Terms', 'Privacy', 'Cookies'],
  copyright: '© 2026 Truvolt Engineering Co. Pvt. Ltd.',
} as const;

/* ------------------------------------------------------------------ clients */

export type Client = {
  /** Short name; also the text fallback when the logo fails or is absent */
  short: string;
  name: string;
  sector: string;
  logo?: ImageAsset;
  logoAlt?: string;
};

/** Home "Trusted by" rail 1: Industry, PSU and EPC ("08 of 100+") */
export const clientsIndustry: Client[] = [
  { short: 'SAIL', name: 'Steel Authority of India', sector: 'Steel · Maharatna PSU', logo: logos.sail, logoAlt: 'Steel Authority of India logo' },
  { short: 'HPCL', name: 'Hindustan Petroleum', sector: 'Oil & gas · PSU', logo: logos.hpcl, logoAlt: 'Hindustan Petroleum logo' },
  { short: 'IndianOil', name: 'Indian Oil Corporation', sector: 'Oil & gas · PSU', logo: logos.indianoil, logoAlt: 'Indian Oil Corporation logo' },
  { short: 'L&T', name: 'Larsen & Toubro', sector: 'EPC · Infrastructure', logo: logos.larsenToubro, logoAlt: 'Larsen & Toubro logo' },
  { short: 'Tata Motors', name: 'Tata Motors', sector: 'Automotive · Plant distribution', logo: logos.tataMotors, logoAlt: 'Tata Motors logo' },
  { short: 'NCC', name: 'NCC Limited', sector: 'EPC · Infrastructure' },
  { short: 'IL&FS', name: 'Infrastructure Leasing & Financial Services', sector: 'Infrastructure' },
  { short: 'Sterling & Wilson', name: 'Sterling & Wilson', sector: 'EPC · Power' },
];

/** Home "Trusted by" rail 2: State distribution companies ("06 DISCOMs") */
export const clientsDiscoms: Client[] = [
  { short: 'WBSEDCL', name: 'West Bengal State Electricity Distribution Co.', sector: 'West Bengal' },
  { short: 'SBPDCL', name: 'South Bihar Power Distribution Co.', sector: 'Bihar' },
  { short: 'NBPDCL', name: 'North Bihar Power Distribution Co.', sector: 'Bihar' },
  { short: 'MSEDCL', name: 'Maharashtra State Electricity Distribution Co.', sector: 'Maharashtra' },
  { short: 'CSPDCL', name: 'Chhattisgarh State Power Distribution Co.', sector: 'Chhattisgarh' },
  { short: 'APSPDCL', name: 'Andhra Pradesh Southern Power Distribution Co.', sector: 'Andhra Pradesh', logo: logos.apspdcl, logoAlt: 'Andhra Pradesh Southern Power Distribution Co. logo' },
];

export const clientRails = [
  { title: 'Industry, PSU and EPC', count: '08 of 100+', dir: 1, clients: clientsIndustry },
  { title: 'State distribution companies', count: '06 DISCOMs', dir: -1, clients: clientsDiscoms },
] as const;

/* ---------------------------------------------------------------- countries */

/** ISO 3166-1 numeric ids, matching `SERVED` in public/map.html. Order as in the Home footprint list. */
export type Country = { id: number; name: string; region: string };

export const countries: Country[] = [
  { id: 356, name: 'India', region: 'HQ' },
  { id: 524, name: 'Nepal', region: 'Asia' },
  { id: 50, name: 'Bangladesh', region: 'Asia' },
  { id: 64, name: 'Bhutan', region: 'Asia' },
  { id: 368, name: 'Iraq', region: 'Middle East' },
  { id: 231, name: 'Ethiopia', region: 'Africa' },
  { id: 404, name: 'Kenya', region: 'Africa' },
  { id: 894, name: 'Zambia', region: 'Africa' },
  { id: 566, name: 'Nigeria', region: 'Africa' },
];

/* ---------------------------------------------------------------- standards */

/** 1 = Compliant, 2 = On request, 0 = Not applicable (Truvolt Quality.dc.html MATRIX). */
export type Mark = 0 | 1 | 2;

export const standardsColumns = ['IS 2026', 'IS 11171', 'IEC 60076', 'BS (on request)'] as const;

export const standardsMatrix: { product: string; marks: [Mark, Mark, Mark, Mark] }[] = [
  { product: 'Distribution Transformers', marks: [1, 0, 1, 2] },
  { product: 'Power Transformers', marks: [1, 0, 1, 2] },
  { product: 'Furnace Duty Transformers', marks: [1, 0, 1, 2] },
  { product: 'Dry Type Transformers', marks: [0, 1, 1, 2] },
  { product: 'Auto Transformers', marks: [1, 0, 1, 2] },
];

export const markLabel = (m: Mark) => (m === 1 ? 'Compliant' : m === 2 ? 'On request' : 'Not applicable');
