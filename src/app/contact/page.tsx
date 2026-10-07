import type { Metadata } from 'next';
import { MotionScope } from '@/lib/motion';
import { ContactHero } from '@/components/contact/ContactHero';
import { InquirySection } from '@/components/contact/InquirySection';
import { MapCard } from '@/components/contact/MapCard';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Send your transformer specification to Truvolt Engineering, Kolkata. Our engineers return a detailed technical proposal in 48 to 72 hours.',
};

/* The Contact mockup's motion is the default intro + scroll reveals, so MotionScope (initPageCore) covers it. */
export default function ContactPage() {
  return (
    <MotionScope>
      <ContactHero />
      <InquirySection />
      <MapCard />
    </MotionScope>
  );
}
