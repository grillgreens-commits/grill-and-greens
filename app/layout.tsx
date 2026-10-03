import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Grill & Greens | منيو المطعم',
  description: 'أكل بيتي شهي ولذيذ - سوهاج',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}