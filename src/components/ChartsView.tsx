import React from 'react';
import { LucideIcon } from './LucideIcon';
import { Apartment, Payment, Expense, Repair } from '../types';

interface ChartsViewProps {
  apartments: Apartment[];
  payments: Payment[];
  expenses: Expense[];
  repairs: Repair[];
  t: (key: string) => string;
  lang: string;
}

export const ChartsView: React.FC<ChartsViewProps> = ({
  apartments,
  payments,
  expenses,
  repairs,
  t,
  lang
}) => {
  const currentYear = new Date().getFullYear();
  const curSymbol = '₪';

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, i, 1);
    return {
      label: d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { month: 'short' }),
      key: `${currentYear}-${String(i + 1).padStart(2, '0')}`
    };
  });

  const monthlyData = months.map(m => {
    const income = payments.filter(p => p.date && p.date.startsWith(m.key)).reduce((s, p) => s + Number(p.amount || 0), 0);
    const exp = expenses.filter(e => {
      const ds = e.actualPaymentDate || e.paymentDate || (e.monthFrom ? e.monthFrom + '-01' : null);
      return ds && ds.startsWith(m.key);
    }).reduce((s, e) => s + Number(e.amount || 0), 0);
    const rep = repairs.filter(r => r.date && r.date.startsWith(m.key)).reduce((s, r) => s + Number(r.cost || 0), 0);
    return { ...m, income, expenses: exp + rep };
  });

  const maxVal = Math.max(...monthlyData.flatMap(d => [d.income, d.expenses]), 1);

  const expenseByType: { [key: string]: number } = {};
  expenses.filter(e => {
    const ds = e.actualPaymentDate || e.paymentDate || (e.monthFrom ? e.monthFrom + '-01' : null) || '';
    return ds.startsWith(String(currentYear));
  }).forEach(e => {
    const key = e.type || 'other';
    expenseByType[key] = (expenseByType[key] || 0) + Number(e.amount || 0);
  });

  repairs.filter(r => r.date && r.date.startsWith(String(currentYear))).forEach(r => {
    expenseByType['repairs'] = (expenseByType['repairs'] || 0) + Number(r.cost || 0);
  });

  const pieColors = ['#6366f1', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  const pieEntries = Object.entries(expenseByType).sort((a, b) => b[1] - a[1]);
  const totalExpenses = pieEntries.reduce((s, [, v]) => s + v, 0);

  const buildPie = () => {
    if (pieEntries.length === 0) return null;
    let startAngle = -Math.PI / 2;
    const cx = 80, cy = 80, r = 65;
    const slices = pieEntries.map(([key, val], i) => {
      const angle = (val / totalExpenses) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(startAngle + angle);
      const y2 = cy + r * Math.sin(startAngle + angle);
      const largeArc = angle > Math.PI ? 1 : 0;
      const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
      startAngle += angle;
      return <path key={key} d={d} fill={pieColors[i % pieColors.length]} opacity="0.9" />;
    });
    return (
      <svg viewBox="0 0 160 160" className="w-40 h-40 mx-auto drop-shadow-lg">
        {slices}
        <circle cx={cx} cy={cy} r="32" className="fill-white dark:fill-slate-800" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="8" fontWeight="bold" className="fill-slate-400 dark:fill-slate-500">סה״כ</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="9" fontWeight="bold" className="fill-slate-800 dark:fill-white">{curSymbol}{(totalExpenses / 1000).toFixed(0)}K</text>
      </svg>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-start">
      <h2 className="text-2xl font-black">{t('charts_tab')}</h2>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-black text-slate-700 dark:text-slate-300 mb-5 flex items-center gap-2">
          <LucideIcon name="BarChart2" size={18} />
          {t('monthly_chart')} {currentYear}
        </h3>
        {monthlyData.every(d => d.income === 0 && d.expenses === 0) ? (
          <p className="text-slate-400 dark:text-slate-300 text-center py-6">{t('no_chart_data')}</p>
        ) : (
          <>
            <div className="flex items-end gap-1 h-40 mb-2">
              {monthlyData.map(m => (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                  <div className="w-full flex gap-0.5 items-end justify-center h-full">
                    <div className="flex-1 bg-emerald-400 rounded-t-md transition-all duration-500 hover:bg-emerald-500 min-h-[2px]" style={{ height: `${Math.max((m.income / maxVal) * 100, 2)}%` }} title={`${curSymbol}${m.income.toLocaleString()}`} />
                    <div className="flex-1 bg-rose-400 rounded-t-md transition-all duration-500 hover:bg-rose-500 min-h-[2px]" style={{ height: `${Math.max((m.expenses / maxVal) * 100, 2)}%` }} title={`${curSymbol}${m.expenses.toLocaleString()}`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              {monthlyData.map(m => (
                <div key={m.key} className="flex-1 text-center text-[9px] text-slate-400 dark:text-slate-300 font-bold">{m.label}</div>
              ))}
            </div>
            <div className="flex gap-4 justify-center mt-3 text-xs font-bold">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />{t('income_label')}</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />{t('expenses_label')}</div>
            </div>
          </>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-black text-slate-700 dark:text-slate-300 mb-5 flex items-center gap-2">
          <LucideIcon name="PieChart" size={18} />
          {t('expense_breakdown')} {currentYear}
        </h3>
        {pieEntries.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-300 text-center py-6">{t('no_chart_data')}</p>
        ) : (
          <div className="space-y-4">
            {buildPie()}
            <div className="space-y-2 mt-4">
              {pieEntries.map(([key, val], i) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                  <span className="text-sm text-slate-600 dark:text-slate-400 flex-1 font-medium">{key === 'repairs' ? t('repairs') : (t(key) || key)}</span>
                  <span className="text-sm font-black text-slate-800 dark:text-white">{curSymbol}{val.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-300 w-10 text-end">{Math.round((val / totalExpenses) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ChartsView;
