import type { Metadata } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import './globals.css';
import { ShellProvider } from '@/lib/shell-context';

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
      <body className="bg-white text-[var(--color-text-dark)] font-sans antialiased">
        <ShellProvider>{children}</ShellProvider>
      </body>
    </html>
  );
}