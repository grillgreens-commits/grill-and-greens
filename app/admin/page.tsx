"use client";

import React, { useState } from "react";

// واجهات البيانات
interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  items: OrderItem[];
  deliveryFee: number;
  total: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  date: string;
}

interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("active-orders");

  // حالة الإعدادات
  const [settings, setSettings] = useState({
    deliveryFee: 30,
    whatsapp: "01012345678",
    isOpen: true,
    minOrder: 50,
  });

  // قائمة أصناف المنيو
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: 1, name: "كفتة بلدي مشوية", category: "مشويات", price: 220, available: true },
    { id: 2, name: "مكرونة بالبشاميل", category: "طواجن", price: 80, available: true },
    { id: 3, name: "بانيه مقرمش", category: "وجبات", price: 120, available: true },
  ]);

  const [newItem, setNewItem] = useState({ name: "", category: "مشويات", price: 0 });

  // قائمة الطلبات النشطة والسابقة
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "1052",
      customerName: "أحمد محمود",
      phone: "01012345678",
      address: "سوهاج - شارع المحطة",
      items: [
        { name: "كفتة بلدي مشوية", qty: 1, price: 220 },
        { name: "مكرونة بالبشاميل", qty: 2, price: 80 },
        { name: "بانيه مقرمش", qty: 1, price: 120 },
      ],
      deliveryFee: 30,
      total: 510,
      status: "pending",
      date: "2026-10-03 16:15",
    },
    {
      id: "1051",
      customerName: "شيماء محمد",
      phone: "01198765432",
      address: "سوهاج - الثقافة",
      items: [
        { name: "كفتة بلدي مشوية", qty: 1, price: 220 },
        { name: "مكرونة بالبشاميل", qty: 1, price: 80 },
      ],
      deliveryFee: 30,
      total: 330,
      status: "completed",
      date: "2026-10-03 14:30",
    },
  ]);

  // إحصائيات التقارير
  const totalSales = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.total, 0);

  // تحديث حالة الطلب
  const updateOrderStatus = (id: string, newStatus: Order["status"]) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === id ? { ...ord, status: newStatus } : ord))
    );
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
          <title>فاتورة طلب #${order.id} - Grill & Greens</title>
          <style>
            body { font-family: sans-serif; padding: 20px; text-align: center; }
            .bill { border: 1px solid #ccc; padding: 20px; border-radius: 8px; max-width: 400px; margin: auto; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: right; }
            .total { font-weight: bold; font-size: 1.2rem; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="bill">
            <h2>🔥 Grill & Greens</h2>
            <p>سوهاج - طلبات المطبخ المنزلي</p>
            <hr/>
            <p><strong>رقم الفاتورة:</strong> #${order.id}</p>
            <p><strong>العميل:</strong> ${order.customerName} (${order.phone})</p>
            <p><strong>العنوان:</strong> ${order.address}</p>
            <p><strong>التاريخ:</strong> ${order.date}</p>
            <table>
              <thead>
                <tr><th>الصنف</th><th>العدد</th><th>السعر</th><th>الإجمالي</th></tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <hr/>
            <p>خدمة التوصيل: ${order.deliveryFee} ج.م</p>
            <p class="total">الإجمالي الكلي: ${order.total} ج.م</p>
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

  // إضافة صنف جديد للمنيو
  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || newItem.price <= 0) return;
    setMenuItems((prev) => [
      ...prev,
      { id: Date.now(), ...newItem, available: true },
    ]);
    setNewItem({ name: "", category: "مشويات", price: 0 });
  };

  // تبديل توفر الصنف
  const toggleItemAvailability = (id: number) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, available: !item.available } : item
      )
    );
  };

  // حذف صنف من المنيو
  const deleteMenuItem = (id: number) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

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
          background-color: #f8f9fa;
        }
        .sidebar {
          min-height: 100vh;
          background-color: #1a2e22;
          color: #fff;
        }
        .brand-logo {
          color: #2ecc71;
          font-weight: 800;
          font-size: 1.4rem;
        }
        .sidebar .nav-link {
          color: #cbd5e1;
          font-size: 1rem;
          padding: 12px 18px;
          border-radius: 8px;
          margin-bottom: 6px;
          transition: all 0.2s;
          cursor: pointer;
        }
        .sidebar .nav-link:hover,
        .sidebar .nav-link.active {
          background-color: #2ecc71;
          color: #000;
          font-weight: 700;
        }
        .card-custom {
          border: none;
          border-radius: 14px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }
        .whatsapp-btn {
          background-color: #25d366;
          color: white;
          border: none;
          font-weight: 600;
        }
        .whatsapp-btn:hover {
          background-color: #1da851;
          color: white;
        }
        .header-title {
          color: #1a2e22;
          font-weight: 800;
        }
      `}</style>

      <div className="container-fluid">
        <div className="row">
          {/* القائمة الجانبية */}
          <div className="col-md-3 col-lg-2 p-3 sidebar">
            <div className="text-center my-3">
              <div className="brand-logo">
                <i className="fa-solid fa-fire text-warning"></i> Grill & Greens
              </div>
              <small className="text-muted">لوحة التحكم والتنفيذ</small>
            </div>
            <hr className="border-secondary mb-4" />
            <ul className="nav nav-pills flex-column">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link w-100 text-start ${activeTab === "active-orders" ? "active" : ""}`}
                  onClick={() => setActiveTab("active-orders")}
                >
                  <i className="fa-solid fa-receipt me-2"></i> الطلبات الحالية
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link w-100 text-start ${activeTab === "menu-control" ? "active" : ""}`}
                  onClick={() => setActiveTab("menu-control")}
                >
                  <i className="fa-solid fa-utensils me-2"></i> إدارة المنيو
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link w-100 text-start ${activeTab === "sales" ? "active" : ""}`}
                  onClick={() => setActiveTab("sales")}
                >
                  <i className="fa-solid fa-chart-column me-2"></i> سجل المبيعات
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link w-100 text-start ${activeTab === "reports" ? "active" : ""}`}
                  onClick={() => setActiveTab("reports")}
                >
                  <i className="fa-solid fa-file-contract me-2"></i> التقارير والتحليلات
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link w-100 text-start ${activeTab === "settings" ? "active" : ""}`}
                  onClick={() => setActiveTab("settings")}
                >
                  <i className="fa-solid fa-sliders me-2"></i> الإعدادات الشاملة
                </button>
              </li>
            </ul>
          </div>

          {/* المحتوى الرئيسي */}
          <div className="col-md-9 col-lg-10 p-4">
            {/* 1️⃣ الطلبات الحالية */}
            {activeTab === "active-orders" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="header-title">
                    <i className="fa-solid fa-bell text-warning me-2"></i> إدارة الطلبات النشطة
                  </h3>
                  <span className="badge bg-danger fs-6">
                    {orders.filter((o) => o.status !== "completed").length} طلبات جارية
                  </span>
                </div>

                <div className="row g-3">
                  {orders
                    .filter((o) => o.status !== "completed")
                    .map((order) => (
                      <div className="col-md-6 col-lg-4" key={order.id}>
                        <div className="card card-custom p-3 border-start border-4 border-warning">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="fw-bold mb-0">طلب #{order.id}</h5>
                            <span
                              className={`badge ${
                                order.status === "pending"
                                  ? "bg-warning text-dark"
                                  : "bg-info text-white"
                              }`}
                            >
                              {order.status === "pending" ? "جديد" : "قيد التجهيز"}
                            </span>
                          </div>
                          <p className="mb-1">
                            <strong>العميل:</strong> {order.customerName}
                          </p>
                          <p className="mb-1">
                            <strong>الهاتف:</strong> {order.phone}
                          </p>
                          <p className="mb-2">
                            <strong>العنوان:</strong> {order.address}
                          </p>
                          <hr />
                          <h6 className="fw-bold">الأصناف المطلوبة:</h6>
                          <ul className="ps-3 mb-2 small">
                            {order.items.map((item, idx) => (
                              <li key={idx}>
                                {item.qty}x {item.name} ({item.price * item.qty} ج.م)
                              </li>
                            ))}
                          </ul>
                          <p className="fw-bold text-success mb-3 fs-5">
                            الإجمالي: {order.total} ج.م{" "}
                            <small className="text-muted fs-6">
                              (شامل {order.deliveryFee} ج.م توصيل)
                            </small>
                          </p>

                          <div className="d-grid gap-2">
                            <a
                              href={`https://wa.me/2${order.phone}?text=${encodeURIComponent(
                                `مرحباً ${order.customerName}، تم استلام طلبك رقم #${order.id} في Grill & Greens وجاري تجهيزه الآن! 🔥`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn whatsapp-btn btn-sm text-center"
                            >
                              <i className="fa-brands fa-whatsapp me-1"></i> مراسلة العميل واتساب
                            </a>
                            <div className="btn-group">
                              {order.status === "pending" && (
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => updateOrderStatus(order.id, "processing")}
                                >
                                  تجهيز 🍳
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() => updateOrderStatus(order.id, "completed")}
                              >
                                <i className="fa-solid fa-check"></i> اكتمال وتسليم
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-dark btn-sm"
                                onClick={() => handlePrintInvoice(order)}
                              >
                                <i className="fa-solid fa-print"></i> طباعة
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 2️⃣ إدارة المنيو */}
            {activeTab === "menu-control" && (
              <div>
                <h3 className="header-title mb-4">
                  <i className="fa-solid fa-utensils text-success me-2"></i> التحكم في الأصناف والأسعار (المنيو)
                </h3>

                {/* نموذج إضافة صنف */}
                <div className="card card-custom p-4 mb-4">
                  <h5 className="fw-bold mb-3">إضافة صنف جديد للمنيو</h5>
                  <form onSubmit={handleAddMenuItem} className="row g-3 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">اسم الوجبة/الصنف:</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="مثال: طاجن مكرونة بالبشاميل"
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
                        <i className="fa-solid fa-plus me-1"></i> إضافة
                      </button>
                    </div>
                  </form>
                </div>

                {/* جدول المنيو الحالي */}
                <div className="card card-custom p-3">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>الصنف</th>
                        <th>التصنيف</th>
                        <th>السعر</th>
                        <th>التوفر في المنيو</th>
                        <th>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map((item) => (
                        <tr key={item.id}>
                          <td className="fw-bold">{item.name}</td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {item.category}
                            </span>
                          </td>
                          <td>{item.price} ج.م</td>
                          <td>
                            <button
                              type="button"
                              className={`btn btn-sm ${
                                item.available ? "btn-success" : "btn-secondary"
                              }`}
                              onClick={() => toggleItemAvailability(item.id)}
                            >
                              {item.available ? "متاح للطلب" : "غير متوفر اليوم"}
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

            {/* 3️⃣ سجل المبيعات */}
            {activeTab === "sales" && (
              <div>
                <h3 className="header-title mb-4">
                  <i className="fa-solid fa-circle-check text-success me-2"></i> سجل الطلبات المكتملة
                </h3>
                <div className="card card-custom p-3">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-dark">
                        <tr>
                          <th>رقم الفاتورة</th>
                          <th>اسم العميل</th>
                          <th>رقم التليفون</th>
                          <th>التاريخ</th>
                          <th>الإجمالي</th>
                          <th>إجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders
                          .filter((o) => o.status === "completed")
                          .map((order) => (
                            <tr key={order.id}>
                              <td>#{order.id}</td>
                              <td>{order.customerName}</td>
                              <td>{order.phone}</td>
                              <td>{order.date}</td>
                              <td className="fw-bold text-success">{order.total} ج.م</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-dark"
                                  onClick={() => handlePrintInvoice(order)}
                                >
                                  <i className="fa-solid fa-print me-1"></i> طباعة الفاتورة
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4️⃣ التقارير */}
            {activeTab === "reports" && (
              <div>
                <h3 className="header-title mb-4">
                  <i className="fa-solid fa-chart-line text-danger me-2"></i> ملخص الإحصائيات المالي
                </h3>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div className="card card-custom p-3 bg-white border-start border-4 border-success">
                      <h6>إجمالي المبيعات المكتملة</h6>
                      <h3 className="text-success fw-bold mb-0">{totalSales} ج.م</h3>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card card-custom p-3 bg-white border-start border-4 border-primary">
                      <h6>إجمالي عدد الطلبات</h6>
                      <h3 className="text-primary fw-bold mb-0">{orders.length} طلبات</h3>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card card-custom p-3 bg-white border-start border-4 border-info">
                      <h6>متوسط قيمة الطلب</h6>
                      <h3 className="text-info fw-bold mb-0">
                        {orders.length ? Math.round(totalSales / orders.length) : 0} ج.م
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5️⃣ الإعدادات الشاملة */}
            {activeTab === "settings" && (
              <div>
                <h3 className="header-title mb-4">
                  <i className="fa-solid fa-gear text-secondary me-2"></i> إعدادات المطعم التشغيلية
                </h3>
                <div className="card card-custom p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">رسوم التوصيل داخل سوهاج (ج.م):</label>
                      <input
                        type="number"
                        className="form-control"
                        value={settings.deliveryFee}
                        onChange={(e) =>
                          setSettings({ ...settings, deliveryFee: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">رقم الواتساب لاستقبال الطلبات:</label>
                      <input
                        type="text"
                        className="form-control"
                        value={settings.whatsapp}
                        onChange={(e) =>
                          setSettings({ ...settings, whatsapp: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">الحد الأدنى للطلب (ج.م):</label>
                      <input
                        type="number"
                        className="form-control"
                        value={settings.minOrder}
                        onChange={(e) =>
                          setSettings({ ...settings, minOrder: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">حالة المطبخ لاستقبال الطلبات:</label>
                      <select
                        className="form-select"
                        value={settings.isOpen ? "open" : "closed"}
                        onChange={(e) =>
                          setSettings({ ...settings, isOpen: e.target.value === "open" })
                        }
                      >
                        <option value="open">مفتوح (يستقبل طلبات)</option>
                        <option value="closed">مغلق مؤقتاً</option>
                      </select>
                    </div>
                    <div className="col-12 mt-4">
                      <button
                        type="button"
                        className="btn btn-primary px-4"
                        onClick={() => alert("تم حفظ الإعدادات بنجاح!")}
                      >
                        <i className="fa-solid fa-floppy-disk me-1"></i> حفظ الإعدادات
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