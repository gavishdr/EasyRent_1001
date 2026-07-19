import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';

const PAYMENT_METHODS_KEYS = ['pm_credit_card', 'pm_bank_transfer', 'pm_cash', 'pm_check', 'pm_app', 'pm_other'];

interface ExpenseModalProps {
  initialData?: any;
  onSave: (data: any, id?: string) => void;
  onCancel: () => void;
  isTenant: boolean;
  t: (key: string) => string;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  initialData,
  onSave,
  onCancel,
  isTenant,
  t
}) => {
  const [formData, setFormData] = useState({ isPaid: 'true', ...initialData });

  const handleChange = (key: string, val: any) => {
    setFormData((prev: any) => {
      const next = { ...prev, [key]: val };
      if (next.type === 'arnona' && (key === 'grossAmount' || key === 'discountPercent' || key === 'type' || key === 'securityLevy')) {
        const g = parseFloat(next.grossAmount) || 0;
        const d = parseFloat(next.discountPercent) || 0;
        const s = parseFloat(next.securityLevy) || 0;
        if (g > 0 || s > 0) {
          next.amount = Math.round((g * (1 - d / 100)) + s);
        } else {
          next.amount = '';
        }
      }
      return next;
    });
  };

  const isUtility = ['electricity', 'water', 'gas'].includes(formData.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-overlay bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-2xl text-slate-800 dark:text-white">
            {initialData?.id ? t('edit') : t('add_expense')}
          </h3>
          <button onClick={onCancel} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-650 transition-colors">
            <LucideIcon name="X" size={20} />
          </button>
        </div>

        <div className="space-y-4 text-start">
          <div>
            <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('expense_type')}</label>
            <div className="relative">
              <select
                className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-start appearance-none"
                value={formData.type || 'arnona'}
                onChange={e => handleChange('type', e.target.value)}
              >
                <optgroup label={t('regular_expenses_group')}>
                  <option value="arnona">{t('arnona')}</option>
                  <option value="electricity">{t('electricity')}</option>
                  <option value="water">{t('water')}</option>
                  <option value="gas">{t('gas')}</option>
                  <option value="hoa">{t('hoa')}</option>
                  <option value="internet">{t('internet')}</option>
                  <option value="insurance">{t('insurance')}</option>
                  <option value="cleaning">{t('cleaning')}</option>
                  <option value="management_fee">{t('management_fee')}</option>
                  <option value="gardening">{t('gardening')}</option>
                  <option value="other_regular">{t('other_regular')}</option>
                </optgroup>
                <optgroup label={t('special_expenses_group')}>
                  <option value="professional_services">{t('professional_services')}</option>
                  <option value="taxes_fees">{t('taxes_fees')}</option>
                  <option value="supplies">{t('supplies')}</option>
                  {!isTenant && <option value="mortgage">{t('mortgage_payment')}</option>}
                  {isTenant && <option value="rent">{t('rent_expense')}</option>}
                </optgroup>
              </select>
              <LucideIcon name="ChevronDown" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {isUtility ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('month_from')}</label>
                  <input type="month" value={formData.monthFrom || ''} onChange={e => handleChange('monthFrom', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl outline-none border text-start" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('month_to')}</label>
                  <input type="month" value={formData.monthTo || ''} onChange={e => handleChange('monthTo', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl outline-none border text-start" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('meter_from')}</label>
                  <input type="date" value={formData.meterFrom || ''} onChange={e => handleChange('meterFrom', e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-755 rounded-xl outline-none border" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('meter_to')}</label>
                  <input type="date" value={formData.meterTo || ''} onChange={e => handleChange('meterTo', e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-755 rounded-xl outline-none border" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('amount')}</label>
                <input type="number" step="any" value={formData.amount || ''} onChange={e => handleChange('amount', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl font-bold outline-none border text-start" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('payment_date')}</label>
                <input type="date" value={formData.paymentDate || ''} onChange={e => handleChange('paymentDate', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl outline-none border" />
              </div>
            </>
          ) : formData.type === 'arnona' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('month_from')}</label>
                  <input type="month" value={formData.monthFrom || ''} onChange={e => handleChange('monthFrom', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl outline-none border text-start" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('month_to')}</label>
                  <input type="month" value={formData.monthTo || ''} onChange={e => handleChange('monthTo', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl outline-none border text-start" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('gross_amount')}</label>
                  <input type="number" step="any" value={formData.grossAmount || ''} onChange={e => handleChange('grossAmount', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl font-bold outline-none border text-start" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('discount_percent')}</label>
                  <input type="number" step="any" value={formData.discountPercent || ''} onChange={e => handleChange('discountPercent', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl font-bold outline-none border text-start" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('security_levy')}</label>
                <input type="number" step="any" value={formData.securityLevy || ''} onChange={e => handleChange('securityLevy', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl font-bold outline-none border text-start" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('net_amount')}</label>
                <input type="number" step="any" value={formData.amount || ''} onChange={e => handleChange('amount', e.target.value)} className="w-full p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-2xl font-black outline-none border text-start" />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('month_from')}</label>
                  <input type="month" value={formData.monthFrom || ''} onChange={e => handleChange('monthFrom', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl outline-none border text-start" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('month_to')}</label>
                  <input type="month" value={formData.monthTo || ''} onChange={e => handleChange('monthTo', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl outline-none border text-start" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('amount')}</label>
                <input type="number" step="any" value={formData.amount || ''} onChange={e => handleChange('amount', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl font-bold outline-none border text-start" />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('is_paid')}</label>
            <div className="relative">
              <select
                className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-start appearance-none"
                value={formData.isPaid}
                onChange={e => handleChange('isPaid', e.target.value)}
              >
                <option value="true">{t('yes')}</option>
                <option value="false">{t('no')}</option>
              </select>
              <LucideIcon name="ChevronDown" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('actual_payment_date')}</label>
              <input type="date" value={formData.actualPaymentDate || ''} onChange={e => handleChange('actualPaymentDate', e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl outline-none border" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('payment_method')}</label>
              <div className="relative">
                <select
                  className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-start appearance-none"
                  value={formData.paymentMethod || ''}
                  onChange={e => handleChange('paymentMethod', e.target.value)}
                >
                  <option value="">{t('select')}</option>
                  {PAYMENT_METHODS_KEYS.map(k => <option key={k} value={t(k)}>{t(k)}</option>)}
                </select>
                <LucideIcon name="ChevronDown" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{t('notes')}</label>
            <textarea
              value={formData.notes || ''}
              onChange={e => handleChange('notes', e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-755 rounded-2xl h-20 resize-none outline-none border text-start"
            />
          </div>

          <button
            onClick={() => onSave(formData, initialData?.id)}
            className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black text-xl shadow-xl shadow-rose-100 dark:shadow-none mt-4 active:scale-95 transition-transform hover:bg-rose-600"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExpenseModal;
