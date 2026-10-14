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
  is_popular?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'المشويات', name: 'المشويات', icon: '🥩' },
  { id: 'الوجبات', name: 'الوجبات', icon: '🍱' },
  { id: 'المحاشي', name: 'المحاشي', icon: '🥬' },
  { id: 'الطواجن', name: 'الطواجن', icon: '🍲' },
  { id: 'الطيور', name: 'الطيور', icon: '🍗' },
  { id: 'أصناف إضافية', name: 'أصناف إضافية', icon: '🥗' },
];

interface CartItem {
  product: MenuItem;
  quantity: number;
}

export default function CustomerMenu() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [orderSent, setOrderSent] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | number | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);
  const [isOpenNow, setIsOpenNow] = useState<boolean>(true);
  const [statusText, setStatusText] = useState<string>('مفتوح الآن 🟢');

  // إعدادات العرض الخاص
  const [promoOffer, setPromoOffer] = useState<{
    type: 'text' | 'image';
    title?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    isActive: boolean;
  } | null>(null);
  const [loadingPromo, setLoadingPromo] = useState<boolean>(true);

  // بيانات الطلب
  const [customerName, setCustomerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [altPhone, setAltPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [notes, setNotes] = useState<string>('');

  const DELIVERY_FEE = 30;

  const SOCIAL_LINKS = {
    facebook: 'https://facebook.com/grillgreens',
    instagram: 'https://www.instagram.com/grillgreens',
    tiktok: 'https://www.tiktok.com/@grillgreens',
    youtube: 'https://youtube.com/@grillgreens', // 👈 أضف هذا السطر هنا
    whatsapp: 'https://wa.me/201101616480',
    phoneCall: 'tel:201101616480',
  };

  useEffect(() => {
    fetchMenuItems();
    fetchPromoOffer();
    checkWorkingHours();
  }, []);

  const checkWorkingHours = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    if (day === 5) {
      setIsOpenNow(false);
      setStatusText('مغلق (الجمعة إجازة) 🔴');
    } else if (hour >= 11 && hour < 20) {
      setIsOpenNow(true);
      setStatusText('مفتوح الآن 🟢');
    } else {
      setIsOpenNow(false);
      setStatusText('مغلق الآن 🔴');
    }
  };

  const fetchMenuItems = async () => {
    setLoadingMenu(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true);

    if (data && !error) {
      setMenuItems(data);
    }
    setLoadingMenu(false);
  };

  const fetchPromoOffer = async () => {
    setLoadingPromo(true);
    const { data } = await supabase.from('settings').select('*').eq('key', 'promo_offer').maybeSingle();
    if (data && data.value) {
      setPromoOffer(data.value);
    } else {
      setPromoOffer(null);
    }
    setLoadingPromo(false);
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

  const filteredItems = selectedCategory
    ? menuItems.filter((item: MenuItem) => item.category === selectedCategory)
    : [];

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

    const paymentText = paymentMethod === 'cash' ? 'كاش عند الاستلام' : paymentMethod === 'instapay' ? 'InstaPay' : 'محفظة إلكترونية';

    const combinedNotes = [
      `طريقة الدفع: ${paymentText}`,
      altPhone ? `رقم إضافي: ${altPhone}` : '',
      notes ? `ملاحظات: ${notes}` : ''
    ].filter(Boolean).join(' | ');

    const orderPayload = {
      customer_name: customerName,
      phone: phone,
      address: orderType === 'delivery' ? address : 'استلام من المطعم',
      items: formattedItems,
      total: grandTotal,
      total_amount: grandTotal,
      payment_method: paymentText,
      notes: combinedNotes,
      status: 'pending',
    };

    await supabase.from('customers').upsert(
      { name: customerName, phone: phone, address: address },
      { onConflict: 'phone' }
    );

    const { data, error } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select();

    setSubmittingOrder(false);

    if (error) {
      alert('حدث خطأ أثناء إرسال الطلب: ' + error.message);
    } else if (data && data[0]) {
      setOrderId(data[0].id);
      setOrderSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff9f4] text-stone-900 font-sans dir-rtl pb-32" dir="rtl">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;800;900&family=Tajawal:wght@700;800;900&display=swap');
        body { font-family: 'Cairo', 'Tajawal', sans-serif; background-color: #fff9f4; }
      `}</style>

      {/* 1. البانر العلوي الهيدر */}
      <div className="relative">
        <div className="h-44 w-full bg-gradient-to-r from-[#b93828] via-[#a12f21] to-[#2d4a3e] overflow-hidden relative shadow-md">
          <img 
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" 
            alt="Grill & Greens Cover" 
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>

        {/* كارت المطعم الرئيسي */}
        <div className="max-w-xl mx-auto px-4 -mt-16 relative z-10">
          <div className="bg-[#b93828] text-white rounded-3xl p-5 shadow-2xl border border-red-500/30 space-y-4">
            
            {/* اللوجو والاسم جنب بعض في سطر واحد */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-[#e8dbca] border-2 border-white rounded-2xl overflow-hidden shadow-md flex items-center justify-center p-1 shrink-0">
                <img 
                  src="https://www2.0zz0.com/2025/12/05/23/289980791.png" 
                  alt="Grill & Greens Logo" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black tracking-tight leading-none">Grill & Greens</h1>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isOpenNow ? 'bg-emerald-500 text-white' : 'bg-stone-800 text-red-300'}`}>
                    {statusText}
                  </span>
                </div>
                <p className="text-xs text-stone-200 font-bold pt-1">العنوان: سوهاج • أكل بيتي ومشويات</p>
                <p className="text-xs text-amber-200 font-black">⏳ تجهيز الأوردر: 1 - 2 ساعة</p>
              </div>
            </div>

            {/* أزرار التواصل موزعة بالتساوي بدون سكرول */}
            <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-red-600/60">
              <a href={SOCIAL_LINKS.phoneCall} className="bg-white/10 hover:bg-white/20 py-2 rounded-xl text-white text-[10px] font-black flex items-center justify-center text-center transition">
                📞 اتصال
              </a>
              <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl text-white text-[10px] font-black flex items-center justify-center text-center transition">
                💬 واتساب
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 py-2 rounded-xl text-white text-[10px] font-black flex items-center justify-center text-center transition">
                فيسبوك
              </a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 py-2 rounded-xl text-white text-[10px] font-black flex items-center justify-center text-center transition">
                انستجرام
              </a>
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 py-2 rounded-xl text-white text-[10px] font-black flex items-center justify-center text-center transition">
                تيك توك
              </a>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-4 space-y-4">

        {/* 2. العروض الخاصة */}
        {!loadingPromo && promoOffer && promoOffer.isActive && (
          <div className="space-y-2">
            <h3 className="text-sm font-black text-[#b93828] flex items-center gap-1">
              <span>🔥</span> عروض خاصة
            </h3>
            <div className="relative overflow-hidden rounded-3xl border border-[#b93828]/20 bg-white p-4 text-stone-900 shadow-lg">
              {promoOffer.type === 'image' && promoOffer.imageUrl ? (
                <img 
                  src={promoOffer.imageUrl} 
                  alt="العرض الخاص" 
                  className="w-full h-auto max-h-56 rounded-2xl object-cover shadow"
                />
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="bg-[#b93828] text-white text-[10px] font-black px-2.5 py-0.5 rounded-md">
                      عرض اليوم
                    </span>
                    <h4 className="text-base font-black text-[#b93828]">{promoOffer.title}</h4>
                    <p className="text-xs font-bold text-stone-600">{promoOffer.description}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-2xl font-black block text-[#b93828]">{promoOffer.price} <span className="text-xs font-bold">ج.م</span></span>
                    <button 
                      onClick={() => addToCart({
                        id: 'promo-offer-special',
                        name: promoOffer.title || 'عرض خاص اليوم',
                        price: promoOffer.price || 0,
                        category: 'العروض',
                        description: promoOffer.description
                      })}
                      className="mt-1 bg-[#b93828] hover:bg-[#a12f21] text-white w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center shadow transition active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. العرض الرئيسي: إما كروت الأقسام وإما أصناف القسم المحدد */}
        <main className="space-y-4 pt-1">
          {loadingMenu ? (
            <div className="text-center py-16 text-stone-400 font-black">جاري تحميل أشهى الوجبات... ⏳</div>
          ) : orderSent ? (
            <div className="bg-white border border-emerald-500/30 p-6 rounded-3xl text-center my-6 space-y-4 shadow-xl">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center text-3xl mx-auto">
                ✅
              </div>
              <h2 className="text-xl font-black text-stone-900">تم إرسال طلبك بنجاح!</h2>
              <p className="text-stone-500 text-xs font-bold">
                رقم الطلب: <span className="font-black text-[#b93828] text-sm">#{String(orderId).split('-')[0].toUpperCase()}</span>
              </p>
              
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-right text-xs space-y-2 max-w-sm mx-auto font-bold">
                <p className="border-b border-stone-200 pb-1 text-stone-700">تفاصيل الفاتورة والوصل:</p>
                <div className="flex justify-between text-stone-600">
                  <span>إجمالي الأصناف:</span>
                  <span>{itemsSubtotal} ج.م</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>طريقة الدفع:</span>
                  <span className="font-bold text-[#b93828]">
                    {paymentMethod === 'cash' ? 'كاش عند الاستلام 💵' : paymentMethod === 'instapay' ? 'انستاباي InstaPay 📱' : 'محفظة إلكترونية 💳'}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>نوع الطلب:</span>
                  <span>{orderType === 'delivery' ? 'توصيل دليفري' : 'استلام من المطعم'}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-[#b93828]">
                    <span>خدمة توصيل (دليفري):</span>
                    <span>+{DELIVERY_FEE} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-900 border-t border-stone-200 pt-1.5 text-sm">
                  <span>المبلغ الإجمالي المطلوب:</span>
                  <span className="text-[#b93828] font-black">{grandTotal} ج.م</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setOrderSent(false);
                  setIsCartOpen(false);
                  setCart([]);
                  setSelectedCategory(null);
                }}
                className="bg-[#b93828] text-white font-black px-6 py-3 rounded-2xl text-xs hover:bg-[#a12f21] transition shadow"
              >
                طلب جديد 🍽️
              </button>
            </div>
          ) : selectedCategory === null ? (
            /* 🔥 الواجهة الأولى: عرض كروت الأقسام فقط */
            <div className="space-y-3">
              <h3 className="text-sm font-black text-[#b93828] flex items-center gap-1">
                <span>🍽️</span> اختار القسم واستمتع بأشهى الأكلات
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => {
                  const count = menuItems.filter(i => i.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className="bg-white border border-stone-200 hover:border-[#b93828] p-5 rounded-3xl shadow-sm hover:shadow-md transition text-right space-y-2 flex flex-col justify-between group active:scale-95"
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-3xl group-hover:scale-110 transition">{cat.icon}</span>
                        <span className="bg-stone-100 text-stone-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                          {count} صنف
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-stone-900 text-base">{cat.name}</h4>
                        <p className="text-[11px] text-[#b93828] font-bold mt-1 flex items-center gap-1">
                          عرض الأصناف ➔
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 🔥 الواجهة الثانية: صفحة أصناف القسم المحدد + زر العودة للأقسام */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-800 px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1"
                >
                  ➔ العودة للأقسام
                </button>
                <h3 className="text-base font-black text-[#b93828]">
                  قسم {selectedCategory} ({filteredItems.length})
                </h3>
              </div>

              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-stone-400 font-black">لا توجد أصناف متوفرة في هذا القسم حالياً.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  {filteredItems.map((item: MenuItem) => (
                    <div
                      key={item.id}
                      className="bg-white border border-stone-200 hover:border-[#b93828]/40 rounded-3xl p-3 shadow-sm hover:shadow-md flex flex-col justify-between transition relative overflow-hidden group"
                    >
                      {/* زر الإضافة السريع (+) */}
                      <button
                        onClick={() => addToCart(item)}
                        className="absolute top-4 left-4 z-10 w-9 h-9 bg-[#b93828] hover:bg-[#a12f21] text-white rounded-full font-black text-lg flex items-center justify-center shadow-lg active:scale-95 transition"
                      >
                        +
                      </button>

                      {/* صورة الصنف */}
                      <div className="w-full h-32 bg-stone-100 rounded-2xl overflow-hidden mb-3 border border-stone-100 flex items-center justify-center">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        ) : (
                          <span className="text-3xl">🍲</span>
                        )}
                      </div>

                      {/* التفاصيل */}
                      <div className="space-y-1 text-right flex-1">
                        {item.is_popular && (
                          <span className="bg-[#b93828]/10 text-[#b93828] text-[9px] font-black px-2 py-0.5 rounded-md inline-block">
                            الأكثر طلباً 🔥
                          </span>
                        )}
                        <h3 className="font-black text-stone-900 text-sm leading-tight">{item.name}</h3>
                        {item.description && (
                          <p className="text-[11px] text-stone-500 line-clamp-2 leading-snug font-bold">{item.description}</p>
                        )}
                      </div>

                      {/* السعر */}
                      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-[#b93828] font-black text-sm">
                          {item.price} <span className="text-[10px] font-bold text-stone-500">ج.م</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* الفوتر */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-8 px-4 text-center mt-12 space-y-3 border-t border-stone-800 font-bold">
        <p className="font-black text-white text-sm">Grill & Greens - سوهاج</p>
        <div className="flex justify-center items-center gap-4 text-stone-400">
          <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#b93828]">فيسبوك</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#b93828]">انستجرام</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-[#b93828]">تيك توك</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-[#b93828]">يوتيوب</a>
        </div>
        <p className="text-[11px] text-stone-500">جميع الحقوق محفوظة © Grill & Greens</p>

        <div className="pt-2 border-t border-stone-800">
          <a href="/admin" className="text-stone-500 hover:text-[#b93828] text-[11px] underline transition">
            🔒 دخول لوحة الإدارة
          </a>
        </div>
      </footer>

      {/* 4. الشريط العائم السفلي للسلة */}
      {cart.length > 0 && !orderSent && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#b93828] hover:bg-[#a12f21] text-white p-4 rounded-3xl shadow-2xl flex justify-between items-center font-black text-sm transition-all active:scale-98 border border-white/20"
          >
            <div className="flex items-center gap-2.5">
              <span className="bg-black/30 text-white px-3 py-1 rounded-xl text-xs font-black">
                {totalItemsCount}
              </span>
              <span>عرض السلة وتأكيد الطلب</span>
            </div>
            <span>{grandTotal} ج.م ➔</span>
          </button>
        </div>
      )}

      {/* 5. نافذة السلة وتأكيد الطلب المنبثقة */}
      {isCartOpen && !orderSent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-bold">
          <div className="bg-white border border-stone-200 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 space-y-4 text-stone-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h2 className="text-base font-black text-stone-900">تفاصيل السلة والوصل</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-stone-400 hover:text-stone-900 font-black text-lg">✕</button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between items-center text-xs border-b border-stone-100 pb-2">
                  <div>
                    <p className="font-black text-stone-800">{product.name}</p>
                    <p className="text-stone-500">{product.price} ج.م × {quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 bg-stone-100 text-stone-700 rounded-xl font-black">-</button>
                    <span className="font-black text-[#b93828]">{quantity}</span>
                    <button onClick={() => addToCart(product)} className="w-7 h-7 bg-[#b93828] text-white rounded-xl font-black">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-stone-50 p-3 rounded-2xl space-y-1.5 text-xs text-stone-600 border border-stone-200">
              <div className="flex justify-between">
                <span>المجموع الفرعي للأصناف:</span>
                <span>{itemsSubtotal} ج.م</span>
              </div>

              {orderType === 'delivery' && (
                <div className="flex justify-between text-[#b93828]">
                  <span>خدمة توصيل (دليفري):</span>
                  <span>+{DELIVERY_FEE} ج.م</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-stone-200 font-black text-sm text-stone-900">
                <span>الإجمالي الكلي بالريسيت:</span>
                <span className="text-[#b93828] text-base">{grandTotal} ج.م</span>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-3 pt-1 text-xs">
              <div>
                <label className="block text-[11px] font-black text-stone-600 mb-1">اسم العميل *</label>
                <input type="text" required placeholder="الاسم الكريم" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-stone-900 outline-none focus:border-[#b93828]" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-black text-stone-600 mb-1">رقم الهاتف *</label>
                  <input type="tel" required placeholder="01xxxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-stone-900 outline-none focus:border-[#b93828]" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-stone-600 mb-1">رقم إضافي (اختياري)</label>
                  <input type="tel" placeholder="01xxxxxxxxx" value={altPhone} onChange={e => setAltPhone(e.target.value)} className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-stone-900 outline-none focus:border-[#b93828]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-black text-stone-600 mb-1">نوع الاستلام</label>
                  <select value={orderType} onChange={e => setOrderType(e.target.value as any)} className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-stone-900 font-black outline-none">
                    <option value="delivery">توصيل دليفري (+30 ج.م)</option>
                    <option value="takeaway">استلام من المطعم (0 ج.م)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-stone-600 mb-1">طريقة الدفع *</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-[#b93828] font-black outline-none">
                    <option value="cash">💵 كاش عند الاستلام</option>
                    <option value="instapay">📱 انستاباي (InstaPay)</option>
                    <option value="wallet">💳 محفظة إلكترونية</option>
                  </select>
                </div>
              </div>

              {paymentMethod !== 'cash' && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl text-[11px] text-emerald-700 font-bold">
                  💡 سيتم تحويل المبلغ إلى الحساب: <span className="font-black underline">01101616480</span> عند تأكيد الطلب.
                </div>
              )}

              {orderType === 'delivery' && (
                <div>
                  <label className="block text-[11px] font-black text-stone-600 mb-1">العنوان التفصيلي *</label>
                  <input type="text" required placeholder="الشارع - العمارة - العلامة المميزة" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-stone-900 outline-none focus:border-[#b93828]" />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-stone-600 mb-1">ملاحظات للوجبة</label>
                <input type="text" placeholder="مثال: بدون بصل، زيادة طحينة..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-stone-900 outline-none focus:border-[#b93828]" />
              </div>

              <button type="submit" disabled={submittingOrder} className="w-full bg-[#b93828] hover:bg-[#a12f21] text-white font-black py-3.5 rounded-2xl shadow-lg transition mt-2">
                {submittingOrder ? 'جاري إرسال الطلب...' : `تأكيد وإرسال الطلب (${grandTotal} ج.م)`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}