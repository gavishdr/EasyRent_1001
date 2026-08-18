import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';
import { Apartment, Mortgage } from '../types';
import { MortgageModal } from './MortgageModal';
import { 
  getMortgageTrackInfo, 
  getCalculationMethodInfo, 
  calculateEstimatedTotalCost 
} from '../utils/mortgage';

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
  const [expandedExplanationId, setExpandedExplanationId] = useState<string | null>(null);

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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Add Mortgage Button */}
      <button 
        onClick={() => setEditing('new')} 
        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.99] transition-all"
      >
        <LucideIcon name="Landmark" size={20} />
        <span>{t('add_mortgage')}</span>
      </button>

      {/* Mortgage Modal */}
      {editing && (
        <MortgageModal
          initialData={editing === 'new' ? null : editing}
          apartments={apartments.sort((a, b) => (a.name || '').localeCompare(b.name || ''))}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          t={t}
        />
      )}

      {/* Mortgages List */}
      {Object.keys(groupedMortgages).length === 0 ? (
        <div className="text-center py-12 opacity-70 bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700">
          <LucideIcon name="Landmark" size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-500" />
          <p className="text-slate-500 dark:text-slate-300 font-bold text-lg">{t('no_mortgage')}</p>
          <p className="text-xs text-slate-400 mt-1">לחץ על "הוסף משכנתא" כדי להגדיר הלוואת משכנתא לנכס</p>
        </div>
      ) : (
        Object.keys(groupedMortgages).sort().map(aptName => (
          <div key={aptName} className="mb-6 text-start">
            <h3 className="font-bold text-slate-500 dark:text-slate-300 text-sm px-2 mb-3 flex items-center gap-2">
              <LucideIcon name="Home" size={15} className="text-indigo-500" />
              <span>{aptName}</span>
            </h3>
            
            <div className="space-y-4">
              {groupedMortgages[aptName].map((m: Mortgage) => {
                const mortgageApt = apartments.find(a => a.id === m.aptId);
                const cur = mortgageApt?.currency || '₪';
                
                // Track & Method info
                const trackInfo = getMortgageTrackInfo(m.track);
                const methodInfo = getCalculationMethodInfo(m.calculationMethod);
                
                // Track label display
                let trackDisplay = trackInfo ? trackInfo.label : (m.track || 'קל"צ - ריבית קבועה לא צמודה');
                if (m.track === 'prime' && m.primeAdjustment) {
                  const adj = Number(m.primeAdjustment);
                  const sign = adj >= 0 ? `+${adj}%` : `${adj}%`;
                  trackDisplay = `פריים (${sign})`;
                }

                const methodDisplay = methodInfo ? methodInfo.label : (m.calculationMethod === 'equal_principal' ? 'קרן שווה' : 'לוח שפיצר');

                // Time calculations
                let endDateDisplay = '';
                let timeLeftDisplay = '';

                if (m.drawdownDate && m.durationYears) {
                  const drawDate = new Date(m.drawdownDate);
                  const endDate = new Date(drawDate);
                  endDate.setFullYear(endDate.getFullYear() + Number(m.durationYears));
                  endDateDisplay = endDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });

                  const now = new Date();
                  let monthsLeft = (endDate.getFullYear() - now.getFullYear()) * 12 + (endDate.getMonth() - now.getMonth());
                  if (now.getDate() > endDate.getDate()) monthsLeft--;

                  if (monthsLeft > 0) {
                    const yLeft = Math.floor(monthsLeft / 12);
                    const mLeft = monthsLeft % 12;
                    if (yLeft > 0 && mLeft > 0) {
                      timeLeftDisplay = `${yLeft} שנים ו-${mLeft} חודשים`;
                    } else if (yLeft > 0) {
                      timeLeftDisplay = `${yLeft} שנים`;
                    } else {
                      timeLeftDisplay = `${mLeft} חודשים`;
                    }
                  } else {
                    timeLeftDisplay = t('ended') || 'הסתיימה';
                  }
                }

                // Estimated total cost
                const estimatedCost = calculateEstimatedTotalCost(m.payment || 0, m.durationYears || 0);

                const isExplanationOpen = expandedExplanationId === m.id;

                return (
                  <div 
                    key={m.id} 
                    className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700/80 hover:shadow-md transition-all space-y-4"
                  >
                    {/* Top Header Row (Matching user image structure) */}
                    <div className="flex justify-between items-start">
                      {/* Action buttons (Trash & Edit on one side) */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => confirm(t('confirm_delete')) && onDelete(m.id)} 
                          className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors" 
                          title={t('delete') || 'מחק'}
                        >
                          <LucideIcon name="Trash2" size={18} />
                        </button>
                        <button 
                          onClick={() => setEditing(m)} 
                          className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors" 
                          title={t('edit') || 'ערוך'}
                        >
                          <LucideIcon name="Edit2" size={18} />
                        </button>
                      </div>

                      {/* Bank Name, Payment & Icon */}
                      <div className="flex items-center gap-3 text-end">
                        <div>
                          <h4 className="font-black text-xl text-slate-800 dark:text-white">
                            {m.bank}
                          </h4>
                          <div className="text-sm text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                            {cur}{Number(m.payment || 0).toLocaleString()} / חודש
                          </div>
                          
                          {/* Badges: Track & Calculation Method */}
                          <div className="flex items-center justify-end gap-1.5 mt-2 flex-wrap">
                            <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-bold px-3 py-1 rounded-full text-xs border border-indigo-100 dark:border-indigo-800/30">
                              {trackDisplay}
                            </span>
                            <span className="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-bold px-3 py-1 rounded-full text-xs border border-slate-200/60 dark:border-slate-700">
                              {methodDisplay}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-2xl text-indigo-600 dark:text-indigo-400 self-start">
                          <LucideIcon name="Landmark" size={24} />
                        </div>
                      </div>
                    </div>

                    {/* Inner Content Card (Styled with rounded borders, dividers & clean typography as in user image) */}
                    <div className="bg-slate-50/80 dark:bg-slate-750/70 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700/60 text-start space-y-4">
                      
                      {/* Row 1: Original Drawdown Amount & Current Balance */}
                      <div className="flex justify-between items-start gap-4">
                        {/* Original Amount (Left in LTR / Right in RTL) */}
                        <div className="text-start">
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 block uppercase">
                            {t('original_amount')}
                          </span>
                          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                            {m.interestRate && (
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                ({m.interestRate}%)
                              </span>
                            )}
                            <span className="font-black text-lg text-slate-800 dark:text-white font-mono">
                              {cur}{Number(m.originalAmount || 0).toLocaleString()}
                            </span>
                          </div>
                          {m.drawdownDate && (
                            <span className="text-xs text-slate-400 dark:text-slate-400 block mt-0.5">
                              תאריך משיכה: {formatDate(m.drawdownDate)}
                            </span>
                          )}
                        </div>

                        {/* Current Balance */}
                        <div className="text-end">
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 block uppercase">
                            {t('current_balance')}
                          </span>
                          <div className="mt-1">
                            <span className="font-black text-lg text-slate-800 dark:text-white font-mono">
                              {cur}{Number(m.balance || 0).toLocaleString()}
                            </span>
                          </div>
                          {m.balanceDate && (
                            <span className="text-xs text-slate-400 dark:text-slate-400 block mt-0.5">
                              {formatDate(m.balanceDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-200/70 dark:border-slate-700/60" />

                      {/* Row 2: Time Left & Expected End Date */}
                      <div className="flex justify-between items-center gap-4">
                        {/* Time Left Badge */}
                        <div className="text-start">
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 block uppercase mb-1">
                            {t('time_left')}
                          </span>
                          {timeLeftDisplay ? (
                            <span className="bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black text-xs px-3 py-1.5 rounded-xl inline-block border border-indigo-200/60 dark:border-indigo-800/40">
                              {timeLeftDisplay}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-bold">-</span>
                          )}
                        </div>

                        {/* Expected End Date */}
                        <div className="text-end">
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 block uppercase">
                            {t('end_date')}
                          </span>
                          <span className="font-black text-base text-slate-800 dark:text-white mt-1 block">
                            {endDateDisplay || (m.drawdownDate && m.durationYears ? `${m.durationYears} שנים` : '-')}
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-200/70 dark:border-slate-700/60" />

                      {/* Row 3: Estimated Total Period Cost (Highlighted in Rose/Red) */}
                      <div className="text-end">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 block uppercase">
                          {t('estimated_total_cost')}
                        </span>
                        <div className="mt-1">
                          <span className="font-black text-xl text-rose-600 dark:text-rose-400 font-mono tracking-tight">
                            {estimatedCost ? `₪${estimatedCost.total.toLocaleString()}` : `${cur}${Number(m.estimatedTotalCost || 0).toLocaleString()}`}
                          </span>
                        </div>
                        {estimatedCost && (
                          <span className="text-xs text-slate-400 dark:text-slate-400 font-mono mt-0.5 block" dir="ltr">
                            {estimatedCost.formula}
                          </span>
                        )}
                      </div>

                      {/* Row 4: Insurance Company & Policy (if exists) */}
                      {(m.insuranceCompany || m.policyNumber) && (
                        <>
                          <div className="border-t border-slate-200/70 dark:border-slate-700/60" />
                          <div className="text-end">
                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 block uppercase">
                              {t('insurance_company')}
                            </span>
                            <div className="font-black text-sm text-slate-800 dark:text-white mt-0.5">
                              {m.insuranceCompany || ''}
                              {m.policyNumber ? ` | מספר פוליסה: ${m.policyNumber}` : ''}
                            </div>
                            {m.insurancePhone && (
                              <a href={`tel:${m.insurancePhone}`} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold mt-0.5 inline-block">
                                טלפון: {m.insurancePhone}
                              </a>
                            )}
                          </div>
                        </>
                      )}

                      {/* Mortgage Track Explanation Box (Placed right under the Insurance box as requested) */}
                      {trackInfo && (
                        <>
                          <div className="border-t border-slate-200/70 dark:border-slate-700/60" />
                          <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/40 text-start space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 font-bold text-xs text-indigo-700 dark:text-indigo-300">
                                <LucideIcon name="BookOpen" size={14} />
                                <span>{t('track_explanation')}: {trackInfo.label}</span>
                              </div>
                              <button 
                                onClick={() => setExpandedExplanationId(isExplanationOpen ? null : m.id)}
                                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                {isExplanationOpen ? 'הסתר פירוט' : 'קרא עוד'}
                              </button>
                            </div>
                            
                            <p className={`text-xs text-slate-600 dark:text-slate-300 leading-relaxed ${!isExplanationOpen ? 'line-clamp-2' : ''}`}>
                              {trackInfo.description}
                            </p>

                            {isExplanationOpen && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] animate-in fade-in duration-200">
                                <div className="bg-white/90 dark:bg-slate-800/90 p-2.5 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30">
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">✓ יתרונות:</span>
                                  <span className="text-slate-600 dark:text-slate-300">{trackInfo.pros}</span>
                                </div>
                                <div className="bg-white/90 dark:bg-slate-800/90 p-2.5 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30">
                                  <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">⚠ חסרונות / דגשים:</span>
                                  <span className="text-slate-600 dark:text-slate-300">{trackInfo.cons}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Notes if any */}
                      {m.notes && (
                        <>
                          <div className="border-t border-slate-200/70 dark:border-slate-700/60" />
                          <div className="text-start">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">{t('notes')}</span>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{m.notes}</p>
                          </div>
                        </>
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
