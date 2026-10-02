import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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
          
          {/* القائمة الجانبية للموبايل والشاشات الكبيرة */}
          <aside className="w-full md:w-64 bg-slate-900 text-white p-4 flex-shrink-0">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div>
                <h1 className="text-xl font-bold text-white">Grill & Greens</h1>
                <p className="text-xs text-emerald-400">Cloud ERP v1.0</p>
              </div>
              <div className="bg-emerald-600 text-white font-bold p-2 rounded-lg text-sm">
                G&G
              </div>
            </div>

            <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-2 md:pb-0">
              <Link href="/" className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm whitespace-nowrap">لوحة التحكم</Link>
              <Link href="/pos" className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 text-sm whitespace-nowrap">الكاشير و POS</Link>
              <Link href="/orders" className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 text-sm whitespace-nowrap">المبيعات والطلبات</Link>
              <Link href="/invoices" className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 text-sm whitespace-nowrap">الفواتير</Link>
              <Link href="/customers" className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 text-sm whitespace-nowrap">العملاء</Link>
              <Link href="/inventory" className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 text-sm whitespace-nowrap">المخزون</Link>
            </nav>
          </aside>

          {/* محتوى الصفحة الرئيسي */}
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}