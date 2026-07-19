import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';

interface Field {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
  options?: any[];
}

interface ModalFormProps {
  title: string;
  fields: Field[];
  initialData?: any;
  onSave: (data: any, id?: string) => void;
  onCancel: () => void;
  t: (key: string) => string;
  enableContactPicker?: boolean;
}

export const ModalForm: React.FC<ModalFormProps> = ({
  title,
  fields,
  initialData,
  onSave,
  onCancel,
  t,
  enableContactPicker
}) => {
  const [formData, setFormData] = useState(initialData || {});

  const handleChange = (key: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: val }));
  };

  const handleContactPicker = async () => {
    const isSupported = 'contacts' in navigator && typeof (navigator as any).contacts?.select === 'function';
    if (!isSupported) {
      alert('ייבוא אנשי קשר נתמך בעיקר במכשירי אנדרואיד כרום.');
      return;
    }
    try {
      const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        const newName = contact.name && contact.name.length > 0 ? contact.name[0] : '';
        const newPhone = contact.tel && contact.tel.length > 0 ? contact.tel[0] : '';
        setFormData((prev: any) => ({ ...prev, name: newName || prev.name, phone: newPhone || prev.phone }));
      }
    } catch (ex) {
      console.error("Contact picker error:", ex);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-overlay bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-2xl text-slate-800 dark:text-white">{title}</h3>
          <button onClick={onCancel} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-650 transition-colors">
            <LucideIcon name="X" size={20} />
          </button>
        </div>

        {enableContactPicker && (
          <button
            type="button"
            onClick={handleContactPicker}
            className="w-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 py-3 rounded-2xl font-bold mb-5 flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
          >
            <LucideIcon name="Users" size={18} />
            <span>{t('import_contact')}</span>
          </button>
        )}

        <div className="space-y-4 text-start">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-300 mr-2 mb-1 block text-start">{f.label}</label>

              {f.key === 'icon' ? (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {f.options?.map((o, idx) => {
                    const isSelected = (formData[f.key] || 'Home') === o.id;
                    return (
                      <button
                        key={`${o.id}-${idx}`}
                        type="button"
                        onClick={() => handleChange(f.key, o.id)}
                        className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all border ${
                          isSelected 
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-650 dark:bg-indigo-950/40 dark:border-indigo-400 dark:text-indigo-300 ring-2 ring-indigo-500/20 scale-105 font-black' 
                            : 'bg-slate-50 dark:bg-slate-750 border-slate-100 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:text-slate-300'
                        }`}
                        title={o.name}
                      >
                        <LucideIcon name={o.id} size={20} />
                        <span className="text-[10px] font-bold">{o.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : f.type === 'select' ? (
                <div className="relative">
                  <select
                    className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-start appearance-none"
                    value={formData[f.key] || ''}
                    onChange={e => handleChange(f.key, e.target.value)}
                  >
                    <option value="">{f.placeholder || t('select')}</option>
                    {f.options?.map((o, idx) => (
                      <option key={`${o.id || o}-${idx}`} value={o.id || o}>{o.name || o}</option>
                    ))}
                  </select>
                  <LucideIcon name="ChevronDown" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              ) : f.type === 'datalist' ? (
                <div className="relative">
                  <input
                    type="text"
                    list={`datalist-${f.key}`}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-start"
                    placeholder={f.placeholder}
                    value={formData[f.key] || ''}
                    onChange={e => handleChange(f.key, e.target.value)}
                  />
                  <datalist id={`datalist-${f.key}`}>
                    {f.options?.map((o: any, idx) => (
                      <option key={`${o.id || o}-${idx}`} value={o.id || o} />
                    ))}
                  </datalist>
                </div>
              ) : f.type === 'textarea' ? (
                <textarea
                  className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 h-24 resize-none text-slate-850 dark:text-white text-start"
                  placeholder={f.placeholder}
                  value={formData[f.key] || ''}
                  onChange={e => handleChange(f.key, e.target.value)}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  step={f.type === 'number' ? "any" : undefined}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-750 rounded-2xl font-bold outline-none border border-slate-100 dark:border-slate-700 text-slate-855 dark:text-white text-start"
                  placeholder={f.placeholder}
                  value={formData[f.key] || ''}
                  onChange={e => handleChange(f.key, e.target.value)}
                />
              )}
            </div>
          ))}

          <button
            onClick={() => onSave(formData, initialData?.id)}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xl shadow-xl shadow-indigo-100 dark:shadow-none mt-6 active:scale-95 transition-transform hover:bg-indigo-700"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};
