import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';
import { Apartment, Mortgage } from '../types';
import { ModalForm } from './ModalForm';

interface MortgagesListProps {
  apartments: Apartment[];
  mortgages: Mortgage[];
  onSave: (data: any, id?: string) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

export const MortgagesList: React.FC<MortgagesListProps> = ({
  apartments,
  mortgages,
  onSave,
  onDelete,
  t
}) => {
  const [editing, setEditing] = useState<any>(null);

  const ISRAELI_BANKS = [
    'בנק לאומי',
    'בנק הפועלים',
    'בנק מזרחי טפחות',
    'בנק דיסקונט',
    'הבנק הבינלאומי',
    'בנק יהב',
    'בנק מרכנתיל',
    'בנק ירושלים',
    'בנק מסד',
    'בנק אגוד'
  ];

  const fields = [
    { key: 'aptId', label: t('assigned_prop'), type: 'select', options: apartments.sort((a, b) => (a.name || '').localeCompare(b.name || '')) },
    { key: 'bank', label: t('bank_name'), placeholder: t('bank_name'), type: 'datalist', options: ISRAELI_BANKS },
    { key: 'originalAmount', label: t('original_amount'), type: 'number' },
    { key: 'interestRate', label: t('mortgage_interest'), type: 'number' },
    { key: 'drawdownDate', label: t('drawdown_date'), type: 'date' },
    { key: 'durationYears', label: t('duration_years'), type: 'number' },
    { key: 'balance', label: t('current_balance'), type: 'number' },
    { key: 'balanceDate', label: t('balance_date'), type: 'date' },
    { key: 'payment', label: t('payment_amount'), type: 'number' },
    { key: 'paymentDate', label: t('payment_date'), type: 'date' },
    { key: 'insuranceCompany', label: t('insurance_company'), placeholder: '...' },
    { key: 'policyNumber', label: t('policy_number'), placeholder: '...' },
    { key: 'insurancePhone', label: t('insurance_phone'), type: 'tel', placeholder: '...' },
    { key: 'notes', label: t('notes'), type: 'textarea', placeholder: '...' }
  ];

  const handleSave = (data: any, id?: string) => {
    const aptName = apartments.find(a => a.id === data.aptId)?.name || '';
    onSave({ ...data, aptName }, id);
    setEditing(null);
  };

  const groupedMortgages = mortgages.reduce((acc: any, m) => {
    const key = m.aptName || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <button onClick={() => setEditing('new')} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
        <LucideIcon name="Landmark" size={20} />
        <span>{t('add_mortgage')}</span>
      </button>

      {editing && (
        <ModalForm
          title={t('add_mortgage')}
          fields={fields}
          initialData={editing === 'new' ? {} : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          t={t}
        />
      )}

      {Object.keys(groupedMortgages).length === 0 ? (
        <div className="text-center py-10 opacity-70">
          <LucideIcon name="Landmark" size={40} className="mx-auto mb-2 text-slate-300 dark:text-slate-500" />
          <p className="text-slate-500 dark:text-slate-300 font-bold">{t('no_mortgage')}</p>
        </div>
      ) : (
        Object.keys(groupedMortgages).sort().map(aptName => (
          <div key={aptName} className="mb-6 text-start">
            <h3 className="font-bold text-slate-400 dark:text-slate-300 text-sm px-2 mb-2 flex items-center gap-2">
              <LucideIcon name="Home" size={14} />
              <span>{aptName}</span>
            </h3>
            <div className="space-y-3">
              {groupedMortgages[aptName].map((m: any) => {
                const mortgageApt = apartments.find(a => a.id === m.aptId);
                const cur = mortgageApt?.currency || '₪';
                let endDateDisplay = '';
                let timeLeftDisplay = '';

                if (m.drawdownDate && m.durationYears) {
                  const drawDate = new Date(m.drawdownDate);
                  const endDate = new Date(drawDate);
                  endDate.setFullYear(endDate.getFullYear() + Number(m.durationYears));
                  endDateDisplay = endDate.toLocaleDateString('he-IL');

                  const now = new Date();
                  let monthsLeft = (endDate.getFullYear() - now.getFullYear()) * 12 + (endDate.getMonth() - now.getMonth());
                  if (now.getDate() > endDate.getDate()) monthsLeft--;

                  if (monthsLeft > 0) {
                    const yLeft = Math.floor(monthsLeft / 12);
                    const mLeft = monthsLeft % 12;
                    timeLeftDisplay = yLeft > 0 ? `${yLeft} שנים ו-${mLeft} חודשים` : `${mLeft} חודשים`;
                  } else {
                    timeLeftDisplay = t('ended');
                  }
                }

                return (
                  <div key={m.id} className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] flex flex-col gap-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400"><LucideIcon name="Landmark" size={24} /></div>
                        <div className="text-start">
                          <div className="font-bold text-lg text-slate-800 dark:text-white">{m.bank}</div>
                          <div className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold">{cur}{Number(m.payment || 0).toLocaleString()} לחודש</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(m)} className="p-2 bg-slate-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-50 transition-colors"><LucideIcon name="Edit2" size={16} /></button>
                        <button onClick={() => confirm(t('confirm_delete')) && onDelete(m.id)} className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-450 rounded-xl hover:bg-rose-100 transition-colors"><LucideIcon name="Trash2" size={16} /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-50 dark:bg-slate-750 p-3 rounded-xl text-start text-xs">
                      {m.originalAmount && (
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">סכום מקורי</span>
                          <span className="font-bold text-slate-700 dark:text-white">{cur}{Number(m.originalAmount).toLocaleString()}</span>
                        </div>
                      )}
                      {m.interestRate && (
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">ריבית שנתית</span>
                          <span className="font-bold text-slate-700 dark:text-white">{m.interestRate}%</span>
                        </div>
                      )}
                      {m.balance && (
                        <div className="col-span-2 border-t dark:border-slate-700 pt-2 mt-1">
                          <span className="text-[10px] text-slate-400 block uppercase">{t('current_balance')}</span>
                          <span className="font-bold text-slate-700 dark:text-white">{cur}{Number(m.balance).toLocaleString()}</span>
                        </div>
                      )}
                      {timeLeftDisplay && (
                        <div className="col-span-2 border-t dark:border-slate-700 pt-2">
                          <span className="text-[10px] text-slate-400 block uppercase">זמן לסיום</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{timeLeftDisplay} (סיום צפוי: {endDateDisplay})</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
export default MortgagesList;
