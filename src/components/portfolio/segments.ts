import { images, type ImageAsset } from '@/data/assets';

export type Segment = {
  kicker: string;
  title: string;
  body: string;
  tags: string[];
  image: ImageAsset;
};

/** Verbatim from Truvolt Portfolio.dc.html (SEGMENTS). */
export const SEGMENTS: Segment[] = [
  {
    kicker: 'Power utilities',
    title: 'Reliable Grid Operation With Low-Loss Designs',
    body: 'Extended equipment life that reduces replacement cost over the project lifecycle, and fast delivery and commissioning for time-critical substation projects. Supplying WBSEDCL, SBPDCL, NBPDCL, MSEDCL, CSPDCL and APSPDCL.',
    tags: ['Grid substations', 'State DISCOMs', 'Power transformers'],
    image: images.forPowerUtilities,
  },
  {
    kicker: 'Industrial plants',
    title: 'Built for Harsh Operating Environments',
    body: 'Robust designs for steel, cement and process industries. Furnace transformers optimised for 24/7 heavy-duty cycles; minimal downtime ensured by superior short-circuit withstand. SAIL, Tata Motors and ferro-alloy operators run on Truvolt units.',
    tags: ['Steel & ferro alloy', 'Cement', 'Furnace duty'],
    image: images.forIndustrialPlants,
  },
  {
    kicker: 'Infrastructure developers',
    title: 'Turnkey Substations, One Point of Responsibility',
    body: 'Design through commissioning under one contract, reducing coordination complexity for EPC and infrastructure projects. Delivered through L&T, NCC, IL&FS and Sterling & Wilson, in full compliance with regulatory and safety standards.',
    tags: ['EPC', 'Road, rail & urban', 'Up to 132 kV'],
    image: images.forInfrastructure,
  },
  {
    kicker: 'Oil & gas, mining, export',
    title: 'Proven in Continuous and Critical Process',
    body: 'Specialist units for HPCL and IOCL refineries, mining operations and rail traction. Export designs validated in tropical and extreme climates across nine countries with complete IEC / BS documentation for customs and regulatory clearance.',
    tags: ['Refineries', 'Mining & rail', '9 countries'],
    image: images.forExport,
  },
];
