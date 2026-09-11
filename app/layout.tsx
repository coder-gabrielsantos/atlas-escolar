import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AtlasProvider } from '@/components/atlas-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atlas-inteligencia-educacional.maxcrowleyadz.chatgpt.site'),
  title: 'Atlas — Inteligência educacional',
  description: 'Diagnóstico escolar orientado por evidências para decisões mais justas.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Atlas — Inteligência educacional',
    description: 'Diagnóstico escolar orientado por evidências para decisões mais justas.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Atlas — Inteligência educacional para decisões mais justas' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atlas — Inteligência educacional',
    description: 'Diagnóstico escolar orientado por evidências para decisões mais justas.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AtlasProvider>{children}</AtlasProvider>
      </body>
    </html>
  );
}
