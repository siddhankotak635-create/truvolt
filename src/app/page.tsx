import type { Metadata } from 'next';
import { CtaBand } from '@/components/shared';
import { images } from '@/data/assets';
import { HomeMotion } from '@/components/home/HomeMotion';
import { Preloader } from '@/components/home/Preloader';
import { Hero } from '@/components/home/Hero';
import { NameSection } from '@/components/home/NameSection';
import { Clients } from '@/components/home/Clients';
import { Stats } from '@/components/home/Stats';
import { Flagship } from '@/components/home/Flagship';
import { Range } from '@/components/home/Range';
import { Capability } from '@/components/home/Capability';
import { Footprint } from '@/components/home/Footprint';
import { Why } from '@/components/home/Why';
import { Process } from '@/components/home/Process';

export const metadata: Metadata = {
  title: { absolute: 'Truvolt Engineering | Reliable Power for Industrial Applications' },
  description:
    'Power, distribution and furnace-duty transformers from 25 kVA to 36 MVA, up to 66 kV. Designed, tested and commissioned for utilities and industry across 9 countries.',
};

/** Home (Truvolt Home.dc.html). Section order follows the mockup; the footer comes from the layout. */
export default function HomePage() {
  return (
    <HomeMotion>
      <Preloader />
      <Hero />
      <NameSection />
      <Clients />
      <Stats />
      <Flagship />
      <Range />
      <Capability />
      <Footprint />
      <Why />
      <Process />
      <CtaBand
        padTop
        minHeight={520}
        imageOpacity={0.55}
        magnet={false}
        image={images.homeLast}
        alt="Truvolt works"
        eyebrow="Get in touch"
        heading="Have a Transformer Requirement? Our Engineers Respond in 48 to 72 Hours."
        button={{ label: 'Send Your Specification', href: 'mailto:contact@truvolt.com' }}
      />
    </HomeMotion>
  );
}
