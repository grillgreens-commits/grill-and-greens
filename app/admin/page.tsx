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
  const [activeTab, setActiveTab] = useState("orders");
  const [loading, setLoading] = useState(false);

  // States للبيانات الحقيقية
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState({
    delivery_fee: 30,
    whatsapp: "",
    is_open: true,
    min_order: 50,
  });

  // إضافة صنف جديد
  const [newItem, setNewItem] = useState({ name: "", category: "مشويات", price: 0 });

  // جلب البيانات عند تحكم الصفحة
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchMenu(), fetchOrders(), fetchSettings()]);
    setLoading(false);
  };

  // 1. جلب المنيو من Supabase
  const fetchMenu = async () => {
    const { data, error } = await supabase.from("menu_items").select("*").order("id", { ascending: true });
    if (!error && data) setMenuItems(data);
  };

  // 2. جلب الطلبات من Supabase
  const fetchOrders = async () => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (!error && data) setOrders(data);
  };

  // 3. جلب الإعدادات من Supabase
  const fetchSettings = async () => {
    const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
    if (!error && data) {
      setSettings(data);
    }
  };

  // إضافة صنف للمنيو في Supabase
  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || newItem.price <= 0) return;

    const { data, error } = await supabase.from("menu_items").insert([
      { name: newItem.name, category: newItem.category, price: newItem.price, available: true }
    ]).select();

    if (!error && data) {
      setMenuItems((prev) => [...prev, data[0]]);
      setNewItem({ name: "", category: "مشويات", price: 0 });
    }
  };

  // تغيير توفر الصنف في Supabase
  const toggleAvailability = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from("menu_items")
      .update({ available: !currentStatus })
      .eq("id", id);

    if (!error) {
      setMenuItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, available: !currentStatus } : item))
      );
    }
  };

  // حذف صنف من Supabase
  const deleteMenuItem = async (id: number) => {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (!error) {
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // تحديث حالة الطلب في Supabase
  const updateOrderStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
    }
  };

  // حفظ الإعدادات في Supabase
  const handleSaveSettings = async () => {
    const { error } = await supabase
      .from("settings")
      .upsert({ id: 1, ...settings });

    if (!error) {
      alert("تم حفظ الإعدادات بنجاح في قاعدة البيانات!");
    }
  };

  // طباعة الفاتورة
  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank", "width=600,height=700");
    if (!printWindow) return;

    const itemsHtml = order.items
      .map(
        (i) =>
          `<tr><td>${i.name}</td><td>${i.qty}</td><td>${i.price} ج.م</td><td>${
            i.qty * i.price
          } ج.م</td></tr>`
      )
      .join("");

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>فاتورة #${order.id} - Grill & Greens</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; text-align: center; }
            .bill { border: 2px dashed #1a2e22; padding: 20px; border-radius: 12px; max-width: 380px; margin: auto; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border-bottom: 1px solid #eee; padding: 8px; text-align: right; }
            .total { font-weight: bold; font-size: 1.3rem; margin-top: 15px; color: #1a2e22; }
          </style>
        </head>
        <body>
          <div class="bill">
            <h2>🔥 Grill & Greens</h2>
            <p>سوهاج - طلبات المطبخ المنزلي</p>
            <hr/>
            <p><strong>رقم الطلب:</strong> #${order.id}</p>
            <p><strong>العميل:</strong> ${order.customer_name} (${order.phone})</p>
            <p><strong>العنوان:</strong> ${order.address}</p>
            <p><strong>التاريخ:</strong> ${new Date(order.created_at).toLocaleString("ar-EG")}</p>
            <table>
              <thead>
                <tr><th>الوجبة</th><th>العدد</th><th>السعر</th><th>الإجمالي</th></tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <hr/>
            <p>خدمة التوصيل: ${order.delivery_fee} ج.م</p>
            <p class="total">المبلغ الإجمالي: ${order.total} ج.م</p>
            <p>شكراً لطلبكم من Grill & Greens!</p>
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
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />

      <style jsx global>{`
        body {
          font-family: 'Cairo', sans-serif;
          background-color: #f3f4f6;
        }
        .sidebar {
          min-height: 100vh;
          background: linear-gradient(180deg, #1a2e22 0%, #0d1812 100%);
          color: #fff;
          box-shadow: 4px 0 15px rgba(0,0,0,0.05);
        }
        .brand-logo {
          color: #2ecc71;
          font-weight: 800;
          font-size: 1.5rem;
        }
        .sidebar .nav-link {
          color: #94a3b8;
          font-size: 0.95rem;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 8px;
          transition: all 0.2s ease;
          border: none;
        }
        .sidebar .nav-link:hover {
          color: #fff;
          background-color: rgba(255, 255, 255, 0.05);
        }
        .sidebar .nav-link.active {
          background-color: #2ecc71;
          color: #000;
          font-weight: 700;
        }
        .card-custom {
          border: none;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }
        .header-title {
          color: #1a2e22;
          font-weight: 800;
        }
      `}</style>

      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3 col-lg-2 p-3 sidebar">
            <div className="text-center my-3">
              <div className="brand-logo">
                <i className="fa-solid fa-fire text-warning me-1"></i> Grill & Greens
              </div>
              <small className="text-muted">الإدارة المباشرة</small>
            </div>
            <hr className="border-secondary mb-4" />
            <ul className="nav nav-pills flex-column">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link w-100 text-start ${activeTab === "orders" ? "active" : ""}`}
                  onClick={() => setActiveTab("orders")}
                >
                  <i className="fa-solid fa-receipt me-2"></i> الطلبات الواردة
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link w-100 text-start ${activeTab === "menu" ? "active" : ""}`}
                  onClick={() => setActiveTab("menu")}
                >
                  <i className="fa-solid fa-utensils me-2"></i> المنيو والأسعار
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link w-100 text-start ${activeTab === "reports" ? "active" : ""}`}
                  onClick={() => setActiveTab("reports")}
                >
                  <i className="fa-solid fa-chart-line me-2"></i> التقارير والمبيعات
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link w-100 text-start ${activeTab === "settings" ? "active" : ""}`}
                  onClick={() => setActiveTab("settings")}
                >
                  <i className="fa-solid fa-gear me-2"></i> الإعدادات
                </button>
              </li>
            </ul>

            <div className="mt-auto pt-4 text-center">
              <button
                className="btn btn-outline-light btn-sm w-100"
                onClick={fetchData}
              >
                <i className={`fa-solid fa-rotate me-1 ${loading ? "fa-spin" : ""}`}></i> تحديث البيانات
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-9 col-lg-10 p-4">
            {/* 1. الطلبات */}
            {activeTab === "orders" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="header-title">
                    <i className="fa-solid fa-bell text-warning me-2"></i> إدارة الطلبات الفعالة
                  </h3>
                  <button className="btn btn-sm btn-outline-secondary" onClick={fetchOrders}>
                    إعادة تحميل
                  </button>
                </div>

                <div className="row g-3">
                  {orders.length === 0 ? (
                    <div className="col-12">
                      <div className="card card-custom p-5 text-center text-muted">
                        لا توجد طلبات مسجلة حالياً
                      </div>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div className="col-md-6 col-lg-4" key={order.id}>
                        <div className="card card-custom p-3 border-start border-4 border-warning">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="fw-bold mb-0">طلب #{order.id}</h5>
                            <span
                              className={`badge ${
                                order.status === "completed"
                                  ? "bg-success"
                                  : order.status === "processing"
                                  ? "bg-info text-white"
                                  : "bg-warning text-dark"
                              }`}
                            >
                              {order.status === "completed"
                                ? "مكتمل"
                                : order.status === "processing"
                                ? "قيد التجهيز"
                                : "جديد"}
                            </span>
                          </div>
                          <p className="mb-1"><strong>العميل:</strong> {order.customer_name}</p>
                          <p className="mb-1"><strong>الهاتف:</strong> {order.phone}</p>
                          <p className="mb-2"><strong>العنوان:</strong> {order.address}</p>
                          <hr />
                          <h6 className="fw-bold">الأصناف:</h6>
                          <ul className="ps-3 mb-2 small">
                            {order.items?.map((item, idx) => (
                              <li key={idx}>
                                {item.qty}x {item.name} ({item.price * item.qty} ج.م)
                              </li>
                            ))}
                          </ul>
                          <p className="fw-bold text-success mb-3 fs-5">
                            الإجمالي: {order.total} ج.م
                          </p>

                          <div className="d-grid gap-2">
                            <a
                              href={`https://wa.me/2${order.phone}?text=${encodeURIComponent(
                                `مرحباً ${order.customer_name}، جاري تجهيز طلبك رقم #${order.id} في Grill & Greens! 🔥`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-success btn-sm text-center"
                            >
                              <i className="fa-brands fa-whatsapp me-1"></i> واتساب
                            </a>
                            <div className="btn-group">
                              {order.status !== "completed" && (
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => updateOrderStatus(order.id, "processing")}
                                >
                                  تجهيز
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() => updateOrderStatus(order.id, "completed")}
                              >
                                تسليم
                              </button>
                              <button
                                type="button"
                                className="btn btn-dark btn-sm"
                                onClick={() => handlePrintInvoice(order)}
                              >
                                طباعة
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 2. المنيو والأسعار (مربوط بقاعدة البيانات) */}
            {activeTab === "menu" && (
              <div>
                <h3 className="header-title mb-4">
                  <i className="fa-solid fa-utensils text-success me-2"></i> التحكم في أصناف المنيو
                </h3>

                {/* نموذج إضافة صنف */}
                <div className="card card-custom p-4 mb-4">
                  <h5 className="fw-bold mb-3">إضافة وجبة أو صنف جديد</h5>
                  <form onSubmit={handleAddMenuItem} className="row g-3 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">اسم الصنف:</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="مثال: كفتة بلدي مشوية"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">التصنيف:</label>
                      <select
                        className="form-select"
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      >
                        <option value="مشويات">مشويات</option>
                        <option value="وجبات">وجبات</option>
                        <option value="طواجن">طواجن</option>
                        <option value="حلويات">حلويات</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold">السعر (ج.م):</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="100"
                        value={newItem.price || ""}
                        onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="col-md-2">
                      <button type="submit" className="btn btn-success w-100">
                        حفظ الصنف
                      </button>
                    </div>
                  </form>
                </div>

                {/* جدول المنيو */}
                <div className="card card-custom p-3">
                  <table className="table table-hover align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>الصنف</th>
                        <th>التصنيف</th>
                        <th>السعر</th>
                        <th>الحالة في الموقع</th>
                        <th>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map((item) => (
                        <tr key={item.id}>
                          <td className="fw-bold">{item.name}</td>
                          <td><span className="badge bg-light text-dark border">{item.category}</span></td>
                          <td>{item.price} ج.م</td>
                          <td>
                            <button
                              type="button"
                              className={`btn btn-sm ${item.available ? "btn-success" : "btn-secondary"}`}
                              onClick={() => toggleAvailability(item.id, item.available)}
                            >
                              {item.available ? "متوفر" : "غير متوفر"}
                            </button>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteMenuItem(item.id)}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. التقارير */}
            {activeTab === "reports" && (
              <div>
                <h3 className="header-title mb-4">
                  <i className="fa-solid fa-chart-line text-danger me-2"></i> التقارير والتحليلات
                </h3>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="card card-custom p-3 border-start border-4 border-success">
                      <h6>إجمالي المبيعات المكتملة</h6>
                      <h3 className="text-success fw-bold mb-0">{totalSales} ج.م</h3>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card card-custom p-3 border-start border-4 border-primary">
                      <h6>إجمالي الطلبات</h6>
                      <h3 className="text-primary fw-bold mb-0">{orders.length}</h3>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. الإعدادات */}
            {activeTab === "settings" && (
              <div>
                <h3 className="header-title mb-4">
                  <i className="fa-solid fa-gear text-secondary me-2"></i> الإعدادات العامة
                </h3>
                <div className="card card-custom p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">خدمة التوصيل (سوهاج):</label>
                      <input
                        type="number"
                        className="form-control"
                        value={settings.delivery_fee}
                        onChange={(e) => setSettings({ ...settings, delivery_fee: Number(e.target.value) })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">رقم الواتساب:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={settings.whatsapp}
                        onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                      />
                    </div>
                    <div className="col-12 mt-4">
                      <button
                        type="button"
                        className="btn btn-primary px-4"
                        onClick={handleSaveSettings}
                      >
                        حفظ الإعدادات في Supabase
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}