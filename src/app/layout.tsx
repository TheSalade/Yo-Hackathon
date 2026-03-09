import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/lib/providers';
import { CustomCursor } from '@/components/shared/CustomCursor';

export const metadata: Metadata = {
  title: 'Yolo — Your savings, finally working hard.',
  description: 'Deposit USDC, ETH, or BTC. Earn real onchain yield. No banks. No bullshit. Powered by YO Protocol.',
  keywords: ['DeFi', 'savings', 'yield', 'USDC', 'ETH', 'Base', 'YO Protocol'],
  openGraph: {
    title: 'Yolo — Your savings, finally working hard.',
    description: 'Deposit USDC, ETH, or BTC. Earn real onchain yield. Powered by YO Protocol on Base.',
    type: 'website',
  },
  icons: {
    icon: '/yo/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <CustomCursor />
          {children}
        </Providers>
      </body>
    </html>
  );
}
