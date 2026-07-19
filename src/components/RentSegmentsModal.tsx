import React, { useState } from 'react';
import { Apartment, RentSegment } from '../types';
import { LucideIcon } from './LucideIcon';

interface RentSegmentsModalProps {
  apt: Apartment;
  lang: string;
  t: (key: string) => string;
  onClose: () => void;
  onSave: (newSegments: RentSegment[]) => Promise<void>;
}

export const RentSegmentsModal: React.FC<RentSegmentsModalProps> = ({
  apt,
  lang,
  t,
  onClose,
  onSave,
}) => {
  const [localSegments, setLocalSegments] = useState<RentSegment[]>([
    ...(apt.rentSegments || []),
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const monthKeys = [
    'month_jan', 'month_feb', 'month_mar', 'month_apr',
    'month_may', 'month_jun', 'month_jul', 'month_aug',
    'month_sep', 'month_oct', 'month_nov', 'month_dec'
  ];

  // Helper to calculate total months and rent for a segment
  const getSegmentStats = (seg: RentSegment) => {
    const from = Number(seg.fromMonth) || 1;
    const to = Number(seg.toMonth) || 1;
    const amt = Number(seg.amount) || 0;

    const monthsCount = to >= from ? (to - from + 1) : (12 - from + to + 1);
    const total = monthsCount * amt;

    return { monthsCount, total };
  };

  // Helper to calculate the overall annual total rent
  const calculateAnnualTotal = () => {
    const baseRent = Number(apt.targetRent) || 0;
    let total = 0;
    for (let m = 1; m <= 12; m++) {
      const matchingSegment = localSegments.find(s => m >= s.fromMonth && m <= s.toMonth);
      if (matchingSegment) {
        total += Number(matchingSegment.amount) || 0;
      } else {
        total += baseRent;
      }
    }
    return total;
  };

  const handleAddSegment = () => {
    setErrorMessage(null);
    let nextFromMonth = 1;
    if (localSegments.length > 0) {
      // Get the last segment's toMonth
      const lastSeg = localSegments[localSegments.length - 1];
      nextFromMonth = (Number(lastSeg.toMonth) % 12) + 1;
    }

    const nextToMonth = nextFromMonth;
    const defaultAmount = Number(apt.targetRent) || 0;

    const newSegment: RentSegment = {
      fromMonth: nextFromMonth,
      toMonth: nextToMonth,
      amount: defaultAmount,
    };

    setLocalSegments([...localSegments, newSegment]);
  };

  const handleValidateAndSave = async () => {
    setErrorMessage(null);

    // Validation checks
    for (let i = 0; i < localSegments.length; i++) {
      const seg = localSegments[i];
      if (seg.fromMonth > seg.toMonth) {
        setErrorMessage(
          lang === 'he'
            ? `בשורה ${i + 1}: חודש ההתחלה (${t(monthKeys[seg.fromMonth - 1])}) אינו יכול להיות אחרי חודש הסיום (${t(monthKeys[seg.toMonth - 1])}).`
            : `In row ${i + 1}: Start month (${t(monthKeys[seg.fromMonth - 1])}) cannot be after end month (${t(monthKeys[seg.toMonth - 1])}).`
        );
        return;
      }
      if (Number(seg.amount) < 0 || isNaN(Number(seg.amount))) {
        setErrorMessage(
          lang === 'he'
            ? `בשורה ${i + 1}: אנא הזן סכום תקין.`
            : `In row ${i + 1}: Please enter a valid amount.`
        );
        return;
      }
    }

    // Overlap validation
    const covered = new Array(13).fill(false);
    for (let i = 0; i < localSegments.length; i++) {
      const seg = localSegments[i];
      for (let m = seg.fromMonth; m <= seg.toMonth; m++) {
        if (covered[m]) {
          setErrorMessage(
            lang === 'he'
              ? `ישנה חפיפה בין תקופות! החודש ${t(monthKeys[m - 1])} מופיע ביותר מתקופה אחת.`
              : `There is an overlap between periods! The month ${t(monthKeys[m - 1])} is included in more than one period.`
          );
          return;
        }
        covered[m] = true;
      }
    }

    try {
      setIsSaving(true);
      await onSave(localSegments);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving segments');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-overlay">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[92vh] text-start border border-slate-100 dark:border-slate-700/50">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-full transition-colors flex items-center justify-center shrink-0 shadow-sm border border-slate-100/40 dark:border-slate-700/30"
            title={lang === 'he' ? 'סגור' : 'Close'}
          >
            <LucideIcon name="X" size={16} />
          </button>

          <div className="flex items-center gap-2.5">
            <h3 className="font-black text-lg sm:text-xl text-slate-800 dark:text-white">
              {lang === 'he' ? `אירועי שכירות — ${apt.name}` : `Rent Events — ${apt.name}`}
            </h3>
            <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-2xl shrink-0 flex items-center justify-center">
              <LucideIcon name="TrendingUp" size={20} />
            </span>
          </div>
        </div>

        {/* Subtitle Banner */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-[1.5rem] text-[11px] text-slate-500 dark:text-slate-300 font-bold leading-normal mb-4 border border-slate-100/50 dark:border-slate-800/30">
          {lang === 'he'
            ? `שכירות בסיס: ₪${Number(apt.targetRent || 0).toLocaleString()}. הגדר תקופות שונות עם סכומים שונים. הסגמנטים מחושבים אוטומטית.`
            : `Base Rent: ₪${Number(apt.targetRent || 0).toLocaleString()}. Define different periods with custom amounts. Segments are calculated automatically.`}
        </div>

        {/* Scrolling list of segments */}
        <div 
          className="flex-1 overflow-y-auto space-y-3.5 mb-4 select-none no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {localSegments.length === 0 ? (
            <div className="text-center py-8 bg-slate-50/70 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <LucideIcon name="ZapOff" size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 font-bold">
                {lang === 'he' ? 'אין אירועי שכירות משתנים מוגדרים' : 'No dynamic rent events configured'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {localSegments.map((seg, idx) => {
                const { monthsCount, total: segmentTotal } = getSegmentStats(seg);
                return (
                  <div
                    key={idx}
                    className="bg-slate-50/60 dark:bg-slate-900/40 p-3 sm:p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2 shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1.5 sm:gap-3">
                      {/* From Month Dropdown */}
                      <div className="flex-1 min-w-[65px] sm:min-w-[95px]">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 mb-1 text-center">
                          {lang === 'he' ? 'מחודש' : 'From Month'}
                        </label>
                        <select
                          value={seg.fromMonth}
                          onChange={(e) => {
                            const updated = [...localSegments];
                            updated[idx].fromMonth = Number(e.target.value);
                            setLocalSegments(updated);
                          }}
                          className="w-full bg-white dark:bg-slate-750 py-2 sm:py-2.5 px-1 sm:px-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-black text-center text-indigo-700 dark:text-indigo-300 focus:outline-none cursor-pointer shadow-sm"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                              {t(monthKeys[m - 1])}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Arrow Icon */}
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <div className="h-4"></div>
                        <div className="flex items-center justify-center h-8 sm:h-10 text-slate-400 dark:text-slate-300 px-0.5">
                          <span className="text-xs sm:text-sm font-black">{lang === 'he' ? '←' : '→'}</span>
                        </div>
                      </div>

                      {/* To Month Dropdown */}
                      <div className="flex-1 min-w-[65px] sm:min-w-[95px]">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 mb-1 text-center">
                          {lang === 'he' ? 'עד חודש' : 'To Month'}
                        </label>
                        <select
                          value={seg.toMonth}
                          onChange={(e) => {
                            const updated = [...localSegments];
                            updated[idx].toMonth = Number(e.target.value);
                            setLocalSegments(updated);
                          }}
                          className="w-full bg-white dark:bg-slate-750 py-2 sm:py-2.5 px-1 sm:px-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-black text-center text-indigo-700 dark:text-indigo-300 focus:outline-none cursor-pointer shadow-sm"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                              {t(monthKeys[m - 1])}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Rent Amount Input with Outside symbol for mobile layout */}
                      <div className="flex-1 min-w-[70px] sm:min-w-[90px]">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-400 mb-1 text-center">
                          {lang === 'he' ? 'סכום' : 'Amount'}
                        </label>
                        <div className="flex items-center gap-0.5 sm:gap-1 justify-center">
                          <span className="text-xs font-black text-slate-400 dark:text-slate-300 shrink-0">₪</span>
                          <input
                            type="number"
                            value={seg.amount || ''}
                            onChange={(e) => {
                              const updated = [...localSegments];
                              updated[idx].amount = Number(e.target.value);
                              setLocalSegments(updated);
                            }}
                            className="w-full bg-white dark:bg-slate-750 py-2 sm:py-2.5 px-1 sm:px-2 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs sm:text-sm font-black text-center text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Trash Button */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="h-4"></div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = localSegments.filter((_, i) => i !== idx);
                            setLocalSegments(updated);
                          }}
                          className="p-2 sm:p-3 bg-rose-50 dark:bg-rose-950/10 text-rose-500 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-sm border border-rose-100/40 dark:border-rose-900/10"
                          title={lang === 'he' ? 'מחק תקופה' : 'Delete period'}
                        >
                          <LucideIcon name="Trash2" size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Summary calculation text line below inputs */}
                    <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 font-bold mt-0.5 text-start flex items-center justify-start gap-1 px-1">
                      {lang === 'he' ? (
                        <span>
                          {monthsCount} חודשים × ₪{Number(seg.amount || 0).toLocaleString()} = ₪{segmentTotal.toLocaleString()}
                        </span>
                      ) : (
                        <span>
                          {monthsCount} months × ₪{Number(seg.amount || 0).toLocaleString()} = ₪{segmentTotal.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action button to add a segment - Mint pastel background styled exactly like screenshot */}
        <button
          type="button"
          onClick={handleAddSegment}
          className="w-full py-3.5 bg-[#e8fbf3] hover:bg-[#d1f7e7] dark:bg-[#10b981]/15 dark:hover:bg-[#10b981]/25 border border-transparent text-[#10b981] dark:text-[#34d399] font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-sm"
        >
          <span>{lang === 'he' ? 'הוסף תקופה חדשה' : 'Add new period'}</span>
          <span className="font-black text-base">+</span>
        </button>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold border border-rose-100 dark:border-rose-950/50">
            {errorMessage}
          </div>
        )}

        {/* Annual Summary Card */}
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl flex justify-between items-center text-indigo-900 dark:text-indigo-200 mt-3.5 border border-indigo-100/30 dark:border-indigo-900/20">
          <span className="font-extrabold text-xs sm:text-sm text-indigo-800 dark:text-indigo-300">
            {lang === 'he' ? 'סה"כ שנתי' : 'Annual Total'}
          </span>
          <span className="font-black text-lg sm:text-xl text-indigo-700 dark:text-indigo-300">
            ₪{calculateAnnualTotal().toLocaleString()}
          </span>
        </div>

        {/* Save and Cancel Buttons Row - Styled exactly as requested and shown in screenshot */}
        <div className="flex gap-4 mt-5 w-full">
          {/* Cancel button: Renders on the right in RTL, on the left in LTR */}
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-sm sm:text-base transition-colors cursor-pointer"
          >
            {lang === 'he' ? 'ביטול' : 'Cancel'}
          </button>

          {/* Save button: Renders on the left in RTL, on the right in LTR. Emerald bg with purple round arrow button inside! */}
          <button
            onClick={handleValidateAndSave}
            disabled={isSaving}
            className="flex-1 py-2.5 px-3 bg-[#10b981] hover:bg-[#0ca678] text-white font-black rounded-2xl text-sm sm:text-base transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3.5 shadow-sm"
          >
            {isSaving ? (
              <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <div className="p-1.5 bg-[#6366f1] dark:bg-[#5053e6] rounded-full text-white flex items-center justify-center shrink-0">
                  <LucideIcon name="ArrowUp" size={14} />
                </div>
                <span>{lang === 'he' ? 'שמור' : 'Save'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
