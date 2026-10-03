"use client";

import React, { useState } from "react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("active-orders");

  return (
    <>
      {/* استدعاء ملفات Bootstrap و FontAwesome */}
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
        .badge-status {
          font-size: 0.85rem;
          padding: 6px 12px;
          border-radius: 20px;
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

      <div class="container-fluid">
        <div class="row">
          {/* القائمة الجانبية (Sidebar) */}
          <div class="col-md-3 col-lg-2 p-3 sidebar">
            <div class="text-center my-3">
              <div class="brand-logo">
                <i class="fa-solid fa-fire text-warning"></i> Grill & Greens
              </div>
              <small class="text-muted">لوحة التحكم والإدارة</small>
            </div>
            <hr class="border-secondary mb-4" />
            <ul class="nav nav-pills flex-column">
              <li class="nav-item">
                <a
                  class={`nav-link ${activeTab === "active-orders" ? "active" : ""}`}
                  onClick={() => setActiveTab("active-orders")}
                >
                  <i class="fa-solid fa-receipt me-2"></i> الفواتير النشطة
                </a>
              </li>
              <li class="nav-item">
                <a
                  class={`nav-link ${activeTab === "sales" ? "active" : ""}`}
                  onClick={() => setActiveTab("sales")}
                >
                  <i class="fa-solid fa-chart-column me-2"></i> سجل المبيعات
                </a>
              </li>
              <li class="nav-item">
                <a
                  class={`nav-link ${activeTab === "customers" ? "active" : ""}`}
                  onClick={() => setActiveTab("customers")}
                >
                  <i class="fa-solid fa-users me-2"></i> دليل العملاء
                </a>
              </li>
              <li class="nav-item">
                <a
                  class={`nav-link ${activeTab === "purchases" ? "active" : ""}`}
                  onClick={() => setActiveTab("purchases")}
                >
                  <i class="fa-solid fa-cart-flatbed me-2"></i> قسم المشتريات
                </a>
              </li>
              <li class="nav-item">
                <a
                  class={`nav-link ${activeTab === "reports" ? "active" : ""}`}
                  onClick={() => setActiveTab("reports")}
                >
                  <i class="fa-solid fa-file-contract me-2"></i> التقارير التفصيلية
                </a>
              </li>
              <li class="nav-item">
                <a
                  class={`nav-link ${activeTab === "settings" ? "active" : ""}`}
                  onClick={() => setActiveTab("settings")}
                >
                  <i class="fa-solid fa-sliders me-2"></i> إعدادات الموقع
                </a>
              </li>
            </ul>
          </div>

          {/* المحتوى الرئيسي */}
          <div class="col-md-9 col-lg-10 p-4">
            {/* 1️⃣ الفواتير النشطة */}
            {activeTab === "active-orders" && (
              <div id="active-orders">
                <div class="d-flex justify-content-between align-items-center mb-4">
                  <h3 class="header-title">
                    <i class="fa-solid fa-bell text-warning me-2"></i> الفواتير والطلبات الحالية
                  </h3>
                  <span class="badge bg-danger fs-6">3 طلبات جديدة</span>
                </div>

                <div class="row g-3">
                  <div class="col-md-6 col-lg-4">
                    <div class="card card-custom p-3 border-start border-4 border-warning">
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="fw-bold mb-0">طلب #1052</h5>
                        <span class="badge bg-warning text-dark badge-status">
                          قيد الانتظار
                        </span>
                      </div>
                      <p class="mb-1">
                        <strong>العميل:</strong> أحمد محمود
                      </p>
                      <p class="mb-1">
                        <strong>الهاتف:</strong> 01012345678
                      </p>
                      <p class="mb-2">
                        <strong>العنوان:</strong> سوهاج - شارع المحطة
                      </p>
                      <hr />
                      <h6 class="fw-bold">تفاصيل الأصناف:</h6>
                      <ul class="ps-3 mb-2 small">
                        <li>1x كفتة بلدي مشوية (220 ج.م)</li>
                        <li>2x مكرونة بالبشاميل (160 ج.م)</li>
                        <li>1x بانيه مقرمش (120 ج.م)</li>
                      </ul>
                      <p class="fw-bold text-success mb-3 fs-5">
                        الإجمالي: 530 ج.م{" "}
                        <small class="text-muted fs-6">
                          (شامل 30 ج.م خدمة توصيل)
                        </small>
                      </p>

                      <div class="d-grid gap-2">
                        <a
                          href="https://wa.me/201012345678?text=مرحباً%20أحمد،%20تم%20استلام%20طلبك%20في%20Grill%20%26%20Greens%20وجاري%20تجهيزه%20الآن!%20🔥"
                          target="_blank"
                          rel="noreferrer"
                          class="btn whatsapp-btn btn-sm"
                        >
                          <i class="fa-brands fa-whatsapp me-1"></i> إرسال رسالة تأكيد بالواتساب
                        </a>
                        <div class="btn-group">
                          <button class="btn btn-outline-primary btn-sm">
                            تجهيز 🍳
                          </button>
                          <button class="btn btn-success btn-sm">
                            <i class="fa-solid fa-check"></i> تم التسليم (نقل للمبيعات)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2️⃣ سجل المبيعات */}
            {activeTab === "sales" && (
              <div id="sales">
                <h3 class="header-title mb-4">
                  <i class="fa-solid fa-circle-check text-success me-2"></i> سجل المبيعات والفواتير المستلمة
                </h3>
                <div class="card card-custom p-3">
                  <div class="table-responsive">
                    <table class="table table-hover align-middle">
                      <thead class="table-dark">
                        <tr>
                          <th>رقم الفاتورة</th>
                          <th>اسم العميل</th>
                          <th>تاريخ وتوقيت الطلب</th>
                          <th>تفاصيل الوجبات</th>
                          <th>الإجمالي</th>
                          <th>الحالة</th>
                          <th>إجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>#1051</td>
                          <td>شيماء محمد</td>
                          <td>2026-10-03 | 02:30 م</td>
                          <td>كفتة بلدي + مكرونة بشاميل</td>
                          <td>380 ج.م</td>
                          <td>
                            <span class="badge bg-success">مكتمل ومستلم</span>
                          </td>
                          <td>
                            <button class="btn btn-sm btn-outline-dark">
                              <i class="fa-solid fa-print"></i> طباعة الفاتورة
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3️⃣ دليل العملاء */}
            {activeTab === "customers" && (
              <div id="customers">
                <h3 class="header-title mb-4">
                  <i class="fa-solid fa-address-book text-info me-2"></i> سجل العملاء والطلبات السابقة
                </h3>
                <div class="card card-custom p-3 mb-4">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <input
                        type="text"
                        class="form-control"
                        placeholder="🔍 بحث باسم العميل أو رقم التليفون..."
                      />
                    </div>
                  </div>
                </div>
                <div class="card card-custom p-3">
                  <table class="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>اسم العميل</th>
                        <th>رقم الهاتف</th>
                        <th>العنوان</th>
                        <th>عدد الطلبات</th>
                        <th>إجمالي المبيعات</th>
                        <th>خيارات</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>أحمد محمود</td>
                        <td>01012345678</td>
                        <td>سوهاج - شارع المحطة</td>
                        <td>4 طلبات</td>
                        <td>1,420 ج.م</td>
                        <td>
                          <button class="btn btn-sm btn-primary">
                            <i class="fa-solid fa-clock-rotate-left"></i> عرض سجله
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4️⃣ المشتريات */}
            {activeTab === "purchases" && (
              <div id="purchases">
                <div class="d-flex justify-content-between align-items-center mb-4">
                  <h3 class="header-title">
                    <i class="fa-solid fa-boxes-stacked text-primary me-2"></i> حركة المشتريات والمستلزمات
                  </h3>
                  <button class="btn btn-success">
                    <i class="fa-solid fa-plus me-1"></i> تسجيل فاتورة شراء جديدة
                  </button>
                </div>
                <div class="card card-custom p-3">
                  <table class="table table-striped align-middle">
                    <thead>
                      <tr>
                        <th>اسم الصنف</th>
                        <th>الكمية الإجمالية</th>
                        <th>آخر سعر شراء</th>
                        <th>إجمالي المصروفات</th>
                        <th>تاريخ التحديث</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>لحوم بلدي طازجة (كفتة)</td>
                        <td>30 كجم</td>
                        <td>380 ج.م / كجم</td>
                        <td>11,400 ج.م</td>
                        <td>2026-10-02</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5️⃣ التقارير */}
            {activeTab === "reports" && (
              <div id="reports">
                <h3 class="header-title mb-4">
                  <i class="fa-solid fa-chart-line text-danger me-2"></i> استخراج التقارير والتحليلات
                </h3>
                <div class="card card-custom p-4">
                  <form class="row g-3 align-items-end">
                    <div class="col-md-3">
                      <label class="form-label fw-bold">من تاريخ:</label>
                      <input type="date" class="form-control" />
                    </div>
                    <div class="col-md-3">
                      <label class="form-label fw-bold">إلى تاريخ:</label>
                      <input type="date" class="form-control" />
                    </div>
                    <div class="col-md-3">
                      <label class="form-label fw-bold">نوع التقرير:</label>
                      <select class="form-select">
                        <option>تقرير المبيعات التفصيلي</option>
                        <option>تقرير المشتريات والمصروفات</option>
                        <option>تقرير عميل محدد</option>
                        <option>تقرير الأرباح والصافي</option>
                      </select>
                    </div>
                    <div class="col-md-3">
                      <button type="button" class="btn btn-danger w-100">
                        <i class="fa-solid fa-file-pdf me-1"></i> استخراج التقرير
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 6️⃣ الإعدادات */}
            {activeTab === "settings" && (
              <div id="settings">
                <h3 class="header-title mb-4">
                  <i class="fa-solid fa-gear text-secondary me-2"></i> إعدادات الموقع والمنيو
                </h3>
                <div class="card card-custom p-4">
                  <h5 class="fw-bold mb-3">التحكم في رسوم التوصيل والمنيو</h5>
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label fw-bold">خدمة التوصيل (سوهاج):</label>
                      <input type="number" class="form-control" defaultValue={30} />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label fw-bold">رقم الواتساب لاستلام الإشعارات:</label>
                      <input type="text" class="form-control" defaultValue="010xxxxxxx" />
                    </div>
                    <div class="col-12 mt-4">
                      <button class="btn btn-primary px-4">
                        <i class="fa-solid fa-floppy-disk me-1"></i> حفظ كافة الإعدادات
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