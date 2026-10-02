'use client';

import { useState } from 'react';
import Link from 'next/link';

// تعريف أنواع البيانات داخلياً لتجنب أخطاء الاستيراد
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'الكل 🍽️' },
  { id: 'grill', name: 'مشويات 🥩' },
  { id: 'chicken', name: 'فراخ ودجاج 🍗' },
  { id: 'casserole', name: 'طواجن وبشاميل 🍲' },
  { id: 'sides', name: 'سلطات ومقبلات 🥗' },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'كفتة بلدي مشوية',
    description: 'كفتة بلدي متبلة بخلطة الجريل الخاصة ومشويه على الفحم',
    price: 150,
    category: 'grill',
  },
  {
    id: '2',
    name: 'بانيه مقرمش',
    description: 'قطع دجاج بانيه متبلة ومقرمشة طلبتك المفضل',
    price: 120,
    category: 'chicken',
  },
  {
    id: '3',
    name: 'مكرونة بالبشاميل',
    description: 'طاجن مكرونة بالبشاميل الغني واللحمة المفرومة على أصولها',
    price: 90,
    category: 'casserole',
  },
];

interface CartItem {
  product: MenuItem;
  quantity: number;
}

export default function CustomerMenu() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [orderSent, setOrderSent] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // بيانات نموذج الطلب
  const [customerName, setCustomerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway'>('delivery');
  const [notes, setNotes] = useState<string>('');

  // روابط وسائل التواصل الاجتماعي المباشرة لـ Grill & Greens
  const SOCIAL_LINKS = {
    facebook: 'https://facebook.com/grillgreens',
    instagram: 'https://www.instagram.com/grillgreens',
    tiktok: 'https://www.tiktok.com/@grillgreens',
    youtube: 'https://youtube.com/@grillgreens',
    whatsapp: 'https://wa.me/201101616480',
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product: item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredItems =
    selectedCategory === 'all'
      ? MENU_ITEMS
      : MENU_ITEMS.filter((item: MenuItem) => item.category === selectedCategory);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || (orderType === 'delivery' && !address)) {
      alert('يرجى ملء البيانات الأساسية للطلب');
      return;
    }

    const generatedId = Math.floor(1000 + Math.random() * 9000).toString();
    setOrderId(generatedId);
    setOrderSent(true);
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-28">
      {/* هيدر المنيو مع شعار ورابط الإدارة */}
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold text-emerald-400">Grill & Greens</h1>
            <p className="text-xs text-slate-300 mt-0.5">أكل بيتي شهي ولذيذ - سوهاج</p>
          </div>

          <Link
            href="/admin"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            دخول الإدارة 🔐
          </Link>
        </div>
      </header>

      {/* شريط السوشيال ميديا والتواصل المباشر */}
      <div className="bg-emerald-800 text-white py-2 px-4 shadow-inner">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-xs">
          <span className="font-medium hidden sm:inline">تابعنا على صفحاتنا:</span>
          <div className="flex gap-3 sm:gap-4 items-center mx-auto sm:mx-0 font-semibold flex-wrap justify-center">
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              📘 فيسبوك
            </a>
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              📸 إنستجرام
            </a>
            <a
              href={SOCIAL_LINKS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              🎵 تيك توك
            </a>
            <a
              href={SOCIAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              ▶️ يوتيوب
            </a>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              💬 واتساب
            </a>
          </div>
        </div>
      </div>

      {/* شريط التصنيفات */}
      <div className="bg-white border-b border-slate-200 sticky top-[60px] z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat: Category) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-sm scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* قائمة الأصناف */}
      <main className="max-w-4xl mx-auto p-4">
        {orderSent ? (
          <div className="bg-white p-6 rounded-2xl border border-emerald-100 text-center my-8 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
              ⏳
            </div>
            <h2 className="text-2xl font-bold text-slate-800">تم إرسال طلبك بنجاح!</h2>
            <p className="text-slate-600 text-sm">
              رقم الطلب الخاص بك: <span className="font-bold text-emerald-600 text-lg">#{orderId}</span>
            </p>
            <div className="inline-block bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium border border-amber-200">
              حالة الطلب الآن: <span className="font-bold">قيد الانتظار لمراجعة المطعم</span>
            </div>
            <p className="text-xs text-slate-400">سوف يتم تجهيز الوجبات فور تأكيد الطلب من قبل الإدارة.</p>
            <button
              onClick={() => {
                setOrderSent(false);
                setIsCartOpen(false);
              }}
              className="mt-4 bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700"
            >
              طلب جديد
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item: MenuItem) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center gap-4 hover:border-emerald-200 transition-colors"
              >
                {/* صورة الصنف إن وجدت */}
                {item.image && (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1 flex-1">
                  <h3 className="font-bold text-slate-800 text-base">{item.name}</h3>
                  {item.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                  )}
                  <p className="text-emerald-600 font-bold text-sm pt-1">
                    {item.price} <span className="text-xs font-normal">ج.م</span>
                  </p>
                </div>

                <button
                  onClick={() => addToCart(item)}
                  className="bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95"
                >
                  + إضافة
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* الشريط العائم للسلة */}
      {cart.length > 0 && !orderSent && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center font-bold text-sm transition-all transform active:scale-98"
          >
            <div className="flex items-center gap-2">
              <span className="bg-emerald-800 text-white px-2.5 py-1 rounded-lg text-xs">
                {totalItemsCount} أصناف
              </span>
              <span>عرض سلة الطلبات</span>
            </div>
            <span>{totalAmount} ج.م ➔</span>
          </button>
        </div>
      )}

      {/* نافذة السلة وتأكيد الطلب */}
      {isCartOpen && !orderSent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-5 space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-slate-800">تفاصيل الطلب</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* ملخص المأكولات */}
            <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
              {cart.map(({ product, quantity }: CartItem) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center text-sm border-b border-slate-50 pb-2"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{product.name}</p>
                    <p className="text-xs text-slate-400">
                      {product.price} ج.م × {quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="w-7 h-7 bg-slate-100 rounded-lg text-slate-600 font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-slate-800">{quantity}</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-7 h-7 bg-emerald-100 rounded-lg text-emerald-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t font-bold text-base text-slate-800">
              <span>الإجمالي:</span>
              <span className="text-emerald-600">{totalAmount} ج.م</span>
            </div>

            {/* نموذج بيانات العميل */}
            <form onSubmit={handlePlaceOrder} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  اسم العميل *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="أدخل اسمك الكريم"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    نوع الاستلام
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as 'delivery' | 'takeaway')}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="delivery">توصيل دليفري 🛵</option>
                    <option value="takeaway">استلام من المطعم 🛍️</option>
                  </select>
                </div>
              </div>

              {orderType === 'delivery' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    العنوان التفصيلي *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="الشارع - رقم العمارة - علامة مميزة"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ملاحظات للوجبة
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: بدون بصل، زيادة صوص..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md text-sm mt-2 transition-all"
              >
                تأكيد وإرسال الطلب للمطعم
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}