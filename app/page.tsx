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

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

export default function ClientPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(30);
  const [loading, setLoading] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    fetchMenuAndSettings();
  }, []);

  const fetchMenuAndSettings = async () => {
    const { data: menuData } = await supabase.from("menu_items").select("*").eq("available", true);
    if (menuData) setMenuItems(menuData);

    const { data: settingsData } = await supabase.from("settings").select("delivery_fee").eq("id", 1).single();
    if (settingsData) setDeliveryFee(settingsData.delivery_fee);
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const itemsTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const finalTotal = itemsTotal + (cart.length > 0 ? deliveryFee : 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert("سلة الطلبات فارغة!");

    setLoading(true);

    const { error } = await supabase.from("orders").insert([
      {
        customer_name: customerName,
        phone: phone,
        address: address,
        items: cart,
        delivery_fee: deliveryFee,
        total: finalTotal,
        status: "pending",
      },
    ]);

    setLoading(false);

    if (error) {
      alert("حدث خطأ أثناء إرسال الطلب: " + error.message);
    } else {
      alert("تم إرسال طلبك بنجاح! سينزل في صفحة الأدمن فوراً.");
      setCart([]);
      setCustomerName("");
      setPhone("");
      setAddress("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 dir-rtl" dir="rtl">
      <header className="max-w-4xl mx-auto text-center mb-8">
        <h1 className="text-3xl font-extrabold text-emerald-950">Grill & Greens</h1>
        <p className="text-emerald-700 text-sm mt-1">المطبخ المنزلي في سوهاج</p>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">قائمة الطعام</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800">{item.name}</h3>
                  <p className="text-emerald-700 font-bold text-sm">{item.price} ج.م</p>
                </div>
                <button
                  onClick={() => addToCart(item)}
                  className="bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-xl text-xs"
                >
                  + إضافة
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm h-fit space-y-4">
          <h2 className="text-lg font-bold text-gray-800 border-b pb-2">سلة الطلبات</h2>

          {cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-xs border-b pb-2">
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-gray-500">{item.price * item.qty} ج.م</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-lg">
                <button onClick={() => updateQty(item.id, -1)} className="text-red-600 font-bold">-</button>
                <span>{item.qty}</span>
                <button onClick={() => updateQty(item.id, 1)} className="text-emerald-600 font-bold">+</button>
              </div>
            </div>
          ))}

          {cart.length > 0 && (
            <div className="text-xs space-y-1 border-t pt-2 font-bold text-emerald-900">
              <div className="flex justify-between"><span>الإجمالي:</span><span>{finalTotal} ج.م</span></div>
            </div>
          )}

          <form onSubmit={handleCheckout} className="space-y-3 pt-2">
            <input
              type="text"
              placeholder="الاسم"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2 border rounded-xl text-xs"
              required
            />
            <input
              type="tel"
              placeholder="رقم الهاتف"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border rounded-xl text-xs"
              required
            />
            <input
              type="text"
              placeholder="العنوان التفصيلي"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 border rounded-xl text-xs"
              required
            />
            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs"
            >
              {loading ? "جاري الإرسال..." : "تأكيد وإرسال الطلب"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}