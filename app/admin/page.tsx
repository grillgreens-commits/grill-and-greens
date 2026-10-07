'use client';
import { PersonalFinance } from '../components/PersonalFinance';
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 🔒 اكتب كلمة المرور التي تريدها هنا
const ADMIN_PASSWORD = '260564'; 

export default function CompleteEnterpriseAdminDashboard() {
  // حالة تسجيل الدخول للوحة التحكم
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'live_orders' | 'sales' | 'customers' | 'purchases' | 'menu' | 'reports' | 'settings' | 'finance'>('live_orders');  
  // Data States
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [purchaseLogs, setPurchaseLogs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Modals & Search States
  const [selectedItemCard, setSelectedItemCard] = useState<string | null>(null);
  const [selectedCustomerModal, setSelectedCustomerModal] = useState<any | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // Sales Filters
  const [salesDateFrom, setSalesDateFrom] = useState('');
  const [salesDateTo, setSalesDateTo] = useState('');

  // New Purchase Form States
  const [purchaseItemName, setPurchaseItemName] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [supplier, setSupplier] = useState('');

  // New Product / Menu Form
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('المشويات');
  const [productImageUrl, setProductImageUrl] = useState('');

  // Settings
  const [whatsappPhone, setWhatsappPhone] = useState('20101616490');

  // التحقق من حالة تسجيل الدخول السابقة في المتصفح
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchAllData();

    // الاشتراك في التحديث الفوري (Realtime) للطلبات والمنيو
    const ordersChannel = supabase
      .channel('realtime_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    const menuChannel = supabase
      .channel('realtime_menu')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(menuChannel);
    };
  }, [isAuthenticated]);

  // دالة تسجيل الدخول
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setAuthError('');
    } else {
      setAuthError('كلمة المرور غير صحيحة ❌');
    }
  };

  // دالة تسجيل الخروج
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
  };

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
    const { data: logs } = await supabase.from('purchase_transactions').select('*').order('created_at', { ascending: false });
    if (logs) setPurchaseLogs(logs);
  };

  const fetchProducts = async () => {
    const { data: menuData, error } = await supabase.from('menu_items').select('*').order('id', { ascending: true });

    if (error) {
      console.error('خطأ في جلب المنيو:', error.message);
      return;
    }

    if (menuData) {
      const formatted = menuData.map((item: any) => ({
        id: item.id,
        name: item.name || 'صنف بدون اسم',
        description: item.description || '',
        price: item.price || 0,
        category: item.category || 'الوجبات',
        image_url: item.image_url || item.image || '',
        is_available: item.is_available !== undefined ? item.is_available : (item.available !== undefined ? item.available : true)
      }));
      setProducts(formatted);
    }
  };

  // دالة تفكيك الأصناف
  const parseOrderItems = (itemsRaw: any): any[] => {
    if (Array.isArray(itemsRaw)) return itemsRaw;
    if (typeof itemsRaw === 'string') {
      try {
        const parsed = JSON.parse(itemsRaw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // 🧮 دالة مساعدة لحساب مجموع أصناف الوجبات فقط (المبيعات الفعليه للمطعم)
  const calculateFoodTotalOnly = (order: any): number => {
    const itemsList = parseOrderItems(order.items);
    if (itemsList.length > 0) {
      return itemsList.reduce((sum: number, it: any) => {
        const price = Number(it.price || 0);
        const qty = Number(it.qty || it.quantity || 1);
        return sum + (price * qty);
      }, 0);
    }
    const total = Number(order.total || order.total_amount || 0);
    const delivery = Number(order.delivery_fee || order.delivery_price || order.delivery || 0);
    return Math.max(0, total - delivery);
  };

  // 🛵 دالة مساعدة لاستخراج قيمة التوصيل فقط
  const calculateDeliveryOnly = (order: any): number => {
    const explicitDelivery = Number(order.delivery_fee || order.delivery_price || order.delivery || 0);
    if (explicitDelivery > 0) return explicitDelivery;

    const total = Number(order.total || order.total_amount || 0);
    const foodTotal = calculateFoodTotalOnly(order);
    return Math.max(0, total - foodTotal);
  };

  // 🖨️ دالة طباعة الفاتورة للعميل
  const handlePrintOrder = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsArr = parseOrderItems(order.items);
    const shortId = String(order.id).split('-')[0].toUpperCase();
    
    const deliveryFee = calculateDeliveryOnly(order);
    const foodTotal = calculateFoodTotalOnly(order);
    const grandTotal = foodTotal + deliveryFee;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>فاتورة طلب #${shortId}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600;800;900&display=swap');
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; color-adjust: exact; }
            body { font-family: 'Cairo', 'Tahoma', sans-serif; direction: rtl; text-align: right; padding: 8px; max-width: 320px; margin: 0 auto; color: #000000 !important; background-color: #ffffff; }
            .bill-card { border: 2px solid #000; padding: 10px; border-radius: 6px; }
            .header { text-align: center; border-bottom: 2px dashed #000000; padding-bottom: 8px; margin-bottom: 10px; }
            .title { font-size: 20px; font-weight: 900; margin: 0; color: #000000; }
            .info-header { font-size: 13px; font-weight: 800; color: #000000; margin: 3px 0; }
            .customer-box { border: 1.5px solid #000000; padding: 8px; border-radius: 6px; margin-bottom: 10px; background-color: #ffffff; }
            .info-customer { font-size: 14px; font-weight: 800; color: #000000; margin: 4px 0; line-height: 1.4; }
            .item-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; color: #000000; margin: 6px 0; border-bottom: 1px dotted #ccc; padding-bottom: 3px; }
            .delivery-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; color: #000000; margin: 6px 0; padding-top: 4px; }
            .total-row { border-top: 2px solid #000000; margin-top: 8px; padding-top: 8px; font-size: 17px; font-weight: 900; color: #000000; display: flex; justify-content: space-between; }
            .footer { text-align: center; margin-top: 12px; font-size: 12px; font-weight: 800; color: #000000; }
          </style>
        </head>
        <body>
          <div class="bill-card">
            <div class="header">
              <p class="title">🔥 Grill & Greens</p>
              <p class="info-header">طلب #${shortId}</p>
              <p class="info-header">التاريخ: ${new Date(order.created_at || Date.now()).toLocaleString('ar-EG')}</p>
            </div>
            
            <div class="customer-box">
              <p class="info-customer"><strong>العميل:</strong> ${order.customer_name || 'عميل'}</p>
              <p class="info-customer"><strong>الهاتف:</strong> ${order.phone || '-'}</p>
              <p class="info-customer"><strong>العنوان:</strong> ${order.address || 'استلام من الفرع'}</p>
              ${order.notes ? `<p class="info-customer" style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #000;"><strong>ملاحظات:</strong> ${order.notes}</p>` : ''}
            </div>

            <div>
              <strong style="font-size: 14px; font-weight: 900; color: #000000; display: block; margin-bottom: 6px;">الأصناف:</strong>
              ${itemsArr.map((it: any) => `
                <div class="item-row">
                  <span>${it.name || it.title} × ${it.qty || it.quantity || 1}</span>
                  <span>${(it.price || 0) * (it.qty || it.quantity || 1)} ج.م</span>
                </div>
              `).join('')}
            </div>
            
            ${deliveryFee > 0 ? `
              <div class="delivery-row">
                <span>🛵 خدمة التوصيل (شركة التوصيل):</span>
                <span>${deliveryFee} ج.م</span>
              </div>
            ` : ''}

            <div class="total-row">
              <span>الإجمالي الكلي:</span>
              <span>${grandTotal} ج.م</span>
            </div>
            
            <div class="footer">
              <p>شكراً لطلبكم من Grill & Greens! 😋</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 🛠️ تحديث حالة الأوردر والربط بالمحفظة تلقائياً
  const updateOrderStatus = async (id: number | string, status: string, orderData?: any) => {
    let paymentMethod = 'cash';

    // 1. عند التسليم: السؤال عن طريقة الدفع والخصم/الإضافة للمحفظة
    if (status === 'completed' && orderData) {
      const foodAmount = calculateFoodTotalOnly(orderData);
      const chosenMethod = prompt(
        `تم اختيار تسليم الأوردر #${String(id).split('-')[0].toUpperCase()}!\nاختر طريقة الدفع لإضافة مبلغ المبيعات الصافي (${foodAmount} ج.م) للمحفظة:\n cash = الكاش / درج المحل\n instapay = InstaPay\n e_wallet = المحفظة الإلكترونية`,
        'cash'
      );

      if (!chosenMethod) return; // تم إلغاء التسليم
      paymentMethod = chosenMethod;

      const accountNames: Record<string, string> = {
        cash: 'الكاش / درج المحل',
        instapay: 'InstaPay',
        e_wallet: 'المحفظة الإلكترونية',
      };

      // إضافة المبيعات لجدول المحفظة
      await supabase.from('wallet_logs').insert([{
        account_id: paymentMethod,
        account_name: accountNames[paymentMethod] || 'الكاش / درج المحل',
        type: 'income',
        category: 'مبيعات مطعم',
        amount: foodAmount,
        source: `إيراد أوردر #${String(id).split('-')[0].toUpperCase()}`,
        notes: `تسليم أوردر العميل: ${orderData.customer_name || ''}`,
        date: new Date().toLocaleString('ar-EG')
      }]);
    }

    // 2. عند الإلغاء: إذا كان الأوردر مسلماً ومكتصلاً سابقاً، يتم خصم قيمته كمرتجع من المحفظة
    if (status === 'cancelled') {
      const targetOrder = orders.find(o => o.id === id);
      if (targetOrder && targetOrder.status === 'completed') {
        const foodAmount = calculateFoodTotalOnly(targetOrder);
        await supabase.from('wallet_logs').insert([{
          account_id: 'cash',
          account_name: 'الكاش / درج المحل',
          type: 'expense',
          category: 'مرتجع مبيعات',
          amount: foodAmount,
          source: `إلغاء/ارتجاع أوردر #${String(id).split('-')[0].toUpperCase()}`,
          notes: 'خصم تلقائي بعد إلغاء الأوردر',
          date: new Date().toLocaleString('ar-EG')
        }]);
      }
    }

    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) {
      if (status === 'completed' && orderData) {
        await supabase.from('customers').upsert(
          { name: orderData.customer_name, phone: orderData.phone, address: orderData.address },
          { onConflict: 'phone' }
        );
      }
      fetchOrders();
      fetchCustomers();
    }
  };

  const cancelPurchaseTransaction = async (id: number) => {
    if (!confirm('هل أنت تأكد من إلغاء هذه الحركة؟')) return;
    const { error } = await supabase.from('purchase_transactions').update({ status: 'cancelled' }).eq('id', id);
    if (!error) fetchPurchases();
  };

  const sendWhatsAppNotification = (phone: string, orderId: any, status: string) => {
    const shortId = String(orderId).split('-')[0].toUpperCase();
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
    let text = `مرحباً بك من مطعم Grill & Greens 🍗\nتفاصيل طلبك رقم #${shortId}:\n`;
    if (status === 'preparing') text += 'طلبك الآن جاري تجهيزه بكل حب 👨‍🍳';
    else if (status === 'delivering') text += 'طلبك خرج مع الدليفري وفي الطريق إليك 🛵';
    else if (status === 'completed') text += 'تم تسليم الطلب بنجاح. نتمنى لك وجبة شهية! 😋';

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDeleteProduct = async (id: number, productName: string) => {
    if (confirm(`هل أنت تأكد من حذف صنف "${productName}" نهائياً من المنيو؟`)) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) {
        alert('حدث خطأ أثناء الحذف: ' + error.message);
      } else {
        alert('تم حذف الصنف بنجاح! 🗑️');
        fetchProducts();
      }
    }
  };

  // 🛒 إضافة المشتريات والخصم من المحفظة
  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalItemName = purchaseItemName.trim();

    if (!finalItemName || !purchaseQty || !purchasePrice) {
      alert('يرجى كتابة اسم الصنف/الخامة وملء جميع الحقول المطلوبة');
      return;
    }

    const chosenMethod = prompt(
      `تسجيل شراء خامات بقيمة إجمالية (${parseFloat(purchaseQty) * parseFloat(purchasePrice)} ج.م):\nاختر الكارت/الحساب المخصوم منه:\n cash = الكاش / درج المحل\n instapay = InstaPay\n e_wallet = المحفظة الإلكترونية`,
      'cash'
    );

    if (!chosenMethod) return;

    const accountNames: Record<string, string> = {
      cash: 'الكاش / درج المحل',
      instapay: 'InstaPay',
      e_wallet: 'المحفظة الإلكترونية',
    };

    const qty = parseFloat(purchaseQty);
    const price = parseFloat(purchasePrice);
    const total = qty * price;

    const { error } = await supabase.from('purchase_transactions').insert([{
      item_name: finalItemName,
      quantity: qty,
      unit_price: price,
      total_price: total,
      supplier_name: supplier || null,
      status: 'active'
    }]);

    if (error) {
      alert('حدث خطأ أثناء حفظ الفاتورة: ' + error.message);
      return;
    }

    // خصم حركة المشتريات تلقائياً من المحفظة
    await supabase.from('wallet_logs').insert([{
      account_id: chosenMethod,
      account_name: accountNames[chosenMethod] || 'الكاش / درج المحل',
      type: 'expense',
      category: 'مشتريات خامات مطعم',
      amount: total,
      source: `شراء خامات: ${finalItemName}`,
      notes: `شراء كمية: ${qty} | المورد: ${supplier || 'غير محدد'}`,
      date: new Date().toLocaleString('ar-EG')
    }]);

    setPurchaseItemName('');
    setPurchaseQty('');
    setPurchasePrice('');
    setSupplier('');
    alert('تم حفظ حركة المشتريات وخصم المبلغ من المحفظة بنجاح ✅');
    fetchPurchases();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productPrice) {
      alert('يرجى كتابة اسم الصنف والسعر');
      return;
    }

    const payload = {
      name: productName,
      description: productDesc,
      price: parseFloat(productPrice),
      category: productCategory,
      image_url: productImageUrl,
      is_available: true
    };

    const { error } = await supabase.from('menu_items').insert([payload]);

    if (error) {
      alert('حدث خطأ أثناء حفظ الصنف: ' + error.message);
    } else {
      alert('تمت إضافة الصنف للمنيو بنجاح 🎉');
      setProductName('');
      setProductDesc('');
      setProductPrice('');
      setProductImageUrl('');
      fetchProducts();
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setEditPrice(String(product.price));
    setEditImageUrl(product.image_url || '');
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const { error } = await supabase
      .from('menu_items')
      .update({
        price: parseFloat(editPrice),
        image_url: editImageUrl
      })
      .eq('id', editingProduct.id);

    if (error) {
      alert('حدث خطأ أثناء حفظ التحديث: ' + error.message);
    } else {
      alert('تم تحديث البيانات بنجاح ✅');
      setEditingProduct(null);
      fetchProducts();
    }
  };

  const toggleProductAvailability = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase.from('menu_items').update({ is_available: !currentStatus }).eq('id', id);
    if (error) {
      alert('حدث خطأ أثناء تحديث حالة التوفر: ' + error.message);
    } else {
      fetchProducts();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 dir-rtl" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            🔒
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">لوحة التحكم - Grill & Greens</h2>
          <p className="text-sm text-gray-500 mb-6">يرجى إدخال كلمة المرور للوصول إلى بيانات الإدارة والطلبات</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="أدخل كلمة المرور..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-emerald-600 focus:outline-none p-3 rounded-xl text-center text-lg font-bold tracking-widest"
                autoFocus
              />
              {authError && <p className="text-xs text-red-600 font-bold mt-2">{authError}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-xl shadow-lg transition"
            >
              دخول اللوحة 🔑
            </button>
          </form>

          <div className="mt-6 pt-4 border-t text-xs text-gray-400">
            <a href="/" className="hover:underline text-emerald-700 font-bold">← العودة لصفحة العميل / المنيو</a>
          </div>
        </div>
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  
  const activeSales = orders.filter(o => o.status === 'completed').filter(o => {
    if (!salesDateFrom && !salesDateTo) return true;
    const orderDate = new Date(o.created_at).getTime();
    const from = salesDateFrom ? new Date(salesDateFrom).getTime() : 0;
    const to = salesDateTo ? new Date(salesDateTo).setHours(23, 59, 59) : Infinity;
    return orderDate >= from && orderDate <= to;
  });

  const activePurchases = purchaseLogs.filter(p => p.status !== 'cancelled');
  const rawMaterialSuggestions = Array.from(new Set(activePurchases.map(p => p.item_name).filter(Boolean)));

  const groupedPurchases = activePurchases.reduce((acc: any, item: any) => {
    const name = item.item_name || 'صنف غير مسمى';
    if (!acc[name]) {
      acc[name] = { item_name: name, purchaseCount: 0, totalQuantity: 0, totalCost: 0, logs: [] };
    }
    acc[name].purchaseCount += 1;
    acc[name].totalQuantity += Number(item.quantity || 0);
    acc[name].totalCost += Number(item.total_price || 0);
    acc[name].logs.push(item);
    return acc;
  }, {});

  const groupedPurchasesList = Object.values(groupedPurchases);

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone?.includes(customerSearch)
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans dir-rtl" dir="rtl">
      {/* Header */}
      <header className="bg-emerald-900 text-white shadow-md p-4 flex flex-wrap justify-between items-center gap-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🔥 Grill & Greens | لوحة التحكم الإدارية
        </h1>
        <div className="flex items-center gap-3">
          <a href="/" className="text-xs bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 rounded-lg font-bold transition">
            🏪 صفحة العميل
          </a>
          <button onClick={handleLogout} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-bold transition">
            خروج 🚪
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white shadow-sm border-b overflow-x-auto flex gap-2 p-2">
        {[
          { id: 'live_orders', label: `📦 الطلبات الحية (${pendingOrders.length})` },
          { id: 'sales', label: `💰 المبيعات (${activeSales.length})` },
          { id: 'customers', label: `👥 قاعدة العملاء (${customers.length})` },
          { id: 'purchases', label: `🛒 المشتريات` },
          { id: 'menu', label: `🍔 إدارة المنيو (${products.length})` },
          { id: 'reports', label: `📊 التقارير الشاملة` },
          { id: 'finance', label: '💳 المحفظة والسيولة المالية' },
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
        {/* 1. الطلبات الحية */}
        {activeTab === 'live_orders' && (
          <div>
            <h2 className="text-lg font-bold mb-4 text-emerald-900">قسم الفواتير والطلبات الحالية (قيد الانتظار والتجهيز)</h2>
            {pendingOrders.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-lg border text-gray-500">لا توجد طلبات جارية حالياً.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOrders.map(order => {
                  const itemsList = parseOrderItems(order.items);
                  const foodTotal = calculateFoodTotalOnly(order);
                  const deliveryFee = calculateDeliveryOnly(order);
                  
                  return (
                    <div key={order.id} className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center border-b pb-2 mb-2">
                          <span className="font-extrabold text-emerald-800">
                            طلب #{String(order.id).split('-')[0].toUpperCase()}
                          </span>
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
                          {itemsList.length === 0 ? (
                            <p className="text-xs text-gray-400">لا توجد تفاصيل أصناف</p>
                          ) : (
                            itemsList.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-xs py-0.5">
                                <span>{item.name || item.title} × {item.qty || item.quantity || 1}</span>
                                <span>{(item.price || 0) * (item.qty || item.quantity || 1)} ج.م</span>
                              </div>
                            ))
                          )}
                          {deliveryFee > 0 && (
                            <div className="flex justify-between text-xs py-0.5 border-t border-dashed border-gray-300 mt-1 pt-1 font-bold text-amber-800">
                              <span>🛵 رسوم التوصيل (شركة أخرى):</span>
                              <span>{deliveryFee} ج.م</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 border-t pt-3">
                        <div className="flex justify-between font-bold text-emerald-900 text-xs mb-1">
                          <span>مبيعات الوجبات الصافية:</span>
                          <span>{foodTotal} ج.م</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 text-sm mb-3 border-t pt-1">
                          <span>المبلغ المطلوب من العميل:</span>
                          <span>{foodTotal + deliveryFee} ج.م</span>
                        </div>

                        <div className="mb-2">
                          <button
                            onClick={() => handlePrintOrder(order)}
                            className="w-full bg-gray-900 hover:bg-black text-white py-1.5 rounded font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition"
                          >
                            <span>🖨</span> طباعة الفاتورة
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="bg-blue-600 text-white py-1.5 rounded font-bold hover:bg-blue-700">تجهيز 👨‍‍🍳</button>
                          <button onClick={() => updateOrderStatus(order.id, 'delivering')} className="bg-purple-600 text-white py-1.5 rounded font-bold hover:bg-purple-700">توصيل 🛵</button>
                          <button onClick={() => updateOrderStatus(order.id, 'completed', order)} className="bg-green-600 text-white py-1.5 rounded font-bold hover:bg-green-700 col-span-2">تسليم وحفظ المبيعات ✅</button>
                          <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="bg-red-100 text-red-700 py-1.5 rounded font-bold hover:bg-red-200">إلغاء الفاتورة ❌</button>
                          <button onClick={() => sendWhatsAppNotification(order.phone, order.id, order.status)} className="bg-emerald-100 text-emerald-800 py-1.5 rounded font-bold hover:bg-emerald-200 flex items-center justify-center gap-1">📱 واتساب</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. قسم المبيعات */}
        {activeTab === 'sales' && (
          <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
            <h2 className="text-lg font-bold text-emerald-900">قسم المبيعات والفواتير المكتملة (مبيعات الوجبات فقط)</h2>
            <div className="flex flex-wrap gap-3 items-center bg-emerald-50 p-3 rounded-lg text-sm">
              <label className="font-bold">من تاريخ:</label>
              <input type="date" value={salesDateFrom} onChange={e => setSalesDateFrom(e.target.value)} className="border p-1.5 rounded bg-white" />
              <label className="font-bold">إلى تاريخ:</label>
              <input type="date" value={salesDateTo} onChange={e => setSalesDateTo(e.target.value)} className="border p-1.5 rounded bg-white" />
              <button onClick={() => window.print()} className="bg-emerald-800 text-white px-4 py-1.5 rounded font-bold hover:bg-emerald-900 mr-auto">طباعة التقرير 🖨️</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-100 font-bold border-b">
                  <tr>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">اسم العميل</th>
                    <th className="p-3">رقم الهاتف</th>
                    <th className="p-3">مبيعات الوجبات (الصافي)</th>
                    <th className="p-3">رسوم الدليفري</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">الإجراءات والطباعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activeSales.map(sale => {
                    const foodNet = calculateFoodTotalOnly(sale);
                    const delivery = calculateDeliveryOnly(sale);
                    return (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold">#{String(sale.id).split('-')[0].toUpperCase()}</td>
                        <td className="p-3 text-xs text-gray-500">{new Date(sale.created_at).toLocaleString('ar-EG')}</td>
                        <td className="p-3">{sale.customer_name}</td>
                        <td className="p-3">{sale.phone}</td>
                        <td className="p-3 font-bold text-green-700">{foodNet} ج.م</td>
                        <td className="p-3 font-bold text-amber-700">{delivery} ج.م</td>
                        <td className="p-3"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">مكتملة ✅</span></td>
                        <td className="p-3 flex gap-2 items-center">
                          <button onClick={() => handlePrintOrder(sale)} className="text-xs bg-emerald-700 text-white px-2.5 py-1 rounded font-bold hover:bg-emerald-800 flex items-center gap-1">
                            <span>👁️</span> معاينة وطباعة
                          </button>
                          <button onClick={() => updateOrderStatus(sale.id, 'cancelled')} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold hover:bg-red-200">إلغاء 🚫</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. قسم العملاء */}
        {activeTab === 'customers' && (
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <h2 className="text-lg font-bold text-emerald-900">قاعدة العملاء والسجل الكامل</h2>
              <input type="text" placeholder="🔍 بحث باسم العميل أو رقم الهاتف..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="border p-2 rounded-lg text-sm w-full md:w-72" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-100 font-bold border-b">
                  <tr>
                    <th className="p-3">اسم العميل</th>
                    <th className="p-3">رقم الهاتف</th>
                    <th className="p-3">العنوان الأساسي</th>
                    <th className="p-3">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCustomers.map(cust => (
                    <tr key={cust.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold">{cust.name}</td>
                      <td className="p-3">{cust.phone}</td>
                      <td className="p-3">{cust.address || '-'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedCustomerModal(cust)}
                          className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded text-xs font-bold hover:bg-emerald-200"
                        >
                          👁️ عرض الكارت
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedCustomerModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl relative max-h-[85vh] overflow-y-auto">
                  <button onClick={() => setSelectedCustomerModal(null)} className="absolute top-4 left-4 text-gray-500 font-bold text-lg">✖</button>
                  <h3 className="text-xl font-bold text-emerald-900 mb-2">👤 كارت العميل: {selectedCustomerModal.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">📱 الهاتف: {selectedCustomerModal.phone} | 📍 العنوان: {selectedCustomerModal.address}</p>

                  {(() => {
                    const custOrders = orders.filter(o => o.phone === selectedCustomerModal.phone && o.status === 'completed');
                    const totalSpent = custOrders.reduce((sum, item) => sum + calculateFoodTotalOnly(item), 0);

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-3 mb-4 bg-emerald-50 p-3 rounded-lg text-center">
                          <div><p className="text-xs text-gray-600">إجمالي الطلبات المكتملة</p><p className="font-bold text-emerald-900">{custOrders.length} طلب</p></div>
                          <div><p className="text-xs text-gray-600">إجمالي مشتريات الوجبات من المطعم</p><p className="font-bold text-green-700">{totalSpent} ج.م</p></div>
                        </div>

                        <h4 className="font-bold mb-2">سجل الفواتير والطلبات السابقة:</h4>
                        <table className="w-full text-right text-xs">
                          <thead className="bg-gray-100 font-bold border-b">
                            <tr><th className="p-2">رقم الفاتورة</th><th className="p-2">التاريخ</th><th className="p-2">مبيعات الوجبات</th><th className="p-2">الطباعة</th></tr>
                          </thead>
                          <tbody className="divide-y">
                            {custOrders.map((o, i) => (
                              <tr key={i}>
                                <td className="p-2 font-bold">#{String(o.id).split('-')[0].toUpperCase()}</td>
                                <td className="p-2">{new Date(o.created_at).toLocaleDateString('ar-EG')}</td>
                                <td className="p-2 font-bold text-green-700">{calculateFoodTotalOnly(o)} ج.م</td>
                                <td className="p-2">
                                  <button onClick={() => handlePrintOrder(o)} className="text-emerald-700 font-bold underline">🖨️ طباعة</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. قسم المشتريات */}
        {activeTab === 'purchases' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <h2 className="text-lg font-bold mb-4 text-emerald-900">تسجيل فاتورة / حركة مشتريات جديدة</h2>
              <form onSubmit={handleAddPurchase} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <input
                    list="rawMaterialsList"
                    type="text"
                    placeholder="اكتب اسم الخامة (مثل: لحمة بلدي...)"
                    value={purchaseItemName}
                    onChange={e => setPurchaseItemName(e.target.value)}
                    className="border p-2 rounded text-sm w-full bg-white font-bold"
                    required
                  />
                  <datalist id="rawMaterialsList">
                    {rawMaterialSuggestions.map((itemName, idx) => (
                      <option key={idx} value={itemName} />
                    ))}
                  </datalist>
                </div>

                <input type="number" placeholder="الكمية" value={purchaseQty} onChange={e => setPurchaseQty(e.target.value)} className="border p-2 rounded text-sm" required />
                <input type="number" placeholder="سعر الوحدة (ج.م)" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="border p-2 rounded text-sm" required />
                <input type="text" placeholder="اسم المورد (اختياري)" value={supplier} onChange={e => setSupplier(e.target.value)} className="border p-2 rounded text-sm" />
                <button type="submit" className="bg-emerald-800 text-white font-bold rounded p-2 hover:bg-emerald-900 text-sm">حفظ حركة المشتريات ➕</button>
              </form>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <h2 className="text-lg font-bold mb-3 text-emerald-900">سجل أصناف المشتريات المجمعة</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-emerald-50 font-bold border-b text-emerald-900">
                    <tr>
                      <th className="p-3">اسم الصنف</th>
                      <th className="p-3">مرات الشراء</th>
                      <th className="p-3">إجمالي الكمية</th>
                      <th className="p-3">إجمالي التكلفة</th>
                      <th className="p-3">عرض الكارت التفصيلي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {groupedPurchasesList.map((group: any) => (
                      <tr 
                        key={group.item_name} 
                        onClick={() => setSelectedItemCard(group.item_name)}
                        className="hover:bg-emerald-50 cursor-pointer"
                      >
                        <td className="p-3 font-bold text-emerald-900">{group.item_name}</td>
                        <td className="p-3 font-bold">{group.purchaseCount} مرة</td>
                        <td className="p-3">{group.totalQuantity}</td>
                        <td className="p-3 font-bold text-red-700">{group.totalCost} ج.م</td>
                        <td className="p-3"><span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">📄 فتح الكارت</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedItemCard && groupedPurchases[selectedItemCard] && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl relative max-h-[80vh] overflow-y-auto">
                  <button onClick={() => setSelectedItemCard(null)} className="absolute top-4 left-4 text-gray-500 font-bold text-lg">✖</button>
                  <h3 className="text-xl font-bold text-emerald-900 mb-3">📊 كارت صنف: {selectedItemCard}</h3>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4 bg-emerald-50 p-3 rounded-lg text-center">
                    <div><p className="text-xs text-gray-600">مرات الشراء</p><p className="font-bold text-emerald-900">{groupedPurchases[selectedItemCard].purchaseCount} مرة</p></div>
                    <div><p className="text-xs text-gray-600">إجمالي الكمية</p><p className="font-bold text-emerald-900">{groupedPurchases[selectedItemCard].totalQuantity}</p></div>
                    <div><p className="text-xs text-gray-600">إجمالي التكلفة</p><p className="font-bold text-red-700">{groupedPurchases[selectedItemCard].totalCost} ج.م</p></div>
                  </div>

                  <table className="w-full text-right text-sm">
                    <thead className="bg-gray-100 font-bold border-b">
                      <tr>
                        <th className="p-2">التاريخ</th>
                        <th className="p-2">الكمية</th>
                        <th className="p-2">سعر الوحدة</th>
                        <th className="p-2">الإجمالي</th>
                        <th className="p-2">المورد</th>
                        <th className="p-2">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {groupedPurchases[selectedItemCard].logs.map((log: any, i: number) => (
                        <tr key={i}>
                          <td className="p-2 text-xs">{new Date(log.created_at || log.purchase_date).toLocaleDateString('ar-EG')}</td>
                          <td className="p-2 font-bold">{log.quantity}</td>
                          <td className="p-2">{log.unit_price} ج.م</td>
                          <td className="p-2 font-bold text-red-700">{log.total_price} ج.م</td>
                          <td className="p-2 text-xs">{log.supplier_name || '-'}</td>
                          <td className="p-2">
                            <button onClick={() => cancelPurchaseTransaction(log.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold hover:bg-red-200">إلغاء ❌</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. قسم إدارة المنيو */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <h2 className="text-lg font-bold mb-4 text-emerald-900">إضافة صنف جديد للمنيو</h2>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <input type="text" placeholder="اسم الوجبة/الصنف" value={productName} onChange={e => setProductName(e.target.value)} className="border p-2 rounded text-sm" required />
                <input type="number" placeholder="سعر البيع (ج.م)" value={productPrice} onChange={e => setProductPrice(e.target.value)} className="border p-2 rounded text-sm" required />
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="p-2 border rounded-md text-sm bg-white"
                >
                  <option value="الوجبات">الوجبات</option>
                  <option value="المشويات">المشويات</option>
                  <option value="المحاشي">المحاشي</option>
                  <option value="الطواجن">الطواجن</option>
                  <option value="الطيور">الطيور</option>
                  <option value="أصناف إضافية">أصناف إضافية</option>
                </select>
                <input type="text" placeholder="رابط صورة الصنف (اختياري)" value={productImageUrl} onChange={e => setProductImageUrl(e.target.value)} className="border p-2 rounded text-sm" />
                <input type="text" placeholder="الوصف (مثال: يشمل: رز بسمتي + سلطة)" value={productDesc} onChange={e => setProductDesc(e.target.value)} className="border p-2 rounded text-sm col-span-1 md:col-span-2 lg:col-span-4" />
                <button type="submit" className="bg-emerald-800 text-white font-bold rounded p-2 hover:bg-emerald-900 text-sm md:col-span-2 lg:col-span-4">حفظ وإضافة للمنيو 🍔</button>
              </form>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <h2 className="text-lg font-bold mb-4 text-emerald-900">أصناف المنيو الحالية ({products.length})</h2>
              {products.length === 0 ? (
                <div className="text-center p-6 text-gray-500">لا توجد أصناف مسجلة حتى الآن.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {products.map(product => (
                    <div key={product.id} className="border rounded-lg p-3 flex flex-col justify-between bg-gray-50">
                      <div>
                        {product.image_url && (
                          <img src={product.image_url} alt={product.name} className="w-full h-36 object-cover rounded mb-2" />
                        )}
                        <h3 className="font-bold text-md">{product.name}</h3>
                        <p className="text-xs text-emerald-800 font-bold">{product.category}</p>
                        {product.description && <p className="text-xs text-gray-600 mt-1">{product.description}</p>}
                        <p className="text-sm font-bold text-green-700 mt-2">السعر: {product.price} ج.م</p>
                      </div>

                      <div className="flex flex-col gap-2 mt-3">
                        <button
                          onClick={() => openEditModal(product)}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-1 rounded text-xs font-bold transition"
                        >
                          ✏️ تعديل السعر / الصورة
                        </button>
                        <button
                          onClick={() => toggleProductAvailability(product.id, product.is_available)}
                          className={`w-full py-1 rounded text-xs font-bold text-white transition ${product.is_available ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}`}
                        >
                          {product.is_available ? 'متوفر بالمحل (In Stock) ✅' : 'غير متوفر (Out of Stock) ❌'}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white py-1 rounded text-xs font-bold transition"
                        >
                          🗑️ حذف الصنف نهائياً
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {editingProduct && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
                  <button onClick={() => setEditingProduct(null)} className="absolute top-4 left-4 text-gray-500 font-bold text-lg">✖</button>
                  <h3 className="text-lg font-bold text-emerald-900 mb-4">✏️ تعديل صنف: {editingProduct.name}</h3>
                  <form onSubmit={handleSaveProductEdit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">السعر الجديد (ج.م):</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        className="border p-2 rounded text-sm w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">رابط صورة الصنف (URL):</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={editImageUrl}
                        onChange={e => setEditImageUrl(e.target.value)}
                        className="border p-2 rounded text-sm w-full"
                      />
                    </div>
                    <button type="submit" className="w-full bg-emerald-800 text-white font-bold p-2 rounded hover:bg-emerald-900">
                      حفظ والتحديث 💾
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. قسم التقارير الشاملة والتحليلات */}
        {activeTab === 'reports' && (() => {
          const filteredSales = activeSales.filter(o => {
            if (!salesDateFrom && !salesDateTo) return true;
            const orderDate = new Date(o.created_at).getTime();
            const from = salesDateFrom ? new Date(salesDateFrom).getTime() : 0;
            const to = salesDateTo ? new Date(salesDateTo).setHours(23, 59, 59) : Infinity;
            return orderDate >= from && orderDate <= to;
          });

          const filteredPurchases = activePurchases.filter(p => {
            if (!salesDateFrom && !salesDateTo) return true;
            const pDate = new Date(p.created_at || p.purchase_date).getTime();
            const from = salesDateFrom ? new Date(salesDateFrom).getTime() : 0;
            const to = salesDateTo ? new Date(salesDateTo).setHours(23, 59, 59) : Infinity;
            return pDate >= from && pDate <= to;
          });

          const itemStats: { [key: string]: { name: string; qty: number; total: number } } = {};
          filteredSales.forEach(order => {
            const items = parseOrderItems(order.items);
            items.forEach((it: any) => {
              const name = it.name || it.title || 'صنف غير مسمى';
              const qty = Number(it.qty || it.quantity || 1);
              const price = Number(it.price || 0);
              if (!itemStats[name]) {
                itemStats[name] = { name, qty: 0, total: 0 };
              }
              itemStats[name].qty += qty;
              itemStats[name].total += qty * price;
            });
          });

          const topProducts = Object.values(itemStats)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

          const customerStats: { [key: string]: { name: string; phone: string; count: number; totalSpent: number } } = {};
          filteredSales.forEach(order => {
            const phone = order.phone || 'بدون رقم';
            const name = order.customer_name || 'عميل غير معروف';
            const foodTotal = calculateFoodTotalOnly(order);

            if (!customerStats[phone]) {
              customerStats[phone] = { name, phone, count: 0, totalSpent: 0 };
            }
            customerStats[phone].count += 1;
            customerStats[phone].totalSpent += foodTotal;
          });

          const topCustomers = Object.values(customerStats)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 5);

          const netFoodSales = filteredSales.reduce((sum, item) => sum + calculateFoodTotalOnly(item), 0);
          const totalExpenses = filteredPurchases.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
          const netProfit = netFoodSales - totalExpenses;

          const handlePrintDetailedReport = () => {
            const printWindow = window.open('', '_blank');
            if (!printWindow) return;

            const dateRangeText = (salesDateFrom || salesDateTo) 
              ? `الفترة من: ${salesDateFrom || 'البداية'} إلى: ${salesDateTo || 'الآن'}`
              : 'تقرير شامل لكل الفترات المسجلة';

            printWindow.document.write(`
              <html dir="rtl" lang="ar">
                <head>
                  <title>تقرير ماليات وإحصائيات - Grill & Greens</title>
                  <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; padding: 20px; color: #111827; }
                    .header { text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 12px; margin-bottom: 20px; }
                    .title { font-size: 22px; font-weight: bold; color: #065f46; margin: 0; }
                    .subtitle { font-size: 13px; color: #4b5563; margin-top: 4px; }
                    .cards-grid { display: flex; gap: 10px; margin-bottom: 20px; }
                    .card { flex: 1; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; text-align: center; }
                    .card-title { font-size: 11px; color: #6b7280; font-weight: bold; }
                    .card-value { font-size: 17px; font-weight: bold; margin-top: 5px; }
                    .green { color: #047857; background-color: #ecfdf5; }
                    .red { color: #b91c1c; background-color: #fef2f2; }
                    .blue { color: #1d4ed8; background-color: #eff6ff; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: right; }
                    th { background-color: #f3f4f6; color: #374151; font-weight: bold; }
                    .section-title { font-size: 15px; font-weight: bold; color: #065f46; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #065f46; padding-bottom: 4px; }
                    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #9ca3af; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <p class="title">🔥 Grill & Greens - تقرير الأداء المالي والإحصائيات</p>
                    <p class="subtitle">${dateRangeText}</p>
                    <p class="subtitle">تاريخ الاستخراج: ${new Date().toLocaleString('ar-EG')}</p>
                  </div>

                  <div class="cards-grid">
                    <div class="card green">
                      <div class="card-title">إجمالي المبيعات (الوجبات فقط)</div>
                      <div class="card-value">${netFoodSales} ج.م</div>
                    </div>
                    <div class="card red">
                      <div class="card-title">المصروفات والمشتريات</div>
                      <div class="card-value">${totalExpenses} ج.م</div>
                    </div>
                    <div class="card blue">
                      <div class="card-title">صافي الأرباح المحسوبة</div>
                      <div class="card-value">${netProfit} ج.م</div>
                    </div>
                  </div>

                  <div class="section-title">🏆 الأصناف الأكثر طلباً ومبيعاً</div>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>اسم الصنف</th>
                        <th>إجمالي الكمية المباعة</th>
                        <th>إجمالي العائد (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${topProducts.map((p, idx) => `
                        <tr>
                          <td>${idx + 1}</td>
                          <td><strong>${p.name}</strong></td>
                          <td>${p.qty} قطعة/وجبة</td>
                          <td>${p.total} ج.م</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>

                  <div class="section-title">👥 الأكثر شراءً من العملاء</div>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>اسم العميل</th>
                        <th>رقم الهاتف</th>
                        <th>عدد الطلبات</th>
                        <th>مشتريات الوجبات (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${topCustomers.map((c, idx) => `
                        <tr>
                          <td>${idx + 1}</td>
                          <td><strong>${c.name}</strong></td>
                          <td>${c.phone}</td>
                          <td>${c.count} طلبات</td>
                          <td>${c.totalSpent} ج.م</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>

                  <div class="footer">
                    <p>تم استخراج التقرير تلقائياً من لوحة تحكم Grill & Greens الإدارية (تم استبعاد رسوم شركات الدليفري الخارجية)</p>
                  </div>
                  <script>
                    window.onload = function() { window.print(); window.close(); };
                  </script>
                </body>
              </html>
            `);
            printWindow.document.close();
          };

          return (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                    📊 التقرير المالي والإحصائي للمطعم
                  </h2>
                  <button
                    onClick={handlePrintDetailedReport}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition flex items-center gap-1"
                  >
                    🖨️ طباعة التقرير الشامل
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 items-center bg-emerald-50/60 p-3 rounded-xl text-sm border border-emerald-100">
                  <span className="font-bold text-emerald-900">تحديد مدة التقارير:</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 font-bold">من:</label>
                    <input
                      type="date"
                      value={salesDateFrom}
                      onChange={e => setSalesDateFrom(e.target.value)}
                      className="border p-1.5 rounded-lg bg-white text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 font-bold">إلى:</label>
                    <input
                      type="date"
                      value={salesDateTo}
                      onChange={e => setSalesDateTo(e.target.value)}
                      className="border p-1.5 rounded-lg bg-white text-xs font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-1 mr-auto">
                    <button
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        setSalesDateFrom(today);
                        setSalesDateTo(today);
                      }}
                      className="text-xs bg-white border border-emerald-300 hover:bg-emerald-100 px-2.5 py-1 rounded-md font-bold text-emerald-800 transition"
                    >
                      اليوم
                    </button>
                    <button
                      onClick={() => {
                        const now = new Date();
                        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                        const today = now.toISOString().split('T')[0];
                        setSalesDateFrom(firstDay);
                        setSalesDateTo(today);
                      }}
                      className="text-xs bg-white border border-emerald-300 hover:bg-emerald-100 px-2.5 py-1 rounded-md font-bold text-emerald-800 transition"
                    >
                      هذا الشهر
                    </button>
                    <button
                      onClick={() => {
                        setSalesDateFrom('');
                        setSalesDateTo('');
                      }}
                      className="text-xs bg-gray-200 hover:bg-gray-300 px-2.5 py-1 rounded-md font-bold text-gray-700 transition"
                    >
                      عرض الكل
                    </button>
                  </div>
                </div>
              </div>

              {/* بطاقات المؤشرات المالية بدون الدليفري */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm">
                  <p className="text-xs text-emerald-800 font-bold">إجمالي المبيعات والإيرادات (الوجبات فقط)</p>
                  <p className="text-3xl font-extrabold text-emerald-900 mt-2">{netFoodSales} <span className="text-xs font-normal">ج.م</span></p>
                  <p className="text-xs text-emerald-700 mt-1">تم مستثنى منها أي رسوم توصيل شرك خارجية</p>
                </div>

                <div className="bg-red-50 border border-red-200 p-5 rounded-2xl shadow-sm">
                  <p className="text-xs text-red-800 font-bold">المصروفات والمشتريات</p>
                  <p className="text-3xl font-extrabold text-red-900 mt-2">{totalExpenses} <span className="text-xs font-normal">ج.م</span></p>
                  <p className="text-xs text-red-700 mt-1">عدد عمليات الشراء: {filteredPurchases.length}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl shadow-sm">
                  <p className="text-xs text-blue-800 font-bold">صافي الأرباح الصافية</p>
                  <p className="text-3xl font-extrabold text-blue-900 mt-2">{netProfit} <span className="text-xs font-normal">ج.م</span></p>
                  <p className="text-xs text-blue-700 mt-1">مبيعات الطعام فقط - المصروفات</p>
                </div>
              </div>

              {/* جداول الأكثر طلباً والأكثر شراءً */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                  <h3 className="font-bold text-md text-emerald-900 mb-3 flex items-center gap-1">
                    <span>🔥</span> الأصناف الأكثر طلباً ومبيعاً
                  </h3>
                  {topProducts.length === 0 ? (
                    <p className="text-xs text-gray-400 p-4 text-center">لا توجد مبيعات في هذه الفترة</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-emerald-50 font-bold text-emerald-900 border-b">
                          <tr>
                            <th className="p-2.5">#</th>
                            <th className="p-2.5">اسم الصنف</th>
                            <th className="p-2.5">الكمية المباعة</th>
                            <th className="p-2.5">إجمالي الإيراد</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {topProducts.map((p, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="p-2.5 font-bold text-emerald-800">{i + 1}</td>
                              <td className="p-2.5 font-bold text-gray-900">{p.name}</td>
                              <td className="p-2.5"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">{p.qty}</span></td>
                              <td className="p-2.5 font-bold text-green-700">{p.total} ج.م</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                  <h3 className="font-bold text-md text-emerald-900 mb-3 flex items-center gap-1">
                    <span>👑</span> الأكثر شراءً من العملاء
                  </h3>
                  {topCustomers.length === 0 ? (
                    <p className="text-xs text-gray-400 p-4 text-center">لا توجد طلبات في هذه الفترة</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-blue-50 font-bold text-blue-900 border-b">
                          <tr>
                            <th className="p-2.5">#</th>
                            <th className="p-2.5">العميل</th>
                            <th className="p-2.5">رقم الهاتف</th>
                            <th className="p-2.5">الطلبات</th>
                            <th className="p-2.5">إجمالي مشتريات الوجبات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {topCustomers.map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="p-2.5 font-bold text-blue-800">{i + 1}</td>
                              <td className="p-2.5 font-bold text-gray-900">{c.name}</td>
                              <td className="p-2.5 text-gray-600">{c.phone}</td>
                              <td className="p-2.5 font-bold">{c.count} طلبات</td>
                              <td className="p-2.5 font-bold text-green-700">{c.totalSpent} ج.م</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 7. قسم الإعدادات */}
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

        {/* قسم المحفظة والسيولة المالية الشامل */}
        {activeTab === 'finance' && <PersonalFinance />}
      </main>
    </div>
  );
}