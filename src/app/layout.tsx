import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vokal Studio',
  description: 'Speak naturally. Get polished writing in your voice.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
