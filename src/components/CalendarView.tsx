import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';
import { Apartment, Payment, Expense, Repair } from '../types';

interface CalendarViewProps {
  apartments: Apartment[];
  payments: Payment[];
  expenses: Expense[];
  repairs: Repair[];
  t: (key: string) => string;
  lang: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  apartments,
  payments,
  expenses,
  repairs,
  t,
  lang
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const events: { [day: number]: any[] } = {};
  const addEvent = (day: number, item: any) => {
    if (!events[day]) events[day] = [];
    events[day].push(item);
  };

  // 1. Gather Payments
  payments.filter(p => p.date && p.date.startsWith(monthStr)).forEach(p => {
    const d = parseInt(p.date.split('-')[2]);
    const apt = apartments.find(a => a.id === p.aptId);
    addEvent(d, { 
      id: p.id || `p-${p.date}-${p.amount}`,
      type: 'income',
      color: 'bg-emerald-400', 
      label: `+₪${Number(p.amount || 0).toLocaleString()}`, 
      apt: apt?.name || (lang === 'he' ? 'נכס כללי' : 'General Property'), 
      amount: Number(p.amount || 0),
      notes: p.notes || '',
      title: lang === 'he' ? 'תקבול שכירות' : 'Rent Payment',
      icon: 'Coins'
    });
  });

  // 2. Gather Expenses
  expenses.filter(e => {
    const dateStr = e.actualPaymentDate || e.paymentDate || (e.monthFrom ? e.monthFrom + '-01' : null);
    return dateStr && dateStr.startsWith(monthStr);
  }).forEach(e => {
    const dStr = e.actualPaymentDate || e.paymentDate || (e.monthFrom ? e.monthFrom + '-01' : '');
    const d = parseInt(dStr.split('-')[2]);
    const apt = apartments.find(a => a.id === e.aptId);
    
    // Get Hebrew translation for expense type
    let expTypeLabel = e.type || '';
    const isMortgage = e.type === 'mortgage' || e.expenseType === 'mortgage' || e.expenseType === 'mortgage_payment';
    
    if (lang === 'he') {
      if (e.type === 'arnona') expTypeLabel = 'ארנונה';
      else if (e.type === 'electricity') expTypeLabel = 'חשמל';
      else if (e.type === 'water') expTypeLabel = 'מים';
      else if (e.type === 'gas') expTypeLabel = 'גז';
      else if (e.type === 'hoa') expTypeLabel = 'ועד בית';
      else if (e.type === 'mortgage' || isMortgage) expTypeLabel = 'משכנתא';
      else if (e.type === 'insurance') expTypeLabel = 'ביטוח';
      else if (e.type === 'management_fee') expTypeLabel = 'דמי ניהול';
      else expTypeLabel = 'הוצאה שוטפת';
    } else {
      if (e.type === 'arnona') expTypeLabel = 'Property Tax (Arnona)';
      else if (e.type === 'electricity') expTypeLabel = 'Electricity';
      else if (e.type === 'water') expTypeLabel = 'Water';
      else if (e.type === 'gas') expTypeLabel = 'Gas';
      else if (e.type === 'hoa') expTypeLabel = 'HOA / Committee';
      else if (e.type === 'mortgage' || isMortgage) expTypeLabel = 'Mortgage';
      else if (e.type === 'insurance') expTypeLabel = 'Insurance';
      else if (e.type === 'management_fee') expTypeLabel = 'Management Fee';
      else expTypeLabel = 'Expense';
    }

    addEvent(d, { 
      id: e.id || `e-${dStr}-${e.amount}`,
      type: isMortgage ? 'mortgage' : 'expense',
      color: isMortgage ? 'bg-blue-400' : 'bg-rose-400', 
      label: `-₪${Number(e.amount || 0).toLocaleString()}`, 
      apt: apt?.name || (lang === 'he' ? 'נכס כללי' : 'General Property'), 
      amount: Number(e.amount || 0),
      notes: e.notes || '',
      title: expTypeLabel,
      icon: isMortgage ? 'Landmark' : 'Receipt'
    });
  });

