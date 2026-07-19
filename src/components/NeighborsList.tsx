import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';
import { Apartment, Neighbor } from '../types';
import { ModalForm } from './ModalForm';

interface NeighborsListProps {
  apartments: Apartment[];
  neighbors: Neighbor[];
  onSave: (data: any, id?: string) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

export const NeighborsList: React.FC<NeighborsListProps> = ({
  apartments,
  neighbors,
  onSave,
  onDelete,
  t
}) => {
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('apt');

  const fields = [
    { key: 'name', label: t('neighbor_name'), placeholder: 'Name' },
    { key: 'aptId', label: t('assigned_prop'), type: 'select', options: apartments.sort((a, b) => (a.name || '').localeCompare(b.name || '')) },
    { key: 'floor', label: t('floor'), placeholder: '0', type: 'number' },
    { key: 'isCommittee', label: t('is_committee'), type: 'select', options: [{ id: 'true', name: t('committee_yes') }, { id: 'false', name: t('committee_no') }] },
    { key: 'phone', label: t('phone'), type: 'tel' },
    { key: 'spousePhone', label: t('spouse_phone'), type: 'tel' },
    { key: 'notes', label: t('notes'), type: 'textarea', placeholder: '...' }
  ];

  const handleSave = (data: any, id?: string) => {
    const aptName = apartments.find(a => a.id === data.aptId)?.name || '';
    onSave({ ...data, aptName }, id);
    setEditing(null);
  };

  const filtered = neighbors.filter(n => {
    const q = search.toLowerCase();
    return !q || (n.name || '').toLowerCase().includes(q) || (n.aptName || '').toLowerCase().includes(q) || (n.phone || '').includes(q);
  });

  const renderList = () => {
    if (sortBy === 'name') {
      const sorted = [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return (
        <div className="space-y-3 text-start">
          {sorted.map(n => (
            <NeighborCard key={n.id} n={n} showApt onEdit={() => setEditing(n)} onDelete={() => confirm(t('confirm_delete')) && onDelete(n.id)} t={t} />
          ))}
        </div>
      );
    }

    const grouped = filtered.reduce((acc: any, n) => {
      const key = n.aptName || 'Unassigned';
      if (!acc[key]) acc[key] = [];
      acc[key].push(n);
      return acc;
    }, {});

    return Object.keys(grouped).sort().map(aptName => (
      <div key={aptName} className="mb-4 text-start">
        <h3 className="font-bold text-slate-400 dark:text-slate-300 text-sm px-2 mb-2 flex items-center gap-2">
          <LucideIcon name="Home" size={14} />
          <span>{aptName}</span>
        </h3>
        <div className="space-y-3">
          {grouped[aptName]
            .sort((a: any, b: any) => {
              if (a.isCommittee === 'true' && b.isCommittee !== 'true') return -1;
              if (a.isCommittee !== 'true' && b.isCommittee === 'true') return 1;
              return (parseInt(a.floor) || 0) - (parseInt(b.floor) || 0);
            })
            .map((n: any) => (
              <NeighborCard key={n.id} n={n} onEdit={() => setEditing(n)} onDelete={() => confirm(t('confirm_delete')) && onDelete(n.id)} t={t} />
            ))
          }
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <button onClick={() => setEditing('new')} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
        <LucideIcon name="UserPlus" size={20} />
        <span>{t('add_neighbor')}</span>
      </button>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <LucideIcon name="Search" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder='חיפוש שכן...'
            className="w-full pr-9 pl-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:border-indigo-300 text-slate-700 dark:text-white"
          />
        </div>
        <button onClick={() => setSortBy(sortBy === 'apt' ? 'name' : 'apt')}
          className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-300 transition-colors whitespace-nowrap">
          <LucideIcon name="ArrowUpDown" size={15} />
          <span>{sortBy === 'apt' ? 'נכס' : 'שם'}</span>
        </button>
      </div>

      {editing && (
        <ModalForm title={t('add_neighbor')} fields={fields} initialData={editing === 'new' ? {} : editing} onSave={handleSave} onCancel={() => setEditing(null)} t={t} enableContactPicker />
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-10 opacity-50">
          <LucideIcon name="Search" size={40} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-400">לא נמצאו תוצאות</p>
        </div>
      ) : renderList()}
    </div>
  );
};

const NeighborCard: React.FC<{ n: Neighbor; showApt?: boolean; onEdit: () => void; onDelete: () => void; t: (key: string) => string }> = ({
  n,
  showApt,
  onEdit,
  onDelete,
  t
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] flex justify-between items-center shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className="bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400"><LucideIcon name="User" size={24} /></div>
        <div className="text-start">
          <div className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            {n.name}
            {n.isCommittee === 'true' && <span className="bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 text-[10px] px-2 py-0.5 rounded-full">ועד</span>}
          </div>
          {showApt && n.aptName && <div className="text-xs text-indigo-500 dark:text-indigo-400 font-bold mt-0.5">{n.aptName}</div>}
          <div className="text-xs text-slate-400 dark:text-slate-300 mt-1">{t('floor')}: {n.floor}</div>
          {n.notes && <div className="text-xs text-slate-400 dark:text-slate-300 mt-1">{n.notes}</div>}
        </div>
      </div>
      <div className="flex gap-2">
        <a href={`tel:${n.phone}`} className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 transition-colors"><LucideIcon name="Phone" size={20} /></a>
        <a href={`https://wa.me/${n.phone ? n.phone.replace(/\D/g, '') : ''}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-100 transition-colors"><LucideIcon name="MessageCircle" size={20} /></a>
        <button onClick={onEdit} className="p-3 bg-slate-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-650 transition-colors"><LucideIcon name="Edit2" size={20} /></button>
        <button onClick={onDelete} className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-450 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"><LucideIcon name="Trash2" size={20} /></button>
      </div>
    </div>
  );
};
export default NeighborsList;
