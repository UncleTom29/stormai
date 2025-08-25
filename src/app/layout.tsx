/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Use the new CSS file
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Optimize font loading
  preload: true
});

export const metadata: Metadata = {
  title: 'StormAI - Smart Contract IDE for Sei',
  description: 'AI-powered smart contract development environment for the Sei blockchain',
  icons: {
    icon: '/favicon.ico',
  },
  // Add performance optimizations
  other: {
    'theme-color': '#0f172a',
    'color-scheme': 'dark',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Performance optimizations */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={`${inter.className} bg-slate-900 text-slate-100`}>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'bg-slate-800 text-slate-100 border border-slate-700',
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}