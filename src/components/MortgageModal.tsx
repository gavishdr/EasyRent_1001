import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';
import { Apartment, Mortgage } from '../types';
import { 
  MORTGAGE_TRACKS, 
  CALCULATION_METHODS, 
  ISRAELI_BANKS, 
  getMortgageTrackInfo, 
  calculateEstimatedTotalCost 
} from '../utils/mortgage';

interface MortgageModalProps {
  initialData?: Partial<Mortgage> | null;
  apartments: Apartment[];
  onSave: (data: Partial<Mortgage>, id?: string) => void;
  onCancel: () => void;
  t: (key: string) => string;
  lang?: string;
  currency?: string;
}

export const MortgageModal: React.FC<MortgageModalProps> = ({
  initialData,
  apartments,
  onSave,
  onCancel,
  t,
  lang = 'he',
  currency = '₪'
}) => {
  const isEn = lang === 'en';
  
  const [formData, setFormData] = useState<Partial<Mortgage>>({
    aptId: initialData?.aptId || (apartments[0]?.id || ''),
    bank: initialData?.bank || '',
    track: initialData?.track || 'kalatz',
    primeAdjustment: initialData?.primeAdjustment !== undefined ? initialData.primeAdjustment : '',
    calculationMethod: initialData?.calculationMethod || 'spitzer',
    originalAmount: initialData?.originalAmount !== undefined ? initialData.originalAmount : '',
    interestRate: initialData?.interestRate !== undefined ? initialData.interestRate : '',
    drawdownDate: initialData?.drawdownDate || '',
    durationYears: initialData?.durationYears !== undefined ? initialData.durationYears : '',
    balance: initialData?.balance !== undefined ? initialData.balance : '',
    balanceDate: initialData?.balanceDate || '',
    payment: initialData?.payment !== undefined ? initialData.payment : '',
    paymentDate: initialData?.paymentDate || '',
    insuranceCompany: initialData?.insuranceCompany || '',
    policyNumber: initialData?.policyNumber || '',
    insurancePhone: initialData?.insurancePhone || '',
    notes: initialData?.notes || ''
  });

  const handleChange = (key: keyof Mortgage, val: any) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const selectedTrackInfo = getMortgageTrackInfo(formData.track);
  const isPrime = formData.track === 'prime';
  
  // Calculate estimated total cost live with language and currency awareness
  const estimatedCost = calculateEstimatedTotalCost(
    formData.payment || 0, 
    formData.durationYears || 0,
    currency,
    lang
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bank || !formData.bank.trim()) {
      alert(t('bank_name') + ' ' + (isEn ? 'is required' : 'שדה חובה'));
      return;
    }
    const aptName = apartments.find(a => a.id === formData.aptId)?.name || '';
    
    const toSave: Partial<Mortgage> = {
      ...formData,
      aptName,
      estimatedTotalCost: estimatedCost ? estimatedCost.total : undefined
    };

    onSave(toSave, initialData?.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 modal-overlay bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 border border-slate-100 dark:border-slate-700 text-start">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <LucideIcon name="Landmark" size={24} />
            </div>
            <div>
              <h3 className="font-black text-2xl text-slate-800 dark:text-white">
                {initialData?.id ? (t('edit') + ' ' + t('mortgage')) : t('add_mortgage')}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-bold mt-0.5">
                {t('mortgage_sub_title')}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onCancel} 
            className="bg-slate-100 dark:bg-slate-700 p-2.5 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <LucideIcon name="X" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Property & Bank */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-1.5 block">
                {t('assigned_prop')} *
              </label>
              <div className="relative">
                <select
                  required
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white appearance-none"
                  value={formData.aptId || ''}
                  onChange={e => handleChange('aptId', e.target.value)}
                >
                  <option value="">{t('select')}</option>
                  {apartments.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <LucideIcon name="ChevronDown" size={16} className={`absolute ${isEn ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-1.5 block">
                {t('bank_name')} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  list="israeli-banks-list"
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  placeholder={isEn ? "e.g. Bank Leumi" : "לדוגמה: בנק לאומי"}
                  value={formData.bank || ''}
                  onChange={e => handleChange('bank', e.target.value)}
                />
                <datalist id="israeli-banks-list">
                  {ISRAELI_BANKS.map(b => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Track & Calculation Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>{t('mortgage_track')} *</span>
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold">{t('loan_track')}</span>
              </label>
              <div className="relative">
                <select
                  required
                  className="w-full p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl font-bold outline-none border border-indigo-200 dark:border-indigo-800/40 text-slate-800 dark:text-white appearance-none"
                  value={formData.track || 'kalatz'}
                  onChange={e => handleChange('track', e.target.value)}
                >
                  {MORTGAGE_TRACKS.map(tr => (
                    <option key={tr.id} value={tr.id}>
                      {isEn ? tr.labelEn : tr.label}
                    </option>
                  ))}
                </select>
                <LucideIcon name="ChevronDown" size={16} className={`absolute ${isEn ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none`} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>{t('calculation_method')} *</span>
                <span className="text-[10px] text-slate-400 font-bold">{t('amortization_schedule')}</span>
              </label>
              <div className="relative">
                <select
                  required
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white appearance-none"
                  value={formData.calculationMethod || 'spitzer'}
                  onChange={e => handleChange('calculationMethod', e.target.value)}
                >
                  {CALCULATION_METHODS.map(cm => (
                    <option key={cm.id} value={cm.id}>
                      {isEn ? cm.labelEn : cm.label}
                    </option>
                  ))}
                </select>
                <LucideIcon name="ChevronDown" size={16} className={`absolute ${isEn ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`} />
              </div>
            </div>
          </div>

          {/* Prime Spread Field (when track is Prime) */}
          {isPrime && (
            <div className="p-4 bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <LucideIcon name="Percent" size={16} className="text-amber-600 dark:text-amber-400" />
                <span>{t('prime_spread')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl font-bold outline-none border border-amber-300 dark:border-amber-800/60 text-slate-800 dark:text-white placeholder:text-slate-400 text-start"
                    placeholder={isEn ? "-0.5 or +0.3" : "-0.5 או +0.3"}
                    value={formData.primeAdjustment || ''}
                    onChange={e => handleChange('primeAdjustment', e.target.value)}
                  />
                  <span className={`absolute ${isEn ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-xs font-black text-amber-600 dark:text-amber-400 pointer-events-none`}>
                    %
                  </span>
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  {isEn ? (
                    <>e.g., enter <span className="font-bold font-mono text-amber-900 dark:text-amber-200">-0.5</span> for Prime minus 0.5% (P-0.5%) or <span className="font-bold font-mono text-amber-900 dark:text-amber-200">+0.3</span> for Prime + 0.3%.</>
                  ) : (
                    <>לדוגמה: הקלד <span className="font-bold font-mono text-amber-900 dark:text-amber-200">-0.5</span> עבור פריים מינוס חצי אחוז (P-0.5%) או <span className="font-bold font-mono text-amber-900 dark:text-amber-200">+0.3</span> עבור פריים פלוס 0.3%.</>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Original Amount & Interest Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-1.5 block">
                {t('original_amount')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400"
                  placeholder="300000"
                  value={formData.originalAmount || ''}
                  onChange={e => handleChange('originalAmount', e.target.value)}
                />
                <span className={`absolute ${isEn ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none`}>{currency}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-1.5 block">
                {t('mortgage_interest')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400"
                  placeholder="2.45"
                  value={formData.interestRate || ''}
                  onChange={e => handleChange('interestRate', e.target.value)}
                />
                <span className={`absolute ${isEn ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none`}>%</span>
              </div>
            </div>
          </div>

          {/* Drawdown Date & Duration Years */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-1.5 block">
                {t('drawdown_date')}
              </label>
              <input
                type="date"
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                value={formData.drawdownDate || ''}
                onChange={e => handleChange('drawdownDate', e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-1.5 block">
                {t('duration_years')} ({isEn ? 'Duration in Years' : 'תקופה בשנים'})
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="50"
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400"
                placeholder={isEn ? "e.g. 13 or 20" : "למשל 13 או 20"}
                value={formData.durationYears || ''}
                onChange={e => handleChange('durationYears', e.target.value)}
              />
            </div>
          </div>

          {/* Monthly Payment & Billing Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-1.5 block">
                {t('payment_amount')} ({isEn ? `Monthly ${currency}` : `חיוב חודשי ${currency}`}) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400"
                  placeholder="2248"
                  value={formData.payment || ''}
                  onChange={e => handleChange('payment', e.target.value)}
                />
                <span className={`absolute ${isEn ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none`}>{currency}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-1.5 block">
                {t('payment_date')} ({isEn ? 'Monthly billing date' : 'יום חיוב בחודש'})
              </label>
              <input
                type="date"
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                value={formData.paymentDate || ''}
                onChange={e => handleChange('paymentDate', e.target.value)}
              />
            </div>
          </div>

          {/* Current Balance & Balance Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-1.5 block">
                {t('current_balance')} ({isEn ? `Outstanding ${currency}` : `סכום יתרה נוכחי ${currency}`})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400"
                  placeholder="61102"
                  value={formData.balance || ''}
                  onChange={e => handleChange('balance', e.target.value)}
                />
                <span className={`absolute ${isEn ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none`}>{currency}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-1.5 block">
                {t('balance_date')} ({isEn ? 'Balance date' : 'תאריך יתרה'})
              </label>
              <input
                type="date"
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                value={formData.balanceDate || ''}
                onChange={e => handleChange('balanceDate', e.target.value)}
              />
            </div>
          </div>

          {/* Live Estimated Total Period Cost Card */}
          {estimatedCost && (
            <div className="p-4 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-start">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                    {t('estimated_total_cost')}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">
                    {estimatedCost.formula}
                  </span>
                </div>
                <div className="text-end">
                  <span className="font-black text-xl text-rose-600 dark:text-rose-400 font-mono">
                    {currency}{estimatedCost.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Insurance Information Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-700 dark:text-slate-200">
              <LucideIcon name="ShieldCheck" size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span>{t('insurance_details')}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 mb-1 block">
                  {t('insurance_company')}
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400"
                  placeholder={isEn ? "e.g. Migdal / Harel" : "למשל: מגדל / הראל"}
                  value={formData.insuranceCompany || ''}
                  onChange={e => handleChange('insuranceCompany', e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 mb-1 block">
                  {t('policy_number')}
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400"
                  placeholder="123456"
                  value={formData.policyNumber || ''}
                  onChange={e => handleChange('policyNumber', e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 mb-1 block">
                  {t('insurance_phone')}
                </label>
                <input
                  type="tel"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-xl font-bold outline-none border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400"
                  placeholder="03-1234567"
                  value={formData.insurancePhone || ''}
                  onChange={e => handleChange('insurancePhone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Mortgage Track Explanation Box (Placed right under Insurance Box as requested) */}
          {selectedTrackInfo && (
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl text-start space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-xs text-indigo-700 dark:text-indigo-300">
                <LucideIcon name="BookOpen" size={16} />
                <span>{t('track_explanation')}: {isEn ? selectedTrackInfo.labelEn : selectedTrackInfo.label}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isEn ? selectedTrackInfo.descriptionEn : selectedTrackInfo.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                    ✓ {t('pros_title')}:
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {isEn ? selectedTrackInfo.prosEn : selectedTrackInfo.pros}
                  </span>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                    ⚠ {t('cons_title')}:
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {isEn ? selectedTrackInfo.consEn : selectedTrackInfo.cons}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-1.5 block">
              {t('notes')}
            </label>
            <textarea
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-750 rounded-2xl outline-none border border-slate-200 dark:border-slate-700 h-20 resize-none text-slate-800 dark:text-white text-xs"
              placeholder={isEn ? "Additional notes and details..." : "הערות ודגשים נוספים..."}
              value={formData.notes || ''}
              onChange={e => handleChange('notes', e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold transition-all shadow-md shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
            >
              <LucideIcon name="Check" size={18} />
              <span>{t('save')}</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 py-3.5 rounded-2xl font-bold transition-all"
            >
              {t('cancel')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
