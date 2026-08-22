import React, { useState, useMemo } from 'react';
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

interface MonthEventItem {
  id: string;
  day: number;
  dateStr: string;
  displayDate: string;
  type: 'income' | 'expense' | 'mortgage' | 'repair' | 'custom_event';
  title: string;
  aptId?: string;
  aptName: string;
  amount: number;
  label: string;
  notes?: string;
  icon: string;
  category?: string;
  rawEvent?: any;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  apartments = [],
  payments = [],
  expenses = [],
  repairs = [],
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

  const isHe = lang !== 'en';
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString(isHe ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

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
      alert(isHe ? 'נא להזין כותרת לאירוע' : 'Please enter an event title');
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
    if (confirm(isHe ? 'האם למחוק אירוע זה מהיומן?' : 'Delete this calendar event?')) {
      if (onDeleteCalendarEvent) {
        await onDeleteCalendarEvent(id);
      }
    }
  };

  // Compile ALL monthly events
  const allMonthlyEvents = useMemo(() => {
    const list: MonthEventItem[] = [];

    // 1. Payments (Income)
    payments.filter(p => p.date && p.date.startsWith(monthStr)).forEach(p => {
      const parts = p.date.split('-');
      const d = parseInt(parts[2], 10);
      const apt = apartments.find(a => a.id === p.aptId);
      const displayDate = `${parts[2]}/${parts[1]}`;
      const amt = Number(p.amount || 0);

      list.push({
        id: p.id || `p-${p.date}-${p.amount}`,
        day: d,
        dateStr: p.date,
        displayDate,
        type: 'income',
        title: isHe ? 'תקבול שכירות' : 'Rent Payment',
        aptId: p.aptId,
        aptName: apt?.name || (isHe ? 'נכס כללי' : 'General Property'),
        amount: amt,
        label: `+₪${amt.toLocaleString('he-IL', { minimumFractionDigits: amt % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}`,
        notes: p.notes || (isHe ? 'תשלום שכר דירה.' : 'Rent payment.'),
        icon: 'Wallet'
      });
    });

    // 2. Expenses & Mortgages
    expenses.filter(e => {
      const dateStr = e.actualPaymentDate || e.paymentDate || (e.monthFrom ? e.monthFrom + '-01' : null);
      return dateStr && dateStr.startsWith(monthStr);
    }).forEach(e => {
      const dStr = e.actualPaymentDate || e.paymentDate || (e.monthFrom ? e.monthFrom + '-01' : '');
      const parts = dStr.split('-');
      const d = parseInt(parts[2], 10);
      const apt = apartments.find(a => a.id === e.aptId);
      const displayDate = `${parts[2] || '01'}/${parts[1] || String(month + 1).padStart(2, '0')}`;
      const amt = Number(e.amount || 0);

      let expTypeLabel = e.type || '';
      const isMortgage = e.type === 'mortgage' || (e as any).expenseType === 'mortgage' || (e as any).expenseType === 'mortgage_payment';

      if (isHe) {
        if (e.type === 'arnona') expTypeLabel = 'ארנונה';
        else if (e.type === 'electricity') expTypeLabel = 'חשמל';
        else if (e.type === 'water') expTypeLabel = 'מים';
        else if (e.type === 'gas') expTypeLabel = 'גז';
        else if (e.type === 'hoa') expTypeLabel = 'ועד בית';
        else if (e.type === 'mortgage' || isMortgage) expTypeLabel = 'משכנתא';
        else if (e.type === 'rent' || e.type === 'rent_expense' || e.type === 'rent_payment') expTypeLabel = 'שכר דירה';
        else if (e.type === 'insurance') expTypeLabel = 'ביטוח';
        else if (e.type === 'cleaning') expTypeLabel = 'ניקיון ותחזוקה';
        else if (e.type === 'gardening') expTypeLabel = 'גינון';
        else if (e.type === 'management_fee') expTypeLabel = 'דמי ניהול';
        else if (e.type === 'professional_services') expTypeLabel = 'שירותים מקצועיים';
        else if (e.type === 'taxes_fees') expTypeLabel = 'מיסים ואגרות';
        else if (e.type === 'supplies') expTypeLabel = 'ציוד שוטף';
        else expTypeLabel = 'הוצאה שוטפת';
      } else {
        if (e.type === 'arnona') expTypeLabel = 'Property Tax (Arnona)';
        else if (e.type === 'electricity') expTypeLabel = 'Electricity';
        else if (e.type === 'water') expTypeLabel = 'Water';
        else if (e.type === 'gas') expTypeLabel = 'Gas';
        else if (e.type === 'hoa') expTypeLabel = 'HOA / Committee';
        else if (e.type === 'mortgage' || isMortgage) expTypeLabel = 'Mortgage';
        else if (e.type === 'rent' || e.type === 'rent_expense' || e.type === 'rent_payment') expTypeLabel = 'Rent';
        else if (e.type === 'insurance') expTypeLabel = 'Insurance';
        else if (e.type === 'cleaning') expTypeLabel = 'Cleaning';
        else if (e.type === 'gardening') expTypeLabel = 'Gardening';
        else if (e.type === 'management_fee') expTypeLabel = 'Management Fee';
        else if (e.type === 'professional_services') expTypeLabel = 'Professional Services';
        else if (e.type === 'taxes_fees') expTypeLabel = 'Taxes & Fees';
        else if (e.type === 'supplies') expTypeLabel = 'Supplies';
        else expTypeLabel = 'Expense';
      }

      list.push({
        id: e.id || `e-${dStr}-${e.amount}`,
        day: d,
        dateStr: dStr,
        displayDate,
        type: isMortgage ? 'mortgage' : 'expense',
        title: expTypeLabel,
        aptId: e.aptId,
        aptName: apt?.name || (isHe ? 'נכס כללי' : 'General Property'),
        amount: amt,
        label: `-₪${amt.toLocaleString('he-IL', { minimumFractionDigits: amt % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}`,
        notes: e.notes || (e.voucherNumber ? `${isHe ? 'מס שובר' : 'Voucher'} ${e.voucherNumber}` : ''),
        icon: isMortgage ? 'Landmark' : 'Receipt'
      });
    });

    // 3. Repairs
    repairs.filter(r => r.date && r.date.startsWith(monthStr)).forEach(r => {
      const parts = r.date.split('-');
      const d = parseInt(parts[2], 10);
      const apt = apartments.find(a => a.id === r.aptId);
      const displayDate = `${parts[2]}/${parts[1]}`;
      const amt = Number(r.cost || 0);

      list.push({
        id: r.id || `r-${r.date}-${r.cost}`,
        day: d,
        dateStr: r.date,
        displayDate,
        type: 'repair',
        title: isHe ? 'תיקון ותחזוקה' : 'Repair & Maintenance',
        aptId: r.aptId,
        aptName: apt?.name || (isHe ? 'נכס כללי' : 'General Property'),
        amount: amt,
        label: `-₪${amt.toLocaleString('he-IL', { minimumFractionDigits: amt % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}`,
        notes: (r as any).description || r.notes || '',
        icon: 'Wrench'
      });
    });

    // 4. Custom Calendar Events (תיעוד ואירועי יומן)
    (calendarEvents || []).filter(ce => ce.date && ce.date.startsWith(monthStr)).forEach(ce => {
      const parts = ce.date.split('-');
      const d = parseInt(parts[2], 10);
      const apt = apartments.find(a => a.id === ce.aptId);
      const displayDate = `${parts[2]}/${parts[1]}`;

      let catIcon = 'NotebookPen';
      if (ce.category === 'handover') catIcon = 'KeyRound';
      else if (ce.category === 'defect') catIcon = 'AlertTriangle';
      else if (ce.category === 'inspection') catIcon = 'ClipboardCheck';

      list.push({
        id: ce.id,
        day: d,
        dateStr: ce.date,
        displayDate,
        type: 'custom_event',
        title: ce.title || (isHe ? 'אירוע יומן' : 'Diary Event'),
        aptId: ce.aptId,
        aptName: apt?.name || (isHe ? 'נכס כללי' : 'General Property'),
        amount: 0,
        label: ce.title,
        notes: ce.notes || '',
        icon: catIcon,
        category: ce.category || 'general',
        rawEvent: ce
      });
    });

    return list;
  }, [payments, expenses, repairs, calendarEvents, monthStr, apartments, isHe, month]);

