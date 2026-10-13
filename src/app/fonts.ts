import { Schibsted_Grotesk, JetBrains_Mono } from 'next/font/google';

export const sans = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  // No italic file: one <em> uses it, and the browser synthesises the slant (saves a ~50 KB preload per page).
  style: ['normal'],
  variable: '--font-sans',
  display: 'swap',
});

export const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});