  // 3. Gather Repairs
  repairs.filter(r => r.date && r.date.startsWith(monthStr)).forEach(r => {
    const d = parseInt(r.date.split('-')[2]);
    const apt = apartments.find(a => a.id === r.aptId);
    addEvent(d, { 
      id: r.id || `r-${r.date}-${r.cost}`,
      type: 'repair',
      color: 'bg-orange-400', 
      label: `-₪${Number(r.cost || 0).toLocaleString()}`, 
      apt: apt?.name || (lang === 'he' ? 'נכס כללי' : 'General Property'), 
      amount: Number(r.cost || 0),
      notes: r.description || r.notes || '',
      title: lang === 'he' ? 'תיקון ותחזוקה' : 'Repair & Maintenance',
      icon: 'Wrench'
    });
  });

  const dayNames = lang === 'he'
    ? ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthIncome = payments.filter(p => p.date && p.date.startsWith(monthStr)).reduce((s, p) => s + Number(p.amount || 0), 0);
  const monthExpenses = [
    ...expenses.filter(e => {
      const ds = e.actualPaymentDate || e.paymentDate || (e.monthFrom ? e.monthFrom + '-01' : null);
      return ds && ds.startsWith(monthStr);
    }).map(e => ({ amount: e.amount })),
    ...repairs.filter(r => r.date && r.date.startsWith(monthStr)).map(r => ({ amount: r.cost }))
  ].reduce((s, e) => s + Number(e.amount || 0), 0);

  // Get active selected day events
  const selectedDayEvents = selectedDay ? (events[selectedDay] || []) : [];

