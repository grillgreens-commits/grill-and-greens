'use client';

import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      {/* هيدر لوحة التحكم */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">لوحة التحكم الرئيسية</h1>
          <p className="text-sm text-slate-500 mt-1">نظام Grill & Greens ERP إدارة المبيعات والمخزون</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors">
          + طلب جديد
        </button>
      </div>

      {/* كروت الإحصائيات السريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">إجمالي المبيعات اليوم</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">0.00 <span className="text-sm font-normal">ج.م</span></h3>
          <span className="inline-block mt-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-medium">جاهز لاستقبال الطلبات</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">عدد الطلبات</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">0 <span className="text-sm font-normal">طلب</span></h3>
          <span className="inline-block mt-2 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">تيك أواي ودليفري</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">مصروفات اليوم</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">0.00 <span className="text-sm font-normal">ج.م</span></h3>
          <span className="inline-block mt-2 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">مطعم فقط</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">قيمة المخزون الحالية</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-2">0.00 <span className="text-sm font-normal">ج.م</span></h3>
          <span className="inline-block mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md font-medium">تحتاج إضافة خامات</span>
        </div>
      </div>
    </div>
  );
}