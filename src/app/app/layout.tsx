import { Instrument_Sans, Libre_Baskerville, DM_Mono } from 'next/font/google';

const instrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const libre = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
});

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${instrument.variable} ${libre.variable} ${dmMono.variable} min-h-screen`}>
      {children}
    </div>
  );
}
