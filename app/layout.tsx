import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./Sidebar"; // استدعاء القائمة الجديدة

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grill & Greens ERP",
  description: "Cloud ERP & POS System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-100 text-slate-900`}>
        <div className="min-h-screen flex flex-col md:flex-row">
          
          {/* مكون القائمة المتجاوب */}
          <Sidebar />

          {/* محتوى الصفحة الرئيسي */}
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}