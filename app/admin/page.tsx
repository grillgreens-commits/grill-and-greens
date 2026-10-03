'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// الأصناف المجلوبة من كود العملاء كبيانات مبدئية
const INITIAL_MENU_ITEMS = [
  // --- المشاوي عالفحم ---
  { id: 'g1', name: 'فرخة كاملة', description: 'تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 360, category: 'المشاوي عالفحم 🥩', image_url: '' },
  { id: 'g2', name: 'نصف فرخة', description: 'تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 195, category: 'المشاوي عالفحم 🥩', image_url: '' },
  { id: 'g3', name: 'ربع فرخة', description: 'تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 120, category: 'المشاوي عالفحم 🥩', image_url: '' },
  { id: 'g4', name: 'ك كباب ستيك', description: 'كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 800, category: 'المشاوي عالفحم 🥩', image_url: '' },
  { id: 'g5', name: 'نصف كباب ستيك', description: 'نصف كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 430, category: 'المشاوي عالفحم 🥩', image_url: '' },
  { id: 'g6', name: 'ربع كباب ستيك', description: 'ربع كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 250, category: 'المشاوي عالفحم 🥩', image_url: '' },
  { id: 'g7', name: 'ك كفتة بلدي', description: 'كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 750, category: 'المشاوي عالفحم 🥩', image_url: '' },
  { id: 'g8', name: 'نصف كفتة بلدي', description: 'نصف كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 400, category: 'المشاوي عالفحم 🥩', image_url: '' },
  { id: 'g9', name: 'ربع كفتة بلدي', description: 'ربع كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 230, category: 'المشاوي عالفحم 🥩', image_url: '' },
  { id: 'g10', name: 'ك شيش طاووق', description: 'كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 400, category: 'المشاوي عالفحم 🥩', image_url: '' },
  { id: 'g11', name: 'نصف شيش طاووق', description: 'نصف كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 220, category: 'المشاوي عالفحم 🥩', image_url: '' },
  { id: 'g12', name: 'ربع شيش طاووق', description: 'ربع كيلو - تشمل: رز بسمتي + سلطة + طحينة + عيش', price: 130, category: 'المشاوي عالفحم 🥩', image_url: '' },

  // --- المحاشي ---
  { id: 'm1', name: 'ك محشي مشكل', description: 'كيلو محشي مشكل', price: 160, category: 'المحاشي 🥬', image_url: '' },
  { id: 'm2', name: 'نصف محشي مشكل', description: 'نصف كيلو محشي مشكل', price: 90, category: 'المحاشي 🥬', image_url: '' },
  { id: 'm3', name: 'ربع محشي مشكل', description: 'ربع كيلو محشي مشكل', price: 50, category: 'المحاشي 🥬', image_url: '' },
  { id: 'm4', name: 'ك محشي كرنب', description: 'كيلو محشي كرنب', price: 180, category: 'المحاشي 🥬', image_url: '' },
  { id: 'm5', name: 'نصف محشي كرنب', description: 'نصف كيلو محشي كرنب', price: 100, category: 'المحاشي 🥬', image_url: '' },
  { id: 'm6', name: 'ربع محشي كرنب', description: 'ربع كيلو محشي كرنب', price: 60, category: 'المحاشي 🥬', image_url: '' },
  { id: 'm7', name: 'ك محشي ورق عنب', description: 'كيلو محشي ورق عنب', price: 200, category: 'المحاشي 🥬', image_url: '' },
  { id: 'm8', name: 'نصف محشي ورق عنب', description: 'نصف كيلو محشي ورق عنب', price: 110, category: 'المحاشي 🥬', image_url: '' },
  { id: 'm9', name: 'ربع محشي ورق عنب', description: 'ربع كيلو محشي ورق عنب', price: 65, category: 'المحاشي 🥬', image_url: '' },
  { id: 'm10', name: 'ك محشي ممبار', description: 'كيلو محشي ممبار', price: 260, category: 'المحاشي 🥬', image_url: '' },
  { id: 'm11', name: 'نصف محشي ممبار', description: 'نصف كيلو محشي ممبار', price: 140, category: 'المحاشي 🥬', image_url: '' },
  { id: 'm12', name: 'ربع محشي ممبار', description: 'ربع كيلو محشي ممبار', price: 80, category: 'المحاشي 🥬', image_url: '' },

  // --- الصواني والطواجن ---
  { id: 'c1', name: 'صينية مكرونة بالبشاميل', description: 'صينية مكرونة بالبشاميل عائلية', price: 300, category: 'الصواني والطواجن 🍲', image_url: '' },
  { id: 'c2', name: 'صينية جلاش باللحمة', description: 'صينية جلاش باللحم المفروم', price: 250, category: 'الصواني والطواجن 🍲', image_url: '' },
  { id: 'c3', name: 'صينية بطاطس بالفراخ', description: 'صينية بطاطس بقطع الفراخ', price: 400, category: 'الصواني والطواجن 🍲', image_url: '' },
  { id: 'c4', name: 'صينية بطاطس باللحمة', description: 'صينية بطاطس بقطع اللحم البلدي', price: 430, category: 'الصواني والطواجن 🍲', image_url: '' },
  { id: 'c5', name: 'طاجن مكرونة بالبشاميل', description: 'طاجن بشاميل فردي', price: 100, category: 'الصواني والطواجن 🍲', image_url: '' },
  { id: 'c6', name: 'طاجن لحمة بالبصل', description: 'طاجن لحم بلدي مع البصل والأعشاب', price: 330, category: 'الصواني والطواجن 🍲', image_url: '' },
  { id: 'c7', name: 'طاجن بامية باللحمة', description: 'طاجن بامية باللحم البلدي', price: 310, category: 'الصواني والطواجن 🍲', image_url: '' },
  { id: 'c8', name: 'طاجن فريك باللحمة', description: 'طاجن فريك بلدي باللحمة', price: 310, category: 'الصواني والطواجن 🍲', image_url: '' },
  { id: 'c9', name: 'طاجن بطاطس باللحمة', description: 'طاجن بطاطس باللحمة البلدي', price: 290, category: 'الصواني والطواجن 🍲', image_url: '' },

  // --- الطيور ---
  { id: 'p1', name: 'فرد حمام محشي فريك', description: 'حمام محشي فريك', price: 240, category: 'الطيور 🍗', image_url: '' },
  { id: 'p2', name: 'فرد حمام محشي رز', description: 'حمام محشي أرز', price: 230, category: 'الطيور 🍗', image_url: '' },
  { id: 'p3', name: 'جوز حمام محشي فريك / رز', description: 'زوج حمام محشي فريك أو أرز', price: 450, category: 'الطيور 🍗', image_url: '' },
  { id: 'p4', name: 'بطة محشي فريك', description: 'بطة كاملة محشية فريك', price: 730, category: 'الطيور 🍗', image_url: '' },
  { id: 'p5', name: 'بطة محشي رز', description: 'بطة كاملة محشية أرز', price: 700, category: 'الطيور 🍗', image_url: '' },
  { id: 'p6', name: 'بطة محشي ورق عنب', description: 'بطة كاملة محشية ورق عنب', price: 780, category: 'الطيور 🍗', image_url: '' },
  { id: 'p7', name: 'فرخة مسلوق محمر', description: 'فرخة كاملة مسلوقة ومحمرة', price: 330, category: 'الطيور 🍗', image_url: '' },
  { id: 'p8', name: 'نصف فرخة مسلوق محمر', description: 'نصف فرخة مسلوقة ومحمرة', price: 170, category: 'الطيور 🍗', image_url: '' },
  { id: 'p9', name: 'ربع فرخة مسلوق محمر', description: 'ربع فرخة مسلوق ومحمر', price: 95, category: 'الطيور 🍗', image_url: '' },

  // --- الوجبات ---
  { id: 'w1', name: 'وجبة ربع فرخة مشوي / محمر', description: 'رز + سلطة + طحينة + عيش', price: 120, category: 'الوجبات 🍱', image_url: '' },
  { id: 'w2', name: 'وجبة ربع فراخ بانية بلدي', description: 'رز + سلطة + عيش', price: 130, category: 'الوجبات 🍱', image_url: '' },
  { id: 'w3', name: 'وجبة ربع فراخ بانية بلدي ميكس', description: 'مكرونة بالبشاميل + سلطة + عيش', price: 210, category: 'الوجبات 🍱', image_url: '' },
  { id: 'w4', name: 'وجبة ربع شيش طاووق مشوي', description: 'رز + سلطة + طحينة + عيش', price: 130, category: 'الوجبات 🍱', image_url: '' },
  { id: 'w5', name: 'وجبة ربع كفتة مشوية', description: 'رز + سلطة + طحينة + عيش', price: 230, category: 'الوجبات 🍱', image_url: '' },
  { id: 'w6', name: 'وجبة ربع كفتة بالصلصة', description: 'رز + سلطة + عيش', price: 230, category: 'الوجبات 🍱', image_url: '' },
  { id: 'w7', name: 'ورقة كبدة بلدي بالخلطة', description: 'رز + سلطة + عيش', price: 230, category: 'الوجبات 🍱', image_url: '' },
  { id: 'w8', name: 'طاجن مكرونة بالجمبري', description: '200 جرام جمبري فريش وايت صوص', price: 300, category: 'الوجبات 🍱', image_url: '' },

  // --- أصناف إضافية ---
  { id: 's1', name: 'فريك خضار سادة', description: 'طباق فريك خضار', price: 70, category: 'أصناف إضافية 🥗', image_url: '' },
  { id: 's2', name: 'بامية خضار سادة', description: 'طبق بامية سادة', price: 70, category: 'أصناف إضافية 🥗', image_url: '' },
  { id: 's3', name: 'بطاطس خضار سادة', description: 'طبق بطاطس مطبوخة سادة', price: 60, category: 'أصناف إضافية 🥗', image_url: '' },
  { id: 's4', name: 'ملوخية خضرا', description: 'طبق ملوخية خضراء بيتي', price: 60, category: 'أصناف إضافية 🥗', image_url: '' },
  { id: 's5', name: 'شوربة لسان عصفور', description: 'شوربة لسان عصفور سخنة', price: 25, category: 'أصناف إضافية 🥗', image_url: '' },
  { id: 's6', name: 'شوربة خضار', description: 'شوربة خضار مشكل', price: 30, category: 'أصناف إضافية 🥗', image_url: '' },
  { id: 's7', name: 'حواوشي بلدي', description: 'رغيف حواوشي بلدي + سلطة + طحينة', price: 90, category: 'أصناف إضافية 🥗', image_url: '' },
  { id: 's8', name: 'بطاطس بوم فريت', description: 'طبق بطاطس بوم فريت مقرمش', price: 40, category: 'أصناف إضافية 🥗', image_url: '' },
  { id: 's9', name: 'رز بسمتي', description: 'طبق أرز بسمتي', price: 35, category: 'أصناف إضافية 🥗', image_url: '' },
  { id: 's10', name: 'رز بالشعرية', description: 'طبق أرز مصري بالشعرية', price: 25, category: 'أصناف إضافية 🥗', image_url: '' },
  { id: 's11', name: 'بانية بلدي مقلي 1ك', description: 'كيلو بانية بلدي جاهز', price: 400, category: 'أصناف إضافية 🥗', image_url: '' },
  { id: 's12', name: 'نصف بانية بلدي مقلي', description: 'نصف كيلو بانية بلدي', price: 220, category: 'أصناف إضافية 🥗', image_url: '' },
];

export default function CompleteEnterpriseAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'live_orders' | 'sales' | 'customers' | 'purchases' | 'menu' | 'reports' | 'settings'>('live_orders');
  
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
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Sales Filters
  const [salesDateFrom, setSalesDateFrom] = useState('');
  const [salesDateTo, setSalesDateTo] = useState('');

  // New Purchase Form States
  const [newPurchaseItem, setNewPurchaseItem] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [supplier, setSupplier] = useState('');

  // New Product / Menu Form
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCost, setProductCost] = useState('');
  const [productCategory, setProductCategory] = useState('المشاوي عالفحم 🥩');
  const [productImage, setProductImage] = useState('');

  // Settings
  const [whatsappPhone, setWhatsappPhone] = useState('201101616480');

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
    const { data: logs } = await supabase.from('purchase_transactions').select('*').order('created_at', { ascending: false });
    if (logs) setPurchaseLogs(logs);
  };

  // جلب المنيو الموحد من جدول menu_items مع استخدام بيانات العميل المبدئية عند الحاجة
  const fetchProducts = async () => {
    let { data: menuData } = await supabase.from('menu_items').select('*').order('created_at', { ascending: true });
    
    if (!menuData || menuData.length === 0) {
      // إدراج المنيو الأساسي في قاعدة البيانات فوراً إذا كانت فارغة
      await supabase.from('menu_items').insert(INITIAL_MENU_ITEMS.map(item => ({
        name: item.name,
        description: item.description,
        price: item.price,
        cost: 0,
        category: item.category,
        image_url: item.image_url,
        is_available: true
      })));
      const { data: refreshed } = await supabase.from('menu_items').select('*');
      menuData = refreshed;
    }

    if (menuData) {
      const formatted = menuData.map((item: any) => ({
        id: item.id,
        name: item.name || item.title || 'صنف بدون اسم',
        description: item.description || '',
        price: item.price || 0,
        cost: item.cost || 0,
        category: item.category || 'الوجبات 🍱',
        image_url: item.image_url || item.image || '',
        is_available: item.is_available !== undefined ? item.is_available : true,
        stock_quantity: item.stock_quantity || 0
      }));
      setProducts(formatted);
    }
  };

  // دالة الطباعة الشاملة
  const handlePrintOrder = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let itemsArr: any[] = [];
    if (Array.isArray(order.items)) {
      itemsArr = order.items;
    } else if (typeof order.items === 'string') {
      try { itemsArr = JSON.parse(order.items); } catch (e) { itemsArr = []; }
    }

    const shortId = String(order.id).split('-')[0].toUpperCase();

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>فاتورة طلب #${shortId}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; padding: 15px; max-width: 350px; margin: 0 auto; }
            .bill-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .title { font-size: 18px; font-weight: bold; margin: 0; }
            .info { font-size: 13px; color: #333; margin: 4px 0; }
            .item-row { display: flex; justify-content: space-between; font-size: 13px; margin: 6px 0; }
            .total-row { border-top: 2px solid #000; margin-top: 10px; padding-top: 8px; font-size: 16px; font-weight: bold; display: flex; justify-content: space-between; }
            .footer { text-align: center; margin-top: 15px; font-size: 11px; color: #666; }
          </style>
        </head>
        <body>
          <div class="bill-card">
            <div class="header">
              <p class="title">🔥 Grill & Greens</p>
              <p class="info">طلب #${shortId}</p>
              <p class="info">التاريخ: ${new Date(order.created_at || Date.now()).toLocaleString('ar-EG')}</p>
            </div>
            <div>
              <p class="info"><strong>العميل:</strong> ${order.customer_name || 'عميل'}</p>
              <p class="info"><strong>الهاتف:</strong> ${order.phone || '-'}</p>
              <p class="info"><strong>العنوان:</strong> ${order.address || 'استلام من الفرع'}</p>
              ${order.notes ? `<p class="info" style="color: #b45309;"><strong>ملاحظات:</strong> ${order.notes}</p>` : ''}
            </div>
            <hr style="border: 0.5px solid #eee; margin: 10px 0;" />
            <div>
              <strong style="font-size: 13px;">الأصناف:</strong>
              ${itemsArr.map((it: any) => `
                <div class="item-row">
                  <span>${it.name || it.title} × ${it.qty || it.quantity || 1}</span>
                  <span>${(it.price || 0) * (it.qty || it.quantity || 1)} ج.م</span>
                </div>
              `).join('')}
            </div>
            <div class="total-row">
              <span>الإجمالي:</span>
              <span>${order.total || order.total_amount || 0} ج.م</span>
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
    if (!confirm('هل أنت تأكد من إلغاء هذه الحركة؟ لتختفي من التقارير مع حفظ السجل.')) return;
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

  // إضافـة حركة مشتريات وتحديث التكلفة
  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurchaseItem || !purchaseQty || !purchasePrice) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const qty = parseFloat(purchaseQty);
    const price = parseFloat(purchasePrice);
    const total = qty * price;
    const itemName = newPurchaseItem.trim();

    const { error } = await supabase.from('purchase_transactions').insert([{
      item_name: itemName,
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

    try {
      const matchedProduct = products.find(p => p.name?.toLowerCase() === itemName.toLowerCase());
      if (matchedProduct) {
        const newStock = (matchedProduct.stock_quantity || 0) + qty;
        await supabase.from('menu_items').update({
          cost: price,
          stock_quantity: newStock
        }).eq('id', matchedProduct.id);
      }
    } catch (e) {
      console.log('ملاحظة: الصنف غير مسجل في المنيو لتحديث التكلفة والمخزون تلقائياً');
    }

    setNewPurchaseItem('');
    setPurchaseQty('');
    setPurchasePrice('');
    setSupplier('');
    alert('تم حفظ حركة المشتريات بنجاح ✅');
    fetchPurchases();
    fetchProducts();
  };

  // إضافة صنف جديد للمنيو
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
      cost: productCost ? parseFloat(productCost) : 0,
      category: productCategory,
      image_url: productImage,
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
      setProductCost('');
      setProductImage('');
      fetchProducts();
    }
  };

  // تعديل صنف حالي في المنيو
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const { error } = await supabase.from('menu_items').update({
      name: editingProduct.name,
      description: editingProduct.description,
      price: parseFloat(editingProduct.price),
      cost: parseFloat(editingProduct.cost || 0),
      category: editingProduct.category,
      image_url: editingProduct.image_url,
    }).eq('id', editingProduct.id);

    if (error) {
      alert('حدث خطأ أثناء التعديل: ' + error.message);
    } else {
      alert('تم تعديل الصنف وصورته بنجاح ✅ وسوف يظهر فوراً للعملاء');
      setEditingProduct(null);
      fetchProducts();
    }
  };

  const toggleProductAvailability = async (id: number | string, currentStatus: boolean) => {
    await supabase.from('menu_items').update({ is_available: !currentStatus }).eq('id', id);
    fetchProducts();
  };

  const pendingOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  
  const activeSales = orders.filter(o => o.status === 'completed').filter(o => {
    if (!salesDateFrom && !salesDateTo) return true;
    const orderDate = new Date(o.created_at).getTime();
    const from = salesDateFrom ? new Date(salesDateFrom).getTime() : 0;
    const to = salesDateTo ? new Date(salesDateTo).setHours(23, 59, 59) : Infinity;
    return orderDate >= from && orderDate <= to;
  });

  const activePurchases = purchaseLogs.filter(p => p.status !== 'cancelled');

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone?.includes(customerSearch)
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans dir-rtl" dir="rtl">
      {/* Header */}
      <header className="bg-emerald-900 text-white shadow-md p-4 flex flex-wrap justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🔥 Grill & Greens | لوحة التحكم الإدارية
        </h1>
        <div className="text-sm bg-emerald-800 px-3 py-1 rounded-full">
          إجمالي المبيعات النشطة: {activeSales.reduce((acc, curr) => acc + (Number(curr.total || curr.total_amount) || 0), 0)} ج.م
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
                {pendingOrders.map(order => (
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
                        {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs py-0.5">
                            <span>{item.name || item.title} × {item.qty || item.quantity || 1}</span>
                            <span>{(item.price || 0) * (item.qty || item.quantity || 1)} ج.م</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-3">
                      <div className="flex justify-between font-bold text-emerald-900 mb-3">
                        <span>الإجمالي:</span>
                        <span>{order.total || order.total_amount} ج.م</span>
                      </div>

                      <div className="mb-2">
                        <button
                          onClick={() => handlePrintOrder(order)}
                          className="w-full bg-gray-900 hover:bg-black text-white py-1.5 rounded font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition"
                        >
                          <span>🖨️</span> طباعة الفاتورة
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="bg-blue-600 text-white py-1.5 rounded font-bold hover:bg-blue-700">تجهيز 👨‍🍳</button>
                        <button onClick={() => updateOrderStatus(order.id, 'delivering')} className="bg-purple-600 text-white py-1.5 rounded font-bold hover:bg-purple-700">توصيل 🛵</button>
                        <button onClick={() => updateOrderStatus(order.id, 'completed', order)} className="bg-green-600 text-white py-1.5 rounded font-bold hover:bg-green-700 col-span-2">تسليم وحفظ المبيعات ✅</button>
                        <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="bg-red-100 text-red-700 py-1.5 rounded font-bold hover:bg-red-200">إلغاء الفاتورة ❌</button>
                        <button onClick={() => sendWhatsAppNotification(order.phone, order.id, order.status)} className="bg-emerald-100 text-emerald-800 py-1.5 rounded font-bold hover:bg-emerald-200 flex items-center justify-center gap-1">📱 واتساب</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. قسم المبيعات */}
        {activeTab === 'sales' && (
          <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
            <h2 className="text-lg font-bold text-emerald-900">قسم المبيعات والفواتير المكتملة</h2>
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
                    <th className="p-3">إجمالي الفاتورة</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3">الإجراءات والطباعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activeSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold">#{String(sale.id).split('-')[0].toUpperCase()}</td>
                      <td className="p-3 text-xs text-gray-500">{new Date(sale.created_at).toLocaleString('ar-EG')}</td>
                      <td className="p-3">{sale.customer_name}</td>
                      <td className="p-3">{sale.phone}</td>
                      <td className="p-3 font-bold text-green-700">{sale.total || sale.total_amount} ج.م</td>
                      <td className="p-3"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">مكتملة ✅</span></td>
                      <td className="p-3 flex gap-2 items-center">
                        <button onClick={() => handlePrintOrder(sale)} className="text-xs bg-emerald-700 text-white px-2.5 py-1 rounded font-bold hover:bg-emerald-800 flex items-center gap-1">
                          <span>👁️️</span> معاينة وطباعة
                        </button>
                        <button onClick={() => updateOrderStatus(sale.id, 'cancelled')} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold hover:bg-red-200">إلغاء 🚫</button>
                      </td>
                    </tr>
                  ))}
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
                    <th className="p-3">تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCustomers.map(cust => (
                    <tr key={cust.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold">
                        <button onClick={() => setSelectedCustomerModal(cust)} className="text-emerald-700 underline font-bold hover:text-emerald-900">
                          {cust.name} 📄
                        </button>
                      </td>
                      <td className="p-3">{cust.phone}</td>
                      <td className="p-3">{cust.address || 'غير محدد'}</td>
                      <td className="p-3 text-xs text-gray-500">{new Date(cust.created_at).toLocaleDateString('ar-EG')}</td>
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
                    const totalSpent = custOrders.reduce((sum, item) => sum + (Number(item.total || item.total_amount) || 0), 0);

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-3 mb-4 bg-emerald-50 p-3 rounded-lg text-center">
                          <div><p className="text-xs text-gray-600">إجمالي الطلبات المكتملة</p><p className="font-bold text-emerald-900">{custOrders.length} طلب</p></div>
                          <div><p className="text-xs text-gray-600">إجمالي الإنفاق</p><p className="font-bold text-green-700">{totalSpent} ج.م</p></div>
                        </div>

                        <h4 className="font-bold mb-2">سجل الفواتير والطلبات السابقة:</h4>
                        <table className="w-full text-right text-xs">
                          <thead className="bg-gray-100 font-bold border-b">
                            <tr><th className="p-2">رقم الفاتورة</th><th className="p-2">التاريخ</th><th className="p-2">المبلغ</th><th className="p-2">الطباعة</th></tr>
                          </thead>
                          <tbody className="divide-y">
                            {custOrders.map((o, i) => (
                              <tr key={i}>
                                <td className="p-2 font-bold">#{String(o.id).split('-')[0].toUpperCase()}</td>
                                <td className="p-2">{new Date(o.created_at).toLocaleDateString('ar-EG')}</td>
                                <td className="p-2 font-bold text-green-700">{o.total || o.total_amount} ج.م</td>
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

        {/* 4. قسم المشتريات المعدل والمطور */}
        {activeTab === 'purchases' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <h2 className="text-lg font-bold mb-4 text-emerald-900">تسجيل فاتورة / حركة مشتريات جديدة (تحديث كارت الصنف)</h2>
              <form onSubmit={handleAddPurchase} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <input
                    type="text"
                    list="items-list"
                    placeholder="اسم الصنف (مثلاً: كفتة بلدي)"
                    value={newPurchaseItem}
                    onChange={e => setNewPurchaseItem(e.target.value)}
                    className="border p-2 rounded text-sm w-full"
                    required
                  />
                  <datalist id="items-list">
                    {products.map((prod, idx) => (
                      <option key={idx} value={prod.name} />
                    ))}
                  </datalist>
                </div>

                <input type="number" placeholder="الكمية" value={purchaseQty} onChange={e => setPurchaseQty(e.target.value)} className="border p-2 rounded text-sm" required />
                <input type="number" placeholder="سعر الوحدة (ج.م)" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="border p-2 rounded text-sm" required />
                <input type="text" placeholder="اسم المورد (اختياري)" value={supplier} onChange={e => setSupplier(e.target.value)} className="border p-2 rounded text-sm" />
                <button type="submit" className="bg-emerald-800 text-white font-bold rounded p-2 hover:bg-emerald-900 text-sm">حفظ وتحديث الصنف ➕</button>
              </form>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <h2 className="text-lg font-bold mb-2 text-emerald-900">سجل حركات المشتريات</h2>
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
                      <th className="p-3">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activePurchases.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <button onClick={() => setSelectedItemCard(log.item_name)} className="font-bold text-emerald-700 underline hover:text-emerald-900">
                            {log.item_name} 📄
                          </button>
                        </td>
                        <td className="p-3">{log.quantity}</td>
                        <td className="p-3">{log.unit_price} ج.م</td>
                        <td className="p-3 font-bold text-red-700">{log.total_price} ج.م</td>
                        <td className="p-3">{log.supplier_name || '-'}</td>
                        <td className="p-3 text-xs text-gray-500">{new Date(log.created_at || log.purchase_date).toLocaleDateString('ar-EG')}</td>
                        <td className="p-3">
                          <button onClick={() => cancelPurchaseTransaction(log.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold hover:bg-red-200">إلغاء ❌</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedItemCard && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl relative max-h-[80vh] overflow-y-auto">
                  <button onClick={() => setSelectedItemCard(null)} className="absolute top-4 left-4 text-gray-500 font-bold text-lg">✖</button>
                  <h3 className="text-xl font-bold text-emerald-900 mb-1">📊 كارت صنف: {selectedItemCard}</h3>
                  {(() => {
                    const itemLogs = activePurchases.filter(l => l.item_name === selectedItemCard);
                    const totalQty = itemLogs.reduce((acc, curr) => acc + Number(curr.quantity), 0);
                    const totalSpent = itemLogs.reduce((acc, curr) => acc + Number(curr.total_price), 0);

                    return (
                      <>
                        <div className="grid grid-cols-3 gap-3 mb-4 bg-emerald-50 p-3 rounded-lg text-center mt-3">
                          <div><p className="text-xs text-gray-600">مرات الشراء</p><p className="font-bold text-emerald-900">{itemLogs.length} مرة</p></div>
                          <div><p className="text-xs text-gray-600">إجمالي الكمية الشراء</p><p className="font-bold text-emerald-900">{totalQty}</p></div>
                          <div><p className="text-xs text-gray-600">إجمالي التكلفة</p><p className="font-bold text-red-700">{totalSpent} ج.م</p></div>
                        </div>

                        <table className="w-full text-right text-sm">
                          <thead className="bg-gray-100 font-bold border-b">
                            <tr><th className="p-2">التاريخ</th><th className="p-2">الكمية</th><th className="p-2">سعر الوحدة</th><th className="p-2">الإجمالي</th></tr>
                          </thead>
                          <tbody className="divide-y">
                            {itemLogs.map((log, i) => (
                              <tr key={i}>
                                <td className="p-2 text-xs">{new Date(log.created_at || log.purchase_date).toLocaleDateString('ar-EG')}</td>
                                <td className="p-2 font-bold">{log.quantity}</td>
                                <td className="p-2">{log.unit_price} ج.م</td>
                                <td className="p-2 font-bold text-red-700">{log.total_price} ج.م</td>
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

        {/* 5. قسم إدارة المنيو المعدل مع حقول تعديل الصور والصنف */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <h2 className="text-lg font-bold mb-4 text-emerald-900">إضافة صنف جديد للمنيو</h2>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="اسم الوجبة/الصنف" value={productName} onChange={e => setProductName(e.target.value)} className="border p-2 rounded text-sm" required />
                <input type="number" placeholder="سعر البيع للجمهور (ج.م)" value={productPrice} onChange={e => setProductPrice(e.target.value)} className="border p-2 rounded text-sm" required />
                <input type="number" placeholder="تكلفة الصنف على المطعم (اختياري)" value={productCost} onChange={e => setProductCost(e.target.value)} className="border p-2 rounded text-sm" />
                <input type="text" placeholder="رابط صورة الوجبة (URL)" value={productImage} onChange={e => setProductImage(e.target.value)} className="border p-2 rounded text-sm" />
                <select value={productCategory} onChange={e => setProductCategory(e.target.value)} className="border p-2 rounded text-sm">
                  <option value="المشاوي عالفحم 🥩">المشاوي عالفحم 🥩</option>
                  <option value="المحاشي 🥬">المحاشي 🥬</option>
                  <option value="الصواني والطواجن 🍲">الصواني والطواجن 🍲</option>
                  <option value="الطيور 🍗">الطيور 🍗</option>
                  <option value="الوجبات 🍱">الوجبات 🍱</option>
                  <option value="أصناف إضافية 🥗">أصناف إضافية 🥗</option>
                </select>
                <button type="submit" className="bg-emerald-800 text-white font-bold rounded p-2 hover:bg-emerald-900 text-sm">حفظ وإضافة للمنيو 🍔</button>
              </form>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <h2 className="text-lg font-bold mb-4 text-emerald-900">أصناف المنيو الحالية ({products.length})</h2>
              {products.length === 0 ? (
                <div className="text-center p-6 text-gray-500">لا توجد أصناف مسجلة حتى الآن.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {products.map(product => (
                    <div key={product.id} className="border rounded-lg p-3 flex flex-col justify-between bg-gray-50 relative">
                      <div>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-36 object-cover rounded mb-2 border" />
                        ) : (
                          <div className="w-full h-36 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400 text-xs font-bold">
                            لا توجد صورة مضافة
                          </div>
                        )}
                        <h3 className="font-bold text-md">{product.name}</h3>
                        <p className="text-xs text-gray-500">{product.category}</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                        <p className="text-sm font-bold text-green-700 mt-1">سعر البيع: {product.price} ج.م</p>
                        {product.cost > 0 && <p className="text-xs text-red-600">التكلفة الأخيرة: {product.cost} ج.م</p>}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-1.5 rounded text-xs font-bold"
                        >
                          تعديل الصنف / الصورة ✏️️
                        </button>
                        <button
                          onClick={() => toggleProductAvailability(product.id, product.is_available)}
                          className={`py-1.5 px-3 rounded text-xs font-bold text-white ${product.is_available ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}`}
                        >
                          {product.is_available ? 'متوفر ✅' : 'نفذ ❌'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal تعديل صنف والصورة */}
            {editingProduct && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
                  <button onClick={() => setEditingProduct(null)} className="absolute top-4 left-4 text-gray-500 font-bold text-lg">✖</button>
                  <h3 className="text-lg font-bold text-emerald-900 mb-4">✏️️ تعديل صنف: {editingProduct.name}</h3>
                  <form onSubmit={handleUpdateProduct} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">اسم الصنف:</label>
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="w-full border p-2 rounded text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">الوصف:</label>
                      <input
                        type="text"
                        value={editingProduct.description || ''}
                        onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        className="w-full border p-2 rounded text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold mb-1">سعر البيع (ج.م):</label>
                        <input
                          type="number"
                          value={editingProduct.price}
                          onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })}
                          className="w-full border p-2 rounded text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">التكلفة (ج.م):</label>
                        <input
                          type="number"
                          value={editingProduct.cost || 0}
                          onChange={e => setEditingProduct({ ...editingProduct, cost: e.target.value })}
                          className="w-full border p-2 rounded text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">القسم:</label>
                      <select
                        value={editingProduct.category}
                        onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full border p-2 rounded text-sm"
                      >
                        <option value="المشاوي عالفحم 🥩">المشاوي عالفحم 🥩</option>
                        <option value="المحاشي 🥬">المحاشي 🥬</option>
                        <option value="الصواني والطواجن 🍲">الصواني والطواجن 🍲</option>
                        <option value="الطيور 🍗">الطيور 🍗</option>
                        <option value="الوجبات 🍱">الوجبات 🍱</option>
                        <option value="أصناف إضافية 🥗">أصناف إضافية 🥗</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">رابط صورة الوجبة (Image URL):</label>
                      <input
                        type="text"
                        placeholder="ضع رابط الصورة هنا..."
                        value={editingProduct.image_url || ''}
                        onChange={e => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                        className="w-full border p-2 rounded text-sm"
                      />
                    </div>
                    <button type="submit" className="w-full bg-emerald-800 text-white font-bold py-2 rounded text-sm hover:bg-emerald-900 mt-2">
                      حفظ التغييرات وصورة الصنف 💾
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. قسم التقارير */}
        {activeTab === 'reports' && (
          <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
            <h2 className="text-lg font-bold text-emerald-900">تصدير واستعراض التقارير المالية</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <p className="text-sm text-emerald-800 font-bold">إجمالي إيرادات المبيعات النشطة</p>
                <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                  {activeSales.reduce((sum, item) => sum + (Number(item.total || item.total_amount) || 0), 0)} ج.م
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                <p className="text-sm text-red-800 font-bold">إجمالي المصروفات والمشتريات النشطة</p>
                <p className="text-2xl font-extrabold text-red-900 mt-1">
                  {activePurchases.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0)} ج.م
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <p className="text-sm text-blue-800 font-bold">صافي الأرباح التقديرية</p>
                <p className="text-2xl font-extrabold text-blue-900 mt-1">
                  {activeSales.reduce((sum, item) => sum + (Number(item.total || item.total_amount) || 0), 0) - activePurchases.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0)} ج.م
                </p>
              </div>
            </div>
          </div>
        )}

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
      </main>
    </div>
  );
}