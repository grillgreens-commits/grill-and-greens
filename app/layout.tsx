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
          
          {/* شريط القائمة العلوي الخاص بالموبايل فقط */}
          <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center w-full sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 text-white font-bold px-2 py-1 rounded text-xs">G&G</div>
              <span className="font-bold text-sm">Grill & Greens</span>
            </div>
          </div>

          {/* القائمة الجانبية للشاشات الكبيرة والتنقل الأفقي المريح للموبايل */}
          <aside className="w-full md:w-64 bg-slate-900 text-white p-4 flex-shrink-0">
            <div className="hidden md:flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div>
                <h1 className="text-xl font-bold text-white">Grill & Greens</h1>
                <p className="text-xs text-emerald-400">Cloud ERP v1.0</p>
              </div>
              <div className="bg-emerald-600 text-white font-bold p-2 rounded-lg text-sm">
                G&G
              </div>
            </div>

            {/* أزرار التنقل: تظهر كشريط سحب أفقي ممتاز في الموبايل وقائمة رأسية في الكمبيوتر */}
            <nav className="flex md:flex-col overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
              <Link href="/" className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm whitespace-nowrap font-medium shrink-0">لوحة التحكم</Link>
              <Link href="/pos" className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 text-sm whitespace-nowrap font-medium shrink-0">الكاشير و POS</Link>
              <Link href="/orders" className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 text-sm whitespace-nowrap font-medium shrink-0">المبيعات والطلبات</Link>
              <Link href="/invoices" className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 text-sm whitespace-nowrap font-medium shrink-0">الفواتير</Link>
              <Link href="/customers" className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 text-sm whitespace-nowrap font-medium shrink-0">العملاء</Link>
              <Link href="/inventory" className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 text-sm whitespace-nowrap font-medium shrink-0">المخزون</Link>
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