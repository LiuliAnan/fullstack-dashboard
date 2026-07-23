import type { Metadata } from 'next';
import MuiThemeProvider from '@/components/providers/MuiThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Full-stack dashboard application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MuiThemeProvider>{children}</MuiThemeProvider>
      </body>
    </html>
  );
}