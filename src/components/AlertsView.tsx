import React from 'react';
import { LucideIcon } from './LucideIcon';

interface AlertsViewProps {
  alerts: any[];
  onDismiss: (id: string) => void;
  t: (key: string) => string;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts, onDismiss, t }) => {
  const cfg: any = {
    overdue: { border: 'border-rose-200 dark:border-rose-900', bg: 'bg-rose-50 dark:bg-rose-950/20', iconBg: 'bg-rose-100 dark:bg-rose-900/40', iconColor: 'text-rose-600 dark:text-rose-300', badge: 'bg-rose-200 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300', icon: 'AlertCircle', label: t('alert_overdue') },
    urgent: { border: 'border-orange-200 dark:border-orange-900', bg: 'bg-orange-50 dark:bg-orange-950/20', iconBg: 'bg-orange-100 dark:bg-orange-900/40', iconColor: 'text-orange-600 dark:text-orange-300', badge: 'bg-orange-200 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300', icon: 'AlertTriangle', label: t('urgent') },
    soon: { border: 'border-amber-200 dark:border-amber-900', bg: 'bg-amber-50 dark:bg-amber-950/20', iconBg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-600 dark:text-amber-300', badge: 'bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300', icon: 'Clock', label: t('soon') },
    planned: { border: 'border-slate-200 dark:border-slate-700', bg: 'bg-white dark:bg-slate-800', iconBg: 'bg-slate-100 dark:bg-slate-700', iconColor: 'text-slate-500 dark:text-slate-400', badge: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300', icon: 'CalendarClock', label: t('alert_planned') },
  };

  const typeIcon: any = {
    expense: 'Receipt',
    rent: 'Wallet',
    contract: 'FileText',
    hoa: 'Building',
    repair: 'Wrench'
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 text-start">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-black">{t('alerts')}</h2>
        <span className="text-sm font-bold text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm">{alerts.length}</span>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-[2.5rem] text-center border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LucideIcon name="CheckCircle" size={40} className="text-emerald-500" />
          </div>
          <p className="text-slate-400 font-bold">{t('no_alerts')}</p>
        </div>
      ) : (
        <>
          <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-4 rounded-2xl text-xs text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
            <div className="space-y-1">
              <div>💡 {t('alert_info_expenses')}</div>
              <div>⚡ {t('alert_info_utilities')}</div>
              <div>🔧 {t('alert_info_repairs')}</div>
            </div>
          </div>

          {alerts.map(alert => {
            const c = cfg[alert.urgency] || cfg.planned;
            return (
              <div key={alert.id} className={`p-5 rounded-[2rem] border shadow-sm ${c.bg} ${c.border}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-2xl flex-shrink-0 ${c.iconBg} ${c.iconColor}`}>
                      <LucideIcon name={typeIcon[alert.type] || 'Bell'} size={22} />
                    </div>
                    <div className="text-start min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${c.badge}`}>{c.label}</span>
                      </div>
                      <div className="font-black text-slate-800 dark:text-white text-sm leading-snug">{alert.title}</div>
                      <div className={`text-sm font-bold mt-0.5 ${c.iconColor}`}>{alert.subtitle}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="flex-shrink-0 bg-white/70 dark:bg-slate-700/70 text-slate-400 dark:text-slate-300 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-600 hover:text-slate-600 transition-colors"
                    title={t('dismiss')}
                  >
                    <LucideIcon name="X" size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
export default AlertsView;