  return (
    <div className="space-y-5 animate-in fade-in duration-300 text-start">
      {/* Month Switcher Header */}
      <div className="flex items-center justify-between px-1">
        <button 
          onClick={() => {
            setCurrentDate(new Date(year, month - 1, 1));
            setSelectedDay(null); // Reset selected day to avoid stale selection
          }} 
          className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-500 hover:text-indigo-600 transition-colors border border-slate-100 dark:border-slate-700/50"
        >
          <LucideIcon name="ChevronRight" size={22} className="rtl:rotate-0 ltr:rotate-180" />
        </button>
        <h2 className="text-xl font-black capitalize text-slate-800 dark:text-white">{monthName}</h2>
        <button 
          onClick={() => {
            setCurrentDate(new Date(year, month + 1, 1));
            setSelectedDay(null);
          }} 
          className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-500 hover:text-indigo-600 transition-colors border border-slate-100 dark:border-slate-700/50"
        >
          <LucideIcon name="ChevronLeft" size={22} className="rtl:rotate-0 ltr:rotate-180" />
        </button>
      </div>

      {/* Month Quick Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/70 dark:border-emerald-900/40 p-4 rounded-2xl text-center shadow-xs">
          <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">{t('income_label')}</div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">₪{monthIncome.toLocaleString()}</div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100/70 dark:border-rose-900/40 p-4 rounded-2xl text-center shadow-xs">
          <div className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">{t('expenses_label')}</div>
          <div className="text-xl font-black text-rose-700 dark:text-rose-400">₪{monthExpenses.toLocaleString()}</div>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] shadow-sm border border-slate-100 dark:border-slate-700/60 p-5">
        <div className="grid grid-cols-7 mb-2 border-b border-slate-100 dark:border-slate-700/40 pb-2">
          {dayNames.map(d => <div key={d} className="text-center text-[11px] font-black text-slate-400 dark:text-slate-300 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            
            const dayEvents = events[day] || [];
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`min-h-[62px] p-1.5 rounded-2xl flex flex-col justify-between text-start transition-all duration-200 group relative
                  ${isSelected 
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20 shadow-md transform scale-105 z-10' 
                    : isToday 
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 ring-2 ring-indigo-400/50 text-slate-800 dark:text-white' 
                      : 'bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700/80'
                  }`}
              >
                {/* Day number */}
                <span className={`text-xs font-black self-end ${isSelected ? 'text-white' : isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-300'}`}>
                  {day}
                </span>

                {/* Event indicators */}
                <div className="flex flex-col gap-1 w-full mt-1">
                  {dayEvents.slice(0, 2).map((ev, ei) => (
                    <div 
                      key={ei} 
                      className={`text-[8px] font-black px-1.5 py-0.5 rounded-md truncate leading-tight w-full shadow-2xs
                        ${isSelected ? 'bg-white/20 text-white' : `${ev.color} text-white`}`}
                      title={`${ev.apt}: ${ev.label}`}
                    >
                      {ev.label}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className={`text-[8px] font-black text-center ${isSelected ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-300'}`}>
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>

                {/* Dot marker if has events but no space */}
                {dayEvents.length > 0 && isSelected && (
                  <span className="absolute bottom-1 right-1 flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar Legend */}
      <div className="flex gap-4 justify-center text-xs font-bold text-slate-500 dark:text-slate-300 py-1 bg-slate-50 dark:bg-slate-800/20 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50 flex-wrap">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-2xs" />{t('income_event')}</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block shadow-2xs" />{t('expense_event')}</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block shadow-2xs" />{lang === 'he' ? 'משכנתא' : 'Mortgage'}</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block shadow-2xs" />{t('repairs')}</div>
      </div>

      {/* Lower Details Section: CLICK TO VIEW DETAIL FOR THE SPECIFIC EVENT AND ITS ASSIGNED PROPERTY */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.2rem] shadow-xl border border-slate-150 dark:border-slate-800 p-6 space-y-4 transition-all duration-300">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <LucideIcon name="Calendar" size={20} className="text-indigo-500" />
            <h3 className="font-black text-base text-slate-850 dark:text-slate-100">
              {lang === 'he' 
                ? `פירוט אירועים ליום ${selectedDay || ''} ב${monthName}` 
                : `Event details for day ${selectedDay || ''} of ${monthName}`}
            </h3>
          </div>
          {selectedDayEvents.length > 0 && (
            <span className="text-xs font-black px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full">
              {selectedDayEvents.length} {lang === 'he' ? 'אירועים' : 'Events'}
            </span>
          )}
        </div>

        {selectedDayEvents.length > 0 ? (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {selectedDayEvents.map((ev, index) => (
              <div 
                key={index} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 gap-3"
              >
                <div className="flex items-center gap-3">
                  {/* Category Styled Badge */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shadow-slate-100 dark:shadow-none
                    ${ev.type === 'income' ? 'bg-gradient-to-tr from-emerald-500 to-teal-400' : ''}
                    ${ev.type === 'expense' ? 'bg-gradient-to-tr from-rose-500 to-pink-500' : ''}
                    ${ev.type === 'repair' ? 'bg-gradient-to-tr from-orange-500 to-amber-500' : ''}
                    ${ev.type === 'mortgage' ? 'bg-gradient-to-tr from-blue-500 to-indigo-500' : ''}
                  `}>
                    <LucideIcon name={ev.icon || 'Circle'} size={18} />
                  </div>

                  <div>
                    {/* Event Title */}
                    <div className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span>{ev.title}</span>
                      {/* Property Badge */}
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                        <LucideIcon name="Home" size={10} />
                        {ev.apt}
                      </span>
                    </div>
                    {/* Notes / Description */}
                    {ev.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 font-semibold leading-relaxed">
                        {ev.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Amount / Value */}
                <div className={`text-base font-black text-right self-end sm:self-center
                  ${ev.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 
                    ev.type === 'mortgage' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}
                `}>
                  {ev.label}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State for Selected Day */
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl bg-slate-50/20 dark:bg-slate-900/10">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-300 mb-3 animate-bounce">
              <LucideIcon name="Sparkles" size={20} className="text-indigo-400" />
            </div>
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-200">
              {lang === 'he' ? 'הכל שקט ביום זה!' : 'All quiet on this day!'}
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-300 mt-1 font-bold">
              {lang === 'he' 
                ? 'אין אירועים, תקבולים או תשלומים שוטפים מתוכננים.' 
                : 'No scheduled collections, maintenance actions or expenses.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
