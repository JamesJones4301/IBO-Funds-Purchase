import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IBO Funds Approval',
  description: 'In Becoming One funds purchase approval workflow'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
