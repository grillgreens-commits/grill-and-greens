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

  const [activeTab, setActiveTab] = useState<'journal' | 'live_orders' | 'sales' | 'customers' | 'purchases' | 'inventory' | 'menu' | 'cost_report' | 'reports' | 'finance' | 'settings'>('live_orders');  
  
  const [orders, setOrders] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [purchaseLogs, setPurchaseLogs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
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

  const [ingredientName, setIngredientName] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('جرام');
  const [ingredientCost, setIngredientCost] = useState('');
  const [ingredientStock, setIngredientStock] = useState('');

  const [whatsappPhone, setWhatsappPhone] = useState('20101616490');

  // أزرار حالة المتجر (مغلق / مفتوح / تلقائي)
  const [storeStatusMode, setStoreStatusMode] = useState<string>('auto');

  // 📊 تقارير شاملة - الفلاتر
  const [reportFilter, setReportFilter] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('all');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // 💰 التحويل بين الكروت في السيولة
  const [transferFrom, setTransferFrom] = useState<string>('instapay');
  const [transferTo, setTransferTo] = useState<string>('cash');
  const [transferAmount, setTransferAmount] = useState<string>('');

  const [promoOfferAdmin, setPromoOfferAdmin] = useState<{
    type: 'text' | 'image';
    title: string;
    description: string;
    price: number;
    imageUrl: string;
    isActive: boolean;
  }>({
    type: 'text',
    title: 'مشكل Grill & Greens للعيلة',
    description: 'كيلو مشويات مشكلة + 4 أطباق جانبية',
    price: 1150,
    imageUrl: '',
    isActive: true,
  });

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchAllData();
    fetchPromoSettings();
    fetchStoreSettings();

    const ordersChannel = supabase
      .channel('realtime_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
        fetchJournal();
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
    await Promise.all([fetchOrders(), fetchJournal(), fetchCustomers(), fetchPurchases(), fetchProducts(), fetchIngredients()]);
    setLoading(false);
  };

  const fetchPromoSettings = async () => {
    const { data } = await supabase.from('settings').select('*').eq('key', 'promo_offer').maybeSingle();
    if (data && data.value) {
      setPromoOfferAdmin(data.value);
    }
  };

  const fetchStoreSettings = async () => {
    const { data } = await supabase.from('settings').select('*').eq('key', 'store_status_mode').maybeSingle();
    if (data && data.value) {
      setStoreStatusMode(data.value.mode || 'auto');
    }
  };

  const handleSaveStoreStatus = async (mode: string) => {
    setStoreStatusMode(mode);
    const { error } = await supabase
      .from('settings')
      .upsert(
        { key: 'store_status_mode', value: { mode } },
        { onConflict: 'key' }
      );

    if (error) {
      alert('حدث خطأ أثناء حفظ حالة المتجر: ' + error.message);
    } else {
      alert('تم تحديث حالة المتجر وعكسها بصفحة العميل بنجاح ✅');
    }
  };

  const handleSavePromoOffer = async () => {
    const { error } = await supabase
      .from('settings')
      .upsert(
        { key: 'promo_offer', value: promoOfferAdmin },
        { onConflict: 'key' }
      );

    if (error) {
      alert('حدث خطأ أثناء حفظ العرض: ' + error.message);
    } else {
      alert('تم تحديث العرض بنجاح ونشره بصفحة العميل! 🔥');
    }
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const fetchJournal = async () => {
    const { data } = await supabase.from('daily_journal').select('*').order('journal_order_number', { ascending: false });
    if (data) setJournalEntries(data);
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

  const fetchIngredients = async () => {
    const { data } = await supabase.from('ingredients').select('*').order('id', { ascending: true });
    if (data) setIngredients(data);
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

  const handlePrintOrder = (order: any, journalNumber?: number) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsArr = parseOrderItems(order.items);
    const shortId = journalNumber ? String(journalNumber) : String(order.id).split('-')[0].toUpperCase();
    
    const deliveryFee = calculateDeliveryOnly(order);
    const foodTotal = calculateFoodTotalOnly(order);
    const discountAmount = Number(order.discount || 0);
    const grandTotal = Math.max(0, foodTotal + deliveryFee - discountAmount);

    const paymentMethodLabel = order.payment_method 
      ? order.payment_method 
      : (order.address?.includes('استلام') ? 'نقداً (كاش بالمحل)' : 'نقداً عند الاستلام (الدليفري)');

    const dateLabel = new Date(order.created_at || Date.now()).toLocaleString('ar-EG');

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>إيصال طلب #${shortId}</title>
          <style>
            body { font-family: Tahoma, Arial, sans-serif; margin: 0; padding: 0; background-color: #fff; color: #000; }
            @page { size: 68mm auto; margin: 0; }
            .rec { width: 68mm; padding: 6px; box-sizing: border-box; font-size: 12px; line-height: 1.35; margin: 0 auto; }
            .rec h2 { text-align: center; margin: 4px 0; font-size: 14px; font-weight: bold; }
            .rec table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
            .rec th, .rec td { border: 1px solid #000; padding: 4px 2px; }
            .center { text-align: center; }
            .right { text-align: right; }
            .info-block { font-size: 12px; margin-bottom: 4px; line-height: 1.4; }
            .notes-box { margin-top: 6px; padding: 6px; border: 1px dashed #000; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="rec">
            <div style="text-align:center">
              <img src="https://www2.0zz0.com/2025/12/05/23/289980791.png" style="width:160px;height:auto;display:block;margin:0 auto 2px" alt="Logo">
              <h2 style="margin:2px 0 0;font-size:15px">Grill & Greens | Sohag</h2>
              <div style="font-size:13px;margin-bottom:6px">أكل بيتي – سوهاج<br> 01101616480 📞</div>
            </div>

            <hr style="border: none; border-top: 1px dashed #000; margin: 4px 0;">

            <div class="info-block">رقم الطلب: <b>#${shortId}</b></div>
            <div class="info-block">التاريخ: ${dateLabel}</div>
            <div class="info-block">العميل: ${order.customer_name || order.name || 'عميل'} ${order.phone ? ' - ' + order.phone : ''}</div>
            <div class="info-block">العنوان: ${order.address || order.addr || 'استلام من الفرع'}</div>
            <div class="info-block">طريقة الدفع: <b>${paymentMethodLabel}</b></div>

            <table>
              <thead>
                <tr>
                  <th style="width:40%">الصنف</th>
                  <th style="width:15%">كمية</th>
                  <th style="width:20%">سعر</th>
                  <th style="width:25%">إجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${itemsArr.map((i: any) => {
                  const price = Number(i.price || 0);
                  const qty = Number(i.qty || i.quantity || 1);
                  return `
                    <tr>
                      <td class="right">${i.name || i.title}</td>
                      <td class="center">${qty}</td>
                      <td class="center">${price.toFixed(2)}</td>
                      <td class="center">${(price * qty).toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}

                <tr>
                  <td colspan="3" class="right">الإجمالي قبل الخصم</td>
                  <td class="center">${foodTotal.toFixed(2)} ج</td>
                </tr>
                ${discountAmount > 0 ? `
                  <tr>
                    <td colspan="3" class="right">الخصم</td>
                    <td class="center">-${discountAmount.toFixed(2)} ج</td>
                  </tr>
                ` : ''}
                <tr>
                  <td colspan="3" class="right">التوصيل</td>
                  <td class="center">+${deliveryFee.toFixed(2)} ج</td>
                </tr>
                <tr>
                  <td colspan="3" class="right"><b>الإجمالي النهائي</b></td>
                  <td class="center"><b>${grandTotal.toFixed(2)} ج</b></td>
                </tr>
              </tbody>
            </table>

            ${order.notes ? `<div class="notes-box"><b>ملاحظات الطلب:</b> ${order.notes}</div>` : ''}

            <div style="text-align:center;margin-top:8px">
              <p style="font-size:12px;margin-top:6px;font-weight:bold">شكرًا لاختياركم Grill & Greens 🌿</p>
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

  const registerOrderInJournal = async (order: any) => {
    const { data: maxEntry } = await supabase.from('daily_journal').select('journal_order_number').order('journal_order_number', { ascending: false }).limit(1).maybeSingle();
    const nextNumber = (maxEntry?.journal_order_number || 1000) + 1;

    const { error } = await supabase.from('daily_journal').insert([{
      order_id: String(order.id),
      journal_order_number: nextNumber,
      customer_name: order.customer_name,
      order_type: order.address?.includes('استلام') ? 'Takeaway' : 'Delivery',
      payment_method: deliveryPaymentAccount,
      total_amount: calculateFoodTotalOnly(order)
    }]);

    if (!error) {
      fetchJournal();
    }
  };

  const updateOrderStatus = async (id: number | string, status: string, orderData?: any) => {
    if (status === 'cancelled' && !confirm('هل أنت تأكد من إلغاء الفاتورة؟')) return;

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

        await supabase.from('daily_journal').delete().eq('order_id', String(id));
      }
    }

    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) {
      fetchOrders();
      fetchCustomers();
      fetchJournal();
    }
  };

  const confirmDeliveryWithPayment = async () => {
    if (!pendingDeliveryOrder) return;

    const foodAmount = calculateFoodTotalOnly(pendingDeliveryOrder);
    const deliveryFee = calculateDeliveryOnly(pendingDeliveryOrder);
    const totalOrderWithDelivery = foodAmount + deliveryFee;

    const accountNames: Record<string, string> = {
      cash: 'الكاش / درج المحل',
      instapay: 'InstaPay',
      e_wallet: 'المحفظة الإلكترونية',
      savings: 'المُدخرات الشخصية',
    };

    const shortId = String(pendingDeliveryOrder.id).split('-')[0].toUpperCase();
    const isCash = deliveryPaymentAccount === 'cash';

    let walletInserts: any[] = [];

    if (isCash) {
      walletInserts.push({
        account_id: 'cash',
        account_name: 'الكاش / درج المحل',
        type: 'income',
        category: 'مبيعات مطعم شامل التوصيل',
        amount: totalOrderWithDelivery,
        source: `إيراد أوردر شامل التوصيل #${shortId}`,
        notes: `تسليم أوردر العميل: ${pendingDeliveryOrder.customer_name || ''}`,
        date: new Date().toLocaleString('ar-EG')
      });

      if (deliveryFee > 0) {
        walletInserts.push({
          account_id: 'cash',
          account_name: 'الكاش / درج المحل',
          type: 'expense',
          category: 'تسوية توصيل أوردر',
          amount: deliveryFee,
          source: `تسوية توصيل أوردر #${shortId}`,
          notes: `خصم رسوم التوصيل الخارجية`,
          date: new Date().toLocaleString('ar-EG')
        });
      }
    } else {
      walletInserts.push({
        account_id: deliveryPaymentAccount,
        account_name: accountNames[deliveryPaymentAccount],
        type: 'income',
        category: 'مبيعات مطعم إلكتروني شامل التوصيل',
        amount: totalOrderWithDelivery,
        source: `إيراد أوردر شامل التوصيل #${shortId}`,
        notes: `تحويل إلكتروني للعميل: ${pendingDeliveryOrder.customer_name || ''}`,
        date: new Date().toLocaleString('ar-EG')
      });

      if (deliveryFee > 0) {
        walletInserts.push({
          account_id: 'cash',
          account_name: 'الكاش / درج المحل',
          type: 'expense',
          category: 'تسوية توصيل أوردر',
          amount: deliveryFee,
          source: `تسوية توصيل أوردر #${shortId}`,
          notes: `خصم 30ج رسوم التوصيل من الكاش فورياً`,
          date: new Date().toLocaleString('ar-EG')
        });
      }
    }

    const { error: walletErr } = await supabase.from('wallet_logs').insert(walletInserts);

    if (!walletErr) {
      await supabase.from('orders').update({ 
        status: 'completed',
        payment_method: accountNames[deliveryPaymentAccount] || 'الكاش / درج المحل'
      }).eq('id', pendingDeliveryOrder.id);
      
      await registerOrderInJournal(pendingDeliveryOrder);

      await supabase.from('customers').upsert(
        { name: pendingDeliveryOrder.customer_name, phone: pendingDeliveryOrder.phone, address: pendingDeliveryOrder.address },
        { onConflict: 'phone' }
      );

      setPendingDeliveryOrder(null);
      fetchOrders();
      fetchCustomers();
      alert(`تم تسجيل الأوردر وتسوية الدفع وتطبيق خصم التوصيل بنجاح ✅`);
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

  const handleTransferBetweenAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(transferAmount);
    if (!amt || amt <= 0) {
      alert('يرجى إدخال مبلغ تحويل صحيح');
      return;
    }
    if (transferFrom === transferTo) {
      alert('لا يمكن التحويل لنفس الحساب!');
      return;
    }

    const accountNames: Record<string, string> = {
      cash: 'الكاش / درج المحل',
      instapay: 'InstaPay',
      e_wallet: 'المحفظة الإلكترونية',
      savings: 'المُدخرات الشخصية',
    };

    const fromName = accountNames[transferFrom] || transferFrom;
    const toName = accountNames[transferTo] || transferTo;

    const nowStr = new Date().toLocaleString('ar-EG');

    const expenseLog = {
      account_id: transferFrom,
      account_name: fromName,
      type: 'expense',
      category: 'تحويل بين الحسابات',
      amount: amt,
      source: `تحويل إلى (${toName})`,
      notes: `سحب مبلغ ${amt} ج.م ونقله لـ (${toName})`,
      date: nowStr
    };

    const incomeLog = {
      account_id: transferTo,
      account_name: toName,
      type: 'income',
      category: 'تحويل بين الحسابات',
      amount: amt,
      source: `تحويل من (${fromName})`,
      notes: `إيداع مبلغ ${amt} ج.م محول من (${fromName})`,
      date: nowStr
    };

    const { error } = await supabase.from('wallet_logs').insert([expenseLog, incomeLog]);

    if (error) {
      alert('حدث خطأ أثناء تنفيذ التحويل: ' + error.message);
    } else {
      alert(`تم تحويل مبلغ ${amt} ج.م من (${fromName}) إلى (${toName}) بنجاح! 🔄`);
      setTransferAmount('');
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

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientName || !ingredientCost) return alert('يرجى كتابة اسم الخامة وتكلفتها');

    const { error } = await supabase.from('ingredients').insert([{
      name: ingredientName,
      unit: ingredientUnit,
      cost_per_unit: parseFloat(ingredientCost),
      current_stock: parseFloat(ingredientStock || '0')
    }]);

    if (!error) {
      alert('تمت إضافة الخامة للمخزون بنجاح ✅');
      setIngredientName('');
      setIngredientCost('');
      setIngredientStock('');
      fetchIngredients();
    }
  };

  const handlePrintReports = () => {
    const reportContent = document.getElementById('printable-reports-section');
    if (!reportContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>التقرير المالي والإحصائي - Grill & Greens</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
            @page { size: A4; margin: 10mm; }
            body { 
              font-family: 'Cairo', Tahoma, Arial, sans-serif; 
              background: #ffffff; 
              color: #111111; 
              margin: 0; 
              padding: 0; 
              direction: rtl; 
              text-align: right;
              font-size: 12px; 
              line-height: 1.5; 
            }
            .print-container { width: 100%; max-width: 190mm; margin: 0 auto; box-sizing: border-box; }
            .header-print { text-align: center; border-bottom: 3px solid #059669; padding-bottom: 10px; margin-bottom: 15px; }
            .header-print h1 { margin: 0; font-size: 20px; color: #064e3b; font-weight: 900; }
            .header-print p { margin: 4px 0 0; font-size: 11px; color: #4b5563; font-weight: 600; }
            .summary-grid { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 15px; direction: rtl; }
            .summary-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: center; background: #f8fafc; }
            .summary-card h4 { margin: 0; font-size: 11px; color: #475569; font-weight: 700; }
            .summary-card p { margin: 4px 0 0; font-size: 15px; font-weight: 900; color: #0f172a; }
            .section-title { font-size: 13px; font-weight: 800; color: #064e3b; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; margin: 12px 0 6px; }
            .grid-2 { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
            .col { flex: 1; min-width: 48%; box-sizing: border-box; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 11px; direction: rtl; }
            th, td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; }
            th { background-color: #f1f5f9; color: #1e293b; font-weight: 700; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer-print { text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px dashed #94a3b8; padding-top: 6px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header-print">
              <h1>Grill & Greens - تقرير الأداء الشامل</h1>
              <p>سوهاج | 📞 01101616480 — تاريخ الإصدار: ${new Date().toLocaleString('ar-EG')}</p>
            </div>
            <div class="summary-grid">
              <div class="summary-card" style="border-color: #059669; background: #ecfdf5;">
                <h4>إجمالي المبيعات (صافي الوجبات)</h4>
                <p style="color: #065f46;">${totalReportFoodSales} ج.م</p>
              </div>
              <div class="summary-card" style="border-color: #e11d48; background: #fff1f2;">
                <h4>إجمالي المشتريات والخامات</h4>
                <p style="color: #9f1239;">${totalReportPurchasesCost} ج.م</p>
              </div>
              <div class="summary-card" style="border-color: #2563eb; background: #eff6ff;">
                <h4>صافي الأرباح</h4>
                <p style="color: #1e40af;">${netReportProfit} ج.م</p>
              </div>
            </div>
            <div class="grid-2">
              <div class="col">
                <div class="section-title">👑 أكثر 5 عملاء طلباً</div>
                <table>
                  <thead><tr><th>اسم العميل</th><th>الهاتف</th><th>الطلبات</th></tr></thead>
                  <tbody>
                    ${top5CustomersByCount.length === 0 ? '<tr><td colspan="3" style="text-align:center">لا توجد بيانات</td></tr>' : 
                      top5CustomersByCount.map(c => `<tr><td><b>${c.name}</b></td><td>${c.phone}</td><td><b>${c.count} طلب</b></td></tr>`).join('')}
                  </tbody>
                </table>
              </div>
              <div class="col">
                <div class="section-title">💰 أكثر 5 عملاء شراءً</div>
                <table>
                  <thead><tr><th>اسم العميل</th><th>الهاتف</th><th>المبلغ الإجمالي</th></tr></thead>
                  <tbody>
                    ${top5CustomersBySpent.length === 0 ? '<tr><td colspan="3" style="text-align:center">لا توجد بيانات</td></tr>' : 
                      top5CustomersBySpent.map(c => `<tr><td><b>${c.name}</b></td><td>${c.phone}</td><td><b>${c.totalSpent} ج.م</b></td></tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="grid-2">
              <div class="col">
                <div class="section-title">🔥 أكثر 10 أصناف طلباً</div>
                <table>
                  <thead><tr><th>الصنف</th><th>الكمية</th><th>الإجمالي</th></tr></thead>
                  <tbody>
                    ${top10ProductsByQty.length === 0 ? '<tr><td colspan="3" style="text-align:center">لا توجد بيانات</td></tr>' : 
                      top10ProductsByQty.map((item, i) => `<tr><td><b>${i+1}. ${item.name}</b></td><td>${item.qty} وجبة</td><td>${item.totalAmount} ج.م</td></tr>`).join('')}
                  </tbody>
                </table>
              </div>
              <div class="col">
                <div class="section-title">❄️ أقل 5 أصناف طلباً (تحتاج ترويج)</div>
                <table>
                  <thead><tr><th>الصنف</th><th>عدد الطلبات</th></tr></thead>
                  <tbody>
                    ${bottom5ProductsByQty.length === 0 ? '<tr><td colspan="2" style="text-align:center">لا توجد بيانات</td></tr>' : 
                      bottom5ProductsByQty.map((item, i) => `<tr><td><b>${i+1}. ${item.name}</b></td><td style="color: #e11d48"><b>${item.qty} طلب فقط</b></td></tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="footer-print">
              جميع الحقوق محفوظة © Grill & Greens - النظام السحابي للإدارة والمبيعات (سوهاج)
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

      <nav className="bg-slate-900 border-b border-slate-800/80 px-6 py-2 overflow-x-auto flex gap-2">
        {[
          { id: 'journal', label: `📔 دفتر اليومية الرسمية (${journalEntries.length})` },
          { id: 'live_orders', label: `📦 الطلبات الحية (${pendingOrders.length})` },
          { id: 'sales', label: `💰 المبيعات (${activeSales.length})` },
          { id: 'inventory', label: `🥦 المخزون والمكونات (${ingredients.length})` },
          { id: 'cost_report', label: `📊 تقرير التكلفة والربح` },
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
        {activeTab === 'journal' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">📔 دفتر اليومية الرسمي (الطلبات المسجلة برقم موحد)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">رقم الطلب الثابت</th>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">اسم العميل</th>
                    <th className="p-3">نوع الطلب</th>
                    <th className="p-3">طريقة الدفع</th>
                    <th className="p-3">الإجمالي (ج.م)</th>
                    <th className="p-3">الطباعة الحرارية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {journalEntries.map(j => (
                    <tr key={j.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-black text-emerald-400">#{j.journal_order_number}</td>
                      <td className="p-3 text-slate-400">{new Date(j.created_at).toLocaleString('ar-EG')}</td>
                      <td className="p-3 font-bold text-slate-200">{j.customer_name}</td>
                      <td className="p-3 text-slate-300">{j.order_type}</td>
                      <td className="p-3 text-slate-300">{j.payment_method}</td>
                      <td className="p-3 font-bold text-emerald-400">{j.total_amount} ج.م</td>
                      <td className="p-3">
                        <button onClick={() => handlePrintOrder({ id: j.order_id, customer_name: j.customer_name, payment_method: j.payment_method }, j.journal_order_number)} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold">🖨️ طباعة</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
                              <span>🛵 رسوم التوصيل:</span>
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

        {activeTab === 'sales' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">قسم المبيعات والفواتير المكتملة</h2>
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

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
              <h2 className="text-lg font-bold mb-3 text-white">إضافة خامة / مكون جديد للمخزون</h2>
              <form onSubmit={handleAddIngredient} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input type="text" placeholder="اسم الخامة (مثال: لحم بلدي)" value={ingredientName} onChange={e => setIngredientName(e.target.value)} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white outline-none focus:border-emerald-500" required />
                <select value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white outline-none font-bold">
                  <option value="جرام">جرام</option>
                  <option value="كيلو">كيلو</option>
                  <option value="قطعة">قطعة</option>
                  <option value="مل">مل</option>
                </select>
                <input type="number" placeholder="تكلفة الوحدة (ج.م)" value={ingredientCost} onChange={e => setIngredientCost(e.target.value)} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white outline-none focus:border-emerald-500" required />
                <input type="number" placeholder="الرصيد الافتتاحي" value={ingredientStock} onChange={e => setIngredientStock(e.target.value)} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white outline-none focus:border-emerald-500" />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl text-xs transition">حفظ بالمخزون 🥦</button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
              <h2 className="text-lg font-bold mb-3 text-white">رصيد المواد الخام والمكونات الحالية</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 font-bold border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3">اسم الخامة</th>
                      <th className="p-3">الوحدة</th>
                      <th className="p-3">تكلفة الوحدة</th>
                      <th className="p-3">الرصيد الحالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {ingredients.map(ing => (
                      <tr key={ing.id}>
                        <td className="p-3 font-bold text-white">{ing.name}</td>
                        <td className="p-3 text-slate-300">{ing.unit}</td>
                        <td className="p-3 text-slate-300">{ing.cost_per_unit} ج.م</td>
                        <td className="p-3 font-bold text-emerald-400">{ing.current_stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cost_report' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">📊 تقرير التكلفة والربح (مرتبط حصرياً بالطلبات المسجلة باليومية)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">رقم الطلب (اليومية)</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3">سعر البيع</th>
                    <th className="p-3">التكلفة التقديرية</th>
                    <th className="p-3">صافي الربح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {journalEntries.map(j => {
                    const estimatedCost = (j.total_amount || 0) * 0.6;
                    const profit = (j.total_amount || 0) - estimatedCost;
                    return (
                      <tr key={j.id}>
                        <td className="p-3 font-bold text-emerald-400">#{j.journal_order_number}</td>
                        <td className="p-3 text-slate-400">{new Date(j.created_at).toLocaleDateString('ar-EG')}</td>
                        <td className="p-3 text-slate-200">{j.customer_name}</td>
                        <td className="p-3 font-bold text-emerald-400">{j.total_amount} ج.م</td>
                        <td className="p-3 font-bold text-amber-400">{estimatedCost.toFixed(2)} ج.م</td>
                        <td className="p-3 font-bold text-blue-400">{profit.toFixed(2)} ج.م</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

        {/* 📊 قسم التقارير الشاملة المطور (تنسيق منظم بالكامل داخل الموقع وخارج الموقع) */}
        {activeTab === 'reports' && (() => {
          const now = new Date();

          const filteredReportOrders = orders.filter(o => o.status === 'completed').filter(o => {
            const orderDate = new Date(o.created_at);
            if (reportFilter === 'today') {
              return orderDate.toDateString() === now.toDateString();
            } else if (reportFilter === 'week') {
              const weekAgo = new Date();
              weekAgo.setDate(now.getDate() - 7);
              return orderDate >= weekAgo;
            } else if (reportFilter === 'month') {
              return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
            } else if (reportFilter === 'custom') {
              if (!reportStartDate || !reportEndDate) return true;
              return orderDate >= new Date(reportStartDate) && orderDate <= new Date(reportEndDate + 'T23:59:59');
            }
            return true;
          });

          const filteredReportPurchases = activePurchases.filter(p => {
            const pDate = new Date(p.created_at || p.purchase_date);
            if (reportFilter === 'today') {
              return pDate.toDateString() === now.toDateString();
            } else if (reportFilter === 'week') {
              const weekAgo = new Date();
              weekAgo.setDate(now.getDate() - 7);
              return pDate >= weekAgo;
            } else if (reportFilter === 'month') {
              return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
            } else if (reportFilter === 'custom') {
              if (!reportStartDate || !reportEndDate) return true;
              return pDate >= new Date(reportStartDate) && pDate <= new Date(reportEndDate + 'T23:59:59');
            }
            return true;
          });

          const totalReportFoodSales = filteredReportOrders.reduce((sum, item) => sum + calculateFoodTotalOnly(item), 0);
          const totalReportPurchasesCost = filteredReportPurchases.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
          const netReportProfit = totalReportFoodSales - totalReportPurchasesCost;

          // 1. إحصائيات العملاء
          const customerStats: { [phone: string]: { name: string; phone: string; count: number; totalSpent: number } } = {};
          filteredReportOrders.forEach(o => {
            const phone = o.phone || 'بدون رقم';
            const name = o.customer_name || 'عميل غير معروف';
            const foodTotal = calculateFoodTotalOnly(o);

            if (!customerStats[phone]) {
              customerStats[phone] = { name, phone, count: 0, totalSpent: 0 };
            }
            customerStats[phone].count += 1;
            customerStats[phone].totalSpent += foodTotal;
          });

          const customerList = Object.values(customerStats);
          const top5CustomersByCount = [...customerList].sort((a, b) => b.count - a.count).slice(0, 5);
          const top5CustomersBySpent = [...customerList].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

          // 2. إحصائيات الأصناف
          const itemStats: { [name: string]: { name: string; qty: number; totalAmount: number } } = {};
          filteredReportOrders.forEach(o => {
            const items = parseOrderItems(o.items);
            items.forEach((it: any) => {
              const name = it.name || it.title || 'صنف غير مسمى';
              const qty = Number(it.qty || it.quantity || 1);
              const price = Number(it.price || 0);

              if (!itemStats[name]) {
                itemStats[name] = { name, qty: 0, totalAmount: 0 };
              }
              itemStats[name].qty += qty;
              itemStats[name].totalAmount += qty * price;
            });
          });

          const itemList = Object.values(itemStats);
          const top10ProductsByQty = [...itemList].sort((a, b) => b.qty - a.qty).slice(0, 10);
          const bottom5ProductsByQty = [...itemList].sort((a, b) => a.qty - b.qty).slice(0, 5);

          return (
            <div className="space-y-6">
              {/* شريط التحكم وفلترة التاريخ وزر الطباعة */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">📊 التقارير الشاملة والأداء</h2>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrintReports}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
                    >
                      <span>🖨️</span> طباعة التقارير (A4 احترافي)
                    </button>

                    <div className="flex flex-wrap gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
                      <button onClick={() => setReportFilter('today')} className={`px-3 py-1.5 rounded-xl font-bold transition ${reportFilter === 'today' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}>اليوم</button>
                      <button onClick={() => setReportFilter('week')} className={`px-3 py-1.5 rounded-xl font-bold transition ${reportFilter === 'week' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}>الأسبوع</button>
                      <button onClick={() => setReportFilter('month')} className={`px-3 py-1.5 rounded-xl font-bold transition ${reportFilter === 'month' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}>الشهر</button>
                      <button onClick={() => setReportFilter('all')} className={`px-3 py-1.5 rounded-xl font-bold transition ${reportFilter === 'all' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}>الكل</button>
                      <button onClick={() => setReportFilter('custom')} className={`px-3 py-1.5 rounded-xl font-bold transition ${reportFilter === 'custom' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}>تاريخ مخصص 📅</button>
                    </div>
                  </div>
                </div>

                {reportFilter === 'custom' && (
                  <div className="flex flex-wrap gap-3 items-center bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs pt-3">
                    <label className="font-bold text-slate-300">من تاريخ:</label>
                    <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-white outline-none" />
                    <label className="font-bold text-slate-300">إلى تاريخ:</label>
                    <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-white outline-none" />
                  </div>
                )}
              </div>

              {/* المحتوى المعروض داخل الموقع (بتصميم أنيق ومرتب) */}
              <div id="printable-reports-section" className="space-y-6">
                
                {/* كروت الملخص المالي الثلاثة */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900 border border-emerald-500/20 p-5 rounded-3xl shadow-xl">
                    <p className="text-xs text-emerald-400 font-bold">إجمالي المبيعات (صافي الوجبات)</p>
                    <p className="text-3xl font-black text-white mt-1">{totalReportFoodSales} <span className="text-xs font-bold text-slate-400">ج.م</span></p>
                  </div>
                  <div className="bg-slate-900 border border-rose-500/20 p-5 rounded-3xl shadow-xl">
                    <p className="text-xs text-rose-400 font-bold">إجمالي المشتريات والخامات</p>
                    <p className="text-3xl font-black text-white mt-1">{totalReportPurchasesCost} <span className="text-xs font-bold text-slate-400">ج.م</span></p>
                  </div>
                  <div className="bg-slate-900 border border-blue-500/20 p-5 rounded-3xl shadow-xl">
                    <p className="text-xs text-blue-400 font-bold">صافي الأرباح</p>
                    <p className="text-3xl font-black text-white mt-1">{netReportProfit} <span className="text-xs font-bold text-slate-400">ج.م</span></p>
                  </div>
                </div>

                {/* الجداول منظمة في شبكة متوازنة */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* أكثر 5 عملاء طلباً */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                      <span>👑</span> أكثر 5 عملاء طلباً (عدد الطلبات)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="text-slate-400 border-b border-slate-800">
                          <tr><th className="p-2">اسم العميل</th><th className="p-2">الهاتف</th><th className="p-2">الطلبات</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {top5CustomersByCount.length === 0 ? (
                            <tr><td colSpan={3} className="p-4 text-center text-slate-500">لا توجد بيانات</td></tr>
                          ) : top5CustomersByCount.map((c, i) => (
                            <tr key={i}>
                              <td className="p-2 font-bold text-white">{c.name}</td>
                              <td className="p-2 text-slate-400">{c.phone}</td>
                              <td className="p-2 font-black text-emerald-400">{c.count} طلب</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* أكثر 5 عملاء شراءً */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                      <span>💰</span> أكثر 5 عملاء شراءً (إجمالي المبلغ)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="text-slate-400 border-b border-slate-800">
                          <tr><th className="p-2">اسم العميل</th><th className="p-2">الهاتف</th><th className="p-2">المبلغ الإجمالي</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {top5CustomersBySpent.length === 0 ? (
                            <tr><td colSpan={3} className="p-4 text-center text-slate-500">لا توجد بيانات</td></tr>
                          ) : top5CustomersBySpent.map((c, i) => (
                            <tr key={i}>
                              <td className="p-2 font-bold text-white">{c.name}</td>
                              <td className="p-2 text-slate-400">{c.phone}</td>
                              <td className="p-2 font-black text-amber-400">{c.totalSpent} ج.م</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* أكثر 10 أصناف طلباً */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                      <span>🔥</span> أكثر 10 أصناف طلباً (الأكثر مبيعاً)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="text-slate-400 border-b border-slate-800">
                          <tr><th className="p-2">الصنف</th><th className="p-2">الكمية</th><th className="p-2">إجمالي السعر</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {top10ProductsByQty.length === 0 ? (
                            <tr><td colSpan={3} className="p-4 text-center text-slate-500">لا توجد بيانات</td></tr>
                          ) : top10ProductsByQty.map((item, i) => (
                            <tr key={i}>
                              <td className="p-2 font-bold text-white">{i + 1}. {item.name}</td>
                              <td className="p-2 font-bold text-emerald-400">{item.qty} وجبة</td>
                              <td className="p-2 text-slate-300">{item.totalAmount} ج.م</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* أقل 5 أصناف طلباً */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                      <span>❄️</span> أقل 5 أصناف طلباً (تحتاج ترويج)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="text-slate-400 border-b border-slate-800">
                          <tr><th className="p-2">الصنف</th><th className="p-2">عدد الطلبات</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {bottom5ProductsByQty.length === 0 ? (
                            <tr><td colSpan={2} className="p-4 text-center text-slate-500">لا توجد بيانات</td></tr>
                          ) : bottom5ProductsByQty.map((item, i) => (
                            <tr key={i}>
                              <td className="p-2 font-bold text-white">{i + 1}. {item.name}</td>
                              <td className="p-2 font-bold text-rose-400">{item.qty} طلب فقط</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🏪 حالة المتجر بصفحة العميل (مغلق / مفتوح / تلقائي)
              </h2>
              <p className="text-xs text-slate-400">
                اختر الحالة التي تود عرضها للعملاء فور دخولهم للمنيو:
              </p>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveStoreStatus('open')}
                  className={`p-3.5 rounded-2xl font-black text-xs border transition flex flex-col items-center justify-center gap-1.5 ${
                    storeStatusMode === 'open' 
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/30' 
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">🟢</span>
                  <span>مفتوح يدويًا</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveStoreStatus('closed')}
                  className={`p-3.5 rounded-2xl font-black text-xs border transition flex flex-col items-center justify-center gap-1.5 ${
                    storeStatusMode === 'closed' 
                      ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-900/30' 
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">🔴</span>
                  <span>مغلق يدويًا</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveStoreStatus('auto')}
                  className={`p-3.5 rounded-2xl font-black text-xs border transition flex flex-col items-center justify-center gap-1.5 ${
                    storeStatusMode === 'auto' 
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-900/30' 
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">⏳</span>
                  <span>التوقيت التلقائي</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🔥 إدارة العرض اليومي المميز (أعلى المنيو)
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-300">حالة العرض بصفحة العميل:</span>
                  <button
                    type="button"
                    onClick={() => setPromoOfferAdmin({ ...promoOfferAdmin, isActive: !promoOfferAdmin.isActive })}
                    className={`px-4 py-1.5 rounded-lg font-bold transition ${
                      promoOfferAdmin.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {promoOfferAdmin.isActive ? 'مفعل ويعرض الآن ✅' : 'معطل ومخفي ❌'}
                  </button>
                </div>

                <div>
                  <label className="block font-bold mb-1.5 text-slate-300">نوع العرض المفضّل:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPromoOfferAdmin({ ...promoOfferAdmin, type: 'text' })}
                      className={`p-2.5 rounded-xl font-bold border transition ${
                        promoOfferAdmin.type === 'text' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      📝 نص وسعر ومكونات
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromoOfferAdmin({ ...promoOfferAdmin, type: 'image' })}
                      className={`p-2.5 rounded-xl font-bold border transition ${
                        promoOfferAdmin.type === 'image' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      🖼️ صورة مصممة / GIF
                    </button>
                  </div>
                </div>

                {promoOfferAdmin.type === 'text' ? (
                  <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <label className="block font-bold mb-1 text-slate-400">عنوان العرض:</label>
                      <input
                        type="text"
                        value={promoOfferAdmin.title}
                        onChange={e => setPromoOfferAdmin({ ...promoOfferAdmin, title: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-400">مكونات وتفاصيل العرض:</label>
                      <input
                        type="text"
                        value={promoOfferAdmin.description}
                        onChange={e => setPromoOfferAdmin({ ...promoOfferAdmin, description: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-400">سعر العرض (ج.م):</label>
                      <input
                        type="number"
                        value={promoOfferAdmin.price}
                        onChange={e => setPromoOfferAdmin({ ...promoOfferAdmin, price: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white outline-none font-bold text-emerald-400 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <label className="block font-bold mb-1 text-slate-400">رابط صورة/GIF العرض:</label>
                    <input
                      type="text"
                      value={promoOfferAdmin.imageUrl}
                      onChange={e => setPromoOfferAdmin({ ...promoOfferAdmin, imageUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <button
                  onClick={handleSavePromoOffer}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-900/30 text-xs"
                >
                  حفظ ونشر العرض بصفحة العميل 💾
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🔄 تحويل أموال بين الكروت والحسابات
              </h2>
              <p className="text-xs text-slate-400">
                يمكنك سحب أي مبلغ من حساب (مثل انستاباي أو المحفظة) ونقله مباشرة لحساب آخر (مثل الكاش أو المدخرات).
              </p>

              <form onSubmit={handleTransferBetweenAccounts} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">التحويل من (المصدر):</label>
                  <select
                    value={transferFrom}
                    onChange={e => setTransferFrom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white font-bold outline-none focus:border-emerald-500"
                  >
                    <option value="instapay">📱 InstaPay</option>
                    <option value="cash">💵 الكاش / درج المحل</option>
                    <option value="e_wallet">💳 المحفظة الإلكترونية</option>
                    <option value="savings">🏦 المُدخرات الشخصية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">التحويل إلى (المستهدف):</label>
                  <select
                    value={transferTo}
                    onChange={e => setTransferTo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white font-bold outline-none focus:border-emerald-500"
                  >
                    <option value="cash">💵 الكاش / درج المحل</option>
                    <option value="instapay">📱 InstaPay</option>
                    <option value="e_wallet">💳 المحفظة الإلكترونية</option>
                    <option value="savings">🏦 المُدخرات الشخصية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">المبلغ المراد تحويله (ج.م):</label>
                  <input
                    type="number"
                    placeholder="مثال: 1000"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white font-bold outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl transition shadow-lg shadow-emerald-900/30"
                  >
                    تأكيد وتحويل المبلغ ⚡
                  </button>
                </div>
              </form>
            </div>

            <PersonalFinance />
          </div>
        )}
      </main>

      {pendingDeliveryOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              💳 تسليم الأوردر وتسجيله بالدفتر اليومي
            </h3>
            
            <p className="text-xs font-bold text-slate-300">
              مبيعات الوجبات: <span className="text-emerald-400 font-black">{calculateFoodTotalOnly(pendingDeliveryOrder)} ج.م</span> | التوصيل: <span className="text-amber-400 font-black">{calculateDeliveryOnly(pendingDeliveryOrder)} ج.م</span>
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
              <p className="text-[10px] text-slate-400 mt-1.5">
                💡 عند الدفع الإلكتروني سيتم إيداع المبلغ شاملاً التوصيل في الحساب المختار، وخصم 30ج رسوم التوصيل تلقائياً من الكاش في نفس اللحظة.
              </p>
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