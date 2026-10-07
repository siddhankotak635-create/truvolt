import type { Metadata } from 'next';
import { CtaBand } from '@/components/shared';
import { AboutMotion } from '@/components/about/AboutMotion';
import { AboutHero, Legacy, StandardSection, WhoWeAre } from '@/components/about/AboutSections';
import { images } from '@/data/assets';

export const metadata: Metadata = {
  title: 'Company',
  description:
    'Truvolt Engineering Co. Pvt. Ltd. designs, manufactures, tests and commissions power and distribution transformers in Kolkata, India, since 1970.',
};

export default function AboutPage() {
  return (
    <AboutMotion>
      <AboutHero />
      <Legacy />
      <WhoWeAre />
      <StandardSection />
      <CtaBand
        image={images.homeLast}
        alt="Truvolt works"
        eyebrow="Get in touch"
        heading="Have a Transformer Requirement? Our Engineers Respond in 48 to 72 Hours."
        button={{ label: 'Send Your Specification', href: 'mailto:contact@truvolt.com' }}
      />
    </AboutMotion>
  );
}