  // Group events by day for calendar day badges and multi-color dots
  const eventsByDay = useMemo(() => {
    const map: { [day: number]: MonthEventItem[] } = {};
    allMonthlyEvents.forEach(item => {
      if (!map[item.day]) map[item.day] = [];
      map[item.day].push(item);
    });
    return map;
  }, [allMonthlyEvents]);

  // Events for the selected day specifically
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return eventsByDay[selectedDay] || [];
  }, [selectedDay, eventsByDay]);

  // Ordered list of all events for "All Monthly Events" section
  // When a user selects a date that has events, those events appear at top (highlighted), followed by the rest in chronological order!
  const sortedMonthlyEvents = useMemo(() => {
    if (!selectedDay || selectedDayEvents.length === 0) {
      // Natural chronological order 1 to 31
      return [...allMonthlyEvents].sort((a, b) => a.day - b.day);
    }

    const selectedEvents = allMonthlyEvents.filter(e => e.day === selectedDay);
    const otherEvents = allMonthlyEvents.filter(e => e.day !== selectedDay).sort((a, b) => a.day - b.day);

    return [...selectedEvents, ...otherEvents];
  }, [allMonthlyEvents, selectedDay, selectedDayEvents]);

  const dayNames = isHe
    ? ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthIncome = allMonthlyEvents.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const monthExpenses = allMonthlyEvents.filter(e => e.type !== 'income' && e.type !== 'custom_event').reduce((s, e) => s + e.amount, 0);

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

  // Helper to render individual event card matching user screenshot exactly with Date clearly visible
  const renderEventCard = (ev: MonthEventItem, isSelectedHighlight = false) => {
    const isIncome = ev.type === 'income';
    const isExpense = ev.type === 'expense';
    const isMortgage = ev.type === 'mortgage';
    const isRepair = ev.type === 'repair';
    const isCustom = ev.type === 'custom_event';

    let cardBg = 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700';
    let iconBg = 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200';
    let titleColor = 'text-slate-800 dark:text-white';
    let amountColor = 'text-slate-700 dark:text-slate-300';

    if (isIncome) {
      cardBg = 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/30';
      iconBg = 'bg-white dark:bg-slate-800 text-emerald-600 border-emerald-100 dark:border-emerald-800/50';
      titleColor = 'text-emerald-800 dark:text-emerald-300';
      amountColor = 'text-emerald-600 dark:text-emerald-400';
    } else if (isExpense) {
      cardBg = 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/30';
      iconBg = 'bg-white dark:bg-slate-800 text-rose-500 border-rose-100 dark:border-rose-800/50';
      titleColor = 'text-rose-600 dark:text-rose-400';
      amountColor = 'text-rose-600 dark:text-rose-400';
    } else if (isMortgage) {
      cardBg = 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/30';
      iconBg = 'bg-white dark:bg-slate-800 text-blue-600 border-blue-100 dark:border-blue-800/50';
      titleColor = 'text-blue-700 dark:text-blue-300';
      amountColor = 'text-blue-700 dark:text-blue-400';
    } else if (isRepair) {
      cardBg = 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/30';
      iconBg = 'bg-white dark:bg-slate-800 text-amber-500 border-amber-100 dark:border-amber-800/50';
      titleColor = 'text-amber-700 dark:text-amber-300';
      amountColor = 'text-amber-700 dark:text-amber-400';
    } else if (isCustom) {
      cardBg = 'bg-purple-50/70 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-900/30';
      iconBg = 'bg-white dark:bg-slate-800 text-purple-600 border-purple-100 dark:border-purple-800/50';
      titleColor = 'text-purple-700 dark:text-purple-300';
      amountColor = 'text-purple-700 dark:text-purple-300';
    }

    return (
      <div 
        key={ev.id}
        className={`rounded-2xl p-4 border transition-all duration-200 flex items-center justify-between gap-3 shadow-xs ${cardBg} ${
          isSelectedHighlight ? 'ring-2 ring-indigo-500/50 shadow-md' : ''
        }`}
      >
        {/* Left Side: Amount / Actions + DATE */}
        <div className="flex items-center gap-2.5 flex-shrink-0 order-1">
          {isCustom ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openEditModal(ev.rawEvent)}
                className="p-2 bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-slate-600 rounded-xl transition-colors shadow-2xs border border-purple-100 dark:border-purple-800/40 cursor-pointer"
                title={isHe ? 'ערוך אירוע' : 'Edit event'}
              >
                <LucideIcon name="Edit2" size={15} />
              </button>
              <button
                onClick={() => handleDeleteCustomEvent(ev.id)}
                className="p-2 bg-white dark:bg-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-600 rounded-xl transition-colors shadow-2xs border border-rose-100 dark:border-rose-800/40 cursor-pointer"
                title={isHe ? 'מחק אירוע' : 'Delete event'}
              >
                <LucideIcon name="Trash2" size={15} />
              </button>
              <div className="text-xs font-black text-purple-700 dark:text-purple-300 bg-white/90 dark:bg-slate-800/90 px-2.5 py-1 rounded-xl border border-purple-200/80 dark:border-purple-800/50 flex items-center gap-1 shadow-2xs">
                <LucideIcon name="Calendar" size={12} className="text-purple-500" />
                <span>{ev.displayDate}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={`text-base font-black tracking-tight ${amountColor}`}>
                {ev.label}
              </div>
              <div className="text-xs font-black text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700 flex items-center gap-1 shadow-2xs">
                <LucideIcon name="Calendar" size={12} className="text-slate-400" />
                <span>{ev.displayDate}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Title, Details & Icon */}
        <div className="flex items-center gap-3 order-2 min-w-0 text-end">
          <div className="truncate">
            <div className={`font-bold text-sm truncate flex items-center justify-end gap-1.5 ${titleColor}`}>
              {isCustom && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                  {isHe ? 'תיעוד יומן' : 'Diary'}
                </span>
              )}
              <span>{ev.title}</span>
            </div>
            {ev.notes && (
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 max-w-[280px] sm:max-w-md">
                {ev.notes}
              </div>
            )}
          </div>

          <div className={`p-2.5 rounded-xl border flex-shrink-0 shadow-2xs ${iconBg}`}>
            <LucideIcon name={ev.icon} size={18} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 text-start pb-12 relative">
      
      {/* Month Switcher & New Event Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setCurrentDate(new Date(year, month - 1, 1));
              setSelectedDay(null);
            }} 
            className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-500 hover:text-indigo-600 transition-colors border border-slate-100 dark:border-slate-700/50 cursor-pointer"
          >
            <LucideIcon name={isHe ? "ChevronRight" : "ChevronLeft"} size={22} />
          </button>
          <h2 className="text-xl font-black capitalize text-slate-800 dark:text-white">{monthName}</h2>
          <button 
            onClick={() => {
              setCurrentDate(new Date(year, month + 1, 1));
              setSelectedDay(null);
            }} 
            className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-500 hover:text-indigo-600 transition-colors border border-slate-100 dark:border-slate-700/50 cursor-pointer"
          >
            <LucideIcon name={isHe ? "ChevronLeft" : "ChevronRight"} size={22} />
          </button>
        </div>

        {/* Quick Add Custom Calendar Event Button */}
        <button
          onClick={() => openAddModal(selectedDay)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-purple-200 dark:shadow-none transition-all duration-200 cursor-pointer active:scale-95"
        >
          <LucideIcon name="CalendarPlus" size={18} />
          <span>{isHe ? 'הוסף אירוע / תיעוד ליומן' : 'Add Event / Note'}</span>
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

      {/* Main Calendar Grid with Multi-Color Event Dots & Color Legend */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] shadow-sm border border-slate-100 dark:border-slate-700/60 p-5">
        <div className="grid grid-cols-7 mb-2 border-b border-slate-100 dark:border-slate-700/40 pb-2">
          {dayNames.map(d => <div key={d} className="text-center text-[11px] font-black text-slate-400 dark:text-slate-300 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            
            const dayEvents = eventsByDay[day] || [];
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
            const isSelected = selectedDay === day;

            // Check distinct event types for multi-color dots
            const hasIncome = dayEvents.some(e => e.type === 'income');
            const hasMortgage = dayEvents.some(e => e.type === 'mortgage');
            const hasExpense = dayEvents.some(e => e.type === 'expense');
            const hasRepair = dayEvents.some(e => e.type === 'repair');
            const hasCustom = dayEvents.some(e => e.type === 'custom_event');

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(prev => prev === day ? null : day)}
                className={`min-h-[66px] p-1.5 rounded-2xl flex flex-col justify-between text-start transition-all duration-200 group relative cursor-pointer
                  ${isSelected 
                    ? 'bg-blue-50/90 dark:bg-blue-950/40 border-2 border-blue-500 dark:border-blue-400 shadow-md ring-2 ring-blue-400/20 z-10' 
                    : isToday 
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 ring-2 ring-indigo-400/50 text-slate-800 dark:text-white' 
                      : 'bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700/80'
                  }`}
              >
                {/* Day number */}
                <span className={`text-xs font-black self-end ${isSelected ? 'text-indigo-600 dark:text-indigo-300 font-extrabold' : isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {day}
                </span>

                {/* Event indicators / multi-color dots */}
                {dayEvents.length > 0 && (
                  <div className="flex flex-col items-center justify-center w-full my-auto gap-0.5">
                    <div className="flex items-center justify-center gap-1 flex-wrap max-w-[34px]">
                      {hasIncome && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title={isHe ? 'תקבול שכירות' : 'Income'} />}
                      {hasMortgage && <span className="w-2 h-2 rounded-full bg-blue-500 shadow-xs" title={isHe ? 'משכנתא' : 'Mortgage'} />}
                      {hasExpense && <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" title={isHe ? 'הוצאה שוטפת' : 'Expense'} />}
                      {hasRepair && <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" title={isHe ? 'תיקון ותחזוקה' : 'Repair'} />}
                      {hasCustom && <span className="w-2 h-2 rounded-full bg-purple-500 shadow-xs" title={isHe ? 'אירוע יומן' : 'Diary Event'} />}
                    </div>
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">
                      {dayEvents.length}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Subtitle helper */}
        <div className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 mt-3 mb-2">
          {isHe ? 'לחץ על יום לפרטים' : 'Click on a day for details'}
        </div>

        {/* Color Legend (מקראת צבעים) */}
        <div className="bg-slate-50 dark:bg-slate-750/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 mt-3">
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-400 mb-2 uppercase tracking-wider">
            {isHe ? 'מקרא צבעים' : 'Color Legend'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs flex-shrink-0"></span>
              <span className="truncate">{isHe ? 'תקבול שכירות' : 'Rent Income'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs flex-shrink-0"></span>
              <span className="truncate">{isHe ? 'משכנתא' : 'Mortgage'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs flex-shrink-0"></span>
              <span className="truncate">{isHe ? 'הוצאה שוטפת' : 'Expenses'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs flex-shrink-0"></span>
              <span className="truncate">{isHe ? 'תיקון ותחזוקה' : 'Repairs'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-2xs col-span-2 sm:col-span-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs flex-shrink-0"></span>
              <span className="truncate">{isHe ? 'אירוע / תיעוד יומן' : 'Diary Events'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Focused Events Card (Shown when a day is selected and has events) */}
      {selectedDay && (
        <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] shadow-sm border border-slate-150 dark:border-slate-700 p-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
            <div className="text-xs font-black text-slate-400 dark:text-slate-400">
              {selectedDayEvents.length} {isHe ? 'אירועים' : 'events'}
            </div>
            <div className="flex items-center gap-1.5 font-black text-base text-slate-800 dark:text-white">
              <span>{selectedDay} {monthName}</span>
              <LucideIcon name="Calendar" size={18} className="text-indigo-600" />
            </div>
          </div>

          {selectedDayEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDayEvents.map(ev => (
                <div key={`sel-${ev.id}`} className="space-y-1">
                  {/* Property Name Header */}
                  <div className="flex items-center justify-end gap-1 text-xs font-black text-slate-800 dark:text-white px-1">
                    <span>{ev.aptName}</span>
                    <LucideIcon name="Home" size={13} className="text-indigo-600" />
                  </div>
                  {renderEventCard(ev, true)}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 font-bold text-xs space-y-2">
              <LucideIcon name="CalendarPlus" size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p>{isHe ? `אין אירועים רשומים ליום ${selectedDay} ב${monthName}` : `No events recorded for day ${selectedDay} in ${monthName}`}</p>
              <button
                onClick={() => openAddModal(selectedDay)}
                className="px-3.5 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-purple-700 transition-all cursor-pointer"
              >
                {isHe ? 'הוסף אירוע/תיעוד ליום זה' : 'Add Event for this Day'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* "All Monthly Events" Section (כל אירועי החודש) */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] shadow-sm border border-slate-150 dark:border-slate-700 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-black text-slate-600 dark:text-slate-300 flex items-center justify-center">
            {allMonthlyEvents.length}
          </div>

          <div className="flex items-center gap-2 font-black text-base text-slate-800 dark:text-white">
            <span>{isHe ? 'כל אירועי החודש' : 'All Monthly Events'}</span>
            <LucideIcon name="List" size={18} className="text-indigo-600" />
          </div>
        </div>

        {/* List of items */}
        {sortedMonthlyEvents.length > 0 ? (
          <div className="space-y-4">
            {sortedMonthlyEvents.map(ev => {
              const isFromSelectedDay = selectedDay && ev.day === selectedDay;

              return (
                <div key={ev.id} className="space-y-1">
                  {/* Property Name Header with Home Icon */}
                  <div className="flex items-center justify-end gap-1.5 text-xs font-black text-indigo-700 dark:text-indigo-400 px-1">
                    <span>{ev.aptName}</span>
                    <LucideIcon name="Home" size={14} className="text-indigo-600 dark:text-indigo-400" />
                  </div>

                  {renderEventCard(ev, !!isFromSelectedDay)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 font-bold text-xs">
            {isHe ? 'אין אירועים או תנועות בחודש זה' : 'No events or transactions in this month'}
          </div>
        )}
      </div>

      {/* Floating Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 hover:shadow-indigo-500/25"
        title={isHe ? 'גלול למעלה' : 'Scroll to top'}
      >
        <LucideIcon name="ArrowUp" size={20} />
      </button>

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
                    ? (isHe ? 'עריכת אירוע ביומן' : 'Edit Calendar Event')
                    : (isHe ? 'הוספת אירוע / תיעוד ליומן' : 'Add Event to Calendar')}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <LucideIcon name="X" size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              {/* Category selector */}
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1.5">
                  {isHe ? 'סוג האירוע / התיעוד' : 'Event Category'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categoryPresets.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEventForm(f => ({ ...f, category: cat.id }))}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        eventForm.category === cat.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <LucideIcon name={cat.icon} size={16} />
                      <span>{isHe ? cat.labelHe : cat.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Property dropdown */}
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1">
                  {isHe ? 'שיוך לנכס' : 'Property'}
                </label>
                <select
                  value={eventForm.aptId}
                  onChange={e => setEventForm(f => ({ ...f, aptId: e.target.value }))}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                >
                  <option value="">{isHe ? 'כללי / כל הנכסים' : 'General / All Properties'}</option>
                  {apartments.map(apt => (
                    <option key={apt.id} value={apt.id}>{apt.name || apt.address}</option>
                  ))}
                </select>
              </div>

              {/* Date picker */}
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-300 mb-1">
                  {isHe ? 'תאריך האירוע' : 'Event Date'}
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
                  {isHe ? 'כותרת האירוע' : 'Event Title'}
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={isHe ? 'לדוגמה: החלפת דייר / קילוף בקירות' : 'e.g., Tenant Move-In / Wall Peeling'}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
                
                {/* Quick title suggestions in Hebrew */}
                {isHe && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 w-full mb-0.5">הצעות מהירות:</span>
                    {titleSuggestionsHe.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEventForm(f => ({ ...f, title: sug }))}
                        className="text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 px-2 py-1 rounded-lg border border-purple-100 dark:border-purple-900/50 font-medium transition-colors cursor-pointer"
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
                  {isHe ? 'תיאור / פירוט התיעוד' : 'Details / Notes'}
                </label>
                <textarea
                  value={eventForm.notes}
                  onChange={e => setEventForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder={isHe ? 'לדוגמה: מצאתי שקיים קילוף בקירות ולכן תיעדתי לגבי הדייר היוצא...' : 'Write any inspection or handover notes here...'}
                  rows={3}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                />
              </div>

              {/* Submit / Cancel buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {t('cancel') || (isHe ? 'בטל' : 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-200 dark:shadow-none hover:from-purple-700 hover:to-indigo-700 transition-all cursor-pointer"
                >
                  {isHe ? 'שמור אירוע' : 'Save Event'}
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
