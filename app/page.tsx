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
}

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'الكل 🍽️' },
  { id: 'المشويات', name: 'المشويات 🥩' },
  { id: 'الوجبات', name: 'الوجبات 🍱' },
  { id: 'المحاشي', name: 'المحاشي 🥬' },
  { id: 'الطواجن', name: 'الطواجن 🍲' },
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
  const [isOpenNow, setIsOpenNow] = useState<boolean>(true);

  // إعدادات العرض الخاص (إما نص أو صورة)
  const [promoOffer, setPromoOffer] = useState<{
    type: 'text' | 'image';
    title?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    isActive: boolean;
  }>({
    type: 'text',
    title: 'مشكل Grill & Greens للعيلة',
    description: 'كيلو مشويات مشكلة + 4 أطباق جانبية',
    price: 1150,
    imageUrl: '',
    isActive: true,
  });

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
    youtube: 'https://youtube.com/@grillgreens',
    whatsapp: 'https://wa.me/201101616480',
  };

  useEffect(() => {
    fetchMenuItems();
    fetchPromoOffer();
    checkWorkingHours();
  }, []);

  // فحص مواعيد العمل: كل يوم من 11 ص لـ 8 م ماعدا الجمعة إجازة
  const checkWorkingHours = () => {
    const now = new Date();
    const day = now.getDay(); // 5 = الجمعة
    const hour = now.getHours();

    if (day === 5) {
      setIsOpenNow(false);
    } else if (hour >= 11 && hour < 20) {
      setIsOpenNow(true);
    } else {
      setIsOpenNow(false);
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
    const { data } = await supabase.from('settings').select('*').eq('key', 'promo_offer').single();
    if (data && data.value) {
      setPromoOffer(data.value);
    }
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
    <div className="min-h-screen bg-[#0d0d0d] text-stone-100 font-sans dir-rtl pb-28" dir="rtl">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&family=Tajawal:wght@700;900&display=swap');
        body { font-family: 'Cairo', 'Tajawal', sans-serif; }
      `}</style>
      
      {/* 1. البانر العلوي بصورة السفرة والأكل البيتي والوجبات */}
      <div className="relative">
        <div className="h-44 w-full bg-gradient-to-r from-[#5a1210] via-[#121212] to-[#1c2419] overflow-hidden relative">
          <img 
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" 
            alt="Grill & Greens Feast Cover" 
            className="w-full h-full object-cover opacity-45 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/30 to-transparent"></div>
        </div>

        {/* الهيدر: اللوجو على اليمين مع خلفية بيج دافئة واسم المطعم بوضوح */}
        <div className="max-w-xl mx-auto px-4 flex items-center justify-start gap-4 -mt-12 relative z-10">
          <div className="w-20 h-20 bg-[#e8dbca] border-2 border-[#b93828] rounded-full overflow-hidden shadow-2xl flex items-center justify-center p-1.5 shrink-0">
            <img 
              src="https://www2.0zz0.com/2025/12/05/23/289980791.png" 
              alt="Grill & Greens Logo" 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-[#f1ede6] tracking-tight drop-shadow-md">Grill & Greens</h1>
            <p className="text-xs text-[#4ade80] font-black bg-[#183a24]/90 px-2.5 py-0.5 rounded-md inline-block border border-[#22673a]">
              مشويات وأكل بيتي • سوهاج
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-5 space-y-4">
        
        {/* 2. شريط كروت البيانات السريعة */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
          <span className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border ${
            isOpenNow 
              ? 'bg-[#183a24]/80 text-[#4ade80] border-[#22673a]' 
              : 'bg-[#3b1513]/80 text-[#fca5a5] border-[#8a221a]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isOpenNow ? 'bg-[#4ade80] animate-pulse' : 'bg-[#ef4444]'}`}></span>
            {isOpenNow ? 'مفتوح الآن 🟢' : 'مغلق الآن (الجمعة إجازة) 🔴'}
          </span>

          <span className="bg-[#1a1a1a] text-stone-300 border border-stone-800 px-3 py-1.5 rounded-xl shadow-sm">
            ⏳ تجهيز الأوردر: 1 - 2 ساعة
          </span>

          <span className="bg-[#1a1a1a] text-stone-300 border border-stone-800 px-3 py-1.5 rounded-xl shadow-sm">
            💳 كاش • محفظة • انستاباي
          </span>

          <a 
            href={SOCIAL_LINKS.whatsapp} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mr-auto bg-[#b93828] hover:bg-[#a12f21] text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition shadow-md"
          >
            📞 اتصل بنا
          </a>
        </div>

        {/* 3. كرت العرض المميز */}
        {promoOffer.isActive && (
          <div className="relative overflow-hidden rounded-2xl border border-[#b93828]/50 bg-gradient-to-r from-[#b93828] via-[#a12f21] to-[#183a24] p-4 text-white shadow-xl">
            {promoOffer.type === 'image' && promoOffer.imageUrl ? (
              <img 
                src={promoOffer.imageUrl} 
                alt="العرض الخاص" 
                className="w-full h-auto rounded-xl object-cover"
              />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="bg-[#0d0d0d] text-[#e8dbca] text-[10px] font-black px-2.5 py-0.5 rounded-md border border-[#e8dbca]/20">
                    🔥 عرض اليوم الخاص
                  </span>
                  <h3 className="text-base font-black leading-tight text-white">{promoOffer.title}</h3>
                  <p className="text-xs font-bold text-stone-200">{promoOffer.description}</p>
                </div>
                <div className="text-left shrink-0">
                  <span className="text-2xl font-black block text-[#e8dbca]">{promoOffer.price} <span className="text-xs font-bold">ج.م</span></span>
                  <button 
                    onClick={() => addToCart({
                      id: 'promo-offer',
                      name: promoOffer.title || 'عرض خاص',
                      price: promoOffer.price || 0,
                      category: 'العروض',
                      description: promoOffer.description
                    })}
                    className="mt-1 bg-[#0d0d0d] hover:bg-[#1a1a1a] text-[#e8dbca] w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center shadow transition active:scale-95 border border-[#e8dbca]/30"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. شريط التصنيفات السريع */}
        <div className="sticky top-0 z-20 bg-[#0d0d0d]/95 backdrop-blur-md py-2 border-b border-stone-800">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#b93828] text-white shadow-lg shadow-[#b93828]/30 scale-105'
                    : 'bg-[#1a1a1a] text-stone-400 border border-stone-800 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* 5. قائمة الأصناف: الصورة يمين | التفاصيل منتصف | زر الإضافة شمال */}
        <main className="space-y-3 pt-1">
          {loadingMenu ? (
            <div className="text-center py-12 text-stone-500 font-black">جاري تحميل أشهى الوجبات... ⏳</div>
          ) : orderSent ? (
            <div className="bg-[#1a1a1a] border border-[#22673a] p-6 rounded-3xl text-center my-6 space-y-4 shadow-2xl">
              <div className="w-16 h-16 bg-[#22673a]/20 text-[#4ade80] border border-[#22673a]/40 rounded-full flex items-center justify-center text-3xl mx-auto">
                ✅
              </div>
              <h2 className="text-xl font-black text-white">تم إرسال طلبك بنجاح!</h2>
              <p className="text-stone-400 text-xs font-bold">
                رقم الطلب: <span className="font-black text-[#b93828] text-sm">#{String(orderId).split('-')[0].toUpperCase()}</span>
              </p>
              
              <div className="bg-[#0d0d0d] p-4 rounded-xl border border-stone-800 text-right text-xs space-y-2 max-w-sm mx-auto font-bold">
                <p className="border-b border-stone-800 pb-1 text-stone-300">تفاصيل الفاتورة والوصل:</p>
                <div className="flex justify-between text-stone-400">
                  <span>إجمالي الأصناف:</span>
                  <span>{itemsSubtotal} ج.م</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>طريقة الدفع:</span>
                  <span className="font-bold text-[#e8dbca]">
                    {paymentMethod === 'cash' ? 'كاش عند الاستلام 💵' : paymentMethod === 'instapay' ? 'انستاباي InstaPay 📱' : 'محفظة إلكترونية 💳'}
                  </span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>نوع الطلب:</span>
                  <span>{orderType === 'delivery' ? 'توصيل دليفري' : 'استلام من المطعم'}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-[#b93828]">
                    <span>خدمة توصيل (دليفري):</span>
                    <span>+{DELIVERY_FEE} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-white border-t border-stone-800 pt-1.5 text-sm">
                  <span>المبلغ الإجمالي المطلوب:</span>
                  <span className="text-[#b93828] font-black">{grandTotal} ج.م</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setOrderSent(false);
                  setIsCartOpen(false);
                  setCart([]);
                }}
                className="bg-[#b93828] text-white font-black px-6 py-2.5 rounded-xl text-xs hover:bg-[#a12f21] transition"
              >
                طلب جديد 🍽️
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-stone-500 font-black">لا توجد أصناف متوفرة في هذا القسم حالياً.</div>
          ) : (
            filteredItems.map((item: MenuItem) => (
              <div
                key={item.id}
                className="bg-[#161616] border border-stone-800/80 hover:border-stone-700 p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 transition"
              >
                {/* الصورة على اليمين */}
                <div className="w-16 h-16 bg-[#0d0d0d] rounded-xl overflow-hidden shrink-0 border border-stone-800 flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🍲</span>
                  )}
                </div>

                {/* التفاصيل بالمنتصف */}
                <div className="flex-1 text-right space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-stone-100 text-sm">{item.name}</h3>
                    {item.is_popular && (
                      <span className="bg-[#b93828]/20 text-[#fca5a5] border border-[#b93828]/40 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                        الأكثر طلباً 🔥
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-stone-400 line-clamp-2 leading-snug font-bold">{item.description}</p>
                  )}
                  <span className="text-[#b93828] font-black text-sm block pt-0.5">
                    {item.price} <span className="text-[10px] font-normal text-stone-400">ج.م</span>
                  </span>
                </div>

                {/* زر الإضافة على الشمال */}
                <button
                  onClick={() => addToCart(item)}
                  className="w-10 h-10 bg-[#b93828] hover:bg-[#a12f21] text-white rounded-xl font-black text-xl flex items-center justify-center shadow-lg active:scale-95 transition shrink-0"
                >
                  +
                </button>
              </div>
            ))
          )}
        </main>
      </div>

      {/* الفوتر */}
      <footer className="bg-[#080808] text-stone-500 text-xs py-8 px-4 text-center mt-12 space-y-3 border-t border-stone-900 font-bold">
        <p className="font-black text-[#e8dbca] text-sm">Grill & Greens - سوهاج</p>
        <div className="flex justify-center items-center gap-4 text-stone-400">
          <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#b93828]">فيسبوك</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#b93828]">انستجرام</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-[#b93828]">تيك توك</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-[#b93828]">يوتيوب</a>
        </div>
        <p className="text-[11px] text-stone-600">جميع الحقوق محفوظة © Grill & Greens</p>

        <div className="pt-2 border-t border-stone-900">
          <a href="/admin" className="text-stone-600 hover:text-[#b93828] text-[11px] underline transition">
            🔒 دخول لوحة الإدارة
          </a>
        </div>
      </footer>

      {/* 6. الشريط العائم للسلة */}
      {cart.length > 0 && !orderSent && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#b93828] hover:bg-[#a12f21] text-white p-3.5 rounded-2xl shadow-2xl flex justify-between items-center font-black text-sm transition-all active:scale-98 border border-[#e8dbca]/20"
          >
            <div className="flex items-center gap-2">
              <span className="bg-[#0d0d0d] text-[#e8dbca] px-2.5 py-1 rounded-xl text-xs font-black">
                {totalItemsCount}
              </span>
              <span>عرض السلة وتأكيد الطلب</span>
            </div>
            <span>{grandTotal} ج.م ➔</span>
          </button>
        </div>
      )}

      {/* 7. نافذة السلة وتأكيد الطلب */}
      {isCartOpen && !orderSent && (
        <div className="fixed inset-0 bg-[#0d0d0d]/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-bold">
          <div className="bg-[#161616] border border-stone-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
              <h2 className="text-base font-black text-white">تفاصيل السلة والوصل</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-stone-400 hover:text-white font-black text-lg">✕</button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between items-center text-xs border-b border-stone-800/50 pb-2">
                  <div>
                    <p className="font-black text-stone-200">{product.name}</p>
                    <p className="text-stone-500">{product.price} ج.م × {quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(product.id)} className="w-6 h-6 bg-stone-800 text-stone-300 rounded-lg font-black">-</button>
                    <span className="font-black text-[#b93828]">{quantity}</span>
                    <button onClick={() => addToCart(product)} className="w-6 h-6 bg-[#b93828] text-white rounded-lg font-black">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#0d0d0d] p-3 rounded-xl space-y-1.5 text-xs text-stone-400 border border-stone-800">
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

              <div className="flex justify-between items-center pt-2 border-t border-stone-800 font-black text-sm text-white">
                <span>الإجمالي الكلي بالريسيت:</span>
                <span className="text-[#b93828] text-base">{grandTotal} ج.م</span>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-3 pt-1 text-xs">
              <div>
                <label className="block text-[11px] font-black text-stone-400 mb-1">اسم العميل *</label>
                <input type="text" required placeholder="الاسم الكريم" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-[#0d0d0d] border border-stone-800 rounded-xl p-3 text-white outline-none focus:border-[#b93828]" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-black text-stone-400 mb-1">رقم الهاتف *</label>
                  <input type="tel" required placeholder="01xxxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-[#0d0d0d] border border-stone-800 rounded-xl p-3 text-white outline-none focus:border-[#b93828]" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-stone-400 mb-1">رقم إضافي (اختياري)</label>
                  <input type="tel" placeholder="01xxxxxxxxx" value={altPhone} onChange={e => setAltPhone(e.target.value)} className="w-full bg-[#0d0d0d] border border-stone-800 rounded-xl p-3 text-white outline-none focus:border-[#b93828]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-black text-stone-400 mb-1">نوع الاستلام</label>
                  <select value={orderType} onChange={e => setOrderType(e.target.value as any)} className="w-full bg-[#0d0d0d] border border-stone-800 rounded-xl p-3 text-white font-black outline-none">
                    <option value="delivery">توصيل دليفري (+30 ج.م)</option>
                    <option value="takeaway">استلام من المطعم (0 ج.م)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-stone-400 mb-1">طريقة الدفع *</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-[#0d0d0d] border border-stone-800 rounded-xl p-3 text-[#e8dbca] font-black outline-none">
                    <option value="cash">💵 كاش عند الاستلام</option>
                    <option value="instapay">📱 انستاباي (InstaPay)</option>
                    <option value="wallet">💳 محفظة إلكترونية</option>
                  </select>
                </div>
              </div>

              {paymentMethod !== 'cash' && (
                <div className="bg-[#183a24]/80 border border-[#22673a] p-2.5 rounded-xl text-[11px] text-[#4ade80] font-bold">
                  💡 سيتم تحويل المبلغ إلى الحساب: <span className="font-black underline text-white">01101616480</span> عند تأكيد الطلب.
                </div>
              )}

              {orderType === 'delivery' && (
                <div>
                  <label className="block text-[11px] font-black text-stone-400 mb-1">العنوان التفصيلي *</label>
                  <input type="text" required placeholder="الشارع - العمارة - العلامة المميزة" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-[#0d0d0d] border border-stone-800 rounded-xl p-3 text-white outline-none focus:border-[#b93828]" />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-stone-400 mb-1">ملاحظات للوجبة</label>
                <input type="text" placeholder="مثال: بدون بصل، زيادة طحينة..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-[#0d0d0d] border border-stone-800 rounded-xl p-3 text-white outline-none focus:border-[#b93828]" />
              </div>

              <button type="submit" disabled={submittingOrder} className="w-full bg-[#b93828] hover:bg-[#a12f21] text-white font-black py-3 rounded-xl shadow-lg transition mt-2">
                {submittingOrder ? 'جاري إرسال الطلب...' : `تأكيد وإرسال الطلب (${grandTotal} ج.م)`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}