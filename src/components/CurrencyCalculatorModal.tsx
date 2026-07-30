import React, { useState } from 'react';
import LucideIcon from './LucideIcon';

interface CurrencyCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  rates: {
    ILS: number;
    USD: number;
    EUR: number;
    GBP: number;
    THB: number;
    AED: number;
    TRY: number;
    PLN: number;
  };
  convertAmount: (value: number, fromCode: string, toCode: string) => number;
}

export const CURRENCY_LIST = [
  { code: 'ILS', symbol: '₪', nameHe: 'שקל ישראלי', nameEn: 'Israeli Shekel', flag: '🇮🇱' },
  { code: 'USD', symbol: '$', nameHe: 'דולר אמריקאי', nameEn: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', nameHe: 'אירו אירופאי', nameEn: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', nameHe: 'פאונד בריטי', nameEn: 'British Pound', flag: '🇬🇧' },
  { code: 'THB', symbol: '฿', nameHe: 'באט תאילנדי', nameEn: 'Thai Baht', flag: '🇹🇭' },
  { code: 'AED', symbol: 'د.إ', nameHe: 'דירהם אמירתי', nameEn: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'TRY', symbol: '₺', nameHe: 'לירה טורקית', nameEn: 'Turkish Lira', flag: '🇹🇷' },
  { code: 'PLN', symbol: 'zł', nameHe: 'זלוטי פולני', nameEn: 'Polish Zloty', flag: '🇵🇱' },
];

export default function CurrencyCalculatorModal({
  isOpen,
  onClose,
  lang,
  rates,
  convertAmount,
}: CurrencyCalculatorModalProps) {
  const [amount, setAmount] = useState<string>('1000');
  const [baseCurrency, setBaseCurrency] = useState<string>('ILS');

  if (!isOpen) return null;

  const numericAmount = parseFloat(amount) || 0;
  const isHe = lang === 'he';

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Convert any commas to dots and strip non-numeric characters except single dot
    val = val.replace(/,/g, '.');
    const cleaned = val.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      setAmount(parts[0] + '.' + parts.slice(1).join(''));
    } else {
      setAmount(cleaned);
    }
  };

  const addAmount = (delta: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(Math.max(0, current + delta).toString());
  };

  const currentBaseInfo = CURRENCY_LIST.find((c) => c.code === baseCurrency) || CURRENCY_LIST[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 modal-overlay bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 text-start max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-xs">
              <LucideIcon name="Calculator" size={22} />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-slate-800 dark:text-white leading-tight">
                {isHe ? 'מחשבון המרת מטבעות' : 'Currency Converter Calculator'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {isHe
                  ? 'הכניסו סכום ובחרו מטבע לקבלת המרה בזמן אמת לכל היתר'
                  : 'Enter an amount and select a currency to calculate live rates'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            title={isHe ? 'סגור' : 'Close'}
          >
            <LucideIcon name="X" size={20} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto space-y-5 pt-4 pr-1 pl-1 custom-scrollbar flex-1">
          
          {/* 1. Base Currency Selection (FIRST) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isHe ? 'בחרו מטבע מקור' : 'Select Base Currency'}
              </span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                {currentBaseInfo.flag} {isHe ? currentBaseInfo.nameHe : currentBaseInfo.nameEn}
              </span>
            </div>

            {/* Compact single row / grid of currency pills */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {CURRENCY_LIST.map((cur) => {
                const isActive = baseCurrency === cur.code;
                return (
                  <button
                    key={cur.code}
                    type="button"
                    onClick={() => setBaseCurrency(cur.code)}
                    className={`py-1.5 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all duration-150 active:scale-95 border ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300 dark:ring-indigo-700 font-black'
                        : 'bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50 dark:hover:bg-slate-700'
                    }`}
                    title={isHe ? cur.nameHe : cur.nameEn}
                  >
                    <span className="text-xs leading-none">{cur.flag}</span>
                    <span className="text-[11px] leading-tight truncate">{cur.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Amount Input & Presets (SECOND) */}
          <div className="bg-slate-50 dark:bg-slate-750 p-4.5 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isHe ? 'סכום להמרה' : 'Amount to Convert'}
              </label>
              <span className="text-xs font-bold text-slate-400">
                {currentBaseInfo.symbol} ({currentBaseInfo.code})
              </span>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-4 rtl:right-4 text-indigo-500 dark:text-indigo-400 font-black text-xl select-none pointer-events-none z-10">
                {currentBaseInfo.symbol}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                dir="ltr"
                autoFocus
                className="w-full bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900/50 focus:border-indigo-500 dark:focus:border-indigo-400 rounded-2xl py-3 px-12 text-2xl font-black text-slate-800 dark:text-white outline-none transition-all shadow-xs text-center"
              />
              {amount !== '' && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="absolute right-4 rtl:left-4 text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 transition-colors z-10 p-1"
                  title={isHe ? 'נקה סכום' : 'Clear amount'}
                >
                  <LucideIcon name="XCircle" size={20} />
                </button>
              )}
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[100, 500, 1000, 5000, 10000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset.toString())}
                  className="py-1 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all shadow-2xs active:scale-95"
                >
                  {preset.toLocaleString()} {currentBaseInfo.symbol}
                </button>
              ))}
              <button
                type="button"
                onClick={() => addAmount(100)}
                className="py-1 px-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-black hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                +100
              </button>
            </div>
          </div>

          {/* Conversion Results Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LucideIcon name="ArrowRightLeft" size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isHe ? 'תוצאות המרה בכל המטבעות' : 'Converted Values in All Currencies'}
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {isHe ? 'לחץ על מטבע להגדרה כמקור' : 'Click currency to set as base'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CURRENCY_LIST.map((cur) => {
                const isBase = cur.code === baseCurrency;
                const convertedValue = convertAmount(numericAmount, baseCurrency, cur.code);
                
                // Calculate rate ratio: 1 Base = X target
                const rateRatio = convertAmount(1, baseCurrency, cur.code);

                return (
                  <div
                    key={cur.code}
                    onClick={() => setBaseCurrency(cur.code)}
                    className={`p-4 rounded-3xl border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                      isBase
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/80 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cur.flag}</span>
                        <div>
                          <div className="font-black text-xs text-slate-800 dark:text-white leading-tight">
                            {isHe ? cur.nameHe : cur.nameEn}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                            {cur.code} ({cur.symbol})
                          </div>
                        </div>
                      </div>

                      {isBase ? (
                        <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-full shadow-2xs">
                          {isHe ? 'מטבע מקור' : 'Base'}
                        </span>
                      ) : (
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          {isHe ? 'בחר' : 'Select'}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-baseline justify-between gap-2">
                      <div className={`text-lg sm:text-xl font-black truncate ${isBase ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>
                        {cur.symbol}{convertedValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    {!isBase && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        <span>
                          1 {currentBaseInfo.code} = {rateRatio < 0.01 ? rateRatio.toFixed(4) : rateRatio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {cur.symbol}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-bold">
            <LucideIcon name="RefreshCw" size={12} className="text-emerald-500" />
            <span>{isHe ? 'שערי חליפין מעודכנים בזמן אמת' : 'Real-time exchange rates active'}</span>
          </div>
          <button
            onClick={onClose}
            className="py-2.5 px-6 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-xs transition-colors"
          >
            {isHe ? 'סגור' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
