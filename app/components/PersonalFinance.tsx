'use client';

import React, { useState } from 'react';

export function PersonalFinance() {
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'logs' | 'adjust' | 'debts' | 'installments'>('overview');

  // 💳 1. الكروت والحسابات المالية
  const [accounts, setAccounts] = useState([
    { id: 'cash', name: 'الكاش / درج المحل', balance: 1500, icon: '💵', color: 'bg-emerald-700' },
    { id: 'instapay', name: 'InstaPay', balance: 5000, icon: '📱', color: 'bg-purple-700' },
    { id: 'e_wallet', name: 'المحفظة الإلكترونية', balance: 1200, icon: '💳', color: 'bg-red-700' },
    { id: 'savings', name: 'المُدخرات الشخصية', balance: 25000, icon: '🏦', color: 'bg-blue-700' },
  ]);

  // 📜 2. دفتر سجل حركة الفلوس الشامل (Audit Log)
  const [logs, setLogs] = useState<any[]>([
    {
      id: 1,
      date: new Date().toLocaleString('ar-EG'),
      accountId: 'cash',
      accountName: 'الكاش / درج المحل',
      type: 'income',
      category: 'مبيعات مطعم',
      amount: 260,
      source: 'أوردر #101',
      notes: 'إيراد مبيعات تلقائي',
    },
    {
      id: 2,
      date: new Date().toLocaleString('ar-EG'),
      accountId: 'instapay',
      accountName: 'InstaPay',
      type: 'expense',
      category: 'مصروف شخصي',
      amount: 150,
      source: 'مصاريف شخصية',
      notes: 'مشتريات منزلية',
    },
  ]);

  // 👤 3. المصاريف الشخصية
  const [personalAmount, setPersonalAmount] = useState('');
  const [selectedPersonalAcc, setSelectedPersonalAcc] = useState('cash');
  const [personalCategory, setPersonalCategory] = useState('مصاريف شخصية');
  const [personalNotes, setPersonalNotes] = useState('');

  // ✏️ 4. تعديل وتصحيح الأرصدة
  const [selectedAdjustAccount, setSelectedAdjustAccount] = useState('cash');
  const [newAdjustBalance, setNewAdjustBalance] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // 🤝 5. الديون
  const [debts, setDebts] = useState([
    { id: 1, person: 'أحمد محمود', type: 'owed_to_me', amount: 500 },
    { id: 2, person: 'محل الأجهزة', type: 'i_owe', amount: 1500 },
  ]);
  const [debtPerson, setDebtPerson] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtType, setDebtType] = useState<'owed_to_me' | 'i_owe'>('i_owe');

  // 📅 6. الأقساط
  const [installments, setInstallments] = useState([
    { id: 1, title: 'قسط ثلاجة المطبخ', monthly: 600, dueDay: 10, endDate: '2027-01-01' },
  ]);
  const [instTitle, setInstTitle] = useState('');
  const [instMonthly, setInstMonthly] = useState('');
  const [instDueDay, setInstDueDay] = useState('');
  const [instEndDate, setInstEndDate] = useState('');

  // 📊 7. فلترة السجل
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // 🛠️ إضافة مصروف شخصي والخصم المباشر
  const handleAddPersonalExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(personalAmount);
    if (!amountNum || amountNum <= 0) return alert('يرجى إدخال مبلغ صحيح');

    const targetAcc = accounts.find((a) => a.id === selectedPersonalAcc);

    setAccounts((prev) =>
      prev.map((acc) => (acc.id === selectedPersonalAcc ? { ...acc, balance: acc.balance - amountNum } : acc))
    );

    const newLog = {
      id: Date.now(),
      date: new Date().toLocaleString('ar-EG'),
      accountId: selectedPersonalAcc,
      accountName: targetAcc?.name,
      type: 'expense',
      category: personalCategory,
      amount: amountNum,
      source: 'سحب مصروف شخصي',
      notes: personalNotes || 'مصروفات شخصية',
    };

    setLogs([newLog, ...logs]);
    setPersonalAmount('');
    setPersonalNotes('');
    alert(`تم خصم ${amountNum} ج.م من (${targetAcc?.name}) كمصروف شخصي بنجاح ✅`);
  };

  // 🛠️ سداد قسط شهري
  const handlePayInstallment = (inst: any) => {
    const accId = prompt('أدخل رمز الكارت للسداد منه:\n cash = الكاش\n instapay = InstaPay\n e_wallet = المحفظة', 'cash');
    if (!accId) return;

    const targetAcc = accounts.find((a) => a.id === accId);
    if (!targetAcc) return alert('رمز الكارت غير صحيح');

    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accId ? { ...acc, balance: acc.balance - inst.monthly } : acc))
    );

    const newLog = {
      id: Date.now(),
      date: new Date().toLocaleString('ar-EG'),
      accountId: accId,
      accountName: targetAcc.name,
      type: 'expense',
      category: 'سداد قسط',
      amount: inst.monthly,
      source: `سداد قسط: ${inst.title}`,
      notes: `تم السداد من ${targetAcc.name}`,
    };

    setLogs([newLog, ...logs]);
    alert(`تم سداد قسط ${inst.title} بقيمة ${inst.monthly} ج.م وخصمه من ${targetAcc.name} ✅`);
  };

  // 🛠️ تصحيح وتعديل رصيد يدوي
  const handleAdjustBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAcc = accounts.find((a) => a.id === selectedAdjustAccount);
    const newBal = parseFloat(newAdjustBalance);

    if (isNaN(newBal)) return alert('يرجى إدخال مبلغ صحيح');
    if (!adjustReason) return alert('يرجى كتابة سبب التعديل لتسجيله في السجل');

    const diff = newBal - (targetAcc?.balance || 0);

    setAccounts((prev) =>
      prev.map((acc) => (acc.id === selectedAdjustAccount ? { ...acc, balance: newBal } : acc))
    );

    const newLog = {
      id: Date.now(),
      date: new Date().toLocaleString('ar-EG'),
      accountId: selectedAdjustAccount,
      accountName: targetAcc?.name,
      type: diff >= 0 ? 'income' : 'expense',
      category: 'تعديل وتسوية رصيد',
      amount: Math.abs(diff),
      source: 'تصحيح رصيد يدوي',
      notes: adjustReason,
    };

    setLogs([newLog, ...logs]);
    setNewAdjustBalance('');
    setAdjustReason('');
    alert(`تم تعديل رصيد (${targetAcc?.name}) وتحديث السجل بنجاح ✅`);
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtPerson || !debtAmount) return alert('يرجى ملء البيانات');
    setDebts([...debts, { id: Date.now(), person: debtPerson, type: debtType, amount: parseFloat(debtAmount) }]);
    setDebtPerson('');
    setDebtAmount('');
  };

  const handleAddInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instTitle || !instMonthly || !instDueDay) return alert('يرجى ملء البيانات');
    setInstallments([
      ...installments,
      { id: Date.now(), title: instTitle, monthly: parseFloat(instMonthly), dueDay: parseInt(instDueDay), endDate: instEndDate },
    ]);
    setInstTitle('');
    setInstMonthly('');
    setInstDueDay('');
    setInstEndDate('');
  };

  const totalBalance = accounts.reduce((sum, item) => sum + item.balance, 0);

  return (
    <div className="space-y-6">
      {/* الهيدر وإجمالي النقدية */}
      <div className="flex flex-wrap justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">💳 المحفظة والسيولة المالية العامة</h2>
          <p className="text-xs text-gray-500 mt-1">تتبع المبيعات، المصاريف الشخصية، الديون، والأقساط</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 px-5 py-2.5 rounded-2xl text-left">
          <span className="text-xs text-emerald-800 block font-bold">إجمالي الخزينة المتاحة:</span>
          <span className="text-2xl font-black text-emerald-900">{totalBalance.toLocaleString()} ج.م</span>
        </div>
      </div>

      {/* شريط التنقل */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'overview' ? 'bg-emerald-800 text-white' : 'bg-white border text-gray-700'}`}>📊 نظرة عامة الأرصدة</button>
        <button onClick={() => setActiveTab('expenses')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'expenses' ? 'bg-emerald-800 text-white' : 'bg-white border text-gray-700'}`}>👤 مصاريف شخصية</button>
        <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'logs' ? 'bg-emerald-800 text-white' : 'bg-white border text-gray-700'}`}>📜 سجل الحركة والتقارير ({logs.length})</button>
        <button onClick={() => setActiveTab('adjust')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'adjust' ? 'bg-emerald-800 text-white' : 'bg-white border text-gray-700'}`}>✏️ تصحيح رصيد</button>
        <button onClick={() => setActiveTab('debts')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'debts' ? 'bg-emerald-800 text-white' : 'bg-white border text-gray-700'}`}>🤝 الديون ({debts.length})</button>
        <button onClick={() => setActiveTab('installments')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeTab === 'installments' ? 'bg-emerald-800 text-white' : 'bg-white border text-gray-700'}`}>📅 الأقساط ({installments.length})</button>
      </div>

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
            <h3 className="font-bold text-gray-900 mb-3">⚡ آخر المعاملات الحية:</h3>
            <div className="divide-y text-sm">
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">[{log.category}] {log.source} ({log.accountName})</p>
                    <p className="text-xs text-gray-500">{log.notes ? `ملاحظات: ${log.notes} | ` : ''}{log.date}</p>
                  </div>
                  <span className={`font-black ${log.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {log.type === 'income' ? '+' : '-'}{log.amount} ج.م
                  </span>
                </div>
              ))}
            </div>
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
              <input type="number" value={personalAmount} onChange={(e) => setPersonalAmount(e.target.value)} placeholder="مثال: 200" className="w-full border p-2.5 rounded-xl text-sm" required />
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
              <input type="text" value={personalNotes} onChange={(e) => setPersonalNotes(e.target.value)} placeholder="مثال: شراء مستلزمات شخصية" className="w-full border p-2.5 rounded-xl text-sm" />
            </div>

            <button type="submit" className="w-full bg-emerald-800 text-white font-bold p-2.5 rounded-xl">خصم وتسجيل المصروف الشخصي 💳</button>
          </form>
        </div>
      )}

      {/* 3. سجل حركة الفلوس */}
      {activeTab === 'logs' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div className="flex flex-wrap justify-between items-center border-b pb-3 gap-2">
            <h3 className="font-bold text-gray-900">📜 دفتر حركة الفلوس الشامل (المطعم والمحفظة)</h3>
            <div className="flex gap-2 items-center text-xs">
              <label className="font-bold">من:</label>
              <input type="date" value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)} className="border p-1.5 rounded-lg" />
              <label className="font-bold">إلى:</label>
              <input type="date" value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)} className="border p-1.5 rounded-lg" />
            </div>
          </div>

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
                    <td className="p-2.5 font-bold">{log.accountName}</td>
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
        </div>
      )}

      {/* 4. تصحيح رصيد */}
      {activeTab === 'adjust' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4 max-w-2xl">
          <h3 className="font-bold text-gray-900 border-b pb-2">✏️ تصحيح رصيد كارت يدوياً</h3>
          <form onSubmit={handleAdjustBalance} className="space-y-3">
            <div>
              <label className="block text-xs font-bold mb-1">اختر الحساب:</label>
              <select value={selectedAdjustAccount} onChange={(e) => setSelectedAdjustAccount(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm bg-white font-bold text-emerald-900">
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.icon} {acc.name} ({acc.balance} ج.م)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">الرصيد الفعلي الجديد (ج.م):</label>
              <input type="number" value={newAdjustBalance} onChange={(e) => setNewAdjustBalance(e.target.value)} placeholder="المبلغ الصحيح المتاح" className="w-full border p-2.5 rounded-xl text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">سبب التعديل والتصحيح:</label>
              <input type="text" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="مثال: تسوية جود كاش / عجز" className="w-full border p-2.5 rounded-xl text-sm" required />
            </div>
            <button type="submit" className="w-full bg-emerald-800 text-white font-bold p-2.5 rounded-xl">تأكيد التعديل 💾</button>
          </form>
        </div>
      )}

      {/* 5. الديون */}
      {activeTab === 'debts' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">🤝 تسجيل دين:</h3>
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
              <div className="space-y-2">
                {debts.filter((d) => d.type === 'i_owe').map((d) => (
                  <div key={d.id} className="bg-white p-3 rounded-xl border flex justify-between text-sm">
                    <span>{d.person}</span>
                    <span className="font-bold text-red-700">{d.amount} ج.م</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 p-4 rounded-2xl">
              <h4 className="font-bold text-green-900 mb-3 text-sm">🟢 مبالغ لي:</h4>
              <div className="space-y-2">
                {debts.filter((d) => d.type === 'owed_to_me').map((d) => (
                  <div key={d.id} className="bg-white p-3 rounded-xl border flex justify-between text-sm">
                    <span>{d.person}</span>
                    <span className="font-bold text-green-700">{d.amount} ج.م</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. الأقساط */}
      {activeTab === 'installments' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">📅 إضافة قسط شهري:</h3>
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
            <div className="space-y-3">
              {installments.map((inst) => (
                <div key={inst.id} className="border p-4 rounded-xl flex flex-wrap justify-between items-center gap-2 bg-amber-50/60 border-amber-200">
                  <div>
                    <p className="font-bold text-gray-900">{inst.title}</p>
                    <p className="text-xs text-amber-900 font-bold mt-1">⏰ موعد السداد: يوم {inst.dueDay} من كل شهر</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-amber-900">{inst.monthly} ج.م / شهرياً</span>
                    <button onClick={() => handlePayInstallment(inst)} className="bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold">
                      سداد القسط الان 💳
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}