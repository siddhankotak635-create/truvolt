import type { Metadata } from 'next';
import { CtaBand } from '@/components/shared/CtaBand';
import { QualityMotion } from '@/components/quality/QualityMotion';
import {
  QualityHero,
  QualitySystem,
  StandardsSection,
  Stats,
  TestBay,
} from '@/components/quality/QualitySections';
import { images } from '@/data/assets';

export const metadata: Metadata = {
  title: 'Quality & Policy',
  description:
    'Every Truvolt transformer is built under an ISO-aligned quality system and tested to IS / IEC standards at our works or at accredited laboratories (CPRI, ERDA).',
};

export default function QualityPage() {
  return (
    <QualityMotion>
      <QualityHero />
      <TestBay />
      <Stats />
      <QualitySystem />
      <StandardsSection />
      <CtaBand
        image={images.qualityProcess8}
        alt="Test bay"
        eyebrow="Test certificates & documentation"
        heading="Need Type-Test Reports or Certification Documents?"
        button={{ label: 'Request Documents', href: 'mailto:contact@truvolt.com' }}
      />
    </QualityMotion>
  );
}
