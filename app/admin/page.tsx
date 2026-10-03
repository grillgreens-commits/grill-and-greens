'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ComprehensiveAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'live_orders' | 'sales' | 'customers' | 'purchases' | 'menu' | 'reports' | 'settings'>('live_orders');
  
  // Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<any[]>([]);
  const [purchaseLogs, setPurchaseLogs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters & Search
  const [customerSearch, setCustomerSearch] = useState('');
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');

  // POS / New Purchase Form States
  const [newPurchaseItem, setNewPurchaseItem] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [supplier, setSupplier] = useState('');

  // Settings
  const [whatsappPhone, setWhatsappPhone] = useState('20101616490');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchCustomers(), fetchPurchases(), fetchProducts()]);
    setLoading(false);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data) setCustomers(data);
  };

  const fetchPurchases = async () => {
    const { data: items } = await supabase.from('purchase_items').select('*');
    const { data: logs } = await supabase.from('purchase_transactions').select('*').order('purchase_date', { ascending: false });
    if (items) setPurchaseItems(items);
    if (logs) setPurchaseLogs(logs);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('id', { ascending: true });
    if (data) setProducts(data);
  };

  // 1. تحديث حالة الطلب وإضافته للعملاء تلقائياً عند الاكتمال
  const updateOrderStatus = async (id: number, status: string, orderData: any) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) {
      if (status === 'completed') {
        // تسجيل/تحديث العميل في قسم العملاء
        await supabase.from('customers').upsert(
          { name: orderData.customer_name, phone: orderData.phone, address: orderData.address },
          { onConflict: 'phone' }
        );
      }
      fetchOrders();
      fetchCustomers();
    }
  };

  // 2. إرسال إشعار واتساب للعميل
  const sendWhatsAppNotification = (phone: string, orderId: number, status: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
    let text = `مرحباً بك من مطعم Grill & Greens 🍗\nتفاصيل طلبك رقم #${orderId}:\n`;
    if (status === 'preparing') text += 'طلبك الآن جاري تجهيزه بكل حب 👨‍🍳';
    else if (status === 'delivering') text += 'طلبك خرج مع الدليفري وفي الطريق إليك 🛵';
    else if (status === 'completed') text += 'تم تسليم الطلب بنجاح. نتمنى لك وجبة شهية! 😋';

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // 3. إضافة حركة مشتريات جديدة
  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurchaseItem || !purchaseQty || !purchasePrice) return;

    // إضافة أو التأكد من وجود الصنف
    let itemId;
    const existing = purchaseItems.find(i => i.item_name.trim().toLowerCase() === newPurchaseItem.trim().toLowerCase());
    if (existing) {
      itemId = existing.id;
    } else {
      const { data: newItem } = await supabase.from('purchase_items').insert([{ item_name: newPurchaseItem }]).select();
      if (newItem && newItem[0]) itemId = newItem[0].id;
    }

    const qty = parseFloat(purchaseQty);
    const price = parseFloat(purchasePrice);
    const total = qty * price;

    await supabase.from('purchase_transactions').insert([{
      item_id: itemId,
      item_name: newPurchaseItem,
      quantity: qty,
      unit_price: price,
      total_price: total,
      supplier_name: supplier
    }]);

    setNewPurchaseItem('');
    setPurchaseQty('');
    setPurchasePrice('');
    setSupplier('');
    fetchPurchases();
  };

  // تصفية الفواتير
  const pendingOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const completedSales = orders.filter(o => o.status === 'completed');

  // تصفية العملاء
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans dir-rtl" dir="rtl">
      {/* Navbar Header */}
      <header className="bg-emerald-900 text-white shadow-md p-4 flex flex-wrap justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🔥 Grill & Greens | لوحة التحكم الإدارية
        </h1>
        <div className="text-sm bg-emerald-800 px-3 py-1 rounded-full">
          إجمالي المبيعات النشطة: {completedSales.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0)} ج.م
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b overflow-x-auto flex gap-2 p-2">
        {[
          { id: 'live_orders', label: `📦 الطلبات الحية (${pendingOrders.length})` },
          { id: 'sales', label: `💰 المبيعات (${completedSales.length})` },
          { id: 'customers', label: `👥 قاعدة العملاء (${customers.length})` },
          { id: 'purchases', label: `🛒 المشتريات` },
          { id: 'menu', label: `🍔 إدارة المنيو` },
          { id: 'reports', label: `📊 التقارير الشاملة` },
          { id: 'settings', label: `⚙️ الإعدادات` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${
              activeTab === tab.id ? 'bg-emerald-700 text-white shadow' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="p-4 max-w-7xl mx-auto">
        {/* 1. قسم الطلبات الحية (الانتظار والتجهيز) */}
        {activeTab === 'live_orders' && (
          <div>
            <h2 className="text-lg font-bold mb-4 text-emerald-900">قسم الفواتير والطلبات الحالية (قيد الانتظار والتجهيز)</h2>
            {pendingOrders.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-lg border text-gray-500">لا توجد طلبات جارية حالياً.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4 relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b pb-2 mb-2">
                        <span className="font-extrabold text-emerald-800">طلب #{order.id}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          order.status === 'preparing' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {order.status === 'pending' ? '⏳ قيد الانتظار' : order.status === 'preparing' ? '👨‍🍳 جاري التجهيز' : '🛵 في الطريق'}
                        </span>
                      </div>
                      <p className="font-bold text-gray-900">{order.customer_name}</p>
                      <p className="text-sm text-gray-600">📱 {order.phone}</p>
                      <p className="text-sm text-gray-600">📍 {order.address}</p>
                      {order.notes && <p className="text-xs text-amber-700 mt-1 bg-amber-50 p-1.5 rounded">📝 {order.notes}</p>}

                      <div className="mt-3 bg-gray-50 p-2 rounded text-sm">
                        <p className="font-bold border-b pb-1 mb-1">الأصناف:</p>
                        {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs py-0.5">
                            <span>{item.name} × {item.qty}</span>
                            <span>{item.price * item.qty} ج.م</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-3">
                      <div className="flex justify-between font-bold text-emerald-900 mb-3">
                        <span>الإجمالي:</span>
                        <span>{order.total || order.total_amount} ج.م</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button onClick={() => updateOrderStatus(order.id, 'preparing', order)} className="bg-blue-600 text-white py-1.5 rounded font-bold hover:bg-blue-700">تجهيز 👨‍🍳</button>
                        <button onClick={() => updateOrderStatus(order.id, 'delivering', order)} className="bg-purple-600 text-white py-1.5 rounded font-bold hover:bg-purple-700">توصيل 🛵</button>
                        <button onClick={() => updateOrderStatus(order.id, 'completed', order)} className="bg-green-600 text-white py-1.5 rounded font-bold hover:bg-green-700 col-span-2">تسليم وحفظ المبيعات ✅</button>
                        <button onClick={() => sendWhatsAppNotification(order.phone, order.id, order.status)} className="bg-emerald-100 text-emerald-800 py-1.5 rounded font-bold hover:bg-emerald-200 col-span-2 flex items-center justify-center gap-1">📱 مراسلة العميل واتساب</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. قسم المبيعات (الفواتير المكتملة) */}
        {activeTab === 'sales' && (
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold mb-4 text-emerald-900">قسم المبيعات (الفواتير المسلمة والمكتملة)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-emerald-50 text-emerald-900 font-bold border-b">
                  <tr>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">اسم العميل</th>
                    <th className="p-3">رقم الهاتف</th>
                    <th className="p-3">إجمالي الفاتورة</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {completedSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold">#{sale.id}</td>
                      <td className="p-3 text-xs text-gray-500">{new Date(sale.created_at).toLocaleString('ar-EG')}</td>
                      <td className="p-3">{sale.customer_name}</td>
                      <td className="p-3">{sale.phone}</td>
                      <td className="p-3 font-bold text-green-700">{sale.total || sale.total_amount} ج.م</td>
                      <td className="p-3"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">مكتملة ✅</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. قسم إدارة العملاء والبحث */}
        {activeTab === 'customers' && (
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <h2 className="text-lg font-bold text-emerald-900">دليل وبيانات العملاء المسجلين</h2>
              <input
                type="text"
                placeholder="🔍 بحث باسم العميل أو رقم الهاتف..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="border p-2 rounded-lg text-sm w-full md:w-72"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-100 font-bold border-b">
                  <tr>
                    <th className="p-3">اسم العميل</th>
                    <th className="p-3">رقم الهاتف</th>
                    <th className="p-3">العنوان الأساسي</th>
                    <th className="p-3">تاريخ أول طلب</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCustomers.map(cust => (
                    <tr key={cust.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold">{cust.name}</td>
                      <td className="p-3">{cust.phone}</td>
                      <td className="p-3">{cust.address || 'غير محدد'}</td>
                      <td className="p-3 text-xs text-gray-500">{new Date(cust.created_at).toLocaleDateString('ar-EG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. قسم المشتريات */}
        {activeTab === 'purchases' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <h2 className="text-lg font-bold mb-4 text-emerald-900">تسجيل فاتورة / حركة مشتريات جديدة</h2>
              <form onSubmit={handleAddPurchase} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="اسم الصنف (مثلاً: لحم بلدي)"
                  value={newPurchaseItem}
                  onChange={e => setNewPurchaseItem(e.target.value)}
                  className="border p-2 rounded text-sm"
                  required
                />
                <input
                  type="number"
                  placeholder="الكمية"
                  value={purchaseQty}
                  onChange={e => setPurchaseQty(e.target.value)}
                  className="border p-2 rounded text-sm"
                  required
                />
                <input
                  type="number"
                  placeholder="سعر الوحدة (ج.م)"
                  value={purchasePrice}
                  onChange={e => setPurchasePrice(e.target.value)}
                  className="border p-2 rounded text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="اسم المورد (اختياري)"
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  className="border p-2 rounded text-sm"
                />
                <button type="submit" className="bg-emerald-800 text-white font-bold rounded p-2 hover:bg-emerald-900 text-sm">حفظ المشتريات ➕</button>
              </form>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <h2 className="text-lg font-bold mb-4 text-emerald-900">سجل وحركات المشتريات السابقه</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-gray-100 font-bold border-b">
                    <tr>
                      <th className="p-3">الصنف</th>
                      <th className="p-3">الكمية</th>
                      <th className="p-3">سعر الوحدة</th>
                      <th className="p-3">الإجمالي</th>
                      <th className="p-3">المورد</th>
                      <th className="p-3">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {purchaseLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold">{log.item_name}</td>
                        <td className="p-3">{log.quantity}</td>
                        <td className="p-3">{log.unit_price} ج.م</td>
                        <td className="p-3 font-bold text-red-700">{log.total_price} ج.م</td>
                        <td className="p-3">{log.supplier_name || '-'}</td>
                        <td className="p-3 text-xs text-gray-500">{log.purchase_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. قسم التقارير الشاملة */}
        {activeTab === 'reports' && (
          <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
            <h2 className="text-lg font-bold text-emerald-900">تصدير واستعراض التقارير المالية</h2>
            <div className="flex flex-wrap gap-3 items-center bg-gray-50 p-3 rounded-lg text-sm">
              <label>من تاريخ:</label>
              <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} className="border p-1.5 rounded" />
              <label>إلى تاريخ:</label>
              <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)} className="border p-1.5 rounded" />
              <button className="bg-emerald-800 text-white px-4 py-1.5 rounded font-bold hover:bg-emerald-900">تطبيق الفلتر 📊</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <p className="text-sm text-emerald-800 font-bold">إجمالي إيرادات المبيعات</p>
                <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                  {completedSales.reduce((sum, item) => sum + (Number(item.total) || 0), 0)} ج.م
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                <p className="text-sm text-red-800 font-bold">إجمالي المصروفات والمشتريات</p>
                <p className="text-2xl font-extrabold text-red-900 mt-1">
                  {purchaseLogs.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0)} ج.م
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <p className="text-sm text-blue-800 font-bold">صافي الأرباح التقديرية</p>
                <p className="text-2xl font-extrabold text-blue-900 mt-1">
                  {completedSales.reduce((sum, item) => sum + (Number(item.total) || 0), 0) - purchaseLogs.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0)} ج.م
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 6. قسم الإعدادات */}
        {activeTab === 'settings' && (
          <div className="bg-white p-4 rounded-xl shadow-sm border max-w-2xl">
            <h2 className="text-lg font-bold mb-4 text-emerald-900">إعدادات النظام والمطعم</h2>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-bold mb-1">رقم الواتساب الافتراضي لاستلام الطلبات الإدارية:</label>
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={e => setWhatsappPhone(e.target.value)}
                  className="border p-2 rounded w-full"
                />
              </div>
              <button onClick={() => alert('تم حفظ الإعدادات بنجاح')} className="bg-emerald-800 text-white px-4 py-2 rounded font-bold hover:bg-emerald-900">
                حفظ التغييرات 💾
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}