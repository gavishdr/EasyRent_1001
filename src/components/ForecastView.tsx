import React, { useState, useMemo } from 'react';
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
  apartments = [],
  recurringBudgets = [],
  onSave,
  onDelete,
  t,
  lang
}) => {
  const currentYearNum = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState<number>(currentYearNum);
  const [selectedAptId, setSelectedAptId] = useState<string>('all');
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

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

  // Available selectable years (from 5 years ago to 6 years ahead)
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYearNum - 4; y <= currentYearNum + 6; y++) {
      years.push(y);
    }
    return years;
  }, [currentYearNum]);

  const annualAmount = (amount: any, freqMonths: any) =>
    (Number(amount) || 0) * (12 / Number(freqMonths || 1));

  const selectedApts = useMemo(() => {
    if (selectedAptId === 'all') return apartments;
    return apartments.filter(a => a.id === selectedAptId);
  }, [apartments, selectedAptId]);

  // Strictly filter recurring budget records by apartment AND by year
  const getBudgetsFor = (aptId: string, year: number) => {
    return recurringBudgets.filter(b => {
      if (!b || b.aptId !== aptId) return false;
      // Default un-tagged legacy records to the baseline current year (2026)
      const bYear = b.year !== undefined && b.year !== null ? Number(b.year) : currentYearNum;
      return bYear === year;
    });
  };

  const getRentForMonth = (apt: Apartment, monthIndex: number) => {
    const base = Number(apt.targetRent || 0);
    const segs = apt.rentSegments;
    if (!segs || !segs.length) return base;
    const mi = monthIndex + 1; // 1-based (1..12)
    for (const seg of segs) {
      const from = Number(seg.fromMonth);
      const to = Number(seg.toMonth);
      if (mi >= from && mi <= to) return Number(seg.amount || 0);
    }
    return base;
  };

  const aptSummary = (apt: Apartment) => {
    const budgets = getBudgetsFor(apt.id, selectedYear);
    let income = 0, rentCost = 0;
    for (let mi = 0; mi < 12; mi++) {
      const rent = getRentForMonth(apt, mi);
      if (apt.status === 'tenant') rentCost += rent;
      else income += rent;
    }
    const expenses = rentCost + budgets.reduce((s, b) => s + annualAmount(b.amount, b.freqMonths), 0);
    return { income, expenses, net: income - expenses };
  };

  const totalSummary = useMemo(() => {
    return selectedApts.reduce((acc, apt) => {
      const s = aptSummary(apt);
      return { income: acc.income + s.income, expenses: acc.expenses + s.expenses, net: acc.net + s.net };
    }, { income: 0, expenses: 0, net: 0 });
  }, [selectedApts, selectedYear, recurringBudgets]);

  const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MONTHS = isHe ? MONTHS_HE : MONTHS_EN;

  const monthlyTable = useMemo(() => {
    return MONTHS.map((monthName, mi) => {
      let income = 0, expenses = 0;
      selectedApts.forEach(apt => {
        const rent = getRentForMonth(apt, mi);
        if (apt.status === 'tenant') {
          expenses += rent;
        } else {
          income += rent;
        }
        getBudgetsFor(apt.id, selectedYear).forEach(b => {
          const freq = Number(b.freqMonths || 1);
          const startMonth = Number(b.startMonth || 1) - 1;
          if ((mi - startMonth + 12) % freq === 0) {
            expenses += Number(b.amount || 0);
          }
        });
      });
      return { name: monthName, monthIndex: mi + 1, income, expenses, net: income - expenses };
    });
  }, [selectedApts, selectedYear, recurringBudgets, MONTHS]);

  const maxBar = Math.max(...monthlyTable.flatMap(m => [m.income, m.expenses]), 1);

  // Helper to duplicate previous year's budget items into the current year
  const handleCopyFromPreviousYear = (aptId: string, prevYear: number) => {
    const prevItems = getBudgetsFor(aptId, prevYear);
    if (prevItems.length === 0) return;
    
    if (window.confirm(isHe 
      ? `האם להעתיק ${prevItems.length} סעיפי תקציב משנת ${prevYear} לשנת ${selectedYear}?` 
      : `Copy ${prevItems.length} budget items from ${prevYear} to ${selectedYear}?`)) {
      prevItems.forEach(item => {
        onSave({
          aptId: item.aptId,
          aptName: item.aptName,
          category: item.category,
          amount: item.amount,
          freqMonths: item.freqMonths,
          startMonth: item.startMonth,
          year: selectedYear,
          notes: item.notes || ''
        }, null);
      });
    }
  };

  const BudgetForm: React.FC<{ apt: Apartment; initial?: any; onClose: () => void }> = ({ apt, initial, onClose }) => {
    const [form, setForm] = useState(initial || {
      aptId: apt.id, 
      aptName: apt.name,
      category: 'hoa', 
      amount: '', 
      freqMonths: '1', 
      startMonth: '1', 
      year: selectedYear,
      notes: ''
    });

    const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
    const annual = annualAmount(form.amount, form.freqMonths);

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center modal-overlay bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-[2.5rem] p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-black text-xl text-slate-800 dark:text-white">
                {initial ? (isHe ? 'עריכת הוצאה שגרתית' : 'Edit Recurring Expense') : (isHe ? 'הוצאה שגרתית חדשה' : 'New Recurring Expense')}
              </h3>
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                📅 {isHe ? `תקציב עבור שנת ${form.year || selectedYear}` : `Budget for Year ${form.year || selectedYear}`}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
              <LucideIcon name="X" size={20} />
            </button>
          </div>

          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-4 bg-indigo-50 dark:bg-indigo-950/20 px-3 py-2 rounded-xl flex items-center justify-between">
            <span>🏢 {apt.name}</span>
            <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg text-xs font-black shadow-xs">{selectedYear}</span>
          </p>

          <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'קטגוריה' : 'Category'}</label>
          <div className="relative mb-4">
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-start appearance-none cursor-pointer">
              <optgroup label={isHe ? 'הוצאות שוטפות' : 'Regular Expenses'}>
                {EXPENSE_CATS_REGULAR.map(c => <option key={c} value={c}>{t(c) || c}</option>)}
              </optgroup>
              <optgroup label={isHe ? 'הוצאות מיוחדות' : 'Special Expenses'}>
                {EXPENSE_CATS_SPECIAL.map(c => <option key={c} value={c}>{t(c) || c}</option>)}
              </optgroup>
            </select>
            <LucideIcon name="ChevronDown" size={16} className={`absolute ${isHe ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`} />
          </div>

          <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'סכום לכל תשלום (₪)' : 'Amount per payment (₪)'}</label>
          <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
            placeholder="0" className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl font-bold outline-none mb-4 text-start border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white" />

          <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'תדירות תשלום' : 'Payment Frequency'}</label>
          <div className="relative mb-4">
            <select value={form.freqMonths} onChange={e => set('freqMonths', e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-start appearance-none cursor-pointer">
              {FREQ_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <LucideIcon name="ChevronDown" size={16} className={`absolute ${isHe ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`} />
          </div>

          <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'חודש תשלום ראשון' : 'First Payment Month'}</label>
          <div className="relative mb-4">
            <select value={form.startMonth} onChange={e => set('startMonth', e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-start appearance-none cursor-pointer">
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <LucideIcon name="ChevronDown" size={16} className={`absolute ${isHe ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`} />
          </div>

          {Number(form.amount) > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-2xl mb-4 text-center">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">{isHe ? `סה"כ שנתי לשנת ${form.year || selectedYear}` : `Annual Total for ${form.year || selectedYear}`}</div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">₪{Math.round(annual).toLocaleString()}</div>
              <div className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">
                {Math.round(Number(form.amount)).toLocaleString()}₪ × {12 / Number(form.freqMonths)} {isHe ? 'תשלומים' : 'payments'}
              </div>
            </div>
          )}

          <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'הערות (אופציונלי)' : 'Notes (optional)'}</label>
          <input value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder="..." className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl font-bold outline-none mb-6 text-start border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white" />

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold cursor-pointer">{isHe ? 'ביטול' : 'Cancel'}</button>
            <button onClick={() => { 
              onSave({ 
                ...form, 
                year: form.year ? Number(form.year) : selectedYear 
              }, initial?.id || null); 
              onClose(); 
            }}
              disabled={!form.amount || Number(form.amount) <= 0}
              className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 disabled:opacity-40 cursor-pointer">{isHe ? 'שמור' : 'Save'}</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 text-start pb-10">
      
      {/* Top Header with Title and Year Selector Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2 text-slate-800 dark:text-white">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <LucideIcon name="TrendingUp" size={24} />
            </span>
            <span>{t('annual_forecast')}</span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 font-medium">
            {isHe 
              ? `נתוני תקציב ותחזית עצמאיים עבור שנת ${selectedYear}` 
              : `Independent budget and forecast data for Year ${selectedYear}`}
          </p>
        </div>

        {/* Year Selector Component */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm self-start sm:self-auto">
          {/* Previous Year Button */}
          <button
            onClick={() => setSelectedYear(prev => prev - 1)}
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={isHe ? 'שנה קודמת' : 'Previous Year'}
          >
            <LucideIcon name={isHe ? "ChevronRight" : "ChevronLeft"} size={18} />
          </button>

          {/* Year Dropdown / Display */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
              className="appearance-none bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-black text-sm px-4 py-2 pe-8 rounded-xl border border-indigo-100 dark:border-indigo-800/50 outline-none cursor-pointer hover:bg-indigo-100/70 transition-colors"
            >
              {availableYears.map(y => (
                <option key={y} value={y} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold">
                  📅 {y} {y === currentYearNum ? (isHe ? '(הנוכחית)' : '(Current)') : ''}
                </option>
              ))}
            </select>
            <LucideIcon name="ChevronDown" size={14} className={`absolute ${isHe ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none`} />
          </div>

          {/* Next Year Button */}
          <button
            onClick={() => setSelectedYear(prev => prev + 1)}
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={isHe ? 'שנה הבאה' : 'Next Year'}
          >
            <LucideIcon name={isHe ? "ChevronLeft" : "ChevronRight"} size={18} />
          </button>

          {/* Jump to Current Year Button if viewing different year */}
          {selectedYear !== currentYearNum && (
            <button
              onClick={() => setSelectedYear(currentYearNum)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              title={isHe ? 'חזור לשנה הנוכחית' : 'Back to current year'}
            >
              <LucideIcon name="RotateCcw" size={12} />
              <span>{isHe ? 'הנוכחית' : 'Current'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Property Filter Pills */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        <button onClick={() => setSelectedAptId('all')}
          className={`px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all cursor-pointer ${selectedAptId === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
          {t('all_properties')} ({(apartments || []).length})
        </button>
        {(apartments || []).map(a => (
          <button key={a.id} onClick={() => setSelectedAptId(a.id)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all border cursor-pointer ${
              selectedAptId === a.id
                ? 'bg-indigo-600 text-white shadow-md border-indigo-600'
                : a.status === 'tenant'
                  ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-300'
                  : Number(a.targetRent) > 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300'
                    : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/40 dark:text-blue-300'
            }`}>
            {a.name}
          </button>
        ))}
      </div>

      {/* Summary KPI Cards for the Selected Year */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-4 rounded-2xl text-center shadow-xs">
          <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1">{t('income')} ({selectedYear})</div>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">₪{Math.round(totalSummary.income).toLocaleString()}</div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-4 rounded-2xl text-center shadow-xs">
          <div className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase mb-1">{t('expenses')} ({selectedYear})</div>
          <div className="text-lg font-black text-rose-700 dark:text-rose-400">₪{Math.round(totalSummary.expenses).toLocaleString()}</div>
        </div>
        <div className={`p-4 rounded-2xl text-center border shadow-xs ${totalSummary.net >= 0 ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/40' : 'bg-orange-50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/40'}`}>
          <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase mb-1">{t('net_profit')} ({selectedYear})</div>
          <div className={`text-lg font-black ${totalSummary.net >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-orange-700 dark:text-orange-400'}`}>₪{Math.round(totalSummary.net).toLocaleString()}</div>
        </div>
      </div>

      {/* Monthly Forecast Visual Bar Chart for Selected Year */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
            <LucideIcon name="BarChart2" size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t('monthly_forecast')} ({selectedYear})</span>
          </h3>
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm"></span>{t('income_col')}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-400 rounded-sm"></span>{t('expense_col')}</span>
          </div>
        </div>
        
        <div className="flex items-end gap-1 h-32 mb-2 pt-4 px-1">
          {monthlyTable.map((m, i) => {
            const isCurrentMonth = selectedYear === currentYearNum && i === currentMonthNum;
            return (
              <div key={i} className="flex-1 flex gap-0.5 items-end h-full justify-center group relative">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 z-20 bg-slate-900 text-white text-[9px] font-bold py-1 px-2 rounded-lg shadow-lg pointer-events-none whitespace-nowrap">
                  +{m.income} | -{m.expenses}
                </div>

                <div className={`w-full flex gap-0.5 items-end h-full justify-center p-0.5 rounded-t-lg ${isCurrentMonth ? 'bg-indigo-50/60 dark:bg-indigo-950/30 ring-1 ring-indigo-400/40' : ''}`}>
                  <div className="flex-1 bg-emerald-400 rounded-t-sm min-h-[2px] transition-all"
                    style={{ height: `${Math.max((m.income / maxBar) * 100, m.income > 0 ? 3 : 0)}%` }}
                    title={`${t('income_col')}: ₪${Math.round(m.income).toLocaleString()}`} />
                  <div className="flex-1 bg-rose-400 rounded-t-sm min-h-[2px] transition-all"
                    style={{ height: `${Math.max((m.expenses / maxBar) * 100, m.expenses > 0 ? 3 : 0)}%` }}
                    title={`${t('expenses')}: ₪${Math.round(m.expenses).toLocaleString()}`} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-1 border-t border-slate-100 dark:border-slate-700/60 pt-2 px-1">
          {monthlyTable.map((m, i) => {
            const isCurrentMonth = selectedYear === currentYearNum && i === currentMonthNum;
            return (
              <div key={i} className={`flex-1 text-center text-[9px] font-bold truncate ${isCurrentMonth ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-400 dark:text-slate-400'}`}>
                {m.name.slice(0, 3)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Detailed Table */}
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-4 bg-slate-50 dark:bg-slate-750 px-4 py-3 text-xs font-black text-slate-400 uppercase">
          <div>{t('month_col')} ({selectedYear})</div>
          <div className="text-center text-emerald-600 dark:text-emerald-400">{t('income_col')}</div>
          <div className="text-center text-rose-600 dark:text-rose-400">{t('expense_col')}</div>
          <div className="text-center text-indigo-600 dark:text-indigo-400">{t('balance_col')}</div>
        </div>
        {monthlyTable.map((m, i) => {
          const isCurrentMonth = selectedYear === currentYearNum && i === currentMonthNum;
          return (
            <div key={i} className={`grid grid-cols-4 px-4 py-3 border-b border-slate-50 dark:border-slate-800/80 text-sm items-center ${isCurrentMonth ? 'bg-indigo-50/60 dark:bg-indigo-950/20 font-black' : ''}`}>
              <div className="font-bold flex items-center gap-1.5">
                <span>{m.name}</span>
                {isCurrentMonth && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-md font-extrabold">
                    {isHe ? 'החודש' : 'Current'}
                  </span>
                )}
              </div>
              <div className="text-center text-emerald-600 dark:text-emerald-400 font-semibold">₪{Math.round(m.income).toLocaleString()}</div>
              <div className="text-center text-rose-600 dark:text-rose-400 font-semibold">₪{Math.round(m.expenses).toLocaleString()}</div>
              <div className={`text-center font-bold ${m.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>₪{Math.round(m.net).toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      {/* Recurring Budget Settings for Selected Apartment */}
      {selectedAptId !== 'all' && apartments.find(a => a.id === selectedAptId) && (() => {
        const apt = apartments.find(a => a.id === selectedAptId)!;
        const currentYearBudgets = getBudgetsFor(apt.id, selectedYear);
        const prevYearBudgets = getBudgetsFor(apt.id, selectedYear - 1);

        return (
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <LucideIcon name="Settings" size={18} className="text-indigo-600" />
                  <span>{t('recurring_expenses')} — {apt.name}</span>
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {isHe ? `תקציב הוצאות ייעודי לשנת ${selectedYear}` : `Budget specific to year ${selectedYear}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Copy from previous year button if current year has 0 items and previous has items */}
                {currentYearBudgets.length === 0 && prevYearBudgets.length > 0 && (
                  <button
                    onClick={() => handleCopyFromPreviousYear(apt.id, selectedYear - 1)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title={isHe ? `העתק נתוני תקציב משנת ${selectedYear - 1}` : `Copy budget from ${selectedYear - 1}`}
                  >
                    <LucideIcon name="Copy" size={14} />
                    <span>{isHe ? `שכפל מ-${selectedYear - 1}` : `Copy from ${selectedYear - 1}`}</span>
                  </button>
                )}

                <button 
                  onClick={() => { setEditingBudget(null); setShowForm(true); }}
                  className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <LucideIcon name="Plus" size={16} />
                  <span>{isHe ? `הוצאה שגרתית ל-${selectedYear}` : `Add to ${selectedYear}`}</span>
                </button>
              </div>
            </div>

            {currentYearBudgets.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 p-8 rounded-[2rem] text-center space-y-3">
                <LucideIcon name="CalendarPlus" size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                  {isHe 
                    ? `לא הוגדרו עדיין הוצאות שגרתיות לשנת ${selectedYear} עבור ${apt.name}` 
                    : `No recurring expenses defined for ${selectedYear} for ${apt.name}`}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button 
                    onClick={() => { setEditingBudget(null); setShowForm(true); }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <LucideIcon name="Plus" size={14} />
                    <span>{isHe ? `הזן הוצאה חדשה לשנת ${selectedYear}` : `Enter new expense for ${selectedYear}`}</span>
                  </button>
                  {prevYearBudgets.length > 0 && (
                    <button
                      onClick={() => handleCopyFromPreviousYear(apt.id, selectedYear - 1)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <LucideIcon name="Copy" size={14} />
                      <span>{isHe ? `העתק נתוני תקציב משנת ${selectedYear - 1} (${prevYearBudgets.length} סעיפים)` : `Copy from ${selectedYear - 1} (${prevYearBudgets.length} items)`}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {currentYearBudgets.map(b => {
                  const annual = annualAmount(b.amount, b.freqMonths);
                  const freq = FREQ_OPTIONS.find(f => f.id === String(b.freqMonths));
                  return (
                    <div key={b.id} className="bg-white dark:bg-slate-800 p-4 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-xl text-rose-500"><LucideIcon name="Receipt" size={20} /></div>
                        <div className="text-start">
                          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span>
                              {(b.category === 'mortgage' || b.category === 'mortgage_payment') ? (isHe ? 'משכנתא' : 'Mortgage') : 
                               (b.category === 'rent' || b.category === 'rent_expense' || b.category === 'rent_payment') ? (isHe ? 'שכר דירה' : 'Rent') : 
                               (t(b.category) || b.category)}
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-md">
                              {selectedYear}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-300 mt-0.5">{freq?.name} · {apt.currency || '₪'}{Number(b.amount).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-end">
                          <div className="font-black text-rose-600 dark:text-rose-400 text-sm">₪{Math.round(annual).toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">{isHe ? 'לשנה' : '/ year'}</div>
                        </div>
                        <button onClick={() => { setEditingBudget(b); setShowForm(true); }} className="p-2 bg-slate-50 dark:bg-slate-700 text-indigo-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-650 cursor-pointer"><LucideIcon name="Edit2" size={16} /></button>
                        <button onClick={() => confirm(isHe ? `האם למחוק הוצאה שגרתית זו משנת ${selectedYear}?` : `Delete recurring budget item from ${selectedYear}?`) && onDelete(b.id)} className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"><LucideIcon name="Trash2" size={16} /></button>
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
