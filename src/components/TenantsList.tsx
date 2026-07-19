import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';
import { Apartment, Tenant, TenantHistory } from '../types';
import { ModalForm } from './ModalForm';

interface TenantsListProps {
  apartments: Apartment[];
  tenants: Tenant[];
  tenantHistory: TenantHistory[];
  onSave: (data: any, id?: string) => void;
  onDelete: (id: string) => void;
  onArchive: (tenant: Tenant, exitDate: string) => void;
  onRestore: (historyItem: TenantHistory) => void;
  onSaveHistory: (data: any, id: string) => void;
  onDeleteHistory: (id: string) => void;
  t: (key: string) => string;
}

export const TenantsList: React.FC<TenantsListProps> = ({
  apartments,
  tenants,
  tenantHistory,
  onSave,
  onDelete,
  onArchive,
  onRestore,
  onSaveHistory,
  onDeleteHistory,
  t
}) => {
  const [editing, setEditing] = useState<any>(null);
  const [editingHistory, setEditingHistory] = useState<any>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [archivingTenant, setArchivingTenant] = useState<Tenant | null>(null);
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('apt'); // 'apt' | 'name'

  const fields = [
    { key: 'name', label: t('tenant_name'), placeholder: 'Name' },
    { key: 'aptId', label: t('assigned_prop'), type: 'select', options: apartments.sort((a, b) => (a.name || '').localeCompare(b.name || '')) },
    { key: 'entryDate', label: t('entry_date'), type: 'date' },
    { key: 'phone', label: t('phone'), type: 'tel' },
    { key: 'notes', label: t('notes'), type: 'textarea', placeholder: t('id_notes') }
  ];

  const historyFields = [
    { key: 'name', label: t('tenant_name'), placeholder: 'Name' },
    { key: 'aptId', label: t('assigned_prop'), type: 'select', options: apartments.sort((a, b) => (a.name || '').localeCompare(b.name || '')) },
    { key: 'entryDate', label: t('entry_date'), type: 'date' },
    { key: 'exitDate', label: t('exit_date'), type: 'date' },
    { key: 'phone', label: t('phone'), type: 'tel' },
    { key: 'notes', label: t('notes'), type: 'textarea', placeholder: t('id_notes') }
  ];

  const handleSave = (data: any, id?: string) => {
    const aptName = apartments.find(a => a.id === data.aptId)?.name || '';
    onSave({ ...data, aptName }, id);
    setEditing(null);
  };

  const filteredTenants = tenants.filter(ten => {
    const q = search.toLowerCase();
    return !q || (ten.name || '').toLowerCase().includes(q) || (ten.aptName || '').toLowerCase().includes(q) || (ten.phone || '').includes(q);
  });

  const renderActiveTenants = () => {
    if (sortBy === 'name') {
      const sorted = [...filteredTenants].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return (
        <div className="space-y-3 text-start">
          {sorted.map(tenant => (
            <TenantCard key={tenant.id} tenant={tenant} showApt onEdit={() => setEditing(tenant)} onArchive={() => setArchivingTenant(tenant)} onDelete={() => confirm(t('confirm_delete')) && onDelete(tenant.id)} t={t} />
          ))}
        </div>
      );
    }

    const grouped = filteredTenants.reduce((acc: any, ten) => {
      const key = ten.aptName || 'Unassigned';
      if (!acc[key]) acc[key] = [];
      acc[key].push(ten);
      return acc;
    }, {});

    return Object.keys(grouped).sort().map(aptName => (
      <div key={aptName} className="mb-4 text-start">
        <h3 className="font-bold text-slate-400 dark:text-slate-300 text-sm px-2 mb-2 flex items-center gap-2">
          <LucideIcon name="Home" size={14} />
          <span>{aptName}</span>
        </h3>
        <div className="space-y-3">
          {grouped[aptName].map((tenant: any) => (
            <TenantCard key={tenant.id} tenant={tenant} onEdit={() => setEditing(tenant)} onArchive={() => setArchivingTenant(tenant)} onDelete={() => confirm(t('confirm_delete')) && onDelete(tenant.id)} t={t} />
          ))}
        </div>
      </div>
    ));
  };

  const groupedHistory = tenantHistory.reduce((acc: any, h) => {
    const key = h.aptName || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(h);
    return acc;
  }, {});

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex gap-3">
        <button onClick={() => setEditing('new')} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
          <LucideIcon name="UserPlus" size={20} />
          <span>{t('add_tenant')}</span>
        </button>
        <button onClick={() => setShowArchive(!showArchive)} className={`px-4 rounded-2xl border font-bold flex items-center gap-2 transition-all ${showArchive ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
          <LucideIcon name="Archive" size={18} />
          <span>{t('tenant_history')}</span>
        </button>
      </div>

      {!showArchive ? (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LucideIcon name="Search" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder='חיפוש שוכר...'
                className="w-full pr-9 pl-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:border-indigo-300 text-slate-700 dark:text-white"
              />
            </div>
            <button onClick={() => setSortBy(sortBy === 'apt' ? 'name' : 'apt')}
              className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 hover:border-indigo-300 transition-colors whitespace-nowrap">
              <LucideIcon name="ArrowUpDown" size={15} />
              {sortBy === 'apt' ? 'דירה' : 'שם'}
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-500 text-sm flex items-center gap-2"><LucideIcon name="Users" size={14} /> {t('active_tenants')} ({filteredTenants.length})</h3>
          </div>

          {filteredTenants.length === 0 && (
            <div className="text-center py-10 opacity-50"><LucideIcon name="Inbox" size={40} className="mx-auto mb-2 text-slate-300" /><p className="text-slate-400">{search ? 'לא נמצאו תוצאות' : 'ריק'}</p></div>
          )}
          {renderActiveTenants()}
        </>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-amber-600 text-sm px-2 flex items-center gap-2"><LucideIcon name="Archive" size={14} /> {t('past_tenants')} ({tenantHistory.length})</h3>
          {tenantHistory.length === 0 && (
            <div className="text-center py-10 opacity-50"><LucideIcon name="Archive" size={40} className="mx-auto mb-2 text-slate-300" /><p className="text-slate-400">הארכיון ריק</p></div>
          )}
          {Object.keys(groupedHistory).sort().map(aptName => (
            <div key={aptName} className="mb-4 text-start">
              <h3 className="font-bold text-slate-400 text-sm px-2 mb-2 flex items-center gap-2"><LucideIcon name="Home" size={14} /> {aptName}</h3>
              <div className="space-y-3">
                {groupedHistory[aptName].sort((a: any, b: any) => new Date(b.exitDate || 0).getTime() - new Date(a.exitDate || 0).getTime()).map((h: any) => (
                  <div key={h.id} className="bg-amber-50 dark:bg-amber-950/10 p-5 rounded-[2rem] shadow-sm border border-amber-100 dark:border-amber-900/30">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-2xl text-amber-600"><LucideIcon name="Users" size={24} /></div>
                        <div className="text-start">
                          <div className="font-bold text-lg text-slate-700 dark:text-amber-300">{h.name}</div>
                          <div className="flex gap-3 mt-1 flex-wrap">
                            {h.entryDate && <span className="text-xs text-slate-500">{t('entry_date')}: {new Date(h.entryDate).toLocaleDateString('he-IL')}</span>}
                            {h.exitDate && <span className="text-xs text-amber-600 font-bold">{t('exit_date')}: {new Date(h.exitDate).toLocaleDateString('he-IL')}</span>}
                          </div>
                          {h.notes && <div className="text-xs text-slate-400 mt-1">{h.notes}</div>}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {h.phone && <a href={`tel:${h.phone}`} className="p-2 bg-white dark:bg-slate-700 text-emerald-600 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-600 transition-colors" title={t('phone')}><LucideIcon name="Phone" size={16} /></a>}
                        <button onClick={() => setEditingHistory(h)} className="p-2 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors" title={t('edit') || 'ערוך'}><LucideIcon name="Edit2" size={16} /></button>
                        <button onClick={() => confirm(t('restore_tenant') + '?') && onRestore(h)} className="p-2 bg-white dark:bg-slate-700 text-amber-500 rounded-xl hover:bg-amber-50 dark:hover:bg-slate-600 transition-colors" title={t('restore_tenant')}><LucideIcon name="RefreshCw" size={16} /></button>
                        <button onClick={() => confirm(t('confirm_delete')) && onDeleteHistory(h.id)} className="p-2 bg-white dark:bg-slate-700 text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-slate-600 transition-colors" title={t('delete') || 'מחק'}><LucideIcon name="Trash2" size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ModalForm title={editing === 'new' ? t('add_tenant') : t('edit_tenant')} fields={fields} initialData={editing === 'new' ? {} : editing} onSave={handleSave} onCancel={() => setEditing(null)} t={t} enableContactPicker />
      )}

      {editingHistory && (
        <ModalForm
          title={t('edit_tenant') || 'עריכת שוכר לשעבר'}
          fields={historyFields}
          initialData={editingHistory}
          onSave={(data) => {
            const aptName = apartments.find(a => a.id === data.aptId)?.name || '';
            onSaveHistory({ ...data, aptName }, editingHistory.id);
            setEditingHistory(null);
          }}
          onCancel={() => setEditingHistory(null)}
          t={t}
          enableContactPicker
        />
      )}

      {archivingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-overlay bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-black text-xl mb-2 text-slate-800 dark:text-white">{t('archive_tenant')}</h3>
            <p className="text-slate-500 text-sm mb-5">{archivingTenant.name}</p>
            <label className="text-xs font-bold text-slate-400 block text-start mb-1">{t('exit_date')}</label>
            <input type="date" value={exitDate} onChange={e => setExitDate(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold border outline-none mb-6 text-start" />
            <div className="flex gap-3">
              <button onClick={() => setArchivingTenant(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">{t('cancel')}</button>
              <button onClick={() => { onArchive(archivingTenant, exitDate); setArchivingTenant(null); }} className="flex-1 py-3 rounded-2xl bg-amber-500 text-white font-bold shadow-lg shadow-amber-100 dark:shadow-none">{t('archive_tenant')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TenantCard: React.FC<{ tenant: Tenant; showApt?: boolean; onEdit: () => void; onArchive: () => void; onDelete: () => void; t: (key: string) => string }> = ({
  tenant,
  showApt,
  onEdit,
  onArchive,
  onDelete,
  t
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] flex justify-between items-center shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400"><LucideIcon name="User" size={24} /></div>
        <div className="text-start">
          <div className="font-bold text-lg text-slate-800 dark:text-white">{tenant.name}</div>
          {showApt && tenant.aptName && <div className="text-xs text-indigo-500 dark:text-indigo-400 font-bold mt-0.5">{tenant.aptName}</div>}
          {tenant.entryDate && <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1">{t('entry_date')}: {new Date(tenant.entryDate).toLocaleDateString('he-IL')}</div>}
          {tenant.notes && <div className="text-xs text-slate-400 dark:text-slate-300 mt-1">{tenant.notes}</div>}
        </div>
      </div>
      <div className="flex gap-2">
        <a href={`tel:${tenant.phone}`} className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 transition-colors"><LucideIcon name="Phone" size={20} /></a>
        <a href={`https://wa.me/${tenant.phone ? tenant.phone.replace(/\D/g, '') : ''}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-100 transition-colors"><LucideIcon name="MessageCircle" size={20} /></a>
        <button onClick={onEdit} className="p-3 bg-slate-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-650 transition-colors"><LucideIcon name="Edit2" size={20} /></button>
        <button onClick={onArchive} className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 rounded-xl hover:bg-amber-100 transition-colors" title={t('archive_tenant')}><LucideIcon name="Archive" size={20} /></button>
        <button onClick={onDelete} className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-450 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"><LucideIcon name="Trash2" size={20} /></button>
      </div>
    </div>
  );
};
export default TenantsList;
