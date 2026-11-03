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
  
  // حالة المتجر (مفتوح / مغلق / تلقائي) المربوطة بلوحة الإدارة
  const [storeStatusMode, setStoreStatusMode] = useState<string>('auto');
  const [isOpenNow, setIsOpenNow] = useState<boolean>(true);

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
    youtube: 'https://youtube.com/@grillgreens',
    whatsapp: 'https://wa.me/201101616480',
    phoneCall: 'tel:201101616480',
  };

  useEffect(() => {
    fetchMenuItems();
    fetchPromoOffer();
    fetchStoreStatusSettings();

    // الاستماع اللحظي لتغييرات حالة المتجر أو العروض من الإدارة
    const settingsChannel = supabase
      .channel('realtime_customer_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        fetchPromoOffer();
        fetchStoreStatusSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  const fetchStoreStatusSettings = async () => {
    const { data } = await supabase.from('settings').select('*').eq('key', 'store_status_mode').maybeSingle();
    if (data && data.value) {
      const mode = data.value.mode || 'auto';
      setStoreStatusMode(mode);
      evaluateStoreOpenState(mode);
    } else {
      evaluateStoreOpenState('auto');
    }
  };

  const evaluateStoreOpenState = (mode: string) => {
    if (mode === 'open') {
      setIsOpenNow(true);
    } else if (mode === 'closed') {
      setIsOpenNow(false);
    } else {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();

      if (day === 5) {
        setIsOpenNow(false);
      } else if (hour >= 11 && hour < 20) {
        setIsOpenNow(true);
      } else {
        setIsOpenNow(false);
      }
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

  // دالة مطابقة مرنة للقسم لتجنب مشكلة القسم الفارغ
  const filteredItems = menuItems.filter((item: MenuItem) => {
    if (selectedCategory === 'all') return true;
    if (!item.category) return false;
    
    // إزالة الهمزات والمسافات للمقارنة الدقيقة
    const normalize = (str: string) => 
      str ? str.trim().replace(/إج|أ|إ|آ/g, 'ا').toLowerCase() : '';

    return normalize(item.category) === normalize(selectedCategory);
  });

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
    <div className="min-h-screen bg-[#fcf8f2] text-stone-900 font-sans dir-rtl pb-28" dir="rtl">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&family=Tajawal:wght@700;900&display=swap');
        body { font-family: 'Cairo', 'Tajawal', sans-serif; }
      `}</style>
      
      {/* 1. البانر العلوي وصورة الخلفية الفاخرة */}
      <div className="relative">
        <div className="h-44 w-full bg-gradient-to-r from-[#b93828] via-[#a12f21] to-[#183a24] overflow-hidden relative">
          <img 
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" 
            alt="Cover" 
            className="w-full h-full object-cover opacity-25 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#b93828] via-transparent to-transparent"></div>
        </div>

        {/* كرت الهيدر الأحمر الاحترافي */}
        <div className="max-w-xl mx-auto px-4 -mt-24 relative z-10">
          <div className="bg-[#b93828] border-2 border-[#a12f21] rounded-3xl p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white tracking-tight">Grill & Greens</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                    isOpenNow 
                      ? 'bg-emerald-600/90 text-white border-emerald-400' 
                      : 'bg-stone-900/90 text-rose-300 border-rose-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOpenNow ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
                    {isOpenNow ? 'مفتوح الآن 🟢' : 'مغلق الآن 🔴'}
                  </span>
                </div>
                <p className="text-xs text-stone-100 font-bold leading-relaxed">
                  العنوان: سوهاج • أكل بيتي ومشويات<br/>
                  ⏳ تجهيز الأوردر: 1 - 2 ساعة
                </p>
              </div>

              <div className="w-16 h-16 bg-white border-2 border-stone-200 rounded-2xl overflow-hidden shadow-md flex items-center justify-center p-1 shrink-0">
                <img 
                  src="https://www2.0zz0.com/2025/12/05/23/289980791.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* أزرار التواصل والسوشيال ميديا داخل الهيدر الأحمر */}
            <div className="grid grid-cols-5 gap-1 pt-2 border-t border-white/20 text-[10px] sm:text-[11px] font-black">
              <a href={SOCIAL_LINKS.phoneCall} className="bg-white/15 hover:bg-white/25 text-white py-2 rounded-xl flex items-center justify-center gap-1 transition">
                📞 اتصال
              </a>
              <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl flex items-center justify-center gap-1 transition">
                💬 واتساب
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="bg-white/15 hover:bg-white/25 text-white py-2 rounded-xl flex items-center justify-center gap-1 transition">
                فيسبوك
              </a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="bg-white/15 hover:bg-white/25 text-white py-2 rounded-xl flex items-center justify-center gap-1 transition">
                انستجرام
              </a>
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="bg-white/15 hover:bg-white/25 text-white py-2 rounded-xl flex items-center justify-center gap-1 transition">
                تيك توك
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-6 space-y-6">
        
        {/* 2. كرت العرض الخاص المميز */}
        {!loadingPromo && promoOffer && promoOffer.isActive && (
          <div className="space-y-3">
            <h2 className="text-sm font-black text-stone-800 flex items-center gap-1.5 px-1">
              <span>🔥</span> عروض خاصة
            </h2>

            <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 text-stone-900 shadow-xl">
              {promoOffer.type === 'image' && promoOffer.imageUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-[#b93828] text-white text-[10px] font-black px-2.5 py-1 rounded-lg">
                      عرض اليوم 👑
                    </span>
                  </div>
                  <img 
                    src={promoOffer.imageUrl} 
                    alt="عرض اليوم" 
                    className="w-full h-auto max-h-56 rounded-2xl object-cover border border-stone-100"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="bg-[#b93828] text-white text-[10px] font-black px-2.5 py-1 rounded-lg inline-block">
                      عرض اليوم 👑
                    </span>
                    <h3 className="text-base font-black leading-tight text-stone-900">{promoOffer.title}</h3>
                    <p className="text-xs font-bold text-stone-500">{promoOffer.description}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-2xl font-black block text-[#b93828]">{promoOffer.price} <span className="text-xs font-bold text-stone-400">ج.م</span></span>
                    <button 
                      onClick={() => addToCart({
                        id: 'promo-offer-special',
                        name: promoOffer.title || 'عرض خاص اليوم',
                        price: promoOffer.price || 0,
                        category: 'العروض',
                        description: promoOffer.description
                      })}
                      className="mt-2 bg-[#b93828] hover:bg-[#a12f21] text-white w-10 h-10 rounded-2xl font-black text-xl flex items-center justify-center shadow-md transition active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. العنوان الرئيسي وعرض الأقسام أو الأصناف */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-stone-800 flex items-center gap-1.5">
              <span>🍽️</span> {selectedCategory === 'all' ? 'اختر القسم واستمتع بأشهى الأكلات' : `قسم: ${selectedCategory}`}
            </h2>
            {selectedCategory !== 'all' && (
              <button 
                onClick={() => setSelectedCategory('all')} 
                className="text-xs font-black text-[#b93828] hover:underline bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm"
              >
                ← العودة لكل الأقسام
              </button>
            )}
          </div>
        </div>

        {/* 4. محتوى الأقسام أو الأصناف */}
        <main className="space-y-3 pt-1">
          {loadingMenu ? (
            <div className="text-center py-12 text-stone-500 font-black">جاري تحميل أشهى الوجبات... ⏳</div>
          ) : orderSent ? (
            <div className="bg-white border border-emerald-300 p-6 rounded-3xl text-center my-6 space-y-4 shadow-2xl">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
                ✅
              </div>
              <h2 className="text-xl font-black text-stone-900">تم إرسال طلبك بنجاح!</h2>
              <p className="text-stone-500 text-xs font-bold">
                رقم الطلب: <span className="font-black text-[#b93828] text-sm">#{String(orderId).split('-')[0].toUpperCase()}</span>
              </p>
              
              <div className="bg-[#fcf8f2] p-4 rounded-2xl border border-stone-200 text-right text-xs space-y-2 max-w-sm mx-auto font-bold">
                <p className="border-b border-stone-200 pb-1 text-stone-700">تفاصيل الفاتورة:</p>
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
                <div className="flex justify-between text-stone-900 border-t border-stone-200 pt-2 text-sm font-black">
                  <span>المبلغ الإجمالي المطلوب:</span>
                  <span className="text-[#b93828]">{grandTotal} ج.م</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setOrderSent(false);
                  setIsCartOpen(false);
                  setCart([]);
                }}
                className="bg-[#b93828] text-white font-black px-6 py-3 rounded-2xl text-xs hover:bg-[#a12f21] transition shadow-lg shadow-[#b93828]/30"
              >
                طلب جديد 🍽️
              </button>
            </div>
          ) : selectedCategory === 'all' ? (
            // عرض الكروت الكبيرة للأقسام فقط (بدون شريط علوي)
            <div className="grid grid-cols-2 gap-3.5">
              {CATEGORIES.filter(c => c.id !== 'all').map((cat) => {
                const count = menuItems.filter(item => {
                  if (!item.category) return false;
                  return item.category.trim().toLowerCase() === cat.name.trim().toLowerCase() ||
                         item.category.trim().toLowerCase() === cat.id.trim().toLowerCase();
                }).length;

                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className="bg-white border border-stone-200/90 hover:border-[#b93828] p-5 rounded-3xl shadow-sm hover:shadow-lg transition cursor-pointer flex flex-col justify-between text-center space-y-4 group"
                  >
                    <div className="w-14 h-14 bg-[#fcf8f2] group-hover:bg-[#b93828]/10 rounded-2xl mx-auto flex items-center justify-center text-3xl transition shadow-inner">
                      {cat.name.includes('مشويات') ? '🥩' : cat.name.includes('وجبات') ? '🍱' : cat.name.includes('محاشي') ? '🥬' : cat.name.includes('طواجن') ? '🍲' : cat.name.includes('طيور') ? '🍗' : '🥗'}
                    </div>
                    <div>
                      <h3 className="font-black text-stone-900 text-base group-hover:text-[#b93828] transition">{cat.name}</h3>
                      <p className="text-[11px] text-stone-400 font-bold mt-1">{count} صنف متاح</p>
                    </div>
                    <span className="text-xs font-black text-stone-600 bg-[#fcf8f2] py-2 rounded-2xl block transition group-hover:bg-[#b93828] group-hover:text-white shadow-sm">
                      عرض الأصناف ←
                    </span>
                  </div>
                );
              })}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-stone-500 font-black bg-white rounded-3xl border border-stone-200 shadow-sm space-y-3">
              <p>لا توجد أصناف متوفرة في هذا القسم حالياً.</p>
              <button 
                onClick={() => setSelectedCategory('all')}
                className="bg-[#b93828] text-white text-xs font-black px-4 py-2 rounded-xl"
              >
                العودة للأقسام
              </button>
            </div>
          ) : (
            // عرض الأصناف داخل القسم المحدد
            filteredItems.map((item: MenuItem) => (
              <div
                key={item.id}
                className="bg-white border border-stone-200/80 hover:border-stone-300 p-4 rounded-3xl shadow-sm flex items-center justify-between gap-4 transition"
              >
                <div className="w-20 h-20 bg-[#fcf8f2] rounded-2xl overflow-hidden shrink-0 border border-stone-200 flex items-center justify-center shadow-inner">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">🍲</span>
                  )}
                </div>

                <div className="flex-1 text-right space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-stone-900 text-sm">{item.name}</h3>
                    {item.is_popular && (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-md">
                        الأكثر طلباً 🔥
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-stone-500 line-clamp-2 leading-snug font-bold">{item.description}</p>
                  )}
                  <span className="text-[#b93828] font-black text-sm block">
                    {item.price} <span className="text-[10px] text-stone-400 font-normal">ج.م</span>
                  </span>
                </div>

                <button
                  onClick={() => addToCart(item)}
                  className="w-11 h-11 bg-[#b93828] hover:bg-[#a12f21] text-white rounded-2xl font-black text-2xl flex items-center justify-center shadow-md active:scale-95 transition shrink-0"
                >
                  +
                </button>
              </div>
            ))
          )}
        </main>
      </div>

      {/* الفوتر */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-8 px-4 text-center mt-12 space-y-3 border-t border-stone-800 font-bold">
        <p className="font-black text-stone-200 text-sm">Grill & Greens - سوهاج</p>
        <div className="flex justify-center items-center gap-4 text-stone-400 text-xs">
          <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white">فيسبوك</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">انستجرام</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-white">تيك توك</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-white">يوتيوب</a>
        </div>
        <p className="text-[11px] text-stone-500">جميع الحقوق محفوظة © Grill & Greens</p>

        <div className="pt-2 border-t border-stone-800">
          <a href="/admin" className="text-stone-500 hover:text-stone-300 text-[11px] underline transition">
            🔒 دخول لوحة الإدارة
          </a>
        </div>
      </footer>

      {/* الشريط العائم للسلة */}
      {cart.length > 0 && !orderSent && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#b93828] hover:bg-[#a12f21] text-white p-4 rounded-3xl shadow-2xl flex justify-between items-center font-black text-sm transition-all active:scale-98 border border-white/20"
          >
            <div className="flex items-center gap-2.5">
              <span className="bg-white/20 text-white px-2.5 py-1 rounded-xl text-xs font-black">
                {totalItemsCount} أصناف
              </span>
              <span>عرض السلة وإتمام الطلب</span>
            </div>
            <span>{grandTotal} ج.م ➔</span>
          </button>
        </div>
      )}

      {/* نافذة السلة وتأكيد الطلب */}
      {isCartOpen && !orderSent && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-bold">
          <div className="bg-white border border-stone-200 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h2 className="text-base font-black text-stone-900">تفاصيل السلة والفاتورة</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-stone-400 hover:text-stone-700 font-black text-lg">✕</button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between items-center text-xs border-b border-stone-100 pb-2">
                  <div>
                    <p className="font-black text-stone-800">{product.name}</p>
                    <p className="text-stone-400">{product.price} ج.م × {quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(product.id)} className="w-7 h-7 bg-stone-100 text-stone-700 rounded-xl font-black">-</button>
                    <span className="font-black text-[#b93828]">{quantity}</span>
                    <button onClick={() => addToCart(product)} className="w-7 h-7 bg-[#b93828] text-white rounded-xl font-black">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#fcf8f2] p-3 rounded-2xl space-y-1.5 text-xs text-stone-600 border border-stone-200">
              <div className="flex justify-between">
                <span>المجموع الفرعي للأصناف:</span>
                <span>{itemsSubtotal} ج.م</span>
              </div>

              {orderType === 'delivery' && (
                <div className="flex justify-between text-[#b93828] font-bold">
                  <span>خدمة توصيل (دليفري):</span>
                  <span>+{DELIVERY_FEE} ج.م</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-stone-200 font-black text-sm text-stone-900">
                <span>الإجمالي الكلي المطلوب:</span>
                <span className="text-[#b93828] text-base">{grandTotal} ج.م</span>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-3 pt-1 text-xs">
              <div>
                <label className="block text-[11px] font-black text-stone-600 mb-1">اسم العميل *</label>
                <input type="text" required placeholder="الاسم الكريم" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-[#fcf8f2] border border-stone-200 rounded-2xl p-3 text-stone-900 outline-none focus:border-[#b93828]" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-black text-stone-600 mb-1">رقم الهاتف *</label>
                  <input type="tel" required placeholder="01xxxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-[#fcf8f2] border border-stone-200 rounded-2xl p-3 text-stone-900 outline-none focus:border-[#b93828]" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-stone-600 mb-1">رقم إضافي (اختياري)</label>
                  <input type="tel" placeholder="01xxxxxxxxx" value={altPhone} onChange={e => setAltPhone(e.target.value)} className="w-full bg-[#fcf8f2] border border-stone-200 rounded-2xl p-3 text-stone-900 outline-none focus:border-[#b93828]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-black text-stone-600 mb-1">نوع الاستلام</label>
                  <select value={orderType} onChange={e => setOrderType(e.target.value as any)} className="w-full bg-[#fcf8f2] border border-stone-200 rounded-2xl p-3 text-stone-900 font-black outline-none">
                    <option value="delivery">توصيل دليفري (+30 ج.م)</option>
                    <option value="takeaway">استلام من المطعم (0 ج.م)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-stone-600 mb-1">طريقة الدفع *</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-[#fcf8f2] border border-stone-200 rounded-2xl p-3 text-[#b93828] font-black outline-none">
                    <option value="cash">💵 كاش عند الاستلام</option>
                    <option value="instapay">📱 انستاباي (InstaPay)</option>
                    <option value="wallet">💳 محفظة إلكترونية</option>
                  </select>
                </div>
              </div>

              {paymentMethod !== 'cash' && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl text-[11px] text-emerald-800 font-bold">
                  💡 سيتم تحويل المبلغ إلى الحساب: <span className="font-black underline text-emerald-900">01101616480</span> عند تأكيد الطلب.
                </div>
              )}

              {orderType === 'delivery' && (
                <div>
                  <label className="block text-[11px] font-black text-stone-600 mb-1">العنوان التفصيلي *</label>
                  <input type="text" required placeholder="الشارع - العمارة - العلامة المميزة" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-[#fcf8f2] border border-stone-200 rounded-2xl p-3 text-stone-900 outline-none focus:border-[#b93828]" />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-stone-600 mb-1">ملاحظات للوجبة</label>
                <input type="text" placeholder="مثال: بدون بصل، زيادة طحينة..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-[#fcf8f2] border border-stone-200 rounded-2xl p-3 text-stone-900 outline-none focus:border-[#b93828]" />
              </div>

              <button type="submit" disabled={submittingOrder} className="w-full bg-[#b93828] hover:bg-[#a12f21] text-white font-black py-3.5 rounded-2xl shadow-lg transition mt-2 shadow-[#b93828]/30">
                {submittingOrder ? 'جاري إرسال الطلب...' : `تأكيد وإرسال الطلب (${grandTotal} ج.م)`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}