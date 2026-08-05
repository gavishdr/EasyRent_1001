import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';
import { Apartment, Payment, Expense, Repair, CalendarEvent } from '../types';

interface CalendarViewProps {
  apartments: Apartment[];
  payments: Payment[];
  expenses: Expense[];
  repairs: Repair[];
  calendarEvents?: CalendarEvent[];
  onSaveCalendarEvent?: (data: Partial<CalendarEvent>, id?: string) => Promise<void> | void;
  onDeleteCalendarEvent?: (id: string) => Promise<void> | void;
  t: (key: string) => string;
  lang: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  apartments,
  payments,
  expenses,
  repairs,
  calendarEvents = [],
  onSaveCalendarEvent,
  onDeleteCalendarEvent,
  t,
  lang
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  
  // Modal State for Custom Calendar Events
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState<{
    aptId: string;
    date: string;
    title: string;
    category: string;
    notes: string;
  }>({
    aptId: '',
    date: new Date().toISOString().split('T')[0],
    title: '',
    category: 'handover',
    notes: ''
  });

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

  // Helper to format date string YYYY-MM-DD
  const getFormattedDateForDay = (dayNum?: number | null) => {
    const dToUse = dayNum || selectedDay || new Date().getDate();
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(dToUse).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  };

  const openAddModal = (dayNum?: number | null) => {
    const defaultApt = apartments.length > 0 ? apartments[0].id : '';
    setEditingEvent(null);
    setEventForm({
      aptId: defaultApt,
      date: getFormattedDateForDay(dayNum),
      title: '',
      category: 'handover',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ce: CalendarEvent) => {
    setEditingEvent(ce);
    setEventForm({
      aptId: ce.aptId || '',
      date: ce.date || getFormattedDateForDay(),
      title: ce.title || '',
      category: ce.category || 'general',
      notes: ce.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim()) {
      alert(lang === 'he' ? 'נא להזין כותרת לאירוע' : 'Please enter an event title');
      return;
    }
    if (onSaveCalendarEvent) {
      await onSaveCalendarEvent({
        aptId: eventForm.aptId,
        date: eventForm.date,
        title: eventForm.title.trim(),
        category: eventForm.category,
        notes: eventForm.notes.trim()
      }, editingEvent?.id);
    }
    setIsModalOpen(false);
  };

  const handleDeleteCustomEvent = async (id: string) => {
    if (confirm(lang === 'he' ? 'האם למחוק אירוע זה מהיומן?' : 'Delete this calendar event?')) {
      if (onDeleteCalendarEvent) {
        await onDeleteCalendarEvent(id);
      }
    }
  };

  // 1. Gather Payments
  payments.filter(p => p.date && p.date.startsWith(monthStr)).forEach(p => {
    const d = parseInt(p.date.split('-')[2]);
    const apt = apartments.find(a => a.id === p.aptId);
    addEvent(d, { 
      id: p.id || `p-${p.date}-${p.amount}`,
      type: 'income',
      color: 'bg-emerald-400', 
      label: `+₪${Math.round(Number(p.amount || 0)).toLocaleString()}`, 
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
    
    let expTypeLabel = e.type || '';
    const isMortgage = e.type === 'mortgage' || (e as any).expenseType === 'mortgage' || (e as any).expenseType === 'mortgage_payment';
    
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
      label: `-₪${Math.round(Number(e.amount || 0)).toLocaleString()}`, 
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
      label: `-₪${Math.round(Number(r.cost || 0)).toLocaleString()}`, 
      apt: apt?.name || (lang === 'he' ? 'נכס כללי' : 'General Property'), 
      amount: Number(r.cost || 0),
      notes: (r as any).description || r.notes || '',
      title: lang === 'he' ? 'תיקון ותחזוקה' : 'Repair & Maintenance',
      icon: 'Wrench'
    });
  });

  // 4. Gather Custom Calendar Events
  (calendarEvents || []).filter(ce => ce.date && ce.date.startsWith(monthStr)).forEach(ce => {
    const d = parseInt(ce.date.split('-')[2]);
    const apt = apartments.find(a => a.id === ce.aptId);
    
    let catIcon = 'BookmarkCheck';
    if (ce.category === 'handover') catIcon = 'KeyRound';
    else if (ce.category === 'defect') catIcon = 'AlertTriangle';
    else if (ce.category === 'inspection') catIcon = 'ClipboardCheck';

    addEvent(d, {
      id: ce.id,
      type: 'custom_event',
      color: 'bg-purple-500',
      label: ce.title || (lang === 'he' ? 'אירוע יומן' : 'Diary Note'),
      apt: apt?.name || (lang === 'he' ? 'נכס כללי' : 'General'),
      amount: 0,
      notes: ce.notes || '',
      title: ce.title,
      category: ce.category || 'general',
      icon: catIcon,
      rawEvent: ce
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

  const categoryPresets = [
    { id: 'handover', icon: 'KeyRound', labelHe: 'החלפת דייר / מסירה', labelEn: 'Tenant Handover' },
    { id: 'defect', icon: 'AlertTriangle', labelHe: 'תיעוד ליקוי / קילוף/נזק', labelEn: 'Defect / Damage' },
    { id: 'inspection', icon: 'ClipboardCheck', labelHe: 'בדיקת נכס / ביקור', labelEn: 'Property Inspection' },
    { id: 'general', icon: 'NotebookPen', labelHe: 'אירוע כללי / הערה', labelEn: 'General Event / Note' }
  ];

  const titleSuggestionsHe = [
    'מסירת דירה - דייר נכנס',
    'פינוי דירה - דייר יוצא',
    'קילוף בקירות / סדקים בחדר',
    'בדיקת מוני חשמל ומים',
    'ביקור נכס תקופתי',
    'החלפת מנעול / צילינדר'
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300 text-start">
      {/* Month Switcher & New Event Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setCurrentDate(new Date(year, month - 1, 1));
              setSelectedDay(null);
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

        {/* Quick Add Custom Calendar Event Button */}
        <button
          onClick={() => openAddModal(selectedDay)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-purple-200 dark:shadow-none transition-all duration-200"
        >
          <LucideIcon name="CalendarPlus" size={18} />
          <span>{lang === 'he' ? 'הוסף אירוע / תיעוד ליומן' : 'Add Event / Note'}</span>
        </button>
      </div>

      {/* Month Quick Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/70 dark:border-emerald-900/40 p-4 rounded-2xl text-center shadow-xs">
          <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">{t('income_label')}</div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">₪{Math.round(monthIncome).toLocaleString()}</div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100/70 dark:border-rose-900/40 p-4 rounded-2xl text-center shadow-xs">
          <div className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">{t('expenses_label')}</div>
          <div className="text-xl font-black text-rose-700 dark:text-rose-400">₪{Math.round(monthExpenses).toLocaleString()}</div>
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
                className={`min-h-[64px] p-1.5 rounded-2xl flex flex-col justify-between text-start transition-all duration-200 group relative
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
                      className={`text-[8px] font-black px-1.5 py-0.5 rounded-md truncate leading-tight w-full shadow-2xs flex items-center gap-1
                        ${isSelected ? 'bg-white/20 text-white' : `${ev.color} text-white`}`}
                      title={`${ev.apt}: ${ev.label}`}
                    >
                      {ev.type === 'custom_event' && <LucideIcon name={ev.icon} size={9} className="flex-shrink-0" />}
                      <span className="truncate">{ev.label}</span>
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
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block shadow-2xs" />{lang === 'he' ? 'אירוע / תיעוד ליומן' : 'Event / Note'}</div>
      </div>

      {/* Lower Details Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.2rem] shadow-xl border border-slate-150 dark:border-slate-800 p-6 space-y-4 transition-all duration-300">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <LucideIcon name="Calendar" size={20} className="text-indigo-500" />
            <h3 className="font-black text-base text-slate-850 dark:text-slate-100">
              {lang === 'he' 
                ? `פירוט אירועים ליום ${selectedDay || ''} ב${monthName}` 
                : `Event details for day ${selectedDay || ''} of ${monthName}`}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {selectedDayEvents.length > 0 && (
              <span className="text-xs font-black px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full">
                {selectedDayEvents.length} {lang === 'he' ? 'אירועים' : 'Events'}
              </span>
            )}

            <button
              onClick={() => openAddModal(selectedDay)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 rounded-xl font-bold text-xs transition-colors"
            >
              <LucideIcon name="CalendarPlus" size={15} />
              <span>{lang === 'he' ? 'הוסף אירוע ליום זה' : 'Add event for this day'}</span>
            </button>
          </div>
        </div>

        {selectedDayEvents.length > 0 ? (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {selectedDayEvents.map((ev, index) => (
              <div 
                key={index} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 gap-3"
              >
                <div className="flex items-start gap-3">
                  {/* Category Styled Badge */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shadow-slate-100 dark:shadow-none flex-shrink-0 mt-0.5
                    ${ev.type === 'income' ? 'bg-gradient-to-tr from-emerald-500 to-teal-400' : ''}
                    ${ev.type === 'expense' ? 'bg-gradient-to-tr from-rose-500 to-pink-500' : ''}
                    ${ev.type === 'repair' ? 'bg-gradient-to-tr from-orange-500 to-amber-500' : ''}
                    ${ev.type === 'mortgage' ? 'bg-gradient-to-tr from-blue-500 to-indigo-500' : ''}
                    ${ev.type === 'custom_event' ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' : ''}
                  `}>
                    <LucideIcon name={ev.icon || 'Circle'} size={18} />
                  </div>

                  <div>
                    {/* Event Title */}
                    <div className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                      <span>{ev.title}</span>
                      {/* Property Badge */}
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                        <LucideIcon name="Home" size={10} />
                        {ev.apt}
                      </span>
                      {ev.type === 'custom_event' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-300 px-2 py-0.5 rounded-full">
                          {lang === 'he' ? 'אירוע יומן' : 'Diary Event'}
                        </span>
                      )}
                    </div>
                    {/* Notes / Description */}
                    {ev.notes && (
                      <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 font-medium leading-relaxed shadow-2xs whitespace-pre-line">
                        {ev.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount or Actions */}
                {ev.type === 'custom_event' ? (
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => openEditModal(ev.rawEvent)}
                      className="p-2 bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 rounded-xl transition-colors shadow-2xs"
                      title={lang === 'he' ? 'ערוך אירוע' : 'Edit event'}
                    >
                      <LucideIcon name="Edit2" size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomEvent(ev.id)}
                      className="p-2 bg-white dark:bg-slate-700 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shadow-2xs"
                      title={lang === 'he' ? 'מחק אירוע' : 'Delete event'}
                    >
                      <LucideIcon name="Trash2" size={16} />
                    </button>
                  </div>
                ) : (
                  <div className={`text-base font-black text-right self-end sm:self-center
                    ${ev.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 
                      ev.type === 'mortgage' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}
                  `}>
                    {ev.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty State for Selected Day */
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl bg-slate-50/20 dark:bg-slate-900/10">
            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-500 mb-3">
              <LucideIcon name="CalendarPlus" size={22} />
            </div>
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-200">
              {lang === 'he' ? 'אין אירועים רשומים ליום זה' : 'No events logged for this day'}
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-300 mt-1 mb-4 font-bold">
              {lang === 'he' 
                ? 'רוצה לתעד מסירת דירה, החלפת דיירים, בדיקת ליקויים או הערה כללית?' 
                : 'Want to log a tenant handover, property check, or damage note?'}
            </p>
            <button
              onClick={() => openAddModal(selectedDay)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-purple-700 transition-all"
            >
              <LucideIcon name="CalendarPlus" size={16} />
              <span>{lang === 'he' ? 'הוסף אירוע/תיעוד ליום זה' : 'Add Event / Note'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal for Adding/Editing Calendar Events */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 text-start space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 dark:bg-purple-950/50 text-purple-600 rounded-xl">
                  <LucideIcon name="CalendarPlus" size={20} />
                </div>
                <h3 className="font-black text-lg text-slate-800 dark:text-white">
                  {editingEvent 
                    ? (lang === 'he' ? 'עריכת אירוע ביומן' : 'Edit Calendar Event')
                    : (lang === 'he' ? 'הוספת אירוע / תיעוד ליומן' : 'Add Event to Calendar')}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <LucideIcon name="X" size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              {/* Category selector */}
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1.5">
                  {lang === 'he' ? 'סוג האירוע / התיעוד' : 'Event Category'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categoryPresets.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEventForm(f => ({ ...f, category: cat.id }))}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                        eventForm.category === cat.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <LucideIcon name={cat.icon} size={16} />
                      <span>{lang === 'he' ? cat.labelHe : cat.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Property dropdown */}
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1">
                  {lang === 'he' ? 'שיוך לנכס' : 'Property'}
                </label>
                <select
                  value={eventForm.aptId}
                  onChange={e => setEventForm(f => ({ ...f, aptId: e.target.value }))}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">{lang === 'he' ? 'כללי / כל הנכסים' : 'General / All Properties'}</option>
                  {apartments.map(apt => (
                    <option key={apt.id} value={apt.id}>{apt.name || apt.address}</option>
                  ))}
                </select>
              </div>

              {/* Date picker */}
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1">
                  {lang === 'he' ? 'תאריך האירוע' : 'Event Date'}
                </label>
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              {/* Title input with quick presets */}
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1">
                  {lang === 'he' ? 'כותרת האירוע' : 'Event Title'}
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={lang === 'he' ? 'לדוגמה: החלפת דייר / קילוף בקירות' : 'e.g., Tenant Move-In / Wall Peeling'}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
                
                {/* Quick title suggestions in Hebrew */}
                {lang === 'he' && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 w-full mb-0.5">הצעות מהירות:</span>
                    {titleSuggestionsHe.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEventForm(f => ({ ...f, title: sug }))}
                        className="text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 px-2 py-1 rounded-lg border border-purple-100 dark:border-purple-900/50 font-medium transition-colors"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details / Notes */}
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1">
                  {lang === 'he' ? 'תיאור / פירוט התיעוד' : 'Details / Notes'}
                </label>
                <textarea
                  value={eventForm.notes}
                  onChange={e => setEventForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder={lang === 'he' ? 'לדוגמה: מצאתי שקיים קילוף בקירות ולכן תיעדתי לגבי הדייר היוצא...' : 'Write any inspection or handover notes here...'}
                  rows={3}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                />
              </div>

              {/* Submit / Cancel buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  {t('cancel') || 'בטל'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-200 dark:shadow-none hover:from-purple-700 hover:to-indigo-700 transition-all"
                >
                  {lang === 'he' ? 'שמור אירוע' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
