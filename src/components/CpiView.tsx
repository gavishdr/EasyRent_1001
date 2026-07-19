import React, { useState, useEffect } from 'react';
import { CpiIndex, Apartment } from '../types';
import { LucideIcon } from './LucideIcon';
import { 
  DEFAULT_CPI_LIST, 
  DEFAULT_CONSTRUCTION_LIST,
  getLatestKnownCpi, 
  getCpiForMonth, 
  calculateCpiLinkedRent, 
  getCpiPublicationDate,
  convertToBase,
  deduplicateCpiHistory
} from '../utils/cpi';

interface CpiViewProps {
  cpiHistory: CpiIndex[];
  onSaveCpi: (data: any, id: string | null) => void;
  onDeleteCpi: (id: string) => void;
  apartments: Apartment[];
  t: (key: string) => string;
  lang: string;
  cpiType: 'cpi' | 'construction';
  onCpiTypeChange: (type: 'cpi' | 'construction') => void;
}

export const CpiView: React.FC<CpiViewProps> = ({
  cpiHistory,
  onSaveCpi,
  onDeleteCpi,
  apartments,
  t,
  lang,
  cpiType = 'cpi',
  onCpiTypeChange
}) => {
  const isHe = lang === 'he';
  
  const getIndexValueForMonth = (year: number, month: number): number | null => {
    // 1. Try to find in custom history
    const customItem = cpiHistory.find(
      c => Number(c.year) === Number(year) && 
           Number(c.month) === Number(month) && 
           (c.indexType || 'cpi') === cpiType
    );
    if (customItem) {
      return convertToBase(customItem.value, cpiType as 'cpi' | 'construction');
    }
    
    // 2. Fallback to default lists
    const defaults = cpiType === 'construction' ? DEFAULT_CONSTRUCTION_LIST : DEFAULT_CPI_LIST;
    const defaultItem = defaults.find(
      c => Number(c.year) === Number(year) && Number(c.month) === Number(month)
    );
    if (defaultItem) {
      return convertToBase(defaultItem.value, cpiType as 'cpi' | 'construction');
    }
    
    return null;
  };
  
  // Tab within CPI View: 'simulator' or 'history'
  const [subTab, setSubTab] = useState<'simulator' | 'history'>('simulator');
  
  // Simulator State
  const [simPrincipal, setSimPrincipal] = useState<string>('5000');
  const [simBaseMonth, setSimBaseMonth] = useState<number>(1);
  const [simBaseYear, setSimBaseYear] = useState<number>(2024);
  const [simCalcDate, setSimCalcDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Manual Index Form State
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formMonth, setFormMonth] = useState<number>(new Date().getMonth() + 1);
  const [formValue, setFormValue] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Trigger cleanup of duplicates in Firestore when component mounts or cpiHistory changes
  useEffect(() => {
    if (cpiHistory && cpiHistory.length > 0) {
      const map = new Map<string, CpiIndex[]>();
      cpiHistory.forEach(item => {
        const key = `${item.year}-${item.month}-${item.indexType || 'cpi'}`;
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(item);
      });

      map.forEach((items) => {
        if (items.length > 1) {
          // Identify the best one to keep:
          let bestItem = items[0];
          for (const item of items) {
            const bestIsBase = bestItem.value >= 1000;
            const itemIsBase = item.value >= 1000;
            if (itemIsBase && !bestIsBase) {
              bestItem = item;
            } else if (itemIsBase === bestIsBase) {
              if (item.value > bestItem.value) {
                bestItem = item;
              }
            }
          }

          // Delete all other items from Firestore
          items.forEach(item => {
            if (item.id && !item.id.startsWith('default-') && item.id !== bestItem.id) {
              console.log(`Cleaning up duplicate CPI entry from Firestore: ${item.year}-${item.month} (value: ${item.value}, type: ${item.indexType || 'cpi'})`);
              onDeleteCpi(item.id);
            }
          });
        }
      });
    }
  }, [cpiHistory, onDeleteCpi]);

  // Group CPI history by Year, ensuring they are strictly unique, deduplicated, and only published indexes are shown
  const now = new Date();
  const historyToUse = deduplicateCpiHistory(cpiHistory, cpiType as 'cpi' | 'construction').filter(item => {
    const pubDate = getCpiPublicationDate(item.year, item.month);
    return pubDate.getTime() <= now.getTime();
  });
  
  const groupedByYear: { [key: number]: CpiIndex[] } = {};
  historyToUse.forEach(item => {
    const yr = Number(item.year);
    if (!groupedByYear[yr]) {
      groupedByYear[yr] = [];
    }
    groupedByYear[yr].push(item);
  });
  
  // Sort months inside each year descendingly (latest month at the top)
  Object.keys(groupedByYear).forEach(yr => {
    groupedByYear[Number(yr)].sort((a, b) => b.month - a.month);
  });

  const yearsList = Object.keys(groupedByYear).map(Number).sort((a, b) => b - a);

  // Simulator calculation
  const simResult = calculateCpiLinkedRent(
    Number(simPrincipal) || 0,
    simBaseYear,
    simBaseMonth,
    new Date(simCalcDate),
    cpiHistory,
    cpiType as 'cpi' | 'construction'
  );

  const isPeriodInvalid = simBaseYear > simResult.targetYear || 
    (simBaseYear === simResult.targetYear && simBaseMonth > simResult.targetMonth);

  const monthNamesHe = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const getMonthName = (m: number) => isHe ? monthNamesHe[m - 1] : monthNamesEn[m - 1];

  const handleSaveIndex = () => {
    const valNum = parseFloat(formValue);
    if (isNaN(valNum) || valNum <= 0) {
      alert(isHe ? 'אנא הזן ערך מדד תקין' : 'Please enter a valid index value');
      return;
    }
    
    // Check if index already exists for this month/year (if not editing the same item)
    const exists = historyToUse.find(c => Number(c.year) === Number(formYear) && Number(c.month) === Number(formMonth) && c.id !== editingId);
    if (exists) {
      alert(isHe ? 'כבר קיים מדד לחודש ושנה אלו' : 'An index already exists for this month and year');
      return;
    }

    const publishedAt = `${formYear}-${String(formMonth === 12 ? 1 : formMonth + 1).padStart(2, '0')}-15`;
    
    onSaveCpi({
      year: Number(formYear),
      month: Number(formMonth),
      value: valNum,
      publishedAt
    }, editingId);

    // Reset Form
    setFormValue('');
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEditIndex = (item: CpiIndex) => {
    setFormYear(item.year);
    setFormMonth(item.month);
    const val = convertToBase(item.value, cpiType as 'cpi' | 'construction');
    setFormValue(val.toFixed(2));
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  // Fetch/Import from CBS (Central Bureau of Statistics)
  const handleImportLatestIndex = async () => {
    setIsImporting(true);
    try {
      const indexId = cpiType === 'construction' ? '200010' : '120010';
      const response = await fetch(`https://apis.cbs.gov.il/index/data/price?id=${indexId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data || !data.month || !data.month[0] || !data.month[0].date) {
        throw new Error(isHe ? "מבנה הנתונים שהתקבל מהלמ\"ס אינו תקין" : "Invalid data structure received from CBS API");
      }

      const BASE_MULTIPLIERS: { [key: string]: number } = {
        "2024 ממוצע": 387169.9961878424,
        "2022 ממוצע": 360493.4787596298,
        "2020 ממוצע": 340409.32838491953,
        "2018 ממוצע": 339391.15492015904,
        "2016 ממוצע": 336030.846455603,
        "2014 ממוצע": 339768.29773064,
        "2012 ממוצע": 333106.1742457255,
        "2010 ממוצע": 316640.85004346534,
        "2008 ממוצע": 298436.23943776184,
        "2006 ממוצע": 283954.5570292691,
        "2002 ממוצע": 273559.3034964057,
        "2000 ממוצע": 256141.66994045474,
        "1998 ממוצע": 240734.65220038448,
        "1993 ממוצע": 152267.3321950566,
        "1987 ממוצע": 62894.39578482305,
        "1985 ממוצע": 35433.46241398481,
        "1980 ממוצע": 157.48205517326584,
        "1976 ממוצע": 18.862385336359546,
        "1969 ממוצע": 4.587155963302752,
        "1964 ממוצע": 3.7082909970111175,
        "1959 ינואר": 2.753,
        "1951 ספטמבר": 1.0
      };

      const dates = data.month[0].date;
      // Filter for records from 2024 onwards
      const filteredDates = dates.filter((d: any) => d.year >= 2024);

      let importedCount = 0;
      let alreadyCount = 0;

      for (const item of filteredDates) {
        const year = item.year;
        const monthNum = item.month;
        if (isNaN(year) || isNaN(monthNum)) continue;

        // Skip importing if the index is not published yet
        const pubDate = getCpiPublicationDate(year, monthNum);
        if (pubDate.getTime() > new Date().getTime()) {
          continue;
        }

        // Check if this month & year already exists in historyToUse
        const alreadyExists = historyToUse.find(c => Number(c.year) === year && Number(c.month) === monthNum);

        if (alreadyExists) {
          alreadyCount++;
        } else {
          const value = item.currBase ? item.currBase.value : 0;
          const base = item.currBase ? (item.currBase.baseDesc || "") : "";
          if (!value) continue;

          let multiplier = 1;
          if (cpiType === 'construction') {
            if (base.includes("2025")) {
              multiplier = 940469.8032366304;
            } else if (base.includes("2011")) {
              multiplier = 678060.420502257;
            } else {
              multiplier = 940469.8032366304;
            }
          } else {
            multiplier = BASE_MULTIPLIERS[base] || BASE_MULTIPLIERS["2024 ממוצע"];
          }

          const convertedValue = Math.round(value * multiplier * 100) / 100;

          if (convertedValue > 0) {
            const publishedAt = `${year}-${String(monthNum === 12 ? 1 : monthNum + 1).padStart(2, '0')}-15`;
            await onSaveCpi({
              year,
              month: monthNum,
              value: convertedValue,
              publishedAt
            }, null);
            importedCount++;
          }
        }
      }

      if (importedCount > 0) {
        if (cpiType === 'construction') {
          alert(isHe 
            ? `מדדי תשומות הבנייה יובאו בהצלחה מהלמ"ס! יובאו ${importedCount} מדדים חדשים משנת 2024 ואילך, המחושבים לפי בסיס יולי 1950.` 
            : `Construction input indexes successfully imported! Imported ${importedCount} new indexes from 2024 onwards on July 1950 base.`
          );
        } else {
          alert(isHe 
            ? `המדדים יובאו בהצלחה מהלמ"ס! יובאו ${importedCount} מדדים חדשים משנת 2024 ואילך, המחושבים ישירות לפי בסיס ספטמבר 1951.` 
            : `CPI successfully imported! Imported ${importedCount} new indexes from 2024 onwards on September 1951 base.`
          );
        }
      } else if (alreadyCount > 0) {
        alert(isHe 
          ? "כל המדדים משנת 2024 ואילך כבר מעודכנים במערכת!" 
          : "All indexes from 2024 onwards are already up to date in the system!"
        );
      } else {
        alert(isHe 
          ? "לא נמצאו מדדים תואמים חדשים בנתוני הלמ\"ס" 
          : "No new matching indexes found in the CBS response"
        );
      }
    } catch (error: any) {
      console.error("Error importing CPI from CBS:", error);
      alert(isHe 
        ? `שגיאה בייבוא המדדים מהלמ"ס: ${error.message || error}. תוכל להזין את המדד באופן ידני בטאב "היסטוריית מדדים וניהול".`
        : `Error importing indexes from CBS: ${error.message || error}. You can still enter it manually in the "CPI History" tab.`
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-start">
      
      {/* Title & Import Header Banner */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-6 rounded-[2.5rem] border border-indigo-100/50 dark:border-indigo-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <LucideIcon name="Scale" size={26} className="text-indigo-500 animate-pulse" />
            <span>
              {cpiType === 'construction'
                ? (isHe ? 'מדד תשומות הבנייה למגורים - סימולטור ומחשבון' : 'Construction Inputs Simulator & Calculator')
                : (isHe ? 'מחשבון הצמדה וסימולטור מדד המחירים לצרכן' : 'CPI Simulator & Linkage Calculator')
              }
            </span>
          </h2>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 max-w-xl">
            {cpiType === 'construction'
              ? (isHe 
                  ? 'מדד תשומות הבנייה למגורים (קוד 200010) מתפרסם בכל 15 לחודש בערב על ידי הלמ"ס. המערכת מחשבת באופן אוטומטי את ההצמדה לשכירות לפי המדד הידוע האחרון במועד החיוב (על בסיס יולי 1950).' 
                  : 'The Residential Building Construction Inputs Price Index (code 200010) is published on the 15th of each month by the CBS. All calculations are on the July 1950 base.'
                )
              : (isHe 
                  ? 'מדד המחירים לצרכן (מדד הלמ"ס) מתפרסם בכל 15 לחודש בערב. המערכת מחשבת באופן אוטומטי את ההצמדה לשכירות לפי המדד הידוע האחרון במועד החיוב.' 
                  : 'The Consumer Price Index (CPI) is published on the 15th of each month. Rent is automatically updated based on the latest known index.'
                )
            }
          </p>
        </div>
        
        <button
          onClick={handleImportLatestIndex}
          disabled={isImporting}
          className={`font-bold py-3 px-5 rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0 ${
            isImporting
              ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-150 dark:shadow-none'
          }`}
        >
          <LucideIcon name={isImporting ? "Loader2" : "CloudDownload"} size={18} className={isImporting ? "animate-spin" : ""} />
          <span>{isImporting ? (isHe ? 'מייבא...' : 'Importing...') : (isHe ? 'יבא מדד אחרון מהלמ"ס' : 'Import Latest Index')}</span>
        </button>
      </div>

      {/* Dynamic Index Type Toggle Switcher (Segmented Control) */}
      <div className="bg-slate-100/85 dark:bg-slate-800/60 p-1.5 rounded-2xl flex w-full max-w-md shadow-sm border border-slate-200/50 dark:border-slate-700/50">
        <button
          onClick={() => onCpiTypeChange('cpi')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-black transition-all ${
            cpiType === 'cpi'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs scale-100'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <LucideIcon name="TrendingUp" size={14} />
          <span>{isHe ? 'מדד המחירים לצרכן' : 'Consumer Price Index'}</span>
        </button>
        <button
          onClick={() => onCpiTypeChange('construction')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-black transition-all ${
            cpiType === 'construction'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs scale-100'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
          }`}
        >
          <LucideIcon name="Home" size={14} />
          <span>{isHe ? 'תשומות הבנייה למגורים' : 'Construction Inputs'}</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-px">
        <button
          onClick={() => setSubTab('simulator')}
          className={`pb-3 px-4 font-black text-sm relative transition-colors ${
            subTab === 'simulator' 
              ? 'text-indigo-650 dark:text-indigo-400 border-b-2 border-indigo-500' 
              : 'text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          {isHe ? 'סימולטור ומחשבון' : 'Calculator Simulator'}
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`pb-3 px-4 font-black text-sm relative transition-colors ${
            subTab === 'history' 
              ? 'text-indigo-650 dark:text-indigo-400 border-b-2 border-indigo-500' 
              : 'text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300'
          }`}
        >
          {cpiType === 'construction'
            ? (isHe ? 'היסטוריית תשומות בנייה וניהול' : 'Construction Inputs History')
            : (isHe ? 'היסטוריית מדדים וניהול' : 'CPI History & Management')
          }
        </button>
      </div>

      {/* Tab 1: Simulator */}
      {subTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Inputs Section */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="font-black text-lg text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <LucideIcon name="Calculator" size={18} className="text-slate-500" />
              <span>{isHe ? 'פרטי ההצמדה' : 'Linkage Settings'}</span>
            </h3>

            {/* Principal */}
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'סכום בסיס / קרן השכירות (₪)' : 'Principal / Base Rent (₪)'}</label>
              <input
                type="number"
                value={simPrincipal}
                onChange={e => setSimPrincipal(e.target.value)}
                placeholder="0"
                className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-850 dark:text-white"
              />
            </div>

            {/* Base Month & Year */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'חודש בסיס' : 'Base Month'}</label>
                <div className="relative">
                  <select
                    value={simBaseMonth}
                    onChange={e => setSimBaseMonth(Number(e.target.value))}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white appearance-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{getMonthName(m)}</option>
                    ))}
                  </select>
                  <LucideIcon name="ChevronDown" size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'שנת בסיס' : 'Base Year'}</label>
                <div className="relative">
                  <select
                    value={simBaseYear}
                    onChange={e => setSimBaseYear(Number(e.target.value))}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white appearance-none"
                  >
                    {[2024, 2025, 2026].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <LucideIcon name="ChevronDown" size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Target Calc Date */}
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'תאריך קובע לחישוב (מדד ידוע במועד זה)' : 'As of Date (for known CPI)'}</label>
              <input
                type="date"
                value={simCalcDate}
                onChange={e => setSimCalcDate(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-850 dark:text-white"
              />
            </div>
          </div>

          {/* Results & Explanation Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Main Result Card */}
            {isPeriodInvalid ? (
              <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden transition-all animate-in fade-in duration-300">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 scale-150">
                  <LucideIcon name="AlertTriangle" size={200} />
                </div>
                
                <div className="relative z-10 flex flex-col justify-between h-full gap-6">
                  <div>
                    <span className="text-rose-100 text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full">
                      {isHe ? 'שגיאת חישוב הצמדה' : 'Linkage Calculation Error'}
                    </span>
                    <div className="text-3xl font-black mt-4 leading-tight">
                      {isHe ? 'התקופה למדד הבסיס שגויה' : 'Invalid Base Period'}
                    </div>
                    <p className="text-sm text-rose-100 mt-2 font-bold">
                      {isHe 
                        ? `תאריך הבסיס (${getMonthName(simBaseMonth)} ${simBaseYear}) מאוחר מהמדד הידוע האחרון (${getMonthName(simResult.targetMonth)} ${simResult.targetYear}).`
                        : `The base date (${getMonthName(simBaseMonth)} ${simBaseYear}) is later than the latest known index (${getMonthName(simResult.targetMonth)} ${simResult.targetYear}).`
                      }
                    </p>
                    <p className="text-xs text-rose-200 mt-1">
                      {isHe 
                        ? 'לא יתכן שתחשב הצמדה למדד שאינו קיים או שטרם פורסם. אנא בחר תאריך בסיס מוקדם או שווה לתאריך המדד הידוע.' 
                        : 'It is not possible to calculate linkage to a non-existent or unpublished index. Please select a base date prior to or equal to the known index date.'
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
                    <div>
                      <span className="text-rose-200 text-[10px] font-black block uppercase">{cpiType === 'construction' ? (isHe ? 'מדד בסיס (יולי 1950)' : 'Base Index (July 1950)') : (isHe ? 'מדד בסיס (ספטמבר 1951)' : 'Base CPI (Sept 1951)')}</span>
                      <span className="text-base font-black mt-0.5 block">--</span>
                      <span className="text-[10px] text-rose-200 block">({getMonthName(simBaseMonth)} {simBaseYear})</span>
                    </div>
                    <div>
                      <span className="text-rose-200 text-[10px] font-black block uppercase">{cpiType === 'construction' ? (isHe ? 'מדד ידוע אחרון (יולי 1950)' : 'Latest Index (July 1950)') : (isHe ? 'מדד ידוע אחרון (ספטמבר 1951)' : 'Latest CPI (Sept 1951)')}</span>
                      <span className="text-base font-black mt-0.5 block">{simResult.targetIndex.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-[10px] text-rose-200 block">({getMonthName(simResult.targetMonth)} {simResult.targetYear})</span>
                    </div>
                    <div>
                      <span className="text-rose-200 text-[10px] font-black block uppercase">{isHe ? 'שינוי באחוזים' : 'Percent Change'}</span>
                      <span className="text-base font-black mt-0.5 block text-rose-300">--</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-indigo-650 to-purple-700 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 scale-150">
                  <LucideIcon name="Scale" size={200} />
                </div>
                
                <div className="relative z-10 flex flex-col justify-between h-full gap-6">
                  <div>
                    <span className="text-indigo-100 text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full">
                      {isHe ? 'סכום מעודכן כולל הצמדה' : 'CPI Linked Amount'}
                    </span>
                    <div className="text-5xl font-black mt-3">
                      ₪{simResult.adjustedRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-5">
                    <div>
                      <span className="text-indigo-200 text-[10px] font-black block uppercase">{cpiType === 'construction' ? (isHe ? 'מדד בסיס (יולי 1950)' : 'Base Index (July 1950)') : (isHe ? 'מדד בסיס (ספטמבר 1951)' : 'Base CPI (Sept 1951)')}</span>
                      <span className="text-base font-black mt-0.5 block">{simResult.baseIndex.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-[10px] text-indigo-200 block">({getMonthName(simBaseMonth)} {simBaseYear})</span>
                    </div>
                    <div>
                      <span className="text-indigo-200 text-[10px] font-black block uppercase">{cpiType === 'construction' ? (isHe ? 'מדד ידוע אחרון (יולי 1950)' : 'Latest Index (July 1950)') : (isHe ? 'מדד ידוע אחרון (ספטמבר 1951)' : 'Latest CPI (Sept 1951)')}</span>
                      <span className="text-base font-black mt-0.5 block">{simResult.targetIndex.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-[10px] text-indigo-200 block">({getMonthName(simResult.targetMonth)} {simResult.targetYear})</span>
                    </div>
                    <div>
                      <span className="text-indigo-200 text-[10px] font-black block uppercase">{isHe ? 'שינוי באחוזים' : 'Percent Change'}</span>
                      <span className={`text-base font-black mt-0.5 block ${simResult.changePercent >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {simResult.changePercent >= 0 ? '+' : ''}{simResult.changePercent}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Explanation / "How it works" */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 text-start space-y-3">
              <h4 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                <LucideIcon name="Info" size={16} className="text-indigo-500" />
                <span>{isHe ? 'הסבר מנגנון ההצמדה בחישוב זה' : 'Linkage Mechanism Explained'}</span>
              </h4>
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-2">
                {isPeriodInvalid ? (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/25 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-rose-800 dark:text-rose-300 space-y-1.5">
                    <p className="font-black text-xs">
                      {isHe ? 'מדוע החישוב נמנע?' : 'Why is the calculation disabled?'}
                    </p>
                    <p>
                      {isHe 
                        ? `בחרת חודש בסיס ${getMonthName(simBaseMonth)} ושנת בסיס ${simBaseYear}, שתאריכם מאוחר מתאריך המדד הידוע האחרון לחישוב במערכת: חודש ${getMonthName(simResult.targetMonth)} לשנת ${simResult.targetYear}.`
                        : `You selected a base month ${getMonthName(simBaseMonth)} and base year ${simBaseYear}, which are later than the latest known index in the system: ${getMonthName(simResult.targetMonth)} ${simResult.targetYear}.`
                      }
                    </p>
                    <p>
                      {isHe 
                        ? 'לא ניתן להצמיד סכומים למדד עתידי שטרם פורסם. כדי לתקן זאת, אנא שנה את חודש/שנת הבסיס לערך מוקדם יותר, או שנה את תאריך החישוב לתאריך מאוחר יותר שבו המדד כבר ידוע.'
                        : 'It is impossible to link amounts to a future unpublished index. To fix this, please change the base month/year to an earlier date, or change the target calculation date to a later date when the index is already published.'
                      }
                    </p>
                  </div>
                ) : isHe ? (
                  <div>
                    <p>
                      עבור תאריך החישוב שקבעת (<strong>{new Date(simCalcDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>), המדד הידוע האחרון שפורסם הוא מדד חודש <strong>{getMonthName(simResult.targetMonth)} {simResult.targetYear}</strong>, אשר פורסם ב- <strong>{new Date(simResult.publicationDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>.
                    </p>
                    <p className="mt-1">
                      ערכי המדד מחושבים על בסיס המדד הרציף ללא שינויי בסיס של הלמ"ס (<strong>בסיס ספטמבר 1951 = 100</strong>):
                    </p>
                    <ul className="list-disc list-inside mt-1 space-y-1 pl-1">
                      <li>מדד ידוע אחרון (חודש {getMonthName(simResult.targetMonth)} {simResult.targetYear}): <strong>{simResult.targetIndex.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> נקודות.</li>
                      <li>מדד בסיס (חודש {getMonthName(simBaseMonth)} {simBaseYear}): <strong>{simResult.baseIndex.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> נקודות.</li>
                    </ul>
                    <p className="mt-2">
                      הפרש המדדים מבטא שינוי של <strong>{simResult.changePercent}%</strong>.
                      לכן, סכום הבסיס (קרן השכירות) של ₪{Number(simPrincipal).toLocaleString()} מוצמד ומעודכן לסכום כולל של <strong>₪{simResult.adjustedRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p>
                      For your selected calculation date (<strong>{new Date(simCalcDate).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>), the latest published known CPI is for <strong>{getMonthName(simResult.targetMonth)} {simResult.targetYear}</strong>, which was published on <strong>{new Date(simResult.publicationDate).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>.
                    </p>
                    <p className="mt-1">
                      The index values are calculated based on the continuous series (<strong>September 1951 Base = 100</strong>) to avoid index base resets:
                    </p>
                    <ul className="list-disc list-inside mt-1 space-y-1 pl-1">
                      <li>Latest known index ({getMonthName(simResult.targetMonth)} {simResult.targetYear}): <strong>{simResult.targetIndex.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> points.</li>
                      <li>Base index ({getMonthName(simBaseMonth)} {simBaseYear}): <strong>{simResult.baseIndex.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> points.</li>
                    </ul>
                    <p className="mt-2">
                      The relative change represents a shift of <strong>{simResult.changePercent}%</strong>.
                      Therefore, your principal base sum of ₪{Number(simPrincipal).toLocaleString()} is linked to a total of <strong>₪{simResult.adjustedRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: CPI History & Management */}
      {subTab === 'history' && (
        <div className="space-y-6">
          
          {/* Add / Edit Form Toggle Button */}
          <div className="flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-800 dark:text-white">{isHe ? 'רשימת מדדים שנתית' : 'Yearly CPI Indices List'}</h3>
            
            <button
              onClick={() => {
                setEditingId(null);
                setFormValue('');
                setIsFormOpen(!isFormOpen);
              }}
              className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-colors border border-indigo-100 dark:border-indigo-900/30"
            >
              <LucideIcon name={isFormOpen ? 'X' : 'Plus'} size={16} />
              <span>{isHe ? (isFormOpen ? 'סגור טופס' : 'הוסף מדד ידנית') : (isFormOpen ? 'Close Form' : 'Add CPI Manually')}</span>
            </button>
          </div>

          {/* Form Box */}
          {isFormOpen && (
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-700 animate-in slide-in-from-top duration-300 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'שנה' : 'Year'}</label>
                <input
                  type="number"
                  value={formYear}
                  onChange={e => setFormYear(Number(e.target.value))}
                  className="w-full p-3 bg-white dark:bg-slate-750 rounded-xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">{isHe ? 'חודש' : 'Month'}</label>
                <div className="relative">
                  <select
                    value={formMonth}
                    onChange={e => setFormMonth(Number(e.target.value))}
                    className="w-full p-3 bg-white dark:bg-slate-750 rounded-xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white appearance-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{getMonthName(m)}</option>
                    ))}
                  </select>
                  <LucideIcon name="ChevronDown" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mb-1 block">
                  {isHe ? 'ערך המדד (בסיס ספטמבר 1951)' : 'CPI Index Value (Sept 1951 Base)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formValue}
                  onChange={e => setFormValue(e.target.value)}
                  placeholder={isHe ? "לדוגמה: 40575415.60" : "e.g. 40575415.60"}
                  className="w-full p-3 bg-white dark:bg-slate-750 rounded-xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveIndex}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-xl w-full flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <LucideIcon name="Save" size={16} />
                  <span>{isHe ? 'שמור' : 'Save'}</span>
                </button>
                {editingId && (
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setFormValue('');
                      setIsFormOpen(false);
                    }}
                    className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-200 font-bold p-3 rounded-xl transition-colors shrink-0 border border-slate-200 dark:border-slate-600"
                  >
                    {isHe ? 'ביטול' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Grouped Years Grid */}
          <div className="space-y-6">
            {yearsList.map(year => {
              const items = groupedByYear[year];
              return (
                <div key={year} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xs">
                  <h4 className="font-black text-xl text-indigo-650 dark:text-indigo-400 mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-2 flex items-center gap-2">
                    <LucideIcon name="Calendar" size={18} />
                    <span>{year}</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {items.map(item => {
                      const prevYear = item.month === 1 ? item.year - 1 : item.year;
                      const prevMonth = item.month === 1 ? 12 : item.month - 1;
                      
                      const currVal = convertToBase(item.value, cpiType as 'cpi' | 'construction');
                      const prevVal = getIndexValueForMonth(prevYear, prevMonth);
                      
                      let changeText = '';
                      let isPositive = false;
                      let isNegative = false;
                      
                      if (prevVal !== null && prevVal > 0) {
                        const currValRounded = Math.round(currVal * 100) / 100;
                        const prevValRounded = Math.round(prevVal * 100) / 100;
                        const diffPct = ((currValRounded / prevValRounded) - 1) * 100;
                        const roundedDiffPct = Math.round(diffPct * 100) / 100;
                        const formattedDiff = roundedDiffPct.toFixed(2);
                        
                        if (roundedDiffPct > 0) {
                          changeText = `+${formattedDiff}%`;
                          isPositive = true;
                        } else if (roundedDiffPct < 0) {
                          changeText = `${formattedDiff}%`;
                          isNegative = true;
                        } else {
                          changeText = '0.00%';
                        }
                      }

                      return (
                        <div 
                          key={item.id} 
                          className="bg-slate-50 dark:bg-slate-750 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all group relative"
                        >
                          <div className="text-start">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 block uppercase">{getMonthName(item.month)}</span>
                            <span className="text-base font-black text-slate-800 dark:text-white mt-0.5 block">
                              {convertToBase(item.value, cpiType as 'cpi' | 'construction').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {item.value < 1000 && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                                {cpiType === 'construction'
                                  ? (isHe ? `נקודות מדד: ${item.value}` : `Index points: ${item.value}`)
                                  : (isHe ? `בסיס 2020: ${item.value}` : `Base 2020: ${item.value}`)
                                }
                              </span>
                            )}
                            
                            {changeText && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                                  isPositive 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                    : isNegative 
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                                      : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
                                }`}>
                                  {changeText}
                                </span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">
                                  {isHe ? 'מחודש קודם' : 'vs prev.'}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-end gap-1.5 mt-3 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditIndex(item)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-150 text-indigo-600 rounded-lg dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 transition-colors"
                              title={isHe ? 'ערוך' : 'Edit'}
                            >
                              <LucideIcon name="Pencil" size={12} />
                            </button>
                            
                            {/* Only allow deleting non-default seeded items, or allow deleting any */}
                            <button
                              onClick={() => onDeleteCpi(item.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-150 text-rose-600 rounded-lg dark:bg-rose-950/40 dark:hover:bg-rose-900/60 transition-colors"
                              title={isHe ? 'מחק' : 'Delete'}
                            >
                              <LucideIcon name="Trash2" size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
