import type { Metadata } from 'next';
import './globals.css';
import './app-styles.css';

export const metadata: Metadata = {
  title: 'Image Pipeline System',
  description: 'Streamlined image intake system for schools and teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
