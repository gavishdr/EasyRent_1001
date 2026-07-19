import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';
import { Apartment, Provider } from '../types';
import { ModalForm } from './ModalForm';

interface ProvidersListProps {
  providers: Provider[];
  apartments: Apartment[];
  onSave: (data: any, id?: string) => void;
  onDelete: (id: string) => void;
  onLogWork: (data: any) => void;
  t: (key: string) => string;
}

export const ProvidersList: React.FC<ProvidersListProps> = ({
  providers,
  apartments,
  onSave,
  onDelete,
  onLogWork,
  t
}) => {
  const [editing, setEditing] = useState<any>(null);
  const [loggingWork, setLoggingWork] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'specialty'

  const SERVICE_TYPES_KEYS = ['electrician', 'plumber', 'solar', 'ac_label', 'renovation', 'paint', 'pest', 'other'];

  const providerFields = [
    { key: 'name', label: t('provider_name'), placeholder: 'Name' },
    { key: 'specialty', label: t('specialty'), type: 'select', options: SERVICE_TYPES_KEYS.map(k => ({ id: t(k), name: t(k) })) },
    { key: 'phone', label: t('phone'), type: 'tel' },
    { key: 'notes', label: t('perm_notes'), type: 'textarea', placeholder: '...' }
  ];

  const workFields = [
    { key: 'aptId', label: t('assigned_prop'), type: 'select', options: apartments.sort((a, b) => (a.name || '').localeCompare(b.name || '')) },
    { key: 'date', label: t('date'), type: 'date' },
    { key: 'cost', label: t('cost'), type: 'number' },
    { key: 'notes', label: t('description'), type: 'textarea' }
  ];

  const handleWorkSave = (data: any) => {
    if (!data.aptId) return alert('Select Property');
    onLogWork({ ...data, providerName: loggingWork.name, type: loggingWork.specialty });
    setLoggingWork(null);
  };

  const filtered = providers
    .filter(p => {
      const q = search.toLowerCase();
      return !q || (p.name || '').toLowerCase().includes(q) || (p.specialty || '').toLowerCase().includes(q) || (p.phone || '').includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'specialty') return (a.specialty || '').localeCompare(b.specialty || '');
      return (a.name || '').localeCompare(b.name || '');
    });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <button onClick={() => setEditing('new')} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
        <LucideIcon name="Plus" size={20} />
        <span>{t('add_provider')}</span>
      </button>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <LucideIcon name="Search" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder='חיפוש ספק...'
            className="w-full pr-9 pl-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:border-indigo-300 text-slate-700 dark:text-white"
          />
        </div>
        <button onClick={() => setSortBy(sortBy === 'name' ? 'specialty' : 'name')}
          className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 hover:border-indigo-300 transition-colors whitespace-nowrap">
          <LucideIcon name="ArrowUpDown" size={15} />
          {sortBy === 'name' ? 'שם' : 'מקצוע'}
        </button>
      </div>

      {editing && (
        <ModalForm title={t('add_provider')} fields={providerFields} initialData={editing === 'new' ? {} : editing} onSave={(d, id) => { onSave(d, id); setEditing(null); }} onCancel={() => setEditing(null)} t={t} enableContactPicker />
      )}
      {loggingWork && (
        <ModalForm title={t('log_work')} fields={workFields} initialData={{ date: new Date().toISOString().split('T')[0] }} onSave={handleWorkSave} onCancel={() => setLoggingWork(null)} t={t} />
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-10 opacity-50"><LucideIcon name="Search" size={40} className="mx-auto mb-2 text-slate-300" /><p className="text-slate-400">לא נמצאו תוצאות</p></div>
      ) : (
        filtered.map(p => (
          <div key={p.id} className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all text-start">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400"><LucideIcon name="Wrench" size={24} /></div>
                <div className="text-start">
                  <div className="font-bold text-xl text-slate-800 dark:text-white">{p.name}</div>
                  <div className="text-xs text-indigo-500 dark:text-indigo-400 font-bold mt-0.5">{p.specialty}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`tel:${p.phone}`} className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 transition-colors"><LucideIcon name="Phone" size={20} /></a>
                <a href={`https://wa.me/${p.phone ? p.phone.replace(/\D/g, '') : ''}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-100 transition-colors"><LucideIcon name="MessageCircle" size={20} /></a>
                <button onClick={() => setEditing(p)} className="p-2 bg-slate-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-50"><LucideIcon name="Edit2" size={20} /></button>
                <button onClick={() => confirm(t('confirm_delete')) && onDelete(p.id)} className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-450 rounded-xl hover:bg-rose-100"><LucideIcon name="Trash2" size={20} /></button>
              </div>
            </div>
            {p.notes && <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-750 p-3 rounded-xl mb-4 italic">"{p.notes}"</div>}
            <button onClick={() => setLoggingWork(p)} className="w-full bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-orange-100 dark:border-orange-900/40 hover:bg-orange-100 transition-colors">
              <LucideIcon name="Clipboard" size={18} />
              <span>{t('log_work')}</span>
            </button>
          </div>
        ))
      )}
    </div>
  );
};
export default ProvidersList;
