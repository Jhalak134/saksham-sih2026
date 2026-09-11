import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ShellProvider } from '@/lib/shell-context';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SAKSHAM — Business Advisory for Rural Entrepreneurs',
  description:
    'AI-driven hyper-local business advisory and financial structuring assistant for rural micro-entrepreneurs.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-[var(--color-text-dark)] antialiased`}>
        <ShellProvider>{children}</ShellProvider>
      </body>
    </html>
  );
}