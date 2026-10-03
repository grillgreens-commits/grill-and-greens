'use client';

import { useState } from 'react';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
}

export interface Category {
  id: string;
  name: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'الكل 🍽️' },
  { id: 'grill', name: 'المشاوي عالفحم 🥩' },
  { id: 'mahshi', name: 'المحاشي 🥬' },
  { id: 'casserole', name: 'الصواني والطواجن 🍲' },
  { id: 'poultry', name: 'الطيور 🍗' },
  { id: 'meals', name: 'الوجبات 🍱' },
  { id: 'sides', name: 'أصناف إضافية 🥗' },
];

export const MENU_ITEMS: MenuItem[] = [
  // --- المشاوي عالفحم (تشمل: رز بسمتي + سلطة + طحينة + عيش) ---
  { id: 'g1', name: 'فرخة كاملة', description: 'تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 360, category: 'grill' },
  { id: 'g2', name: 'نصف فرخة', description: 'تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 195, category: 'grill' },
  { id: 'g3', name: 'ربع فرخة', description: 'تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 120, category: 'grill' },
  { id: 'g4', name: 'ك كباب ستيك', description: 'كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 800, category: 'grill' },
  { id: 'g5', name: 'نصف كباب ستيك', description: 'نصف كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 430, category: 'grill' },
  { id: 'g6', name: 'ربع كباب ستيك', description: 'ربع كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 250, category: 'grill' },
  { id: 'g7', name: 'ك كفتة بلدي', description: 'كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 750, category: 'grill' },
  { id: 'g8', name: 'نصف كفتة بلدي', description: 'نصف كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 400, category: 'grill' },
  { id: 'g9', name: 'ربع كفتة بلدي', description: 'ربع كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 230, category: 'grill' },
  { id: 'g10', name: 'ك شيش طاووق', description: 'كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 400, category: 'grill' },
  { id: 'g11', name: 'نصف شيش طاووق', description: 'نصف كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 220, category: 'grill' },
  { id: 'g12', name: 'ربع شيش طاووق', description: 'ربع كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 130, category: 'grill' },

  // --- المحاشي ---
  { id: 'm1', name: 'ك محشي مشكل', description: 'كيلو محشي مشكل', price: 160, category: 'mahshi' },
  { id: 'm2', name: 'نصف محشي مشكل', description: 'نصف كيلو محشي مشكل', price: 90, category: 'mahshi' },
  { id: 'm3', name: 'ربع محشي مشكل', description: 'ربع كيلو محشي مشكل', price: 50, category: 'mahshi' },
  { id: 'm4', name: 'ك محشي كرنب', description: 'كيلو محشي كرنب', price: 180, category: 'mahshi' },
  { id: 'm5', name: 'نصف محشي كرنب', description: 'نصف كيلو محشي كرنب', price: 100, category: 'mahshi' },
  { id: 'm6', name: 'ربع محشي كرنب', description: 'ربع كيلو محشي كرنب', price: 60, category: 'mahshi' },
  { id: 'm7', name: 'ك محشي ورق عنب', description: 'كيلو محشي ورق عنب', price: 200, category: 'mahshi' },
  { id: 'm8', name: 'نصف محشي ورق عنب', description: 'نصف كيلو محشي ورق عنب', price: 110, category: 'mahshi' },
  { id: 'm9', name: 'ربع محشي ورق عنب', description: 'ربع كيلو محشي ورق عنب', price: 65, category: 'mahshi' },
  { id: 'm10', name: 'ك محشي ممبار', description: 'كيلو محشي ممبار', price: 260, category: 'mahshi' },
  { id: 'm11', name: 'نصف محشي ممبار', description: 'نصف كيلو محشي ممبار', price: 140, category: 'mahshi' },
  { id: 'm12', name: 'ربع محشي ممبار', description: 'ربع كيلو محشي ممبار', price: 80, category: 'mahshi' },

  // --- الصواني والطواجن ---
  { id: 'c1', name: 'صينية مكرونة بالبشاميل', description: 'صينية مكرونة بالبشاميل عائلية', price: 300, category: 'casserole' },
  { id: 'c2', name: 'صينية جلاش باللحمة', description: 'صينية جلاش باللحم المفروم', price: 250, category: 'casserole' },
  { id: 'c3', name: 'صينية بطاطس بالفراخ', description: 'صينية بطاطس بقطع الفراخ', price: 400, category: 'casserole' },
  { id: 'c4', name: 'صينية بطاطس باللحمة', description: 'صينية بطاطس بقطع اللحم البلدي', price: 430, category: 'casserole' },
  { id: 'c5', name: 'طاجن مكرونة بالبشاميل', description: 'طاجن بشاميل فردي', price: 100, category: 'casserole' },
  { id: 'c6', name: 'طاجن لحمة بالبصل', description: 'طاجن لحم بلدي مع البصل والأعشاب', price: 330, category: 'casserole' },
  { id: 'c7', name: 'طاجن بامية باللحمة', description: 'طاجن بامية باللحم البلدي', price: 310, category: 'casserole' },
  { id: 'c8', name: 'طاجن فريك باللحمة', description: 'طاجن فريك بلدي باللحمة', price: 310, category: 'casserole' },
  { id: 'c9', name: 'طاجن بطاطس باللحمة', description: 'طاجن بطاطس باللحمة البلدي', price: 290, category: 'casserole' },

  // --- الطيور ---
  { id: 'p1', name: 'فرد حمام محشي فريك', description: 'حمام محشي فريك', price: 240, category: 'poultry' },
  { id: 'p2', name: 'فرد حمام محشي رز', description: 'حمام محشي أرز', price: 230, category: 'poultry' },
  { id: 'p3', name: 'جوز حمام محشي فريك / رز', description: 'زوج حمام محشي فريك أو أرز', price: 450, category: 'poultry' },
  { id: 'p4', name: 'بطة محشي فريك', description: 'بطة كاملة محشية فريك', price: 730, category: 'poultry' },
  { id: 'p5', name: 'بطة محشي رز', description: 'بطة كاملة محشية أرز', price: 700, category: 'poultry' },
  { id: 'p6', name: 'بطة محشي ورق عنب', description: 'بطة كاملة محشية ورق عنب', price: 780, category: 'poultry' },
  { id: 'p7', name: 'فرخة مسلوق محمر', description: 'فرخة كاملة مسلوقة ومحمرة', price: 330, category: 'poultry' },
  { id: 'p8', name: 'نصف فرخة مسلوق محمر', description: 'نصف فرخة مسلوقة ومحمرة', price: 170, category: 'poultry' },
  { id: 'p9', name: 'ربع فرخة مسلوق محمر', description: 'ربع فرخة مسلوق ومحمر', price: 95, category: 'poultry' },

  // --- الوجبات ---
  { id: 'w1', name: 'وجبة ربع فرخة مشوي / محمر', description: 'رز + سلطة + طحينة + عيش', price: 120, category: 'meals' },
  { id: 'w2', name: 'وجبة ربع فراخ بانية بلدي', description: 'رز + سلطة + عيش', price: 130, category: 'meals' },
  { id: 'w3', name: 'وجبة ربع فراخ بانية بلدي ميكس', description: 'مكرونة بالبشاميل + سلطة + عيش', price: 210, category: 'meals' },
  { id: 'w4', name: 'وجبة ربع شيش طاووق مشوي', description: 'رز + سلطة + طحينة + عيش', price: 130, category: 'meals' },
  { id: 'w5', name: 'وجبة ربع كفتة مشوية', description: 'رز + سلطة + طحينة + عيش', price: 230, category: 'meals' },
  { id: 'w6', name: 'وجبة ربع كفتة بالصلصة', description: 'رز + سلطة + عيش', price: 230, category: 'meals' },
  { id: 'w7', name: 'ورقة كبدة بلدي بالخلطة', description: 'رز + سلطة + عيش', price: 230, category: 'meals' },
  { id: 'w8', name: 'طاجن مكرونة بالجمبري', description: '200 جرام جمبري فريش وايت صوص', price: 300, category: 'meals' },

  // --- أصناف إضافية ---
  { id: 's1', name: 'فريك خضار سادة', description: 'طباق فريك خضار', price: 70, category: 'sides' },
  { id: 's2', name: 'بامية خضار سادة', description: 'طبق بامية سادة', price: 70, category: 'sides' },
  { id: 's3', name: 'بطاطس خضار سادة', description: 'طبق بطاطس مطبوخة سادة', price: 60, category: 'sides' },
  { id: 's4', name: 'ملوخية خضرا', description: 'طبق ملوخية خضراء بيتي', price: 60, category: 'sides' },
  { id: 's5', name: 'شوربة لسان عصفور', description: 'شوربة لسان عصفور سخنة', price: 25, category: 'sides' },
  { id: 's6', name: 'شوربة خضار', description: 'شوربة خضار مشكل', price: 30, category: 'sides' },
  { id: 's7', name: 'حواوشي بلدي', description: 'رغيف حواوشي بلدي + سلطة + طحينة', price: 90, category: 'sides' },
  { id: 's8', name: 'بطاطس بوم فريت', description: 'طبق بطاطس بوم فريت مقرمش', price: 40, category: 'sides' },
  { id: 's9', name: 'رز بسمتي', description: 'طبق أرز بسمتي', price: 35, category: 'sides' },
  { id: 's10', name: 'رز بالشعرية', description: 'طبق أرز مصري بالشعرية', price: 25, category: 'sides' },
  { id: 's11', name: 'بانية بلدي مقلي 1ك', description: 'كيلو بانية بلدي جاهز', price: 400, category: 'sides' },
  { id: 's12', name: 'نصف بانية بلدي مقلي', description: 'نصف كيلو بانية بلدي', price: 220, category: 'sides' },
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

  // بيانات الطلب
  const [customerName, setCustomerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway'>('delivery');
  const [notes, setNotes] = useState<string>('');

  const DELIVERY_FEE = 30;

  const SOCIAL_LINKS = {
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

  const itemsSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
  const grandTotal = itemsSubtotal + deliveryFee;

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
  };

  return (
    <div className="min-h-screen bg-amber-50/40 text-slate-800 pb-28">
      {/* هيدر الصفحة الرئيسي للعميل - خالي تماماً من أزرار أو أشرطة الإدارة */}
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-black text-amber-400 tracking-wide">Grill & Greens</h1>
          <p className="text-xs text-slate-300 mt-0.5">أكل بيتي بجودة عالية - جميع اللحوم بلدي وطازة</p>
        </div>
      </header>

      {/* شريط مواعيد العمل والتواصل وطرق الدفع */}
      <div className="bg-red-800 text-white py-2 px-4 shadow-inner">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs gap-1.5 text-center sm:text-right">
          <div>
            <span className="font-bold text-amber-300">مواعيدنا: </span>
            من 11 صباحاً - 8 مساءً (ماعدا الجمعة) | يتم تجهيز الأوردر من 1 - 2 ساعة
          </div>
          <div className="flex gap-3 items-center font-bold">
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[11px] flex items-center gap-1"
            >
              📱 01101616480
            </a>
            <span className="text-amber-200 text-[11px]">كاش - محفظة - انستاباي</span>
          </div>
        </div>
      </div>

      {/* شريط التصنيفات */}
      <div className="bg-white border-b border-slate-200 sticky top-[65px] z-20 shadow-sm">
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
        {orderSent ? (
          <div className="bg-white p-6 rounded-2xl border border-emerald-100 text-center my-8 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
              ⏳
            </div>
            <h2 className="text-xl font-bold text-slate-800">تم إرسال طلبك بنجاح!</h2>
            <p className="text-slate-600 text-sm">
              رقم الطلب: <span className="font-bold text-red-600 text-base">#{orderId}</span>
            </p>

            {/* تفاصيل الريسيت للعميل */}
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.map((item: MenuItem) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center gap-3 hover:border-red-200 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <h3 className="font-bold text-slate-800 text-sm">{item.name}</h3>
                  {item.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  <p className="text-red-700 font-extrabold text-sm pt-1">
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

            {/* ملخص الأصناف */}
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

            {/* الحساب والتكاليف التفصيلية */}
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

            {/* نموذج البيانات */}
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
                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 rounded-xl shadow-md text-xs mt-1 transition-all"
              >
                تأكيد وإرسال الطلب
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}