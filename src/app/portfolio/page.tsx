import type { Metadata } from 'next';
import { PortfolioMotion } from '@/components/portfolio/PortfolioMotion';
import { FilmHero } from '@/components/portfolio/FilmHero';
import { CapabilityBand } from '@/components/portfolio/CapabilityBand';
import { Segments } from '@/components/portfolio/Segments';
import { PortfolioCta } from '@/components/portfolio/PortfolioCta';

export const metadata: Metadata = {
  title: 'Portfolio',
  description:
    'Fifty-five years of Truvolt transformers in service with power utilities, industrial plants, infrastructure developers and export markets across nine countries.',
};

export default function PortfolioPage() {
  return (
    <PortfolioMotion>
      <FilmHero />
      <CapabilityBand />
      <Segments />
      <PortfolioCta />
    </PortfolioMotion>
  );
}
