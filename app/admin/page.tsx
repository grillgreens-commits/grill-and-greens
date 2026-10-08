'use client';
import { PersonalFinance } from '../components/PersonalFinance';
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_PASSWORD = '260564'; 

export default function CompleteEnterpriseAdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'live_orders' | 'sales' | 'customers' | 'purchases' | 'menu' | 'reports' | 'settings' | 'finance'>('live_orders');  
  
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [purchaseLogs, setPurchaseLogs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedItemCard, setSelectedItemCard] = useState<string | null>(null);
  const [selectedCustomerModal, setSelectedCustomerModal] = useState<any | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  const [pendingDeliveryOrder, setPendingDeliveryOrder] = useState<any | null>(null);
  const [deliveryPaymentAccount, setDeliveryPaymentAccount] = useState<string>('cash');

  const [pendingPurchaseData, setPendingPurchaseData] = useState<any | null>(null);
  const [purchasePaymentAccount, setPurchasePaymentAccount] = useState<string>('cash');

  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  const [salesDateFrom, setSalesDateFrom] = useState('');
  const [salesDateTo, setSalesDateTo] = useState('');

  const [purchaseItemName, setPurchaseItemName] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [supplier, setSupplier] = useState('');

  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('المشويات');
  const [productImageUrl, setProductImageUrl] = useState('');

  const [whatsappPhone, setWhatsappPhone] = useState('20101616490');

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchAllData();

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

  const calculateDeliveryOnly = (order: any): number => {
    const explicitDelivery = Number(order.delivery_fee || order.delivery_price || order.delivery || 0);
    if (explicitDelivery > 0) return explicitDelivery;

    const total = Number(order.total || order.total_amount || 0);
    const foodTotal = calculateFoodTotalOnly(order);
    return Math.max(0, total - foodTotal);
  };

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

  const updateOrderStatus = async (id: number | string, status: string, orderData?: any) => {
    if (status === 'completed' && orderData) {
      setPendingDeliveryOrder(orderData);
      setDeliveryPaymentAccount('cash');
      return;
    }

    if (status === 'cancelled') {
      const targetOrder = orders.find(o => o.id === id);
      if (targetOrder && targetOrder.status === 'completed') {
        const foodAmount = calculateFoodTotalOnly(targetOrder);
        const shortId = String(id).split('-')[0].toUpperCase();

        const { data: originalLog } = await supabase
          .from('wallet_logs')
          .select('account_id, account_name')
          .eq('source', `إيراد أوردر #${shortId}`)
          .order('created_at', { ascending: false })
          .maybeSingle();

        const refundAccountId = originalLog?.account_id || 'cash';
        const refundAccountName = originalLog?.account_name || 'الكاش / درج المحل';

        await supabase.from('wallet_logs').insert([{
          account_id: refundAccountId,
          account_name: refundAccountName,
          type: 'expense',
          category: 'مرتجع مبيعات',
          amount: foodAmount,
          source: `إلغاء/ارتجاع أوردر #${shortId}`,
          notes: `خصم تلقائي بعد إلغاء الأوردر من (${refundAccountName})`,
          date: new Date().toLocaleString('ar-EG')
        }]);
      }
    }

    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) {
      fetchOrders();
      fetchCustomers();
    }
  };

  const confirmDeliveryWithPayment = async () => {
    if (!pendingDeliveryOrder) return;

    const foodAmount = calculateFoodTotalOnly(pendingDeliveryOrder);
    const accountNames: Record<string, string> = {
      cash: 'الكاش / درج المحل',
      instapay: 'InstaPay',
      e_wallet: 'المحفظة الإلكترونية',
      savings: 'المُدخرات الشخصية',
    };

    const { error: walletErr } = await supabase.from('wallet_logs').insert([{
      account_id: deliveryPaymentAccount,
      account_name: accountNames[deliveryPaymentAccount] || 'الكاش / درج المحل',
      type: 'income',
      category: 'مبيعات مطعم',
      amount: foodAmount,
      source: `إيراد أوردر #${String(pendingDeliveryOrder.id).split('-')[0].toUpperCase()}`,
      notes: `تسليم أوردر العميل: ${pendingDeliveryOrder.customer_name || ''}`,
      date: new Date().toLocaleString('ar-EG')
    }]);

    if (!walletErr) {
      await supabase.from('orders').update({ status: 'completed' }).eq('id', pendingDeliveryOrder.id);
      await supabase.from('customers').upsert(
        { name: pendingDeliveryOrder.customer_name, phone: pendingDeliveryOrder.phone, address: pendingDeliveryOrder.address },
        { onConflict: 'phone' }
      );

      setPendingDeliveryOrder(null);
      fetchOrders();
      fetchCustomers();
      alert(`تم تسليم الأوردر وإضافة ${foodAmount} ج.م لمقبوضات (${accountNames[deliveryPaymentAccount]}) بنجاح ✅`);
    } else {
      alert('حدث خطأ في التسجيل: ' + walletErr.message);
    }
  };

  const cancelPurchaseTransaction = async (id: number) => {
    if (!confirm('هل أنت تأكد من إلغاء هذه الحركة وإرجاع المبلغ للمحفظة؟')) return;

    const targetPurchase = purchaseLogs.find(p => p.id === id);
    if (!targetPurchase) return;

    const { data: originalLog } = await supabase
      .from('wallet_logs')
      .select('account_id, account_name')
      .eq('source', `شراء خامات: ${targetPurchase.item_name}`)
      .order('created_at', { ascending: false })
      .maybeSingle();

    const refundAccountId = originalLog?.account_id || 'cash';
    const refundAccountName = originalLog?.account_name || 'الكاش / درج المحل';
    const refundAmount = Number(targetPurchase.total_price || 0);

    const { error: walletErr } = await supabase.from('wallet_logs').insert([{
      account_id: refundAccountId,
      account_name: refundAccountName,
      type: 'income',
      category: 'إلغاء مشتريات / مسترد',
      amount: refundAmount,
      source: `إلغاء شراء خامات: ${targetPurchase.item_name}`,
      notes: `إرجاع تلقائي لمبلغ المشتريات إلى (${refundAccountName})`,
      date: new Date().toLocaleString('ar-EG')
    }]);

    if (!walletErr) {
      await supabase.from('purchase_transactions').update({ status: 'cancelled' }).eq('id', id);
      fetchPurchases();
      alert(`تم إلغاء الحركة وإعادة مبلغ ${refundAmount} ج.م إلى (${refundAccountName}) بنجاح ✅`);
    }
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

  const handleAddPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const finalItemName = purchaseItemName.trim();

    if (!finalItemName || !purchaseQty || !purchasePrice) {
      alert('يرجى كتابة اسم الصنف/الخامة وملء جميع الحقول المطلوبة');
      return;
    }

    const qty = parseFloat(purchaseQty);
    const price = parseFloat(purchasePrice);
    const total = qty * price;

    setPendingPurchaseData({
      itemName: finalItemName,
      qty,
      price,
      total,
      supplier: supplier || null
    });
    setPurchasePaymentAccount('cash');
  };

  const confirmPurchaseWithPayment = async () => {
    if (!pendingPurchaseData) return;

    const accountNames: Record<string, string> = {
      cash: 'الكاش / درج المحل',
      instapay: 'InstaPay',
      e_wallet: 'المحفظة الإلكترونية',
      savings: 'المُدخرات الشخصية',
    };

    const { error: purchaseErr } = await supabase.from('purchase_transactions').insert([{
      item_name: pendingPurchaseData.itemName,
      quantity: pendingPurchaseData.qty,
      unit_price: pendingPurchaseData.price,
      total_price: pendingPurchaseData.total,
      supplier_name: pendingPurchaseData.supplier,
      status: 'active'
    }]);

    if (purchaseErr) {
      alert('حدث خطأ أثناء حفظ الفاتورة: ' + purchaseErr.message);
      return;
    }

    await supabase.from('wallet_logs').insert([{
      account_id: purchasePaymentAccount,
      account_name: accountNames[purchasePaymentAccount] || 'الكاش / درج المحل',
      type: 'expense',
      category: 'مشتريات خامات مطعم',
      amount: pendingPurchaseData.total,
      source: `شراء خامات: ${pendingPurchaseData.itemName}`,
      notes: `الكمية: ${pendingPurchaseData.qty} | المورد: ${pendingPurchaseData.supplier || 'غير محدد'}`,
      date: new Date().toLocaleString('ar-EG')
    }]);

    setPendingPurchaseData(null);
    setPurchaseItemName('');
    setPurchaseQty('');
    setPurchasePrice('');
    setSupplier('');
    alert('تم حفظ الفاتورة وخصم المبلغ من المحفظة بنجاح ✅');
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 dir-rtl font-sans" dir="rtl">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl shadow-inner">
            🔐
          </div>
          <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Grill & Greens ERP</h2>
          <p className="text-xs text-slate-400 mb-6 font-medium">لوحة التحكم السحابية وإدارة النظام</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="••••••••"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none p-3.5 rounded-xl text-center text-xl font-bold tracking-widest transition"
              autoFocus
            />
            {authError && <p className="text-xs text-rose-500 font-bold">{authError}</p>}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-900/30 transition-all active:scale-[0.98]"
            >
              تسجيل الدخول 🔑
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs">
            <a href="/" className="hover:underline text-emerald-400 font-bold">← العودة لصفحة العميل / المنيو</a>
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans dir-rtl" dir="rtl">
      {/* 🔴 Top Dark Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-6 py-3.5 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-xl">🔥</div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight">Grill & Greens ERP</h1>
            <p className="text-[10px] text-emerald-400 font-medium">لوحة الإدارة والمبيعات الشاملة</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a href="/" className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5">
            <span>🏪</span> صفحة العميل
          </a>
          <button onClick={handleLogout} className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white px-3.5 py-2 rounded-xl font-bold transition">
            خروج 🚪
          </button>
        </div>
      </header>

      {/* 🟢 Modern Nav Tabs */}
      <nav className="bg-slate-900 border-b border-slate-800/80 px-6 py-2 overflow-x-auto flex gap-2">
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
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-lg shadow-emerald-900/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* 1. الطلبات الحية */}
        {activeTab === 'live_orders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">قسم الفواتير والطلبات الحالية (قيد الانتظار والتجهيز)</h2>
              <span className="text-xs text-slate-400 font-medium">مزامنة فورية حية 🟢</span>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-3xl text-slate-500">
                <span className="text-4xl block mb-2">🎉</span>
                <p className="font-bold">لا توجد طلبات جارية حالياً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOrders.map(order => {
                  const itemsList = parseOrderItems(order.items);
                  const foodTotal = calculateFoodTotalOnly(order);
                  const deliveryFee = calculateDeliveryOnly(order);
                  
                  return (
                    <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
                      <div>
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
                          <span className="font-black text-emerald-400 text-base">
                            طلب #{String(order.id).split('-')[0].toUpperCase()}
                          </span>
                          <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black border ${
                            order.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            order.status === 'preparing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}>
                            {order.status === 'pending' ? '⏳ قيد الانتظار' : order.status === 'preparing' ? '👨‍🍳 جاري التجهيز' : '🛵 في الطريق'}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-slate-200 text-sm">{order.customer_name}</p>
                          <p className="text-slate-400">📱 {order.phone}</p>
                          <p className="text-slate-400">📍 {order.address}</p>
                          {order.notes && <p className="text-amber-400 bg-amber-500/10 p-2 rounded-xl mt-2 border border-amber-500/20">📝 {order.notes}</p>}
                        </div>

                        <div className="mt-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                          <p className="font-bold text-slate-400 border-b border-slate-800 pb-1">الأصناف:</p>
                          {itemsList.length === 0 ? (
                            <p className="text-xs text-slate-500">لا توجد تفاصيل أصناف</p>
                          ) : (
                            itemsList.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-slate-300">
                                <span>{item.name || item.title} × {item.qty || item.quantity || 1}</span>
                                <span className="font-bold">{(item.price || 0) * (item.qty || item.quantity || 1)} ج.م</span>
                              </div>
                            ))
                          )}
                          {deliveryFee > 0 && (
                            <div className="flex justify-between text-amber-400 border-t border-dashed border-slate-800 pt-1.5 mt-1 font-bold">
                              <span>🛵 رسوم التوصيل (شركة أخرى):</span>
                              <span>{deliveryFee} ج.م</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-800 space-y-3">
                        <div className="flex justify-between font-medium text-slate-400 text-xs">
                          <span>مبيعات الوجبات الصافية:</span>
                          <span className="text-emerald-400 font-bold">{foodTotal} ج.م</span>
                        </div>
                        <div className="flex justify-between font-black text-sm text-white border-t border-slate-800 pt-1">
                          <span>المبلغ المطلوب من العميل:</span>
                          <span className="text-emerald-400">{foodTotal + deliveryFee} ج.م</span>
                        </div>

                        <button
                          onClick={() => handlePrintOrder(order)}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <span>🖨</span> طباعة الفاتورة
                        </button>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl font-bold transition">تجهيز 👨‍‍🍳</button>
                          <button onClick={() => updateOrderStatus(order.id, 'delivering')} className="bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl font-bold transition">توصيل 🛵</button>
                          <button onClick={() => updateOrderStatus(order.id, 'completed', order)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 rounded-xl font-black col-span-2 transition">تسليم وحفظ المبيعات ✅</button>
                          <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white py-2 rounded-xl font-bold transition">إلغاء الفاتورة ❌</button>
                          <button onClick={() => sendWhatsAppNotification(order.phone, order.id, order.status)} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1">📱 واتساب</button>
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">قسم المبيعات والفواتير المكتملة (مبيعات الوجبات فقط)</h2>
            <div className="flex flex-wrap gap-3 items-center bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
              <label className="font-bold text-slate-300">من تاريخ:</label>
              <input type="date" value={salesDateFrom} onChange={e => setSalesDateFrom(e.target.value)} className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-white outline-none" />
              <label className="font-bold text-slate-300">إلى تاريخ:</label>
              <input type="date" value={salesDateTo} onChange={e => setSalesDateTo(e.target.value)} className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-white outline-none" />
              <button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold transition mr-auto">طباعة التقرير 🖨️</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
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
                <tbody className="divide-y divide-slate-800/60">
                  {activeSales.map(sale => {
                    const foodNet = calculateFoodTotalOnly(sale);
                    const delivery = calculateDeliveryOnly(sale);
                    return (
                      <tr key={sale.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-emerald-400">#{String(sale.id).split('-')[0].toUpperCase()}</td>
                        <td className="p-3 text-slate-400">{new Date(sale.created_at).toLocaleString('ar-EG')}</td>
                        <td className="p-3 font-bold">{sale.customer_name}</td>
                        <td className="p-3 text-slate-400">{sale.phone}</td>
                        <td className="p-3 font-bold text-emerald-400">{foodNet} ج.م</td>
                        <td className="p-3 font-bold text-amber-400">{delivery} ج.م</td>
                        <td className="p-3"><span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-bold">مكتملة ✅</span></td>
                        <td className="p-3 flex gap-2 items-center">
                          <button onClick={() => handlePrintOrder(sale)} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                            <span>👁️</span> طباعة
                          </button>
                          <button onClick={() => updateOrderStatus(sale.id, 'cancelled')} className="bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-lg font-bold transition">إلغاء 🚫</button>
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h2 className="text-lg font-bold text-white">قاعدة العملاء والسجل الكامل</h2>
              <input type="text" placeholder="🔍 بحث باسم العميل أو رقم الهاتف..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white outline-none w-full md:w-72" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">اسم العميل</th>
                    <th className="p-3">رقم الهاتف</th>
                    <th className="p-3">العنوان الأساسي</th>
                    <th className="p-3">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCustomers.map(cust => (
                    <tr key={cust.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-200">{cust.name}</td>
                      <td className="p-3 text-slate-400">{cust.phone}</td>
                      <td className="p-3 text-slate-400">{cust.address || '-'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedCustomerModal(cust)}
                          className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 px-3 py-1.5 rounded-xl font-bold transition"
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
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
                  <button onClick={() => setSelectedCustomerModal(null)} className="absolute top-4 left-4 text-slate-400 hover:text-white font-bold text-lg">✖</button>
                  <h3 className="text-xl font-bold text-white mb-2">👤 كارت العميل: {selectedCustomerModal.name}</h3>
                  <p className="text-xs text-slate-400 mb-4">📱 الهاتف: {selectedCustomerModal.phone} | 📍 العنوان: {selectedCustomerModal.address}</p>

                  {(() => {
                    const custOrders = orders.filter(o => o.phone === selectedCustomerModal.phone && o.status === 'completed');
                    const totalSpent = custOrders.reduce((sum, item) => sum + calculateFoodTotalOnly(item), 0);

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                          <div><p className="text-xs text-slate-400">إجمالي الطلبات المكتملة</p><p className="font-black text-emerald-400 text-lg">{custOrders.length} طلب</p></div>
                          <div><p className="text-xs text-slate-400">إجمالي مشتريات الوجبات</p><p className="font-black text-emerald-400 text-lg">{totalSpent} ج.م</p></div>
                        </div>

                        <h4 className="font-bold text-white mb-2 text-xs">سجل الفواتير والطلبات السابقة:</h4>
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                            <tr><th className="p-2.5">رقم الفاتورة</th><th className="p-2.5">التاريخ</th><th className="p-2.5">مبيعات الوجبات</th><th className="p-2.5">الطباعة</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {custOrders.map((o, i) => (
                              <tr key={i}>
                                <td className="p-2.5 font-bold text-emerald-400">#{String(o.id).split('-')[0].toUpperCase()}</td>
                                <td className="p-2.5 text-slate-400">{new Date(o.created_at).toLocaleDateString('ar-EG')}</td>
                                <td className="p-2.5 font-bold text-emerald-400">{calculateFoodTotalOnly(o)} ج.م</td>
                                <td className="p-2.5">
                                  <button onClick={() => handlePrintOrder(o)} className="text-emerald-400 font-bold underline">🖨️ طباعة</button>
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
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
              <h2 className="text-lg font-bold mb-4 text-white">تسجيل فاتورة / حركة مشتريات جديدة</h2>
              <form onSubmit={handleAddPurchase} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <input
                    list="rawMaterialsList"
                    type="text"
                    placeholder="اسم الخامة (مثال: لحمة...)"
                    value={purchaseItemName}
                    onChange={e => setPurchaseItemName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white font-bold w-full outline-none focus:border-emerald-500"
                    required
                  />
                  <datalist id="rawMaterialsList">
                    {rawMaterialSuggestions.map((itemName, idx) => (
                      <option key={idx} value={itemName} />
                    ))}
                  </datalist>
                </div>

                <input type="number" placeholder="الكمية" value={purchaseQty} onChange={e => setPurchaseQty(e.target.value)} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white outline-none focus:border-emerald-500" required />
                <input type="number" placeholder="سعر الوحدة (ج.م)" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white outline-none focus:border-emerald-500" required />
                <input type="text" placeholder="اسم المورد (اختياري)" value={supplier} onChange={e => setSupplier(e.target.value)} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white outline-none focus:border-emerald-500" />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl p-3 text-xs transition shadow-lg shadow-emerald-900/30">حفظ حركة المشتريات ➕</button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
              <h2 className="text-lg font-bold mb-3 text-white">سجل أصناف المشتريات المجمعة</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 font-bold border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3">اسم الصنف</th>
                      <th className="p-3">مرات الشراء</th>
                      <th className="p-3">إجمالي الكمية</th>
                      <th className="p-3">إجمالي التكلفة</th>
                      <th className="p-3">عرض الكارت التفصيلي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {groupedPurchasesList.map((group: any) => (
                      <tr 
                        key={group.item_name} 
                        onClick={() => setSelectedItemCard(group.item_name)}
                        className="hover:bg-slate-800/40 cursor-pointer transition"
                      >
                        <td className="p-3 font-bold text-white">{group.item_name}</td>
                        <td className="p-3 font-bold text-slate-300">{group.purchaseCount} مرة</td>
                        <td className="p-3 text-slate-400">{group.totalQuantity}</td>
                        <td className="p-3 font-bold text-rose-400">{group.totalCost} ج.م</td>
                        <td className="p-3"><span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg font-bold">📄 فتح الكارت</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedItemCard && groupedPurchases[selectedItemCard] && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[80vh] overflow-y-auto">
                  <button onClick={() => setSelectedItemCard(null)} className="absolute top-4 left-4 text-slate-400 hover:text-white font-bold text-lg">✖</button>
                  <h3 className="text-xl font-bold text-white mb-3">📊 كارت صنف: {selectedItemCard}</h3>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                    <div><p className="text-xs text-slate-400">مرات الشراء</p><p className="font-bold text-white">{groupedPurchases[selectedItemCard].purchaseCount} مرة</p></div>
                    <div><p className="text-xs text-slate-400">إجمالي الكمية</p><p className="font-bold text-white">{groupedPurchases[selectedItemCard].totalQuantity}</p></div>
                    <div><p className="text-xs text-slate-400">إجمالي التكلفة</p><p className="font-bold text-rose-400">{groupedPurchases[selectedItemCard].totalCost} ج.م</p></div>
                  </div>

                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950 font-bold border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="p-2.5">التاريخ</th>
                        <th className="p-2.5">الكمية</th>
                        <th className="p-2.5">سعر الوحدة</th>
                        <th className="p-2.5">الإجمالي</th>
                        <th className="p-2.5">المورد</th>
                        <th className="p-2.5">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {groupedPurchases[selectedItemCard].logs.map((log: any, i: number) => (
                        <tr key={i}>
                          <td className="p-2.5 text-slate-400">{new Date(log.created_at || log.purchase_date).toLocaleDateString('ar-EG')}</td>
                          <td className="p-2.5 font-bold text-slate-200">{log.quantity}</td>
                          <td className="p-2.5 text-slate-300">{log.unit_price} ج.م</td>
                          <td className="p-2.5 font-bold text-rose-400">{log.total_price} ج.م</td>
                          <td className="p-2.5 text-slate-400">{log.supplier_name || '-'}</td>
                          <td className="p-2.5">
                            <button onClick={() => cancelPurchaseTransaction(log.id)} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white px-2 py-1 rounded-lg font-bold transition">إلغاء ❌</button>
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
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
              <h2 className="text-lg font-bold mb-4 text-white">إضافة صنف جديد للمنيو</h2>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <input type="text" placeholder="اسم الوجبة/الصنف" value={productName} onChange={e => setProductName(e.target.value)} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white outline-none focus:border-emerald-500" required />
                <input type="number" placeholder="سعر البيع (ج.م)" value={productPrice} onChange={e => setProductPrice(e.target.value)} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white outline-none focus:border-emerald-500" required />
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white outline-none font-bold"
                >
                  <option value="الوجبات">الوجبات</option>
                  <option value="المشويات">المشويات</option>
                  <option value="المحاشي">المحاشي</option>
                  <option value="الطواجن">الطواجن</option>
                  <option value="الطيور">الطيور</option>
                  <option value="أصناف إضافية">أصناف إضافية</option>
                </select>
                <input type="text" placeholder="رابط صورة الصنف (اختياري)" value={productImageUrl} onChange={e => setProductImageUrl(e.target.value)} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white outline-none focus:border-emerald-500" />
                <input type="text" placeholder="الوصف (مثال: يشمل: رز بسمتي + سلطة)" value={productDesc} onChange={e => setProductDesc(e.target.value)} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white outline-none focus:border-emerald-500 col-span-1 md:col-span-2 lg:col-span-4" />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl p-3 text-xs md:col-span-2 lg:col-span-4 transition shadow-lg shadow-emerald-900/30">حفظ وإضافة للمنيو 🍔</button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
              <h2 className="text-lg font-bold mb-4 text-white">أصناف المنيو الحالية ({products.length})</h2>
              {products.length === 0 ? (
                <div className="text-center p-8 text-slate-500">لا توجد أصناف مسجلة حتى الآن.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {products.map(product => (
                    <div key={product.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
                      <div>
                        {product.image_url && (
                          <img src={product.image_url} alt={product.name} className="w-full h-36 object-cover rounded-xl mb-3 border border-slate-800" />
                        )}
                        <h3 className="font-bold text-sm text-white">{product.name}</h3>
                        <p className="text-[10px] text-emerald-400 font-bold mt-0.5">{product.category}</p>
                        {product.description && <p className="text-xs text-slate-400 mt-1.5">{product.description}</p>}
                        <p className="text-sm font-black text-emerald-400 mt-3">السعر: {product.price} ج.م</p>
                      </div>

                      <div className="flex flex-col gap-2 mt-4">
                        <button
                          onClick={() => openEditModal(product)}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 py-1.5 rounded-xl text-xs font-bold transition"
                        >
                          ✏️ تعديل السعر / الصورة
                        </button>
                        <button
                          onClick={() => toggleProductAvailability(product.id, product.is_available)}
                          className={`w-full py-1.5 rounded-xl text-xs font-bold transition ${product.is_available ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}
                        >
                          {product.is_available ? 'متوفر بالمحل (In Stock) ✅' : 'غير متوفر (Out of Stock) ❌'}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="w-full bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white py-1.5 rounded-xl text-xs font-bold transition"
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
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
                  <button onClick={() => setEditingProduct(null)} className="absolute top-4 left-4 text-slate-400 hover:text-white font-bold text-lg">✖</button>
                  <h3 className="text-lg font-bold text-white mb-4">✏️ تعديل صنف: {editingProduct.name}</h3>
                  <form onSubmit={handleSaveProductEdit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-300">السعر الجديد (ج.م):</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white w-full outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-300">رابط صورة الصنف (URL):</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={editImageUrl}
                        onChange={e => setEditImageUrl(e.target.value)}
                        className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white w-full outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl transition">
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
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    📊 التقرير المالي والإحصائي للمطعم
                  </h2>
                  <button
                    onClick={handlePrintDetailedReport}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
                  >
                    🖨️ طباعة التقرير الشامل
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 items-center bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                  <span className="font-bold text-slate-300">تحديد مدة التقارير:</span>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-400 font-bold">من:</label>
                    <input
                      type="date"
                      value={salesDateFrom}
                      onChange={e => setSalesDateFrom(e.target.value)}
                      className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-400 font-bold">إلى:</label>
                    <input
                      type="date"
                      value={salesDateTo}
                      onChange={e => setSalesDateTo(e.target.value)}
                      className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-white outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 mr-auto">
                    <button
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        setSalesDateFrom(today);
                        setSalesDateTo(today);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg font-bold text-emerald-400 transition"
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
                      className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg font-bold text-emerald-400 transition"
                    >
                      هذا الشهر
                    </button>
                    <button
                      onClick={() => {
                        setSalesDateFrom('');
                        setSalesDateTo('');
                      }}
                      className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg font-bold text-slate-300 transition"
                    >
                      عرض الكل
                    </button>
                  </div>
                </div>
              </div>

              {/* بطاقات المؤشرات المالية بدون الدليفري */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-emerald-500/20 p-6 rounded-3xl shadow-xl">
                  <p className="text-xs text-emerald-400 font-bold">إجمالي المبيعات والإيرادات (الوجبات فقط)</p>
                  <p className="text-3xl font-black text-white mt-2">{netFoodSales} <span className="text-xs font-normal text-slate-400">ج.م</span></p>
                  <p className="text-[10px] text-slate-400 mt-2">مستثنى منها أي رسوم توصيل خارجية</p>
                </div>

                <div className="bg-slate-900 border border-rose-500/20 p-6 rounded-3xl shadow-xl">
                  <p className="text-xs text-rose-400 font-bold">المصروفات والمشتريات</p>
                  <p className="text-3xl font-black text-white mt-2">{totalExpenses} <span className="text-xs font-normal text-slate-400">ج.م</span></p>
                  <p className="text-[10px] text-slate-400 mt-2">عدد عمليات الشراء: {filteredPurchases.length}</p>
                </div>

                <div className="bg-slate-900 border border-blue-500/20 p-6 rounded-3xl shadow-xl">
                  <p className="text-xs text-blue-400 font-bold">صافي الأرباح الصافية</p>
                  <p className="text-3xl font-black text-white mt-2">{netProfit} <span className="text-xs font-normal text-slate-400">ج.م</span></p>
                  <p className="text-[10px] text-slate-400 mt-2">مبيعات الطعام فقط - المصروفات</p>
                </div>
              </div>

              {/* جداول الأكثر طلباً والأكثر شراءً */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                  <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-1.5">
                    <span>🔥</span> الأصناف الأكثر طلباً ومبيعاً
                  </h3>
                  {topProducts.length === 0 ? (
                    <p className="text-xs text-slate-500 p-4 text-center">لا توجد مبيعات في هذه الفترة</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-950 font-bold text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-2.5">#</th>
                            <th className="p-2.5">اسم الصنف</th>
                            <th className="p-2.5">الكمية المباعة</th>
                            <th className="p-2.5">إجمالي الإيراد</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {topProducts.map((p, i) => (
                            <tr key={i} className="hover:bg-slate-800/40">
                              <td className="p-2.5 font-bold text-emerald-400">{i + 1}</td>
                              <td className="p-2.5 font-bold text-white">{p.name}</td>
                              <td className="p-2.5"><span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">{p.qty}</span></td>
                              <td className="p-2.5 font-bold text-emerald-400">{p.total} ج.م</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                  <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-1.5">
                    <span>👑</span> الأكثر شراءً من العملاء
                  </h3>
                  {topCustomers.length === 0 ? (
                    <p className="text-xs text-slate-500 p-4 text-center">لا توجد طلبات في هذه الفترة</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-950 font-bold text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-2.5">#</th>
                            <th className="p-2.5">العميل</th>
                            <th className="p-2.5">رقم الهاتف</th>
                            <th className="p-2.5">الطلبات</th>
                            <th className="p-2.5">إجمالي مشتريات الوجبات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {topCustomers.map((c, i) => (
                            <tr key={i} className="hover:bg-slate-800/40">
                              <td className="p-2.5 font-bold text-blue-400">{i + 1}</td>
                              <td className="p-2.5 font-bold text-white">{c.name}</td>
                              <td className="p-2.5 text-slate-400">{c.phone}</td>
                              <td className="p-2.5 font-bold text-slate-200">{c.count} طلبات</td>
                              <td className="p-2.5 font-bold text-emerald-400">{c.totalSpent} ج.م</td>
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
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl max-w-2xl">
            <h2 className="text-lg font-bold mb-4 text-white">إعدادات النظام والمطعم</h2>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1.5 text-slate-300">رقم الواتساب الافتراضي لاستلام الطلبات الإدارية:</label>
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={e => setWhatsappPhone(e.target.value)}
                  className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none w-full focus:border-emerald-500"
                />
              </div>
              <button onClick={() => alert('تم حفظ الإعدادات بنجاح')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition">
                حفظ التغييرات 💾
              </button>
            </div>
          </div>
        )}

        {/* قسم المحفظة والسيولة المالية الشامل */}
        {activeTab === 'finance' && <PersonalFinance />}
      </main>

      {/* 🔽 1. النافذة المنبثقة لاختيار طريقة الدفع عند تسليم الأوردر */}
      {pendingDeliveryOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              💳 تسليم الأوردر #{String(pendingDeliveryOrder.id).split('-')[0].toUpperCase()}
            </h3>
            
            <p className="text-xs font-bold text-slate-300">
              مبيعات الوجبات الصافية: <span className="text-emerald-400 font-black text-base">{calculateFoodTotalOnly(pendingDeliveryOrder)} ج.م</span>
            </p>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-300">اختر طريقة الدفع للإضافة للمحفظة السحابية:</label>
              <select
                value={deliveryPaymentAccount}
                onChange={(e) => setDeliveryPaymentAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl font-bold text-emerald-400 text-xs outline-none"
              >
                <option value="cash">💵 الكاش / درج المحل</option>
                <option value="instapay">📱 InstaPay</option>
                <option value="e_wallet">💳 المحفظة الإلكترونية</option>
                <option value="savings">🏦 المُدخرات الشخصية</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={confirmDeliveryWithPayment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition text-xs shadow-lg shadow-emerald-900/30"
              >
                تأكيد التسليم وحفظ المبيعات ✅
              </button>
              <button
                onClick={() => setPendingDeliveryOrder(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-3 rounded-xl transition text-xs"
              >
                إلغاء ✖
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔽 2. النافذة المنبثقة لاختيار طريقة الدفع عند تسجيل المشتريات */}
      {pendingPurchaseData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              🛒 خصم فاتورة مشتريات ({pendingPurchaseData.itemName})
            </h3>
            
            <p className="text-xs font-bold text-slate-300">
              إجمالي التكلفة المطلوب خصمها: <span className="text-rose-400 font-black text-base">{pendingPurchaseData.total} ج.م</span>
            </p>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-300">اختر الحساب/الكارت المخصوم منه المبلغ:</label>
              <select
                value={purchasePaymentAccount}
                onChange={(e) => setPurchasePaymentAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl font-bold text-emerald-400 text-xs outline-none"
              >
                <option value="cash">💵 الكاش / درج المحل</option>
                <option value="instapay">📱 InstaPay</option>
                <option value="e_wallet">💳 المحفظة الإلكترونية</option>
                <option value="savings">🏦 المُدخرات الشخصية</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={confirmPurchaseWithPayment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition text-xs shadow-lg shadow-emerald-900/30"
              >
                تأكيد الخصم وحفظ المشتريات 💾
              </button>
              <button
                onClick={() => setPendingPurchaseData(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-3 rounded-xl transition text-xs"
              >
                إلغاء ✖
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}