"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

interface Order {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  items: { name: string; qty: number; price: number }[];
  delivery_fee: number;
  total: number;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "reports" | "settings">("orders");
  const [loading, setLoading] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState({
    delivery_fee: 30,
    whatsapp: "",
    is_open: true,
    min_order: 50,
  });

  const [newItem, setNewItem] = useState({ name: "", category: "مشويات", price: "" });

  useEffect(() => {
    fetchData();

    // الاستماع اللحظي للطلبات الجديدة (Realtime)
    const channel = supabase
      .channel("realtime-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          setOrders((prevOrders) => [payload.new as Order, ...prevOrders]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchMenu(), fetchOrders(), fetchSettings()]);
    setLoading(false);
  };

  const fetchMenu = async () => {
    const { data } = await supabase.from("menu_items").select("*").order("id", { ascending: true });
    if (data) setMenuItems(data);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
    if (data) setSettings(data);
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;

    const priceNum = parseFloat(newItem.price);
    const { data, error } = await supabase
      .from("menu_items")
      .insert([{ name: newItem.name, category: newItem.category, price: priceNum, available: true }])
      .select();

    if (!error && data) {
      setMenuItems((prev) => [...prev, data[0]]);
      setNewItem({ name: "", category: "مشويات", price: "" });
    }
  };

  const toggleAvailability = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase.from("menu_items").update({ available: !currentStatus }).eq("id", id);
    if (!error) {
      setMenuItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, available: !currentStatus } : item))
      );
    }
  };

  const deleteMenuItem = async (id: number) => {
    if (!confirm("هل أنت تأكد من حذف هذا الصنف من المنيو؟")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (!error) {
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const updateOrderStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    }
  };

  const handleSaveSettings = async () => {
    const { error } = await supabase.from("settings").upsert({ id: 1, ...settings });
    if (!error) alert("تم حفظ الإعدادات بنجاح!");
  };

  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank", "width=600,height=700");
    if (!printWindow) return;

    const itemsHtml = (order.items || [])
      .map(
        (i) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;">${i.qty}</td><td style="padding:8px;border-bottom:1px solid #eee;">${i.price} ج.م</td><td style="padding:8px;border-bottom:1px solid #eee;">${i.qty * i.price} ج.م</td></tr>`
      )
      .join("");

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>فاتورة #${order.id} - Grill & Greens</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; text-align: center; color: #1a2e22; }
            .bill { border: 2px dashed #1a2e22; padding: 24px; border-radius: 12px; max-width: 380px; margin: auto; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; text-align: right; }
            th { border-bottom: 2px solid #1a2e22; padding: 8px; }
            .total { font-weight: bold; font-size: 1.2rem; margin-top: 15px; color: #16a34a; }
          </style>
        </head>
        <body>
          <div class="bill">
            <h2>Grill & Greens</h2>
            <p style="margin-top:-10px; color:#666;">سوهاج - المطبخ المنزلي</p>
            <hr/>
            <p style="text-align:right;"><strong>رقم الطلب:</strong> #${order.id}</p>
            <p style="text-align:right;"><strong>العميل:</strong> ${order.customer_name}</p>
            <p style="text-align:right;"><strong>الهاتف:</strong> ${order.phone}</p>
            <p style="text-align:right;"><strong>العنوان:</strong> ${order.address}</p>
            <table>
              <thead>
                <tr><th>الوجبة</th><th>العدد</th><th>السعر</th><th>الإجمالي</th></tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <hr/>
            <p style="text-align:right;">التوصيل: ${order.delivery_fee} ج.م</p>
            <p class="total">الإجمالي: ${order.total} ج.م</p>
            <p style="font-size:0.85rem; color:#888; margin-top:20px;">شكراً لطلبكم من Grill & Greens!</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const completedOrders = orders.filter((o) => o.status === "completed");
  const totalSales = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row dir-rtl" dir="rtl">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-emerald-950 text-white p-5 flex flex-col justify-between shadow-xl">
        <div>
          <div className="text-center py-4 border-b border-emerald-800 mb-6">
            <h1 className="text-2xl font-extrabold text-emerald-400 tracking-wide">Grill & Greens</h1>
            <p className="text-xs text-emerald-200 mt-1">لوحة التحكم وإدارة المطعم</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full text-right px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-between ${
                activeTab === "orders" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-gray-300 hover:bg-emerald-900"
              }`}
            >
              <span>الطلبات الواردة</span>
              {orders.filter((o) => o.status !== "completed").length > 0 && (
                <span className="bg-amber-400 text-xs text-black px-2 py-0.5 rounded-full font-bold">
                  {orders.filter((o) => o.status !== "completed").length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("menu")}
              className={`w-full text-right px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "menu" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-gray-300 hover:bg-emerald-900"
              }`}
            >
              إدارة المنيو والأسعار
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full text-right px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "reports" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-gray-300 hover:bg-emerald-900"
              }`}
            >
              التقارير والمبيعات
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full text-right px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "settings" ? "bg-emerald-500 text-slate-950 shadow-md" : "text-gray-300 hover:bg-emerald-900"
              }`}
            >
              إعدادات التوصيل
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-emerald-800">
          <button
            onClick={fetchData}
            disabled={loading}
            className="w-full bg-emerald-800 hover:bg-emerald-700 text-emerald-100 py-2.5 px-4 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
          >
            {loading ? "جاري التحديث..." : "تحديث البيانات"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {activeTab === "orders" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">إدارة الطلبات</h2>
              <span className="text-sm bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                إجمالي الطلبات: {orders.length}
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
                لا توجد طلبات واردة حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3">
                        <span className="font-extrabold text-lg text-emerald-900">
  طلب #{String(order.id).slice(-6).toUpperCase()}
</span>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : order.status === "processing"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {order.status === "completed"
                            ? "مكتمل"
                            : order.status === "processing"
                            ? "قيد التجهيز"
                            : "طلب جديد"}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600 mb-4">
                        <p><strong className="text-gray-800">العميل:</strong> {order.customer_name}</p>
                        <p><strong className="text-gray-800">الهاتف:</strong> {order.phone}</p>
                        <p><strong className="text-gray-800">العنوان:</strong> {order.address}</p>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-xl mb-4">
                        <p className="text-xs font-bold text-gray-500 mb-2">الأصناف المطلوبة:</p>
                        <ul className="text-xs space-y-1 text-gray-700">
                          {order.items?.map((item, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span>{item.qty}x {item.name}</span>
                              <span className="font-semibold">{item.price * item.qty} ج.م</span>
                            </li>
                          ))}
                        </ul>
                        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-sm text-emerald-900">
                          <span>الإجمالي:</span>
                          <span>{order.total} ج.م</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <a
                        href={`https://wa.me/2${order.phone}?text=${encodeURIComponent(
                          `مرحباً ${order.customer_name}، جاري تجهيز طلبك رقم #${order.id} من Grill & Greens!`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl text-xs transition"
                      >
                        مراسلة عبر الواتساب
                      </a>

                      <div className="grid grid-cols-3 gap-2">
                        {order.status !== "completed" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "processing")}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold py-1.5 rounded-lg text-xs"
                          >
                            تجهيز
                          </button>
                        )}
                        <button
                          onClick={() => updateOrderStatus(order.id, "completed")}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold py-1.5 rounded-lg text-xs"
                        >
                          تسليم
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(order)}
                          className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold py-1.5 rounded-lg text-xs"
                        >
                          طباعة
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "menu" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">إدارة أصناف المنيو</h2>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">إضافة صنف جديد</h3>
              <form onSubmit={handleAddMenuItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">اسم الصنف</label>
                  <input
                    type="text"
                    placeholder="مثال: كفتة بلدي"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">التصنيف</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="مشويات">مشويات</option>
                    <option value="وجبات">وجبات</option>
                    <option value="طواجن">طواجن</option>
                    <option value="حلويات">حلويات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">السعر (ج.م)</label>
                  <input
                    type="number"
                    placeholder="150"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition"
                  >
                    حفظ في المنيو
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                  <tr>
                    <th className="p-4">الصنف</th>
                    <th className="p-4">التصنيف</th>
                    <th className="p-4">السعر</th>
                    <th className="p-4">التوفر</th>
                    <th className="p-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-gray-800">{item.name}</td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-emerald-700">{item.price} ج.م</td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleAvailability(item.id, item.available)}
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            item.available ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {item.available ? "متوفر" : "غير متوفر"}
                        </button>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => deleteMenuItem(item.id)}
                          className="text-red-600 hover:text-red-800 font-semibold text-xs"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">تقارير المبيعات</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-emerald-200 border-r-4 border-r-emerald-600 shadow-sm">
                <p className="text-sm text-gray-500 font-bold mb-1">إجمالي المبيعات المكتملة</p>
                <p className="text-3xl font-extrabold text-emerald-700">{totalSales} ج.م</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-blue-200 border-r-4 border-r-blue-600 shadow-sm">
                <p className="text-sm text-gray-500 font-bold mb-1">عدد الطلبات المكتملة</p>
                <p className="text-3xl font-extrabold text-blue-700">{completedOrders.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">إعدادات الموقع والتوصيل</h2>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">رسوم التوصيل داخل سوهاج (ج.م)</label>
                <input
                  type="number"
                  value={settings.delivery_fee}
                  onChange={(e) => setSettings({ ...settings, delivery_fee: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">رقم الواتساب لاستقبال الطلبات</label>
                <input
                  type="text"
                  value={settings.whatsapp}
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition"
              >
                حفظ الإعدادات
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}