'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function PersonalFinance() {
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'logs' | 'adjust' | 'debts' | 'installments'>('overview');

  const [accounts, setAccounts] = useState([
    { id: 'cash', name: 'الكاش / درج المحل', balance: 0, icon: '💵', color: 'bg-emerald-700' },
    { id: 'instapay', name: 'InstaPay', balance: 0, icon: '📱', color: 'bg-purple-700' },
    { id: 'e_wallet', name: 'المحفظة الإلكترونية', balance: 0, icon: '💳', color: 'bg-red-700' },
    { id: 'savings', name: 'المُدخرات الشخصية', balance: 0, icon: '🏦', color: 'bg-blue-700' },
  ]);

  const [logs, setLogs] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب البيانات فورياً من Supabase عند الفتح
  useEffect(() => {
    fetchCloudData();

    // اشتراك للتحديث الفوري عبر كافة الأجهزة (Realtime)
    const walletChannel = supabase
      .channel('wallet_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_logs' }, () => {
        fetchCloudData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_debts' }, () => {
        fetchCloudData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_installments' }, () => {
        fetchCloudData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
    };
  }, []);

  const fetchCloudData = async () => {
    setLoading(true);
    
    // 1. جلب سجل الحركات
    const { data: logsData } = await supabase.from('wallet_logs').select('*').order('created_at', { ascending: false });
    if (logsData) {
      setLogs(logsData);
      
      // إعادة حساب أرصدة الكروت بناءً على سجل الحركات
      const newBalances = { cash: 0, instapay: 0, e_wallet: 0, savings: 0 };
      logsData.forEach((log: any) => {
        const accId = log.account_id as keyof typeof newBalances;
        if (newBalances[accId] !== undefined) {
          if (log.type === 'income') newBalances[accId] += Number(log.amount);
          else if (log.type === 'expense') newBalances[accId] -= Number(log.amount);
        }
      });

      setAccounts(prev => prev.map(acc => ({
        ...acc,
        balance: newBalances[acc.id as keyof typeof newBalances] || 0
      })));
    }

    // 2. جلب الديون
    const { data: debtsData } = await supabase.from('personal_debts').select('*').order('created_at', { ascending: false });
    if (debtsData) setDebts(debtsData);

    // 3. جلب الأقساط
    const { data: instData } = await supabase.from('personal_installments').select('*').order('created_at', { ascending: false });
    if (instData) setInstallments(instData);

    setLoading(false);
  };

  // المدخلات
  const [personalAmount, setPersonalAmount] = useState('');
  const [selectedPersonalAcc, setSelectedPersonalAcc] = useState('cash');
  const [personalCategory, setPersonalCategory] = useState('مصاريف شخصية');
  const [personalNotes, setPersonalNotes] = useState('');

  const [selectedAdjustAccount, setSelectedAdjustAccount] = useState('cash');
  const [newAdjustBalance, setNewAdjustBalance] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const [debtPerson, setDebtPerson] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtType, setDebtType] = useState<'owed_to_me' | 'i_owe'>('i_owe');

  const [instTitle, setInstTitle] = useState('');
  const [instMonthly, setInstMonthly] = useState('');
  const [instDueDay, setInstDueDay] = useState('');
  const [instEndDate, setInstEndDate] = useState('');

  // 🛠️ إضافة مصروف شخصي وسحفظه في السحابة
  const handleAddPersonalExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(personalAmount);
    if (!amountNum || amountNum <= 0) return alert('يرجى إدخال مبلغ صحيح');

    const targetAcc = accounts.find((a) => a.id === selectedPersonalAcc);

    const { error } = await supabase.from('wallet_logs').insert([{
      account_id: selectedPersonalAcc,
      account_name: targetAcc?.name,
      type: 'expense',
      category: personalCategory,
      amount: amountNum,
      source: 'سحب مصروف شخصي',
      notes: personalNotes || 'مصروفات شخصية',
      date: new Date().toLocaleString('ar-EG')
    }]);

    if (error) {
      alert('خطأ في الحفظ السحابي: ' + error.message);
    } else {
      setPersonalAmount('');
      setPersonalNotes('');
      fetchCloudData();
      alert(`تم تسجيل المصروف الشخصي وحفظه سحابياً ✅`);
    }
  };

  // 🛠️ تصحيح وتعديل رصيد سحابياً
  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAcc = accounts.find((a) => a.id === selectedAdjustAccount);
    const newBal = parseFloat(newAdjustBalance);

    if (isNaN(newBal)) return alert('يرجى إدخال مبلغ صحيح');
    if (!adjustReason) return alert('يرجى كتابة سبب التعديل لتسجيله');

    const diff = newBal - (targetAcc?.balance || 0);

    const { error } = await supabase.from('wallet_logs').insert([{
      account_id: selectedAdjustAccount,
      account_name: targetAcc?.name,
      type: diff >= 0 ? 'income' : 'expense',
      category: 'تعديل وتسوية رصيد',
      amount: Math.abs(diff),
      source: 'تصحيح رصيد يدوي',
      notes: adjustReason,
      date: new Date().toLocaleString('ar-EG')
    }]);

    if (!error) {
      setNewAdjustBalance('');
      setAdjustReason('');
      fetchCloudData();
      alert(`تم تحديث الرصيد سحابياً بنجاح ✅`);
    }
  };

  // 🛠️ إلغاء أوردر / مرتجع (خصم من المحفظة)
  const handleCancelOrder = async (orderId: string, amount: number, accountId: string = 'cash') => {
    const targetAcc = accounts.find((a) => a.id === accountId);
    const { error } = await supabase.from('wallet_logs').insert([{
      account_id: accountId,
      account_name: targetAcc?.name || 'الكاش / درج المحل',
      type: 'expense',
      category: 'مرتجع مبيعات',
      amount: amount,
      source: `إلغاء/ارتجاع أوردر #${orderId}`,
      notes: 'إلغاء فاتورة بعد التسليم',
      date: new Date().toLocaleString('ar-EG')
    }]);

    if (!error) {
      fetchCloudData();
      alert(`تم خصم قيمة المرتجع (${amount} ج.م) من المحفظة بنجاح ✅`);
    }
  };

  // 🛠️ إضافة دين للسحابة
  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtPerson || !debtAmount) return alert('يرجى ملء البيانات');

    const { error } = await supabase.from('personal_debts').insert([{
      person: debtPerson,
      type: debtType,
      amount: parseFloat(debtAmount)
    }]);

    if (!error) {
      setDebtPerson('');
      setDebtAmount('');
      fetchCloudData();
    }
  };

  // 🛠️ سداد/تحصيل دين
  const handleSettleDebt = async (debt: any) => {
    const accId = prompt('اختر الحساب/الكارت المالي:\n cash = الكاش\n instapay = InstaPay\n e_wallet = المحفظة الإلكترونية\n savings = المدخرات', 'cash');
    if (!accId) return;

    const targetAcc = accounts.find((a) => a.id === accId);
    if (!targetAcc) return alert('رمز الكارت غير صحيح');

    const isOwedToMe = debt.type === 'owed_to_me'; // لي
    const logType = isOwedToMe ? 'income' : 'expense';

    const { error: logErr } = await supabase.from('wallet_logs').insert([{
      account_id: accId,
      account_name: targetAcc.name,
      type: logType,
      category: isOwedToMe ? 'تحصيل دين' : 'سداد دين',
      amount: debt.amount,
      source: isOwedToMe ? `تحصيل دين من ${debt.person}` : `سداد دين لـ ${debt.person}`,
      notes: 'تسوية دين مسجل',
      date: new Date().toLocaleString('ar-EG')
    }]);

    if (!logErr) {
      await supabase.from('personal_debts').delete().eq('id', debt.id);
      fetchCloudData();
      alert(`تم تسوية الدين وتحديث المحفظة بنجاح ✅`);
    }
  };

  // 🛠️ حذف دين
  const handleDeleteDebt = async (id: number) => {
    if (!confirm('هل أنت تأكد من حذف هذا الدين؟')) return;
    const { error } = await supabase.from('personal_debts').delete().eq('id', id);
    if (!error) fetchCloudData();
  };

  // 🛠️ إضافة قسط للسحابة
  const handleAddInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instTitle || !instMonthly || !instDueDay) return alert('يرجى ملء البيانات');

    const { error } = await supabase.from('personal_installments').insert([{
      title: instTitle,
      monthly: parseFloat(instMonthly),
      due_day: parseInt(instDueDay),
      end_date: instEndDate || null
    }]);

    if (!error) {
      setInstTitle('');
      setInstMonthly('');
      setInstDueDay('');
      setInstEndDate('');
      fetchCloudData();
    }
  };

  // 🛠️ سداد قسط شهري
  const handlePayInstallment = async (inst: any) => {
    const accId = prompt('اختر الكارت للسداد منه:\n cash = الكاش\n instapay = InstaPay\n e_wallet = المحفظة الإلكترونية\n savings = المدخرات', 'cash');
    if (!accId) return;

    const targetAcc = accounts.find((a) => a.id === accId);
    if (!targetAcc) return alert('رمز الكارت غير صحيح');

    const { error } = await supabase.from('wallet_logs').insert([{
      account_id: accId,
      account_name: targetAcc.name,
      type: 'expense',
      category: 'سداد قسط',
      amount: inst.monthly,
      source: `سداد قسط: ${inst.title}`,
      notes: `خصماً من ${targetAcc.name}`,
      date: new Date().toLocaleString('ar-EG')
    }]);

    if (!error) {
      fetchCloudData();
      alert(`تم خصم وسداد قسط (${inst.title}) بقيمة ${inst.monthly} ج.م بنجاح ✅`);
    }
  };

  // 🛠️ حذف قسط
  const handleDeleteInstallment = async (id: number) => {
    if (!confirm('هل أنت تأكد من حذف هذا القسط؟')) return;
    const { error } = await supabase.from('personal_installments').delete().eq('id', id);
    if (!error) fetchCloudData();
  };

  const totalBalance = accounts.reduce((sum, item) => sum + item.balance, 0);

  return (
    <div className="space-y-6">
      {/* الهيدر */}
      <div className="flex flex-wrap justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">💳 المحفظة والسيولة المالية (ربط سحابي مباشر ☁️)</h2>
          <p className="text-xs text-gray-500 mt-1">بياناتك محفوظة ومزامنة فورياً عبر كافة الأجهزة</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 px-5 py-2.5 rounded-2xl text-left">
          <span className="text-xs text-emerald-800 block font-bold">إجمالي الخزينة المتاحة:</span>
          <span className="text-2xl font-black text-emerald-900">{totalBalance.toLocaleString()} ج.م</span>
        </div>
      </div>

      {/* التبويبات */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'overview' ? 'bg-emerald-800 text-white' : 'bg-white border text-gray-700'}`}>📊 نظرة عامة الأرصدة</button>
        <button onClick={() => setActiveTab('expenses')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'expenses' ? 'bg-emerald-800 text-white' : 'bg-white border text-gray-700'}`}>👤 مصاريف شخصية</button>
        <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'logs' ? 'bg-emerald-800 text-white' : 'bg-white border text-gray-700'}`}>📜 سجل الحركة والتقارير ({logs.length})</button>
        <button onClick={() => setActiveTab('adjust')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'adjust' ? 'bg-emerald-800 text-white' : 'bg-white border text-gray-700'}`}>✏️ تصحيح رصيد</button>
        <button onClick={() => setActiveTab('debts')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'debts' ? 'bg-emerald-800 text-white' : 'bg-white border text-gray-700'}`}>🤝 الديون ({debts.length})</button>
        <button onClick={() => setActiveTab('installments')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'installments' ? 'bg-emerald-800 text-white' : 'bg-white border text-gray-700'}`}>📅 الأقساط ({installments.length})</button>
      </div>

      {loading ? (
        <div className="bg-white p-8 text-center rounded-2xl border text-gray-500 font-bold">جاري جلب البيانات السحابية... 🔄</div>
      ) : (
        <>
          {/* 1. نظرة عامة */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {accounts.map((acc) => (
                  <div key={acc.id} className={`${acc.color} text-white p-4 rounded-2xl shadow-sm flex flex-col justify-between`}>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">{acc.icon}</span>
                      <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">{acc.name}</span>
                    </div>
                    <div className="mt-4">
                      <p className="text-[11px] opacity-80">الرصيد المتاح:</p>
                      <p className="text-lg font-black">{acc.balance.toLocaleString()} ج.م</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">⚡ آخر المعاملات السحابية:</h3>
                {logs.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">لا توجد حركات مسجلة بعد.</p>
                ) : (
                  <div className="divide-y text-sm">
                    {logs.slice(0, 5).map((log) => (
                      <div key={log.id} className="py-2.5 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900">[{log.category}] {log.source} ({log.account_name})</p>
                          <p className="text-xs text-gray-500">{log.notes ? `ملاحظات: ${log.notes} | ` : ''}{log.date}</p>
                        </div>
                        <span className={`font-black ${log.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {log.type === 'income' ? '+' : '-'}{log.amount} ج.م
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. المصاريف الشخصية */}
          {activeTab === 'expenses' && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4 max-w-2xl">
              <h3 className="font-bold text-gray-900 border-b pb-2">👤 تسجيل مصروف شخصي وتحديد كارت الخصم</h3>
              <form onSubmit={handleAddPersonalExpense} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1">المبلغ (ج.م):</label>
                  <input type="number" value={personalAmount} onChange={(e) => setPersonalAmount(e.target.value)} placeholder="أدخل المبلغ" className="w-full border p-2.5 rounded-xl text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">الخصم من كارت/حساب:</label>
                  <select value={selectedPersonalAcc} onChange={(e) => setSelectedPersonalAcc(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm bg-white font-bold text-emerald-900">
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.icon} {acc.name} ({acc.balance} ج.م)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">تصنيف المصروف الشخصي:</label>
                  <select value={personalCategory} onChange={(e) => setPersonalCategory(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm bg-white">
                    <option value="مصاريف شخصية">👤 مصاريف شخصية عامة</option>
                    <option value="مشتريات منزلية">🏠 مشتريات منزلية</option>
                    <option value="علاج وطبابة">🏥 علاج وطبابة</option>
                    <option value="ترفيه وخروج">☕ ترفيه وخروج</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">ملاحظة:</label>
                  <input type="text" value={personalNotes} onChange={(e) => setPersonalNotes(e.target.value)} placeholder="مثال: بيان المصروف" className="w-full border p-2.5 rounded-xl text-sm" />
                </div>
                <button type="submit" className="w-full bg-emerald-800 text-white font-bold p-2.5 rounded-xl">خصم وتسجيل المصروف الشخصي 💳</button>
              </form>
            </div>
          )}

          {/* 3. سجل حركة الفلوس */}
          {activeTab === 'logs' && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <h3 className="font-bold text-gray-900 border-b pb-3">📜 دفتر حركة الفلوس الشامل (سحابي)</h3>
              {logs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">السجل فارغ. لا توجد حركات مسجلة حالياً.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100 font-bold border-b">
                      <tr>
                        <th className="p-2.5">التاريخ</th>
                        <th className="p-2.5">الحساب/الكارت</th>
                        <th className="p-2.5">التصنيف</th>
                        <th className="p-2.5">المصدر/البيان</th>
                        <th className="p-2.5">المبلغ</th>
                        <th className="p-2.5">الملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="p-2.5 text-gray-500">{log.date}</td>
                          <td className="p-2.5 font-bold">{log.account_name}</td>
                          <td className="p-2.5"><span className="bg-gray-100 px-2 py-0.5 rounded-full font-bold">{log.category}</span></td>
                          <td className="p-2.5 font-bold text-gray-900">{log.source}</td>
                          <td className={`p-2.5 font-black ${log.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                            {log.type === 'income' ? '+' : '-'}{log.amount} ج.م
                          </td>
                          <td className="p-2.5 text-gray-600">{log.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. تصحيح رصيد */}
          {activeTab === 'adjust' && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4 max-w-2xl">
              <h3 className="font-bold text-gray-900 border-b pb-2">✏️ تصحيح رصيد كارت يدوياً</h3>
              <form onSubmit={handleAdjustBalance} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1">اختر الحساب المراد تعديله:</label>
                  <select value={selectedAdjustAccount} onChange={(e) => setSelectedAdjustAccount(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm bg-white font-bold text-emerald-900">
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.icon} {acc.name} ({acc.balance} ج.م)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">الرصيد الفعلي الجديد (ج.م):</label>
                  <input type="number" value={newAdjustBalance} onChange={(e) => setNewAdjustBalance(e.target.value)} placeholder="أدخل الرصيد الجديد" className="w-full border p-2.5 rounded-xl text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">سبب التعديل والتصحيح:</label>
                  <input type="text" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="اكتب سبب التعديل للتسجيل" className="w-full border p-2.5 rounded-xl text-sm" required />
                </div>
                <button type="submit" className="w-full bg-emerald-800 text-white font-bold p-2.5 rounded-xl">تأكيد وتحديث الرصيد 💾</button>
              </form>
            </div>
          )}

          {/* 5. الديون */}
          {activeTab === 'debts' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">🤝 تسجيل دين جديد:</h3>
                <form onSubmit={handleAddDebt} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="text" placeholder="الاسم" value={debtPerson} onChange={(e) => setDebtPerson(e.target.value)} className="border p-2 rounded-xl text-sm" required />
                  <input type="number" placeholder="المبلغ" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} className="border p-2 rounded-xl text-sm" required />
                  <select value={debtType} onChange={(e) => setDebtType(e.target.value as any)} className="border p-2 rounded-xl text-sm bg-white font-bold">
                    <option value="i_owe">🔴 عليّ (التزام)</option>
                    <option value="owed_to_me">🟢 لي (مستحق)</option>
                  </select>
                  <button type="submit" className="bg-emerald-800 text-white font-bold p-2 rounded-xl">حفظ ➕</button>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
                  <h4 className="font-bold text-red-900 mb-3 text-sm">🔴 مبالغ عليّ:</h4>
                  {debts.filter((d) => d.type === 'i_owe').length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">لا توجد ديون مسجلة عليك.</p>
                  ) : (
                    <div className="space-y-2">
                      {debts.filter((d) => d.type === 'i_owe').map((d) => (
                        <div key={d.id} className="bg-white p-3 rounded-xl border flex justify-between items-center text-sm">
                          <div>
                            <span className="font-bold block">{d.person}</span>
                            <span className="font-black text-red-700">{d.amount} ج.م</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSettleDebt(d)} className="bg-emerald-700 text-white text-xs px-2.5 py-1 rounded-lg font-bold">سداد 💳</button>
                            <button onClick={() => handleDeleteDebt(d.id)} className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-lg font-bold">حذف 🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-green-50 border border-green-200 p-4 rounded-2xl">
                  <h4 className="font-bold text-green-900 mb-3 text-sm">🟢 مبالغ لي:</h4>
                  {debts.filter((d) => d.type === 'owed_to_me').length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">لا توجد ديون مستحقة لك.</p>
                  ) : (
                    <div className="space-y-2">
                      {debts.filter((d) => d.type === 'owed_to_me').map((d) => (
                        <div key={d.id} className="bg-white p-3 rounded-xl border flex justify-between items-center text-sm">
                          <div>
                            <span className="font-bold block">{d.person}</span>
                            <span className="font-black text-green-700">{d.amount} ج.م</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSettleDebt(d)} className="bg-emerald-700 text-white text-xs px-2.5 py-1 rounded-lg font-bold">تحصيل 💳</button>
                            <button onClick={() => handleDeleteDebt(d.id)} className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-lg font-bold">حذف 🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 6. الأقساط */}
          {activeTab === 'installments' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">📅 إضافة قسط شهري جديد:</h3>
                <form onSubmit={handleAddInstallment} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <input type="text" placeholder="اسم القسط" value={instTitle} onChange={(e) => setInstTitle(e.target.value)} className="border p-2 rounded-xl text-sm" required />
                  <input type="number" placeholder="المبلغ الشهري" value={instMonthly} onChange={(e) => setInstMonthly(e.target.value)} className="border p-2 rounded-xl text-sm" required />
                  <input type="number" placeholder="يوم الاستحقاق" value={instDueDay} onChange={(e) => setInstDueDay(e.target.value)} className="border p-2 rounded-xl text-sm" required />
                  <input type="date" value={instEndDate} onChange={(e) => setInstEndDate(e.target.value)} className="border p-2 rounded-xl text-sm" />
                  <button type="submit" className="bg-emerald-800 text-white font-bold p-2 rounded-xl">حفظ 📅</button>
                </form>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">🔔 الأقساط النشطة:</h3>
                {installments.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">لا توجد أقساط مسجلة بعد.</p>
                ) : (
                  <div className="space-y-3">
                    {installments.map((inst) => (
                      <div key={inst.id} className="border p-4 rounded-xl flex flex-wrap justify-between items-center gap-2 bg-amber-50/60 border-amber-200">
                        <div>
                          <p className="font-bold text-gray-900">{inst.title}</p>
                          <p className="text-xs text-amber-900 font-bold mt-1">
                            ⏰ موعد السداد: يوم {inst.due_day} من كل شهر {inst.end_date ? `| ينتهي في: ${inst.end_date}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-amber-900 ml-2">{inst.monthly} ج.م / شهرياً</span>
                          <button onClick={() => handlePayInstallment(inst)} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition">
                            سداد الآن 💳
                          </button>
                          <button onClick={() => handleDeleteInstallment(inst.id)} className="bg-red-100 hover:bg-red-200 text-red-700 text-xs px-2.5 py-1.5 rounded-lg font-bold transition">
                            حذف 🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}