import type { Metadata } from 'next';
import './globals.css';
import { ShellProvider } from '@/lib/shell-context';

export const metadata: Metadata = {
  title: 'SAKSHAM — Business Advisory for Rural Entrepreneurs',
  description:
    'AI-driven hyper-local business advisory and financial structuring assistant for rural micro-entrepreneurs.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} bg-white text-[var(--color-text-dark)] antialiased`}>
        <ShellProvider>{children}</ShellProvider>
      </body>
    </html>
  );
}