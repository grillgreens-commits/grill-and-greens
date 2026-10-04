'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface MenuItem {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  is_available?: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'الكل 🍽️' },
  { id: 'الوجبات', name: 'الوجبات 🍱' },
  { id: 'المشويات', name: 'المشاوي عالفحم 🥩' },
  { id: 'المحاشي', name: 'المحاشي 🥬' },
  { id: 'الطواجن', name: 'الصواني والطواجن 🍲' },
  { id: 'الطيور', name: 'الطيور 🍗' },
  { id: 'أصناف إضافية', name: 'أصناف إضافية 🥗' },
];

interface CartItem {
  product: MenuItem;
  quantity: number;
}

export default function CustomerMenu() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [orderSent, setOrderSent] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | number | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);

  // بيانات الطلب
  const [customerName, setCustomerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway'>('delivery');
  const [notes, setNotes] = useState<string>('');

  const DELIVERY_FEE = 30;

  const SOCIAL_LINKS = {
    facebook: 'https://facebook.com/grillgreens',
    instagram: 'https://www.instagram.com/grillgreens',
    tiktok: 'https://www.tiktok.com/@grillgreens',
    youtube: 'https://youtube.com/@grillgreens',
    whatsapp: 'https://wa.me/201101616480',
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // جلب المنيو الحية من قاعدة البيانات
  const fetchMenuItems = async () => {
    setLoadingMenu(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true);

    if (data && !error) {
      setMenuItems(data);
    } else {
      console.error('خطأ في جلب بيانات المنيو:', error);
    }
    setLoadingMenu(false);
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

  const removeFromCart = (id: string | number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const itemsSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
  const grandTotal = itemsSubtotal + deliveryFee;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((item: MenuItem) => item.category === selectedCategory);

  // إرسال الطلب وحفظه في Supabase
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || (orderType === 'delivery' && !address)) {
      alert('يرجى ملء البيانات الأساسية للطلب');
      return;
    }

    setSubmittingOrder(true);

    const formattedItems = cart.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      qty: item.quantity,
    }));

    const orderPayload = {
      customer_name: customerName,
      phone: phone,
      address: orderType === 'delivery' ? address : 'استلام من المطعم',
      items: formattedItems,
      total: grandTotal,
      total_amount: grandTotal,
      notes: notes,
      status: 'pending',
    };

    // 1. إضافة أو تحديث بيانات العميل في جدول customers
    await supabase.from('customers').upsert(
      { name: customerName, phone: phone, address: address },
      { onConflict: 'phone' }
    );

    // 2. إدراج الطلب في جدول orders
    const { data, error } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select();

    setSubmittingOrder(false);

    if (error) {
      alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى: ' + error.message);
    } else if (data && data[0]) {
      const insertedId = data[0].id;
      setOrderId(insertedId);
      setOrderSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/40 text-slate-800 pb-28 flex flex-col justify-between">
      <div>
        {/* هيدر الصفحة الرئيسي للعميل */}
        <header className="bg-slate-900 text-white p-4 sticky top-0 z-30 shadow-md">
          <div className="max-w-3xl mx-auto text-center space-y-1">
            <h1 className="text-2xl font-black text-amber-400 tracking-wide">Grill & Greens</h1>
            <p className="text-xs text-slate-300">أكل بيتي بجودة عالية - جميع اللحوم بلدي وطازة</p>
            
            <div className="flex justify-center items-center gap-3 pt-2 text-xs">
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">📘 فيسبوك</a>
              <span>•</span>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">📸 انستجرام</a>
              <span>•</span>
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">🎵 تيك توك</a>
              <span>•</span>
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition-colors">▶️ يوتيوب</a>
            </div>
          </div>
        </header>

        {/* شريط مواعيد العمل والتواصل */}
        <div className="bg-red-800 text-white py-2 px-4 shadow-inner">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs gap-1.5 text-center sm:text-right">
            <div>
              <span className="font-bold text-amber-300">مواعيدنا: </span>
              من 11 صباحاً - 8 مساءً (ماعدا الجمعة) | تجهيز الأوردر من 1 - 2 ساعة
            </div>
            <div className="flex gap-3 items-center font-bold">
              <a
                href={SOCIAL_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[11px] flex items-center gap-1 shadow-sm"
              >
                💬 واتساب 01101616480
              </a>
              <span className="text-amber-200 text-[11px]">كاش - محفظة - انستاباي</span>
            </div>
          </div>
        </div>

        {/* شريط التصنيفات */}
        <div className="bg-white border-b border-slate-200 sticky top-[95px] z-20 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat: Category) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-red-700 text-white shadow-sm scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* قائمة الأصناف */}
        <main className="max-w-3xl mx-auto p-4">
          {loadingMenu ? (
            <div className="text-center py-12 font-bold text-slate-500">جاري تحميل المنيو... ⏳</div>
          ) : orderSent ? (
            <div className="bg-white p-6 rounded-2xl border border-emerald-100 text-center my-8 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
                ⏳
              </div>
              <h2 className="text-xl font-bold text-slate-800">تم إرسال طلبك بنجاح!</h2>
              <p className="text-slate-600 text-sm">
                رقم الطلب: <span className="font-bold text-red-600 text-base">#{String(orderId).split('-')[0].toUpperCase()}</span>
              </p>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right text-xs space-y-2 max-w-sm mx-auto">
                <p className="font-bold border-b pb-1 text-slate-700">تفاصيل الفاتورة والوصل:</p>
                <div className="flex justify-between text-slate-600">
                  <span>إجمالي الأصناف:</span>
                  <span>{itemsSubtotal} ج.م</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>نوع الطلب:</span>
                  <span>{orderType === 'delivery' ? 'توصيل دليفري' : 'استلام من المطعم'}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-red-700 font-semibold">
                    <span>خدمة توصيل (دليفري):</span>
                    <span>+{DELIVERY_FEE} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 border-t pt-1.5 text-sm">
                  <span>المبلغ الإجمالي المطلوب:</span>
                  <span className="text-red-700">{grandTotal} ج.م</span>
                </div>
              </div>

              <div className="inline-block bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-xs font-medium border border-amber-200">
                حالة الطلب: <span className="font-bold">قيد الانتظار لمراجعة المطعم</span>
              </div>
              <p className="text-xs text-slate-400">سيتم التواصل معكم وتجهيز الوجبة فور تأكيد الطلب.</p>
              <button
                onClick={() => {
                  setOrderSent(false);
                  setIsCartOpen(false);
                  setCart([]);
                }}
                className="mt-4 bg-red-700 text-white px-6 py-2 rounded-xl text-xs font-semibold hover:bg-red-800"
              >
                طلب جديد
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-bold">لا توجد أصناف متوفرة حالياً في هذا القسم.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredItems.map((item: MenuItem) => (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex gap-3 hover:border-red-200 transition-colors items-center justify-between"
                >
                  <div className="w-20 h-20 bg-amber-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center text-2xl relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-amber-300 font-bold text-xl">🍲</span>
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    <p className="text-red-700 font-extrabold text-sm pt-0.5">
                      {item.price} <span className="text-xs font-normal">ج.م</span>
                    </p>
                  </div>

                  <button
                    onClick={() => addToCart(item)}
                    className="bg-red-50 hover:bg-red-700 text-red-700 hover:text-white border border-red-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95"
                  >
                    + إضافة
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* الفوتر */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 px-4 text-center mt-8 space-y-3">
        <p className="font-bold text-amber-400 text-sm">Grill & Greens - سوهاج</p>
        <div className="flex justify-center items-center gap-4 text-slate-300 font-medium">
          <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer">فيسبوك</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer">انستجرام</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer">تيك توك</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer">يوتيوب</a>
        </div>
        <p className="text-[11px] text-slate-500">جميع الحقوق محفوظة © Grill & Greens</p>
      </footer>

      {/* الشريط العائم للسلة */}
      {cart.length > 0 && !orderSent && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-red-700 hover:bg-red-800 text-white p-3.5 rounded-2xl shadow-xl flex justify-between items-center font-bold text-sm transition-all transform active:scale-98"
          >
            <div className="flex items-center gap-2">
              <span className="bg-red-900 text-white px-2 py-0.5 rounded-lg text-xs">
                {totalItemsCount} أصناف
              </span>
              <span>عرض السلة وتأكيد الطلب</span>
            </div>
            <span>{grandTotal} ج.م ➔</span>
          </button>
        </div>
      )}

      {/* نافذة السلة وتأكيد الطلب */}
      {isCartOpen && !orderSent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-slate-800">تفاصيل السلة والوصل</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
              {cart.map(({ product, quantity }: CartItem) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center text-xs border-b border-slate-50 pb-2"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{product.name}</p>
                    <p className="text-slate-400 mt-0.5">
                      {product.price} ج.م × {quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="w-6 h-6 bg-slate-100 rounded-lg text-slate-600 font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-slate-800">{quantity}</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-6 h-6 bg-red-100 rounded-lg text-red-800 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
              <div className="flex justify-between">
                <span>المجموع الفرعي للأصناف:</span>
                <span>{itemsSubtotal} ج.م</span>
              </div>

              {orderType === 'delivery' && (
                <div className="flex justify-between text-red-700 font-medium">
                  <span>خدمة توصيل (دليفري):</span>
                  <span>+{DELIVERY_FEE} ج.م</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t font-bold text-sm text-slate-800">
                <span>الإجمالي الكلي بالريسيت:</span>
                <span className="text-red-700 text-base">{grandTotal} ج.م</span>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-2.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  اسم العميل *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="الاسم الكريم"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500"
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
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    نوع الاستلام
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as 'delivery' | 'takeaway')}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-red-500"
                  >
                    <option value="delivery">توصيل دليفري (+30 ج.م)</option>
                    <option value="takeaway">استلام من المطعم (0 ج.م)</option>
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
                    placeholder="الشارع - العمارة - العلامة المميزة"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500"
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
                  placeholder="مثال: بدون بصل، زيادة طحينة..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingOrder}
                className="w-full bg-red-700 hover:bg-red-800 disabled:bg-slate-400 text-white font-bold py-2.5 rounded-xl shadow-md text-xs mt-1 transition-all"
              >
                {submittingOrder ? 'جاري إرسال الطلب...' : 'تأكيد وإرسال الطلب'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}