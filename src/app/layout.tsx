import type { Metadata, Viewport } from 'next';
import 'lenis/dist/lenis.css';
import '@/styles/tokens.css';
import '@/styles/global.css';
import { sans, mono } from './fonts';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { MotionProvider } from '@/lib/motion';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.truvolt.com'),
  title: {
    default: 'Truvolt Engineering | Power & Distribution Transformers, Kolkata',
    template: '%s | Truvolt Engineering',
  },
  description:
    'Power, distribution and furnace-duty transformers from 25 kVA to 36 MVA, up to 66 kV. Designed, tested and commissioned in Kolkata since 1970.',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#DCE7F3',
  width: 'device-width',
  initialScale: 1,
};

/** Runs before first paint: opt in to intro pre-hiding unless reduced motion is requested. */
const motionFlag = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('tv-motion')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionFlag }} />
      </head>
      <body>
        <a className="skip-link" href="#main" data-native="">
          Skip to content
        </a>
        <MotionProvider>
          <Header />
          <main id="main" data-tv-root="" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
