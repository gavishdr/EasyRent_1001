import React, { useState, useMemo } from 'react';
import { LucideIcon } from './LucideIcon';
import { Apartment, Payment, Expense, Repair } from '../types';

interface ChartsViewProps {
  apartments?: Apartment[];
  payments?: Payment[];
  expenses?: Expense[];
  repairs?: Repair[];
  t: (key: string) => string;
  lang: string;
  currency?: string;
  globalCurrency?: string;
}

export const ChartsView: React.FC<ChartsViewProps> = ({
  apartments = [],
  payments = [],
  expenses = [],
  repairs = [],
  t,
  lang,
  currency = '₪'
}) => {
  const currentYearNum = new Date().getFullYear();
  
  // State for sorting & filtering
  const [selectedAptId, setSelectedAptId] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYearNum));
  const [sortBy, setSortBy] = useState<'amount_desc' | 'amount_asc' | 'name' | 'percent'>('amount_desc');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Safe helper for getting a clean string date from any expense object
  const getExpenseDate = (e: any): string => {
    if (!e) return '';
    const raw = e.actualPaymentDate || e.paymentDate || (e.monthFrom ? `${e.monthFrom}-01` : null) || (e.month ? `${e.month}-01` : null) || e.date;
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object') {
      if (raw.seconds) {
        try {
          return new Date(raw.seconds * 1000).toISOString().split('T')[0];
        } catch {
          return '';
        }
      }
      if (typeof raw.toDate === 'function') {
        try {
          return raw.toDate().toISOString().split('T')[0];
        } catch {
          return '';
        }
      }
    }
    if (typeof e.createdAt === 'string') return e.createdAt;
    return '';
  };

  // Safe helper for matching date strings with year
  const matchesYear = (dateStr?: any, year?: string): boolean => {
    if (!dateStr) return false;
    const str = String(dateStr).trim();
    if (!str) return false;
    if (!year || year === 'all') return true;
    return str.startsWith(year);
  };

  // Extract all available years from transactions
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYearNum);
    yearsSet.add(currentYearNum - 1);
    yearsSet.add(currentYearNum + 1);

    (payments || []).forEach(p => {
      if (p && p.date) {
        const y = parseInt(String(p.date).split('-')[0], 10);
        if (!isNaN(y) && y > 1990 && y < 2100) yearsSet.add(y);
      }
    });

    (expenses || []).forEach(e => {
      const d = getExpenseDate(e);
      if (d) {
        const y = parseInt(d.split('-')[0], 10);
        if (!isNaN(y) && y > 1990 && y < 2100) yearsSet.add(y);
      }
    });

    (repairs || []).forEach(r => {
      if (r && r.date) {
        const y = parseInt(String(r.date).split('-')[0], 10);
        if (!isNaN(y) && y > 1990 && y < 2100) yearsSet.add(y);
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [payments, expenses, repairs, currentYearNum]);

  // Selected apartment object name for display
  const selectedAptObj = useMemo(() => {
    return (apartments || []).find(a => String(a?.id) === String(selectedAptId));
  }, [apartments, selectedAptId]);

  // Strictly Filtered dataset according to property & year selection
  const filteredPayments = useMemo(() => {
    return (payments || []).filter(p => {
      if (!p) return false;
      if (selectedAptId !== 'all') {
        const pAptId = String(p.aptId || (p as any).apartmentId || (p as any).propertyId || '');
        if (pAptId !== String(selectedAptId)) return false;
      }
      if (selectedYear !== 'all' && !matchesYear(p.date, selectedYear)) return false;
      return true;
    });
  }, [payments, selectedAptId, selectedYear]);

  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter(e => {
      if (!e) return false;
      if (selectedAptId !== 'all') {
        const eAptId = String(e.aptId || (e as any).apartmentId || (e as any).propertyId || '');
        if (eAptId !== String(selectedAptId)) return false;
      }
      const d = getExpenseDate(e);
      if (selectedYear !== 'all' && !matchesYear(d, selectedYear)) return false;
      return true;
    });
  }, [expenses, selectedAptId, selectedYear]);

  const filteredRepairs = useMemo(() => {
    return (repairs || []).filter(r => {
      if (!r) return false;
      if (selectedAptId !== 'all') {
        const rAptId = String(r.aptId || (r as any).apartmentId || (r as any).propertyId || '');
        if (rAptId !== String(selectedAptId)) return false;
      }
      if (selectedYear !== 'all' && !matchesYear(r.date, selectedYear)) return false;
      return true;
    });
  }, [repairs, selectedAptId, selectedYear]);

  // Summary Metrics specifically calculated for the filtered dataset
  const totalIncome = useMemo(() => {
    return filteredPayments.reduce((s, p) => s + (Number(p?.amount) || 0), 0);
  }, [filteredPayments]);

  const totalExpensesOnly = useMemo(() => {
    return filteredExpenses.reduce((s, e) => s + (Number(e?.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalRepairsOnly = useMemo(() => {
    return filteredRepairs.reduce((s, r) => s + (Number(r?.cost) || 0), 0);
  }, [filteredRepairs]);

  const totalExpenseAmount = totalExpensesOnly + totalRepairsOnly;
  const netBalance = totalIncome - totalExpenseAmount;
  const expenseRatio = totalIncome > 0 ? Math.min(100, Math.round((totalExpenseAmount / totalIncome) * 100)) : 0;

  // Translation & Metadata Helpers for Categories
  const getCategoryMeta = (catKey: string) => {
    const safeKey = String(catKey || 'other').toLowerCase();
    switch (safeKey) {
      case 'mortgage':
      case 'mortgage_payment':
        return {
          label: lang === 'he' ? 'משכנתא' : 'Mortgage',
          icon: 'Landmark',
          color: '#3b82f6', // blue
          bgLight: 'bg-blue-50 dark:bg-blue-950/30',
          textColor: 'text-blue-600 dark:text-blue-400'
        };
      case 'rent':
      case 'rent_expense':
      case 'rent_payment':
        return {
          label: lang === 'he' ? 'שכר דירה' : 'Rent',
          icon: 'Key',
          color: '#8b5cf6', // purple
          bgLight: 'bg-purple-50 dark:bg-purple-950/30',
          textColor: 'text-purple-600 dark:text-purple-400'
        };
      case 'repairs':
        return {
          label: lang === 'he' ? 'תיקונים ותחזוקה' : 'Repairs & Maintenance',
          icon: 'Wrench',
          color: '#f97316', // orange
          bgLight: 'bg-orange-50 dark:bg-orange-950/30',
          textColor: 'text-orange-600 dark:text-orange-400'
        };
      case 'arnona':
        return {
          label: lang === 'he' ? 'ארנונה' : 'Arnona (Tax)',
          icon: 'Building',
          color: '#ec4899', // pink
          bgLight: 'bg-pink-50 dark:bg-pink-950/30',
          textColor: 'text-pink-600 dark:text-pink-400'
        };
      case 'electricity':
        return {
          label: lang === 'he' ? 'חשמל' : 'Electricity',
          icon: 'Zap',
          color: '#eab308', // yellow
          bgLight: 'bg-amber-50 dark:bg-amber-950/30',
          textColor: 'text-amber-600 dark:text-amber-400'
        };
      case 'water':
        return {
          label: lang === 'he' ? 'מים' : 'Water',
          icon: 'Droplets',
          color: '#06b6d4', // cyan
          bgLight: 'bg-cyan-50 dark:bg-cyan-950/30',
          textColor: 'text-cyan-600 dark:text-cyan-400'
        };
      case 'gas':
        return {
          label: lang === 'he' ? 'גז' : 'Gas',
          icon: 'Flame',
          color: '#f43f5e', // rose
          bgLight: 'bg-rose-50 dark:bg-rose-950/30',
          textColor: 'text-rose-600 dark:text-rose-400'
        };
      case 'hoa':
        return {
          label: lang === 'he' ? 'ועד בית' : 'HOA / Committee',
          icon: 'Users',
          color: '#14b8a6', // teal
          bgLight: 'bg-teal-50 dark:bg-teal-950/30',
          textColor: 'text-teal-600 dark:text-teal-400'
        };
      case 'insurance':
        return {
          label: lang === 'he' ? 'ביטוח' : 'Insurance',
          icon: 'Shield',
          color: '#6366f1', // indigo
          bgLight: 'bg-indigo-50 dark:bg-indigo-950/30',
          textColor: 'text-indigo-600 dark:text-indigo-400'
        };
      case 'management_fee':
        return {
          label: lang === 'he' ? 'דמי ניהול' : 'Management Fee',
          icon: 'Briefcase',
          color: '#64748b', // slate
          bgLight: 'bg-slate-100 dark:bg-slate-700/50',
          textColor: 'text-slate-600 dark:text-slate-400'
        };
      case 'cleaning':
        return {
          label: lang === 'he' ? 'ניקיון ותחזוקה' : 'Cleaning',
          icon: 'Brush',
          color: '#10b981', // emerald
          bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
          textColor: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'gardening':
        return {
          label: lang === 'he' ? 'גינון' : 'Gardening',
          icon: 'Leaf',
          color: '#84cc16', // lime
          bgLight: 'bg-lime-50 dark:bg-lime-950/30',
          textColor: 'text-lime-600 dark:text-lime-400'
        };
      case 'professional_services':
        return {
          label: lang === 'he' ? 'שירותים מקצועיים' : 'Professional Services',
          icon: 'FileText',
          color: '#a855f7', // violet
          bgLight: 'bg-violet-50 dark:bg-violet-950/30',
          textColor: 'text-violet-600 dark:text-violet-400'
        };
      case 'taxes_fees':
        return {
          label: lang === 'he' ? 'מיסים ואגרות' : 'Taxes & Fees',
          icon: 'Receipt',
          color: '#d97706', // amber-600
          bgLight: 'bg-amber-50 dark:bg-amber-950/30',
          textColor: 'text-amber-700 dark:text-amber-300'
        };
      case 'supplies':
        return {
          label: lang === 'he' ? 'ציוד שוטף' : 'Supplies',
          icon: 'ShoppingBag',
          color: '#0284c7', // light blue
          bgLight: 'bg-sky-50 dark:bg-sky-950/30',
          textColor: 'text-sky-600 dark:text-sky-400'
        };
      default:
        return {
          label: t(safeKey) || safeKey || (lang === 'he' ? 'אחר' : 'Other'),
          icon: 'CircleEllipsis',
          color: '#94a3b8',
          bgLight: 'bg-slate-100 dark:bg-slate-800',
          textColor: 'text-slate-600 dark:text-slate-400'
        };
    }
  };

  // Monthly Bars (12 months of selected year, or current year if 'all')
  const chartYear = selectedYear === 'all' ? currentYearNum : (parseInt(selectedYear, 10) || currentYearNum);
  
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(chartYear, i, 1);
      const monthKey = `${chartYear}-${String(i + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { month: 'short' });

      const income = filteredPayments
        .filter(p => p && p.date && String(p.date).startsWith(monthKey))
        .reduce((s, p) => s + (Number(p?.amount) || 0), 0);

      const exp = filteredExpenses
        .filter(e => {
          const ds = getExpenseDate(e);
          return ds ? ds.startsWith(monthKey) : false;
        })
        .reduce((s, e) => s + (Number(e?.amount) || 0), 0);

      const rep = filteredRepairs
        .filter(r => r && r.date && String(r.date).startsWith(monthKey))
        .reduce((s, r) => s + (Number(r?.cost) || 0), 0);

      return {
        monthKey,
        label,
        monthIndex: i + 1,
        income,
        expenses: exp + rep,
        net: income - (exp + rep)
      };
    });
  }, [chartYear, filteredPayments, filteredExpenses, filteredRepairs, lang]);

  const maxVal = useMemo(() => {
    const vals = monthlyData.flatMap(d => [Number(d.income) || 0, Number(d.expenses) || 0]);
    return vals.length > 0 ? Math.max(...vals, 1) : 1;
  }, [monthlyData]);

  // Group Expenses by Category with breakdown list
  interface CategoryGroup {
    key: string;
    label: string;
    amount: number;
    count: number;
    icon: string;
    color: string;
    bgLight: string;
    textColor: string;
    items: Array<{
      id: string;
      title: string;
      aptName: string;
      amount: number;
      date: string;
      isPaid: boolean;
      type: string;
    }>;
  }

  const categoryGroups = useMemo(() => {
    const map: { [key: string]: CategoryGroup } = {};

    // 1. Process Expenses
    (filteredExpenses || []).forEach(e => {
      if (!e) return;
      const rawKey = e.type || 'other';
      const key = (rawKey === 'mortgage_payment' || rawKey === 'mortgage') ? 'mortgage' :
                  (rawKey === 'rent_expense' || rawKey === 'rent_payment' || rawKey === 'rent') ? 'rent' : rawKey;

      if (!map[key]) {
        const meta = getCategoryMeta(key);
        map[key] = {
          key,
          label: meta.label || key,
          amount: 0,
          count: 0,
          icon: meta.icon || 'CircleEllipsis',
          color: meta.color || '#94a3b8',
          bgLight: meta.bgLight || 'bg-slate-100',
          textColor: meta.textColor || 'text-slate-600',
          items: []
        };
      }

      const apt = (apartments || []).find(a => String(a?.id) === String(e.aptId));
      const amt = Number(e.amount) || 0;
      map[key].amount += amt;
      map[key].count += 1;
      map[key].items.push({
        id: e.id || `e-${Math.random()}`,
        title: e.notes || map[key].label,
        aptName: apt?.name || (lang === 'he' ? 'כללי' : 'General'),
        amount: amt,
        date: getExpenseDate(e),
        isPaid: e.isPaid !== 'false',
        type: key
      });
    });

    // 2. Process Repairs
    if ((filteredRepairs || []).length > 0) {
      const repKey = 'repairs';
      if (!map[repKey]) {
        const meta = getCategoryMeta(repKey);
        map[repKey] = {
          key: repKey,
          label: meta.label,
          amount: 0,
          count: 0,
          icon: meta.icon,
          color: meta.color,
          bgLight: meta.bgLight,
          textColor: meta.textColor,
          items: []
        };
      }

      filteredRepairs.forEach(r => {
        if (!r) return;
        const apt = (apartments || []).find(a => String(a?.id) === String(r.aptId));
        const cost = Number(r.cost) || 0;
        map[repKey].amount += cost;
        map[repKey].count += 1;
        map[repKey].items.push({
          id: r.id || `r-${Math.random()}`,
          title: r.description || (lang === 'he' ? 'תיקון' : 'Repair'),
          aptName: apt?.name || (lang === 'he' ? 'כללי' : 'General'),
          amount: cost,
          date: r.date ? String(r.date) : '',
          isPaid: true,
          type: repKey
        });
      });
    }

    // Convert map to array and sort
    const groups = Object.values(map);

    groups.sort((a, b) => {
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      if (sortBy === 'name') return (a.label || '').localeCompare(b.label || '', lang === 'he' ? 'he' : 'en');
      if (sortBy === 'percent') return b.amount - a.amount;
      return b.amount - a.amount;
    });

    return groups;
  }, [filteredExpenses, filteredRepairs, apartments, sortBy, lang]);

  // Donut SVG Builder with total safety
  const buildDonut = () => {
    if (!categoryGroups || categoryGroups.length === 0 || !totalExpenseAmount || totalExpenseAmount <= 0) {
      return null;
    }
    let startAngle = -Math.PI / 2;
    const cx = 90, cy = 90, r = 70;

    const slices = categoryGroups.map(cat => {
      if (cat.amount <= 0) return null;
      const angle = (cat.amount / totalExpenseAmount) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(startAngle + angle);
      const y2 = cy + r * Math.sin(startAngle + angle);
      const largeArc = angle > Math.PI ? 1 : 0;
      const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
      startAngle += angle;
      const pct = Math.round((cat.amount / totalExpenseAmount) * 100) || 0;
      return (
        <path
          key={cat.key}
          d={d}
          fill={cat.color}
          className="transition-all duration-300 hover:opacity-100 opacity-90 cursor-pointer"
          onClick={() => setExpandedCategory(expandedCategory === cat.key ? null : cat.key)}
        >
          <title>{`${cat.label}: ${currency}${Math.round(cat.amount).toLocaleString()} (${pct}%)`}</title>
        </path>
      );
    }).filter(Boolean);

    return (
      <div className="relative flex justify-center items-center py-2">
        <svg viewBox="0 0 180 180" className="w-48 h-48 drop-shadow-md">
          {slices}
          <circle cx={cx} cy={cy} r="38" className="fill-white dark:fill-slate-800" />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fontWeight="bold" className="fill-slate-400 dark:fill-slate-400">
            {lang === 'he' ? 'סה״כ הוצאות' : 'Total'}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="12" fontWeight="900" className="fill-slate-800 dark:fill-white">
            {currency}{totalExpenseAmount >= 1000000 ? `${(totalExpenseAmount / 1000000).toFixed(1)}M` : totalExpenseAmount >= 1000 ? `${(totalExpenseAmount / 1000).toFixed(0)}K` : Math.round(totalExpenseAmount).toLocaleString()}
          </text>
        </svg>
      </div>
    );
  };

  const isFiltered = selectedAptId !== 'all' || selectedYear !== String(currentYearNum);

  const handleResetFilters = () => {
    setSelectedAptId('all');
    setSelectedYear(String(currentYearNum));
    setSortBy('amount_desc');
    setExpandedCategory(null);
  };

  const currentFilterLabel = selectedAptObj 
    ? selectedAptObj.name 
    : (lang === 'he' ? 'כלל הנכסים' : 'All Properties');

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-start pb-12">
      
      {/* Header & Controls Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2.5">
              <span className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <LucideIcon name="PieChart" size={22} />
              </span>
              <span>{lang === 'he' ? 'גרפים ופילוח הוצאות' : 'Charts & Expense Breakdown'}</span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 font-medium">
              {lang === 'he' 
                ? `מציג נתונים עבור: ${currentFilterLabel} (${selectedYear === 'all' ? 'כל השנים' : selectedYear})` 
                : `Showing data for: ${currentFilterLabel} (${selectedYear === 'all' ? 'All Years' : selectedYear})`}
            </p>
          </div>

          {/* Reset Filters button if active */}
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="self-start lg:self-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
            >
              <LucideIcon name="RotateCcw" size={14} />
              <span>{lang === 'he' ? 'איפוס סינונים' : 'Reset Filters'}</span>
            </button>
          )}
        </div>

        {/* Filter and Sorting Boxes Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          
          {/* 1. Property Filter Box */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <LucideIcon name="Building" size={14} className="text-indigo-500" />
              <span>{lang === 'he' ? 'סינון לפי נכס:' : 'Filter by Property:'}</span>
            </label>
            <div className="relative">
              <select
                value={selectedAptId}
                onChange={e => {
                  setSelectedAptId(e.target.value);
                  setExpandedCategory(null);
                }}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 hover:bg-slate-100/70 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-2xl font-black text-sm outline-none border border-slate-200 dark:border-slate-700 transition-all appearance-none cursor-pointer pe-10"
              >
                <option value="all">
                  {lang === 'he' ? `🏢 כל הנכסים (${(apartments || []).length})` : `🏢 All Properties (${(apartments || []).length})`}
                </option>
                {(apartments || []).map(apt => (
                  <option key={apt.id} value={apt.id}>
                    {apt.name || (lang === 'he' ? 'נכס ללא שם' : 'Unnamed Property')} {apt.city ? `(${apt.city})` : ''}
                  </option>
                ))}
              </select>
              <LucideIcon name="ChevronDown" size={16} className={`absolute ${lang === 'he' ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`} />
            </div>
          </div>

          {/* 2. Year Filter Box */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <LucideIcon name="Calendar" size={14} className="text-indigo-500" />
              <span>{lang === 'he' ? 'סינון לפי שנה:' : 'Filter by Year:'}</span>
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={e => {
                  setSelectedYear(e.target.value);
                  setExpandedCategory(null);
                }}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 hover:bg-slate-100/70 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-2xl font-black text-sm outline-none border border-slate-200 dark:border-slate-700 transition-all appearance-none cursor-pointer pe-10"
              >
                {availableYears.map(y => (
                  <option key={y} value={String(y)}>
                    📅 {y} {y === currentYearNum ? (lang === 'he' ? '(השנה הנוכחית)' : '(Current Year)') : ''}
                  </option>
                ))}
                <option value="all">
                  🌐 {lang === 'he' ? 'כל השנים (היסטוריה מלאה)' : 'All Years (Full History)'}
                </option>
              </select>
              <LucideIcon name="ChevronDown" size={16} className={`absolute ${lang === 'he' ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`} />
            </div>
          </div>

          {/* 3. Breakdown Sort Box */}
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <LucideIcon name="ArrowUpDown" size={14} className="text-indigo-500" />
              <span>{lang === 'he' ? 'מיון פילוח הוצאות:' : 'Sort Breakdown By:'}</span>
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 hover:bg-slate-100/70 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-2xl font-black text-sm outline-none border border-slate-200 dark:border-slate-700 transition-all appearance-none cursor-pointer pe-10"
              >
                <option value="amount_desc">💰 {lang === 'he' ? 'סכום (מהגבוה לנמוך)' : 'Amount (High to Low)'}</option>
                <option value="amount_asc">💸 {lang === 'he' ? 'סכום (מהנמוך לגבוה)' : 'Amount (Low to High)'}</option>
                <option value="percent">📊 {lang === 'he' ? 'אחוז מההוצאות' : 'Percentage Share'}</option>
                <option value="name">🔤 {lang === 'he' ? 'שם סוג הוצאה (א-ת)' : 'Category Name (A-Z)'}</option>
              </select>
              <LucideIcon name="ChevronDown" size={16} className={`absolute ${lang === 'he' ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`} />
            </div>
          </div>

        </div>
      </div>

      {/* KPI Cards for Selected View - Explicitly calculated for selected property & year */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400">
              {lang === 'he' ? 'סה״כ הכנסות' : 'Total Income'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <LucideIcon name="TrendingUp" size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
            {currency}{Math.round(totalIncome).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-bold mt-1 flex items-center justify-between">
            <span>{filteredPayments.length} {lang === 'he' ? 'תקבולים' : 'payments'}</span>
            <span className="truncate max-w-[120px] opacity-80">{currentFilterLabel}</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400">
              {lang === 'he' ? 'סה״כ הוצאות' : 'Total Expenses'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <LucideIcon name="TrendingDown" size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 truncate">
            {currency}{Math.round(totalExpenseAmount).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-bold mt-1 flex items-center justify-between">
            <span>{categoryGroups.length} {lang === 'he' ? 'סוגי הוצאה' : 'categories'} ({expenseRatio}%)</span>
            <span className="truncate max-w-[120px] opacity-80">{currentFilterLabel}</span>
          </div>
        </div>

        {/* Net Flow Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400">
              {lang === 'he' ? 'רווח נקי / תזרים' : 'Net Cash Flow'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              netBalance >= 0 
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' 
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
            }`}>
              <LucideIcon name={netBalance >= 0 ? "Coins" : "AlertCircle"} size={16} />
            </div>
          </div>
          <div className={`text-2xl font-black truncate ${
            netBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'
          }`}>
            {currency}{Math.round(netBalance).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-bold mt-1 flex items-center justify-between">
            <span>{selectedYear === 'all' ? (lang === 'he' ? 'כל השנים' : 'All Years') : selectedYear}</span>
            <span className="truncate max-w-[120px] font-black text-indigo-600 dark:text-indigo-400">{currentFilterLabel}</span>
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <LucideIcon name="BarChart" size={16} />
            </span>
            <span>
              {lang === 'he' ? 'הכנסות מול הוצאות' : 'Income vs Expenses'} ({selectedYear === 'all' ? chartYear : selectedYear}) - {currentFilterLabel}
            </span>
          </h3>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-sm" />
              <span className="text-slate-600 dark:text-slate-300">{lang === 'he' ? 'הכנסות' : 'Income'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-500 inline-block shadow-sm" />
              <span className="text-slate-600 dark:text-slate-300">{lang === 'he' ? 'הוצאות' : 'Expenses'}</span>
            </div>
          </div>
        </div>

        {monthlyData.every(d => d.income === 0 && d.expenses === 0) ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <LucideIcon name="BarChart" size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-slate-400 dark:text-slate-400 font-bold text-sm">
              {lang === 'he' ? `אין נתוני תנועות עבור ${currentFilterLabel} בשנה שנבחרה` : `No transactions recorded for ${currentFilterLabel} in the selected year`}
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-1.5 sm:gap-3 h-48 mb-3 pt-6 px-1">
              {monthlyData.map(m => {
                const incomePercent = Math.max((m.income / maxVal) * 100, m.income > 0 ? 4 : 0);
                const expensePercent = Math.max((m.expenses / maxVal) * 100, m.expenses > 0 ? 4 : 0);
                
                return (
                  <div key={m.monthKey} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Hover Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-xl shadow-xl pointer-events-none whitespace-nowrap">
                      <div>{m.label}: +{currency}{Math.round(m.income).toLocaleString()} | -{currency}{Math.round(m.expenses).toLocaleString()}</div>
                      <div className={m.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {lang === 'he' ? 'נטו:' : 'Net:'} {currency}{Math.round(m.net).toLocaleString()}
                      </div>
                    </div>

                    <div className="w-full flex gap-1 items-end justify-center h-full">
                      {/* Income Bar */}
                      <div
                        className="w-1/2 bg-emerald-500 rounded-t-lg transition-all duration-500 hover:bg-emerald-400 cursor-pointer shadow-sm min-h-[2px]"
                        style={{ height: `${incomePercent}%` }}
                        title={`${lang === 'he' ? 'הכנסות' : 'Income'} ${m.label}: ${currency}${Math.round(m.income).toLocaleString()}`}
                      />
                      {/* Expense Bar */}
                      <div
                        className="w-1/2 bg-rose-500 rounded-t-lg transition-all duration-500 hover:bg-rose-400 cursor-pointer shadow-sm min-h-[2px]"
                        style={{ height: `${expensePercent}%` }}
                        title={`${lang === 'he' ? 'הוצאות' : 'Expenses'} ${m.label}: ${currency}${Math.round(m.expenses).toLocaleString()}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Month Labels */}
            <div className="flex gap-1.5 sm:gap-3 border-t border-slate-100 dark:border-slate-700 pt-2 px-1">
              {monthlyData.map(m => (
                <div key={m.monthKey} className="flex-1 text-center text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 font-bold truncate">
                  {m.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expense Breakdown & Distribution (Pie & Categories) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
            <span className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <LucideIcon name="Layers" size={16} />
            </span>
            <span>
              {lang === 'he' ? 'פילוח הוצאות לפי סוג' : 'Expense Breakdown by Type'} - {currentFilterLabel}
              {selectedYear !== 'all' ? ` (${selectedYear})` : ` (${lang === 'he' ? 'כל השנים' : 'All Years'})`}
            </span>
          </h3>

          <div className="text-xs font-bold text-slate-400">
            {lang === 'he' ? 'לחץ על סעיף לצפייה בפירוט התשלומים' : 'Click category to view itemized records'}
          </div>
        </div>

        {categoryGroups.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <LucideIcon name="PieChart" size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-slate-400 dark:text-slate-400 font-bold text-sm">
              {lang === 'he' ? `אין הוצאות להצגה עבור ${currentFilterLabel} בחיתוך שנבחר` : `No expenses to display for ${currentFilterLabel} with this filter`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Donut Chart Visual */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-850/60 rounded-[2rem] border border-slate-100 dark:border-slate-700/60">
              {buildDonut()}
              <div className="text-center mt-2">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                  {lang === 'he' ? 'חלוקת סך ההוצאות' : 'Expense Distribution'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {categoryGroups.length} {lang === 'he' ? 'סוגי הוצאות פעילים' : 'active expense types'}
                </span>
              </div>
            </div>

            {/* Itemized Categories List */}
            <div className="lg:col-span-7 space-y-3">
              {categoryGroups.map(cat => {
                const percent = totalExpenseAmount > 0 ? (cat.amount / totalExpenseAmount) * 100 : 0;
                const isExpanded = expandedCategory === cat.key;

                return (
                  <div
                    key={cat.key}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isExpanded 
                        ? 'bg-slate-50 dark:bg-slate-750 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                        : 'bg-white dark:bg-slate-800/80 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-650'
                    }`}
                  >
                    {/* Category Summary Row */}
                    <div
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.key)}
                      className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          <LucideIcon name={cat.icon} size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-800 dark:text-white truncate">
                              {cat.label}
                            </span>
                            {/* Distinct badges for Rent and Mortgage */}
                            {cat.key === 'mortgage' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full">
                                {lang === 'he' ? 'משכנתא' : 'Mortgage'}
                              </span>
                            )}
                            {cat.key === 'rent' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full">
                                {lang === 'he' ? 'שכר דירה' : 'Rent'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {cat.count} {lang === 'he' ? 'רשומות' : 'records'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-end">
                          <div className="font-black text-base text-slate-800 dark:text-white">
                            {currency}{Math.round(cat.amount).toLocaleString()}
                          </div>
                          <div className="text-[11px] font-bold text-slate-400">
                            {percent.toFixed(1)}%
                          </div>
                        </div>
                        <LucideIcon
                          name={isExpanded ? "ChevronUp" : "ChevronDown"}
                          size={16}
                          className="text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Progress Percentage Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5">
                      <div
                        className="h-full transition-all duration-500 rounded-r-full"
                        style={{ width: `${percent}%`, backgroundColor: cat.color }}
                      />
                    </div>

                    {/* Expanded Items List */}
                    {isExpanded && (
                      <div className="p-4 bg-white/70 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-700 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
                          {lang === 'he' ? `פירוט תשלומים עבור ${cat.label}` : `Itemized records for ${cat.label}`} ({cat.items.length})
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 pe-1">
                          {cat.items.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl flex items-center justify-between text-xs font-bold border border-slate-100 dark:border-slate-700"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="text-slate-800 dark:text-white font-bold truncate">
                                  {item.title}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                                  <span>🏢 {item.aptName}</span>
                                  {item.date && <span>📅 {item.date}</span>}
                                </div>
                              </div>
                              <div className="text-end shrink-0">
                                <span className="text-rose-600 dark:text-rose-400 font-black">
                                  {currency}{Math.round(item.amount).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default ChartsView;
