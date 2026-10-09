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

  // بيانات الطلب المحدثة
  const [customerName, setCustomerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [altPhone, setAltPhone] = useState<string>(''); // رقم إضافي اختياري
  const [address, setAddress] = useState<string>('');
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash'); // طريقة الدفع
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

  // جلب إعدادات العرض الخاص إذا وُجدت
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

    const paymentText = paymentMethod === 'cash' ? 'كاش عند الاستلام' : paymentMethod === 'instapay' ? 'InstaPay' : 'محفظة إلكترونية';

    // تجميع الملاحظات مع الرقم الإضافي وطريقة الدفع
    const finalNotes = [
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
      notes: finalNotes,
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans dir-rtl pb-28" dir="rtl">
      
      {/* 1. البانر العلوي واللوجو المتقاطع */}
      <div className="relative">
        <div className="h-44 w-full bg-gradient-to-r from-red-950 via-zinc-900 to-emerald-950 overflow-hidden relative">
          <img 
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80" 
            alt="Grill & Greens Cover" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
        </div>

        {/* تداخل اللوجو واسم المطعم */}
        <div className="max-w-xl mx-auto px-4 flex items-end justify-between -mt-14 relative z-10">
          <div>
            <h1 className="text-2xl font-black text-amber-400 tracking-tight">Grill & Greens</h1>
            <p className="text-xs text-zinc-400 font-bold mt-0.5">مشويات وأكل بيتي • سوهاج</p>
          </div>
          <div className="w-20 h-20 bg-zinc-900 border-2 border-amber-500 rounded-full overflow-hidden shadow-2xl flex items-center justify-center p-1 bg-zinc-950">
            <img 
              src="https://www2.0zz0.com/2025/12/05/23/289980791.png" 
              alt="Grill & Greens Logo" 
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-4 space-y-4">
        
        {/* 2. شريط كروت البيانات السريعة */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            مفتوح الآن
          </span>
          <span className="bg-zinc-900 text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-xl shadow-sm">
            🛵 توصيل 45 دقيقة
          </span>
          <span className="bg-zinc-900 text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-xl shadow-sm">
            💳 كاش • محفظة • انستاباي
          </span>
          <a 
            href={SOCIAL_LINKS.whatsapp} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mr-auto bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition"
          >
            📞 اتصل بنا
          </a>
        </div>

        {/* 3. كرت العرض المميز (نص أو صورة مصممة) */}
        {promoOffer.isActive && (
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-4 text-zinc-950 shadow-lg shadow-amber-500/10">
            {promoOffer.type === 'image' && promoOffer.imageUrl ? (
              <img 
                src={promoOffer.imageUrl} 
                alt="العرض الخاص" 
                className="w-full h-auto rounded-xl object-cover"
              />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="bg-zinc-950 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                    🔥 عرض اليوم الخاص
                  </span>
                  <h3 className="text-base font-black leading-tight text-zinc-950">{promoOffer.title}</h3>
                  <p className="text-xs font-bold text-zinc-800">{promoOffer.description}</p>
                </div>
                <div className="text-left shrink-0">
                  <span className="text-2xl font-black block text-zinc-950">{promoOffer.price} <span className="text-xs font-bold">ج.م</span></span>
                  <button 
                    onClick={() => addToCart({
                      id: 'promo-offer',
                      name: promoOffer.title || 'عرض خاص',
                      price: promoOffer.price || 0,
                      category: 'العروض',
                      description: promoOffer.description
                    })}
                    className="mt-1 bg-zinc-950 hover:bg-zinc-900 text-amber-400 w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center shadow transition active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. شريط التصنيفات السريع */}
        <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md py-2 border-b border-zinc-800/80">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20 scale-105'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* 5. قائمة الأصناف بكروت هيرو أنيقة */}
        <main className="space-y-3 pt-1">
          {loadingMenu ? (
            <div className="text-center py-12 text-zinc-500 font-bold">جاري تحميل أشهى الوجبات... ⏳</div>
          ) : orderSent ? (
            <div className="bg-zinc-900 border border-emerald-500/30 p-6 rounded-3xl text-center my-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center text-3xl mx-auto">
                ✅
              </div>
              <h2 className="text-xl font-black text-white">تم إرسال طلبك بنجاح!</h2>
              <p className="text-zinc-400 text-xs">
                رقم الطلب: <span className="font-black text-amber-400 text-sm">#{String(orderId).split('-')[0].toUpperCase()}</span>
              </p>
              
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-right text-xs space-y-2 max-w-sm mx-auto">
                <p className="font-bold border-b border-zinc-800 pb-1 text-zinc-300">تفاصيل الفاتورة والوصل:</p>
                <div className="flex justify-between text-zinc-400">
                  <span>إجمالي الأصناف:</span>
                  <span>{itemsSubtotal} ج.م</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>طريقة الدفع:</span>
                  <span className="font-bold text-amber-400">
                    {paymentMethod === 'cash' ? 'كاش عند الاستلام 💵' : paymentMethod === 'instapay' ? 'انستاباي InstaPay 📱' : 'محفظة إلكترونية 💳'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>نوع الطلب:</span>
                  <span>{orderType === 'delivery' ? 'توصيل دليفري' : 'استلام من المطعم'}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-amber-400 font-semibold">
                    <span>خدمة توصيل (دليفري):</span>
                    <span>+{DELIVERY_FEE} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-white border-t border-zinc-800 pt-1.5 text-sm">
                  <span>المبلغ الإجمالي المطلوب:</span>
                  <span className="text-amber-400">{grandTotal} ج.م</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setOrderSent(false);
                  setIsCartOpen(false);
                  setCart([]);
                }}
                className="bg-amber-400 text-zinc-950 font-black px-6 py-2.5 rounded-xl text-xs hover:bg-amber-300 transition"
              >
                طلب جديد 🍽️
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 font-bold">لا توجد أصناف متوفرة في هذا القسم حالياً.</div>
          ) : (
            filteredItems.map((item: MenuItem) => (
              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 p-3.5 rounded-2xl shadow-lg flex items-center justify-between gap-3 transition"
              >
                {/* الأزرار والسعر على اليمين كما بالتصميم */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => addToCart(item)}
                    className="w-10 h-10 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl font-black text-xl flex items-center justify-center shadow-md active:scale-95 transition"
                  >
                    +
                  </button>
                  <div>
                    <span className="text-amber-400 font-black text-sm block">
                      {item.price} <span className="text-[10px] font-normal text-zinc-400">ج.م</span>
                    </span>
                    {item.is_popular && (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                        الأكثر طلباً 🔥
                      </span>
                    )}
                  </div>
                </div>

                {/* تفاصيل الاسم والوصف */}
                <div className="flex-1 text-right space-y-0.5">
                  <h3 className="font-bold text-zinc-100 text-sm">{item.name}</h3>
                  {item.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-snug">{item.description}</p>
                  )}
                </div>

                {/* صورة الوجبة */}
                <div className="w-16 h-16 bg-zinc-950 rounded-xl overflow-hidden shrink-0 border border-zinc-800 flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🍲</span>
                  )}
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      {/* الفوتر */}
      <footer className="bg-zinc-950 text-zinc-500 text-xs py-8 px-4 text-center mt-12 space-y-3 border-t border-zinc-900">
        <p className="font-bold text-amber-400 text-sm">Grill & Greens - سوهاج</p>
        <div className="flex justify-center items-center gap-4 text-zinc-400 font-medium">
          <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">فيسبوك</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">انستجرام</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">تيك توك</a>
          <span>•</span>
          <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">يوتيوب</a>
        </div>
        <p className="text-[11px] text-zinc-600">جميع الحقوق محفوظة © Grill & Greens</p>

        <div className="pt-2 border-t border-zinc-900">
          <a href="/admin" className="text-zinc-600 hover:text-amber-400 text-[11px] underline transition">
            🔒 دخول لوحة الإدارة
          </a>
        </div>
      </footer>

      {/* 6. الشريط العائم للسلة */}
      {cart.length > 0 && !orderSent && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 p-3.5 rounded-2xl shadow-2xl flex justify-between items-center font-black text-sm transition-all active:scale-98"
          >
            <div className="flex items-center gap-2">
              <span className="bg-zinc-950 text-amber-400 px-2.5 py-1 rounded-xl text-xs font-bold">
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
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-white">تفاصيل السلة والوصل</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-zinc-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between items-center text-xs border-b border-zinc-800/50 pb-2">
                  <div>
                    <p className="font-bold text-zinc-200">{product.name}</p>
                    <p className="text-zinc-500">{product.price} ج.م × {quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(product.id)} className="w-6 h-6 bg-zinc-800 text-zinc-300 rounded-lg font-bold">-</button>
                    <span className="font-bold text-amber-400">{quantity}</span>
                    <button onClick={() => addToCart(product)} className="w-6 h-6 bg-amber-400 text-zinc-950 rounded-lg font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-zinc-950 p-3 rounded-xl space-y-1.5 text-xs text-zinc-400 border border-zinc-800">
              <div className="flex justify-between">
                <span>المجموع الفرعي للأصناف:</span>
                <span>{itemsSubtotal} ج.م</span>
              </div>

              {orderType === 'delivery' && (
                <div className="flex justify-between text-amber-400 font-medium">
                  <span>خدمة توصيل (دليفري):</span>
                  <span>+{DELIVERY_FEE} ج.م</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-zinc-800 font-bold text-sm text-white">
                <span>الإجمالي الكلي بالريسيت:</span>
                <span className="text-amber-400 text-base">{grandTotal} ج.م</span>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-3 pt-1 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">اسم العميل *</label>
                <input type="text" required placeholder="الاسم الكريم" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-amber-400" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">رقم الهاتف *</label>
                  <input type="tel" required placeholder="01xxxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">رقم إضافي (اختياري)</label>
                  <input type="tel" placeholder="01xxxxxxxxx" value={altPhone} onChange={e => setAltPhone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-amber-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">نوع الاستلام</label>
                  <select value={orderType} onChange={e => setOrderType(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white font-bold outline-none">
                    <option value="delivery">توصيل دليفري (+30 ج.م)</option>
                    <option value="takeaway">استلام من المطعم (0 ج.م)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">طريقة الدفع *</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-amber-400 font-bold outline-none">
                    <option value="cash">💵 كاش عند الاستلام</option>
                    <option value="instapay">📱 انستاباي (InstaPay)</option>
                    <option value="wallet">💳 محفظة إلكترونية</option>
                  </select>
                </div>
              </div>

              {/* تنبيه تعليمات عند اختيار طرق الدفع الإلكتروني */}
              {paymentMethod !== 'cash' && (
                <div className="bg-emerald-950/60 border border-emerald-800/80 p-2.5 rounded-xl text-[11px] text-emerald-300 font-medium">
                  💡 سيتم تحويل المبلغ إلى الحساب: <span className="font-bold underline text-emerald-200">01101616480</span> عند تأكيد الطلب.
                </div>
              )}

              {orderType === 'delivery' && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">العنوان التفصيلي *</label>
                  <input type="text" required placeholder="الشارع - العمارة - العلامة المميزة" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-amber-400" />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">ملاحظات للوجبة</label>
                <input type="text" placeholder="مثال: بدون بصل، زيادة طحينة..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-amber-400" />
              </div>

              <button type="submit" disabled={submittingOrder} className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black py-3 rounded-xl shadow-lg transition mt-2">
                {submittingOrder ? 'جاري إرسال الطلب...' : `تأكيد وإرسال الطلب (${grandTotal} ج.م)`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}