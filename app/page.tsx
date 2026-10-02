'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Receipt, 
  Users, 
  Package, 
  UtensilsCrossed, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  Store, 
  LogOut,
  Bell,
  Search,
  Plus
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-gray-100 font-sans dir-rtl" dir="rtl">
      {/* القائمة الجانبية - Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shadow-lg">
        <div>
          {/* شعار الهوية واسم المطعم */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg text-slate-950 font-bold">
              G&G
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Grill & Greens</h1>
              <span className="text-xs text-emerald-400">Cloud ERP v1.0</span>
            </div>
          </div>

          {/* روابط التنقل الرئيسية */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'dashboard', name: 'لوحة التحكم', icon: LayoutDashboard },
              { id: 'pos', name: 'الكاشير و POS', icon: Store },
              { id: 'orders', name: 'المبيعات والطلبات', icon: ShoppingCart },
              { id: 'invoices', name: 'الفواتير', icon: Receipt },
              { id: 'customers', name: 'العملاء', icon: Users },
              { id: 'inventory', name: 'المخزون', icon: Package },
              { id: 'recipes', name: 'الوصفات والتكاليف', icon: UtensilsCrossed },
              { id: 'expenses', name: 'المصروفات', icon: DollarSign },
              { id: 'accounts', name: 'الحسابات والأرباح', icon: TrendingUp },
              { id: 'reports', name: 'التقارير', icon: BarChart3 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* أسفل القائمة الجانبية - الإعدادات والمستخدم */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>الإعدادات</span>
          </button>
          
          <div className="pt-2 flex items-center justify-between px-4 py-2 text-xs text-slate-400 border-t border-slate-800/60">
            <span>الفرع الرئيسي - سوهاج</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="متصل بالسحابة"></span>
          </div>
        </div>
      </aside>

      {/* المحتوى الرئيسي - Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* الشريط العلوي - Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">
              {activeTab === 'dashboard' && 'لوحة التحكم الرئيسية'}
              {activeTab === 'pos' && 'نقطة البيع الكاشير'}
              {activeTab === 'orders' && 'إدارة المبيعات والطلبات'}
              {activeTab === 'inventory' && 'إدارة المخزون والمكونات'}
              {activeTab === 'expenses' && 'إدارة المصروفات'}
              {activeTab === 'settings' && 'إعدادات النظام'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* زر إضافة طلب سريع */}
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-emerald-700 transition">
              <Plus className="w-4 h-4" />
              <span>طلب جديد</span>
            </button>

            {/* التنبيهات */}
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* ملف المستخدم */}
            <div className="flex items-center gap-3 border-r pr-4 border-gray-200">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                م
              </div>
              <div className="text-sm">
                <div className="font-semibold text-gray-800">مدير النظام</div>
                <div className="text-xs text-gray-500">الفرع الرئيسي</div>
              </div>
            </div>
          </div>
        </header>

        {/* جسم الصفحة الرئيسي - Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* كروت الإحصائيات السريعة */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-sm font-medium text-gray-500">إجمالي المبيعات اليوم</div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">0.00 ج.م</div>
                  <div className="text-xs text-emerald-600 mt-1">جاهز لاستقبال الطلبات</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-sm font-medium text-gray-500">عدد الطلبات</div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">0 طلب</div>
                  <div className="text-xs text-gray-500 mt-1">تيك أواي ودليفري</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-sm font-medium text-gray-500">مصروفات اليوم</div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">0.00 ج.م</div>
                  <div className="text-xs text-gray-500 mt-1">مطعم فقط</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-sm font-medium text-gray-500">قيمة المخزون الحالية</div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">0.00 ج.م</div>
                  <div className="text-xs text-amber-600 mt-1">تحتاج إضافة خامات</div>
                </div>
              </div>

              {/* قسم التنبيهات والطلبات السريعة */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-gray-400">
                <Store className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-base font-medium">أهلاً بك في نظام Grill & Greens Cloud ERP</p>
                <p className="text-xs text-gray-400 mt-1">تم إعداد الهيكل الرئيسي الواجهة بنجاح.</p>
              </div>
            </div>
          )}

          {activeTab !== 'dashboard' && (
            <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-gray-400 min-h-[400px]">
              <Package className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-lg font-medium text-gray-700">قسم ({activeTab}) قيد البناء والتجهيز</p>
              <p className="text-sm text-gray-400 mt-1">سنقوم ببرمجة وظائفه بالتفصيل في الخطوات القادمة.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}