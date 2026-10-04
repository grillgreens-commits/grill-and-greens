import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, CheckCircle, Clock, XCircle, RefreshCw, 
  Search, Filter, Plus, Edit2, Trash2, Eye, MapPin, Phone, 
  User, DollarSign, Calendar, ArrowUpRight, TrendingUp, Package
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface OrderItem {
  id?: string;
  name?: string;
  title?: string;
  price: number;
  quantity?: number;
  qty?: number;
}

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  total_amount?: number;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
}

export default function CompleteEnterpriseAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // إدارة الأصناف
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    category: 'وجبات رئيسية',
    price: 0,
    description: '',
    available: true
  });

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();

    // التحديث اللحظي للطلبات المباشرة Realtime Subscription
    const subscription = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
      } else if (data) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase.from('menu_items').select('*');
      if (error) console.error('Error fetching menu:', error);
      else if (data) setMenuItems(data);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        alert('حدث خطأ أثناء تحديث الحالة');
      } else {
        setOrders(prev =>
          prev.map(order => (order.id === orderId ? { ...order, status: newStatus } : order))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ available: !item.available })
        .eq('id', item.id);

      if (!error) {
        setMenuItems(prev =>
          prev.map(i => (i.id === item.id ? { ...i, available: !i.available } : i))
        );
      }
    } catch (err) {
      console.error('Error toggling item:', err);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch =
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone?.includes(searchQuery) ||
      String(order.id).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> جديد</span>;
      case 'preparing':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> قيد التحضير</span>;
      case 'completed':
        return <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> مكتمل</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> ملغي</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dir-rtl" dir="rtl">
      {/* Navbar */}
      <header className="bg-gray-900 text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">لوحة إدارة المطعم</h1>
              <p className="text-xs text-gray-400">إدارة الطلبات والمنيو المباشرة</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'orders' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              الطلبات المباشرة
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'menu' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              إدارة قائمة الطعام
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {activeTab === 'orders' ? (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">إجمالي الطلبات</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">{orders.length}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package className="w-6 h-6" /></div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">طلبات معلقة</p>
                  <h3 className="text-2xl font-bold text-amber-600 mt-1">
                    {orders.filter(o => o.status === 'pending').length}
                  </h3>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-6 h-6" /></div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">طلبات قيد التحضير</p>
                  <h3 className="text-2xl font-bold text-blue-600 mt-1">
                    {orders.filter(o => o.status === 'preparing').length}
                  </h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><RefreshCw className="w-6 h-6" /></div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">إجمالي المبيعات</p>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                    {orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total || o.total_amount || 0), 0)} ج.م
                  </h3>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign className="w-6 h-6" /></div>
              </div>
            </div>

            {/* Filter and Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث برقم الطلب، اسم العميل، أو الهاتف..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                {['all', 'pending', 'preparing', 'completed', 'cancelled'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      statusFilter === st
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st === 'all' && 'الكل'}
                    {st === 'pending' && 'الجديدة'}
                    {st === 'preparing' && 'التحضير'}
                    {st === 'completed' && 'المكتملة'}
                    {st === 'cancelled' && 'الملغاة'}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-gray-50 text-gray-600 border-b">
                    <tr>
                      <th className="p-4">رقم الطلب</th>
                      <th className="p-4">العميل</th>
                      <th className="p-4">الهاتف</th>
                      <th className="p-4">العنوان</th>
                      <th className="p-4">المبلغ</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">التاريخ</th>
                      <th className="p-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-400">
                          لا توجد طلبات مطابقة
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="p-4 font-mono font-bold text-emerald-600">
                            #{String(order.id).slice(0, 8).toUpperCase()}
                          </td>
                          <td className="p-4 font-semibold text-gray-800">{order.customer_name}</td>
                          <td className="p-4 text-gray-600">{order.phone}</td>
                          <td className="p-4 text-gray-600 max-w-xs truncate">{order.address}</td>
                          <td className="p-4 font-bold text-gray-800">
                            {order.total || order.total_amount} ج.م
                          </td>
                          <td className="p-4">{getStatusBadge(order.status)}</td>
                          <td className="p-4 text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                title="عرض التفاصيل"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {order.status === 'pending' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                                  className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                                >
                                  تحضير
                                </button>
                              )}

                              {order.status === 'preparing' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'completed')}
                                  className="px-2.5 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
                                >
                                  إنهاء
                                </button>
                              )}

                              {order.status !== 'cancelled' && order.status !== 'completed' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                  className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                  title="إلغاء الطلب"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Menu Management Tab */
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">قائمة الأصناف</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map(item => (
                <div key={item.id} className="border p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">{item.name}</h4>
                    <p className="text-xs text-gray-500">{item.category}</p>
                    <p className="text-sm font-semibold text-emerald-600 mt-1">{item.price} ج.م</p>
                  </div>
                  <button
                    onClick={() => toggleItemAvailability(item)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.available ? 'متاح' : 'غير متاح'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal - Order Details */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-lg text-gray-800">
                  تفاصيل الطلب #{String(selectedOrder.id).slice(0, 8).toUpperCase()}
                </h3>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>اسم العميل:</strong> {selectedOrder.customer_name}</p>
                <p><strong>رقم الهاتف:</strong> {selectedOrder.phone}</p>
                <p><strong>العنوان:</strong> {selectedOrder.address}</p>
                {selectedOrder.notes && <p><strong>ملاحظات:</strong> {selectedOrder.notes}</p>}
              </div>

              <div className="border-t border-b py-3 space-y-2">
                <h4 className="font-bold text-gray-800 text-xs">الأصناف المطلوبة:</h4>
                {selectedOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{it.name || it.title} x{it.quantity || it.qty}</span>
                    <span className="font-semibold">{it.price * (it.quantity || it.qty || 1)} ج.م</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-gray-800 text-base">
                <span>الإجمالي:</span>
                <span className="text-emerald-600">{selectedOrder.total || selectedOrder.total_amount} ج.م</span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}