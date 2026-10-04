'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle2, Clock, MapPin, Phone, User, MessageSquare, Utensils, Search } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// إعداد الاتصال بـ Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
  image?: string;
}

interface CartItem {
  product: MenuItem;
  quantity: number;
}

export default function CustomerMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // بيانات الطلب
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway'>('delivery');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  // حالة الشراء
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // جلب قائمة الأصناف المتاحة من Supabase
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true);

      if (error) {
        console.error('Error fetching menu items:', error);
      } else if (data) {
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to load menu:', err);
    }
  };

  const categories = ['الكل', ...Array.from(new Set(items.map(i => i.category)))];

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'الكل' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = orderType === 'delivery' ? 15 : 0;
  const grandTotal = subtotal + deliveryFee;

  // إرسال الطلب وحفظه في Supabase
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || (orderType === 'delivery' && !address)) {
      alert('يرجى إكمال جميع البيانات المطلوبة');
      return;
    }

    setIsSubmitting(true);

    const formattedItems = cart.map(item => ({
      id: item.product.id,
      name: item.product.name,
      title: item.product.name,
      price: item.product.price,
      qty: item.quantity,
      quantity: item.quantity
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
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select();

      if (error) {
        console.error('Error inserting order:', error);
        alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
      } else if (data && data.length > 0) {
        const newOrder = data[0];
        const displayId = String(newOrder.id).slice(0, 8).toUpperCase();
        setOrderId(displayId);
        setOrderSent(true);
        setCart([]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 dir-rtl" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4 border border-green-100">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">تم إرسال طلبك بنجاح!</h2>
          <p className="text-gray-600">رقم الطلب الخاص بك هو:</p>
          <div className="bg-gray-100 py-3 rounded-lg font-mono text-xl font-bold text-emerald-600 tracking-wider">
            #{orderId}
          </div>
          <p className="text-sm text-gray-500">جاري مراجعة طلبك وإعداده الآن. شكرًا لثقتك بنا!</p>
          <button
            onClick={() => {
              setOrderSent(false);
              setOrderId(null);
            }}
            className="w-full mt-6 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition"
          >
            طلب جديد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-12 dir-rtl" dir="rtl">
      {/* Header */}
      <header className="bg-emerald-700 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">قائمة الطعام</h1>
              <p className="text-xs text-emerald-100">اطلب وجبتك المفضلة أونلاين</p>
            </div>
          </div>
          <div className="relative">
            <ShoppingCart className="w-7 h-7" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن وجبة..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-bold text-emerald-600 text-lg">{item.price} ج.م</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                  >
                    <Plus className="w-4 h-4" /> إضافة
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart & Checkout Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-3">
              <ShoppingCart className="w-5 h-5 text-emerald-600" /> سلة الطلبات
            </h2>

            {cart.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-sm">السلة فارغة حالياً</p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg">
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-800">{item.product.name}</div>
                        <div className="text-xs text-gray-500">{item.product.price} ج.م</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded mr-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-4 pt-4 border-t">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">الاسم بالكامل</label>
                    <div className="relative">
                      <User className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="أدخل اسمك"
                        className="w-full pr-9 pl-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">رقم الهاتف</label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="01xxxxxxxxx"
                        className="w-full pr-9 pl-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">نوع الاستلام</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`py-2 text-xs rounded-lg font-medium border ${
                          orderType === 'delivery'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                            : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        توصيل
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderType('takeaway')}
                        className={`py-2 text-xs rounded-lg font-medium border ${
                          orderType === 'takeaway'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                            : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        استلام من الفرع
                      </button>
                    </div>
                  </div>

                  {orderType === 'delivery' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">العنوان التفصيلي</label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          placeholder="المنطقة، الشارع، رقم العمارة"
                          className="w-full pr-9 pl-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">ملاحظات إضافية</label>
                    <div className="relative">
                      <MessageSquare className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="أي تفاصيل خاصة بالطلب"
                        className="w-full pr-9 pl-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>المجموع:</span>
                      <span>{subtotal} ج.م</span>
                    </div>
                    {orderType === 'delivery' && (
                      <div className="flex justify-between text-gray-600">
                        <span>خدمة التوصيل:</span>
                        <span>{deliveryFee} ج.م</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base text-gray-800 pt-1 border-t">
                      <span>الإجمالي:</span>
                      <span className="text-emerald-600">{grandTotal} ج.م</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:bg-gray-400"
                  >
                    {isSubmitting ? 'جاري إرسال الطلب...' : 'تأكيد الطلب'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}