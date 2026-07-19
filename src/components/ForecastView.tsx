import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';
import { Apartment, RecurringBudget } from '../types';

interface ForecastViewProps {
  apartments: Apartment[];
  recurringBudgets: RecurringBudget[];
  onSave: (data: any, id?: string | null) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
  lang: string;
}

export const ForecastView: React.FC<ForecastViewProps> = ({
  apartments,
  recurringBudgets,
  onSave,
  onDelete,
  t,
  lang
}) => {
  const [selectedAptId, setSelectedAptId] = useState('all');
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const isHe = lang !== 'en';
  const FREQ_OPTIONS = isHe ? [
    { id: '1', name: 'כל חודש (×12)' },
    { id: '2', name: 'כל חודשיים (×6)' },
    { id: '3', name: 'כל 3 חודשים (×4)' },
    { id: '6', name: 'כל 6 חודשים (×2)' },
    { id: '12', name: 'פעם בשנה (×1)' },
  ] : [
    { id: '1', name: 'Every month (×12)' },
    { id: '2', name: 'Every 2 months (×6)' },
    { id: '3', name: 'Every 3 months (×4)' },
    { id: '6', name: 'Every 6 months (×2)' },
    { id: '12', name: 'Once a year (×1)' },
  ];

  const EXPENSE_CATS_REGULAR = [
    'arnona', 'electricity', 'water', 'gas', 'hoa',
    'internet', 'insurance', 'cleaning', 'management_fee',
    'gardening', 'other_regular'
  ];
  const EXPENSE_CATS_SPECIAL = [
    'mortgage', 'professional_services', 'taxes_fees', 'supplies', 'rent'
  ];

  const annualAmount = (amount: any, freqMonths: any) =>
    (Number(amount) || 0) * (12 / Number(freqMonths || 1));

  const selectedApts = selectedAptId === 'all'
    ? apartments
    : apartments.filter(a => a.id === selectedAptId);

  const getBudgetsFor = (aptId: string) =>
    recurringBudgets.filter(b => b.aptId === aptId);

  const getRentForMonth = (apt: Apartment, monthIndex: number) => {
    const base = Number(apt.targetRent || 0);
    const segs = apt.rentSegments;
    if (!segs || !segs.length) return base;
    const mi = monthIndex + 1; // 1-based
    for (const seg of segs) {
      const from = Number(seg.fromMonth);
      const to = Number(seg.toMonth);
      if (mi >= from && mi <= to) return Number(seg.amount || 0);
    }
    return base;
  };

  const aptSummary = (apt: Apartment) => {
    const budgets = getBudgetsFor(apt.id);
    let income = 0, rentCost = 0;
    for (let mi = 0; mi < 12; mi++) {
      const rent = getRentForMonth(apt, mi);
      if (apt.status === 'tenant') rentCost += rent;
      else income += rent;
    }
    const expenses = rentCost + budgets.reduce((s, b) => s + annualAmount(b.amount, b.freqMonths), 0);
    return { income, expenses, net: income - expenses };
  };

  const totalSummary = selectedApts.reduce((acc, apt) => {
    const s = aptSummary(apt);
    return { income: acc.income + s.income, expenses: acc.expenses + s.expenses, net: acc.net + s.net };
  }, { income: 0, expenses: 0, net: 0 });

  const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MONTHS = isHe ? MONTHS_HE : MONTHS_EN;

  const monthlyTable = MONTHS.map((monthName, mi) => {
    let income = 0, expenses = 0;
    selectedApts.forEach(apt => {
      const rent = getRentForMonth(apt, mi);
      if (apt.status === 'tenant') {
        expenses += rent;
      } else {
        income += rent;
      }
      getBudgetsFor(apt.id).forEach(b => {
        const freq = Number(b.freqMonths || 1);
        const startMonth = Number(b.startMonth || 1) - 1;
        if ((mi - startMonth + 12) % freq === 0) {
          expenses += Number(b.amount || 0);
        }
      });
    });
    return { name: monthName, income, expenses, net: income - expenses };
  });

  const maxBar = Math.max(...monthlyTable.flatMap(m => [m.income, m.expenses]), 1);

  const BudgetForm: React.FC<{ apt: Apartment; initial?: any; onClose: () => void }> = ({ apt, initial, onClose }) => {
    const [form, setForm] = useState(initial || {
      aptId: apt.id, aptName: apt.name,
      category: 'hoa', amount: '', freqMonths: '1', startMonth: '1', notes: ''
    });

    const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
    const annual = annualAmount(form.amount, form.freqMonths);

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center modal-overlay bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-[2.5rem] p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-black text-xl text-slate-800 dark:text-white">
              {initial ? (isHe ? 'עריכת הוצאה שגרתית' : 'Edit Recurring Expense') : (isHe ? 'הוצאה שגרתית חדשה' : 'New Recurring Expense')}
            </h3>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              <LucideIcon name="X" size={20} />
            </button>
          </div>
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-4 bg-indigo-50 dark:bg-indigo-950/20 px-3 py-2 rounded-xl">{apt.name}</p>

          <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'קטגוריה' : 'Category'}</label>
          <div className="relative mb-4">
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-start appearance-none">
              <optgroup label={isHe ? 'הוצאות שוטפות' : 'Regular Expenses'}>
                {EXPENSE_CATS_REGULAR.map(c => <option key={c} value={c}>{t(c) || c}</option>)}
              </optgroup>
              <optgroup label={isHe ? 'הוצאות מיוחדות' : 'Special Expenses'}>
                {EXPENSE_CATS_SPECIAL.map(c => <option key={c} value={c}>{t(c) || c}</option>)}
              </optgroup>
            </select>
            <LucideIcon name="ChevronDown" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'סכום לכל תשלום (₪)' : 'Amount per payment (₪)'}</label>
          <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
            placeholder="0" className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl font-bold outline-none mb-4 text-start" />

          <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'תדירות תשלום' : 'Payment Frequency'}</label>
          <div className="relative mb-4">
            <select value={form.freqMonths} onChange={e => set('freqMonths', e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-start appearance-none">
              {FREQ_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <LucideIcon name="ChevronDown" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'חודש תשלום ראשון' : 'First Payment Month'}</label>
          <div className="relative mb-4">
            <select value={form.startMonth} onChange={e => set('startMonth', e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-start appearance-none">
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <LucideIcon name="ChevronDown" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {Number(form.amount) > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-2xl mb-4 text-center">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">{isHe ? 'סה"כ שנתי' : 'Annual Total'}</div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">₪{annual.toLocaleString()}</div>
              <div className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">
                {Number(form.amount).toLocaleString()}₪ × {12 / Number(form.freqMonths)} {isHe ? 'תשלומים' : 'payments'}
              </div>
            </div>
          )}

          <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'הערות (אופציונלי)' : 'Notes (optional)'}</label>
          <input value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder="..." className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl font-bold outline-none mb-6 text-start" />

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">{isHe ? 'ביטול' : 'Cancel'}</button>
            <button onClick={() => { onSave(form, initial?.id || null); onClose(); }}
              disabled={!form.amount || Number(form.amount) <= 0}
              className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 disabled:opacity-40">{isHe ? 'שמור' : 'Save'}</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 text-start">
      <h2 className="text-2xl font-black flex items-center gap-2">
        <LucideIcon name="TrendingUp" size={24} className="text-indigo-600" />
        {t('annual_forecast')}
      </h2>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        <button onClick={() => setSelectedAptId('all')}
          className={`px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all ${selectedAptId === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
          {t('all_properties')}
        </button>
        {apartments.map(a => (
          <button key={a.id} onClick={() => setSelectedAptId(a.id)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all border ${
              selectedAptId === a.id
                ? 'bg-indigo-600 text-white shadow-md border-indigo-600'
                : a.status === 'tenant'
                  ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20'
                  : Number(a.targetRent) > 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20'
                    : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20'
            }`}>
            {a.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-2xl text-center">
          <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1">{t('income')}</div>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">₪{Math.round(totalSummary.income).toLocaleString()}</div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-4 rounded-2xl text-center">
          <div className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase mb-1">{t('expenses')}</div>
          <div className="text-lg font-black text-rose-700 dark:text-rose-400">₪{Math.round(totalSummary.expenses).toLocaleString()}</div>
        </div>
        <div className={`p-4 rounded-2xl text-center border ${totalSummary.net >= 0 ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20' : 'bg-orange-50 border-orange-100 dark:bg-orange-950/20'}`}>
          <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1">{t('net_profit')}</div>
          <div className={`text-lg font-black ${totalSummary.net >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-orange-700 dark:text-orange-400'}`}>₪{Math.round(totalSummary.net).toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-black text-slate-700 dark:text-slate-300 mb-4 text-sm">{t('monthly_forecast')}</h3>
        <div className="flex items-end gap-1 h-32 mb-2">
          {monthlyTable.map((m, i) => (
            <div key={i} className="flex-1 flex gap-0.5 items-end h-full justify-center">
              <div className="flex-1 bg-emerald-400 rounded-t-sm min-h-[2px] transition-all"
                style={{ height: `${Math.max((m.income / maxBar) * 100, 2)}%` }}
                title={`${t('income_col')}: ₪${m.income.toLocaleString()}`} />
              <div className="flex-1 bg-rose-400 rounded-t-sm min-h-[2px] transition-all"
                style={{ height: `${Math.max((m.expenses / maxBar) * 100, 2)}%` }}
                title={`${t('expenses')}: ₪${m.expenses.toLocaleString()}`} />
            </div>
          ))}
        </div>
        <div className="flex gap-1 mb-3">
          {monthlyTable.map((m, i) => (
            <div key={i} className="flex-1 text-center text-[8px] text-slate-400 dark:text-slate-300 font-bold">{m.name.slice(0, 3)}</div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-4 bg-slate-50 dark:bg-slate-750 px-4 py-3 text-xs font-black text-slate-400 uppercase">
          <div>{t('month_col')}</div>
          <div className="text-center text-emerald-600 dark:text-emerald-400">{t('income_col')}</div>
          <div className="text-center text-rose-600 dark:text-rose-400">{t('expense_col')}</div>
          <div className="text-center text-indigo-600 dark:text-indigo-400">{t('balance_col')}</div>
        </div>
        {monthlyTable.map((m, i) => {
          const isCurrentMonth = i === new Date().getMonth();
          return (
            <div key={i} className={`grid grid-cols-4 px-4 py-3 border-b border-slate-50 dark:border-slate-800 text-sm ${isCurrentMonth ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}>
              <div className="font-bold">{m.name}</div>
              <div className="text-center text-emerald-600 dark:text-emerald-400 font-semibold">₪{m.income.toLocaleString()}</div>
              <div className="text-center text-rose-600 dark:text-rose-400 font-semibold">₪{m.expenses.toLocaleString()}</div>
              <div className={`text-center font-bold ${m.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₪{m.net.toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      {selectedAptId !== 'all' && apartments.find(a => a.id === selectedAptId) && (() => {
        const apt = apartments.find(a => a.id === selectedAptId)!;
        const budgets = getBudgetsFor(apt.id);
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-black text-slate-750 dark:text-white flex items-center gap-2">
                <LucideIcon name="Settings" size={18} />
                <span>{t('recurring_expenses')} — {apt.name}</span>
              </h3>
              <button onClick={() => { setEditingBudget(null); setShowForm(true); }}
                className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition-colors">
                <LucideIcon name="Plus" size={18} />
              </button>
            </div>

            {budgets.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 p-8 rounded-[2rem] text-center">
                <LucideIcon name="Plus" size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-400 font-bold text-sm">{t('click_plus_add_recurring')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {budgets.map(b => {
                  const annual = annualAmount(b.amount, b.freqMonths);
                  const freq = FREQ_OPTIONS.find(f => f.id === String(b.freqMonths));
                  return (
                    <div key={b.id} className="bg-white dark:bg-slate-800 p-4 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-xl text-rose-500"><LucideIcon name="Receipt" size={20} /></div>
                        <div className="text-start">
                          <div className="font-bold text-slate-800 dark:text-white">{t(b.category) || b.category}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-300 mt-0.5">{freq?.name} · {apt.currency || '₪'}{Number(b.amount).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-end">
                          <div className="font-black text-rose-600 dark:text-rose-400 text-sm">₪{Math.round(annual).toLocaleString()}</div>
                          <div className="text-[10px] text-slate-450">{isHe ? 'לשנה' : '/ year'}</div>
                        </div>
                        <button onClick={() => { setEditingBudget(b); setShowForm(true); }} className="p-2 bg-slate-50 dark:bg-slate-700 text-indigo-500 rounded-xl"><LucideIcon name="Edit2" size={16} /></button>
                        <button onClick={() => confirm('Delete?') && onDelete(b.id)} className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl"><LucideIcon name="Trash2" size={16} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {showForm && (
              <BudgetForm apt={apt} initial={editingBudget} onClose={() => { setShowForm(false); setEditingBudget(null); }} />
            )}
          </div>
        );
      })()}
    </div>
  );
};
export default ForecastView;
