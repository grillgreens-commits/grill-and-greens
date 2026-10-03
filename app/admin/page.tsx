"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Order {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  const updateStatus = async (id: number, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    fetchOrders();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 dir-rtl" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-emerald-950">لوحة تحكم الطلبات - Grill & Greens</h1>
          <button onClick={fetchOrders} className="bg-emerald-600 text-white text-xs px-4 py-2 rounded-xl font-bold">
            تحديث الطلبات 🔄
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-gray-500 border">لا توجد طلبات بعد.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-emerald-900">طلب #{order.id}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                    {order.status === "completed" ? "مكتمل" : "جديد"}
                  </span>
                </div>
                <p className="text-xs"><strong>العميل:</strong> {order.customer_name}</p>
                <p className="text-xs"><strong>الهاتف:</strong> {order.phone}</p>
                <p className="text-xs"><strong>العنوان:</strong> {order.address}</p>
                <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1">
                  <p className="font-bold mb-1">الوجبات:</p>
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.qty}x {item.name}</span>
                      <span>{item.price * item.qty} ج.م</span>
                    </div>
                  ))}
                  <div className="border-t pt-1 font-bold flex justify-between text-emerald-800">
                    <span>الإجمالي:</span>
                    <span>{order.total} ج.م</span>
                  </div>
                </div>
                <button
                  onClick={() => updateStatus(order.id, "completed")}
                  className="w-full bg-emerald-50 text-emerald-700 font-bold text-xs py-2 rounded-xl"
                >
                  تعليم كـ "تم التسليم"
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}