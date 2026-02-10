import React, { useState } from 'react';
import { useApp } from '../store.jsx';
import { DAYS, HOURS, getTimeSlotLabel, generateId } from '../utils.js';

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', required }) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">
        {label}{required && <span className="text-red-500 ms-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ============ Professors Tab ============
function ProfessorsTab() {
  const { professors, addProfessor, updateProfessor, deleteProfessor } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = professors.filter(p => p.name.includes(search));

  const openAdd = () => { setForm({ name: '' }); setEditItem(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ name: p.name }); setEditItem(p); setShowModal(true); };
  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editItem) updateProfessor(editItem.id, form);
    else addProfessor(form);
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <i className="fa-solid fa-plus"></i> إضافة محاضر
        </button>
        <div className="relative">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث..."
            className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 pe-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
          <i className="fa-solid fa-magnifying-glass absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"></i>
        </div>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-right">
        الإجمالي: {filtered.length} محاضر
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">#</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">الاسم</th>
              <th className="px-4 py-3 text-center text-gray-600 dark:text-gray-300 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onClick={() => setDeleteConfirm(p)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-gray-400">لا توجد نتائج</p>
        )}
      </div>

      {showModal && (
        <Modal title={editItem ? 'تعديل محاضر' : 'إضافة محاضر'} onClose={() => setShowModal(false)}>
          <InputField label="الاسم الكامل (بالمسمى الوظيفي)" value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))} required />
          <p className="text-xs text-gray-400 text-right mb-4">مثال: أ.م.د. محمد علي</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">إلغاء</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
          </div>
        </Modal>
      )}
      {deleteConfirm && (
        <Modal title="حذف محاضر" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-right">
            هل تريد حذف المحاضر <strong>{deleteConfirm.name}</strong>؟
          </p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">إلغاء</button>
            <button onClick={() => { deleteProfessor(deleteConfirm.id); setDeleteConfirm(null); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">حذف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============ Locations Tab ============
function LocationsTab() {
  const { locations, addLocation, updateLocation, deleteLocation } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', capacity: 72, type: 'classroom' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = locations.filter(l => l.name.includes(search));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setForm({ name: '', capacity: 72, type: 'classroom' }); setEditItem(null); setShowModal(true); };
  const openEdit = (l) => { setForm({ name: l.name, capacity: l.capacity, type: l.type }); setEditItem(l); setShowModal(true); };
  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editItem) updateLocation(editItem.id, { ...form, capacity: +form.capacity });
    else addLocation({ ...form, capacity: +form.capacity });
    setShowModal(false);
  };

  const typeLabels = { classroom: 'قاعة', lecture: 'مدرج', lab: 'معمل', online: 'أونلاين' };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <i className="fa-solid fa-plus"></i> إضافة مكان
        </button>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="بحث..." className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">#</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">الاسم</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">النوع</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">السعة (ساعات)</th>
              <th className="px-4 py-3 text-center text-gray-600 dark:text-gray-300 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l, i) => (
              <tr key={l.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium">{l.name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{typeLabels[l.type] || l.type}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{l.capacity}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(l)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><i className="fa-solid fa-pen-to-square"></i></button>
                    <button onClick={() => setDeleteConfirm(l)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><i className="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editItem ? 'تعديل مكان' : 'إضافة مكان'} onClose={() => setShowModal(false)}>
          <InputField label="اسم المكان" value={form.name} onChange={v => set('name', v)} required />
          <SelectField label="نوع المكان" value={form.type} onChange={v => set('type', v)}
            options={[{ value: 'classroom', label: 'قاعة' }, { value: 'lecture', label: 'مدرج' }, { value: 'lab', label: 'معمل' }, { value: 'online', label: 'أونلاين' }]} />
          <InputField label="السعة الأقصى (ساعات/أسبوع)" value={form.capacity} onChange={v => set('capacity', v)} type="number" />
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">إلغاء</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ</button>
          </div>
        </Modal>
      )}
      {deleteConfirm && (
        <Modal title="حذف مكان" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-right">هل تريد حذف <strong>{deleteConfirm.name}</strong>؟</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">إلغاء</button>
            <button onClick={() => { deleteLocation(deleteConfirm.id); setDeleteConfirm(null); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">حذف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============ Subjects Tab ============
function SubjectsTab() {
  const { subjects, addSubject, updateSubject, deleteSubject } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = subjects.filter(s => s.name.includes(search) || s.code.includes(search));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setForm({ name: '', code: '' }); setEditItem(null); setShowModal(true); };
  const openEdit = (s) => { setForm({ name: s.name, code: s.code }); setEditItem(s); setShowModal(true); };
  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editItem) updateSubject(editItem.id, form);
    else addSubject(form);
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <i className="fa-solid fa-plus"></i> إضافة مادة
        </button>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="بحث..." className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">#</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">اسم المادة</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">الكود</th>
              <th className="px-4 py-3 text-center text-gray-600 dark:text-gray-300 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.code}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><i className="fa-solid fa-pen-to-square"></i></button>
                    <button onClick={() => setDeleteConfirm(s)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><i className="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal title={editItem ? 'تعديل مادة' : 'إضافة مادة'} onClose={() => setShowModal(false)}>
          <InputField label="اسم المادة" value={form.name} onChange={v => set('name', v)} required />
          <InputField label="كود المادة" value={form.code} onChange={v => set('code', v)} />
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">إلغاء</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">حفظ</button>
          </div>
        </Modal>
      )}
      {deleteConfirm && (
        <Modal title="حذف مادة" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-right">هل تريد حذف <strong>{deleteConfirm.name}</strong>؟</p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">إلغاء</button>
            <button onClick={() => { deleteSubject(deleteConfirm.id); setDeleteConfirm(null); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">حذف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============ Groups Tab ============
function GroupsTab() {
  const { groups, addGroup, updateGroup, deleteGroup } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ year: 'الفرقة الأولى', major: '', section: 'مجموعة (A)' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = groups.filter(g =>
    g.year.includes(search) || g.major.includes(search) || g.section.includes(search)
  );
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setForm({ year: 'الفرقة الأولى', major: '', section: 'مجموعة (A)' }); setEditItem(null); setShowModal(true); };
  const openEdit = (g) => { setForm({ year: g.year, major: g.major, section: g.section }); setEditItem(g); setShowModal(true); };
  const handleSave = () => {
    if (!form.major.trim()) return;
    if (editItem) updateGroup(editItem.id, form);
    else addGroup(form);
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <i className="fa-solid fa-plus"></i> إضافة فرقة
        </button>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="بحث..." className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">#</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">الفرقة</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">التخصص</th>
              <th className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">المجموعة</th>
              <th className="px-4 py-3 text-center text-gray-600 dark:text-gray-300 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g, i) => (
              <tr key={g.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium">{g.year}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{g.major}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{g.section}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(g)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><i className="fa-solid fa-pen-to-square"></i></button>
                    <button onClick={() => setDeleteConfirm(g)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><i className="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal title={editItem ? 'تعديل فرقة' : 'إضافة فرقة'} onClose={() => setShowModal(false)}>
          <SelectField label="الفرقة الدراسية" value={form.year} onChange={v => set('year', v)}
            options={['الفرقة الأولى', 'الفرقة الثانية', 'الفرقة الثالثة', 'الفرقة الرابعة'].map(y => ({ value: y, label: y }))} />
          <InputField label="التخصص" value={form.major} onChange={v => set('major', v)} required />
          <InputField label="المجموعة" value={form.section} onChange={v => set('section', v)} />
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">إلغاء</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">حفظ</button>
          </div>
        </Modal>
      )}
      {deleteConfirm && (
        <Modal title="حذف فرقة" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-right">
            هل تريد حذف <strong>{deleteConfirm.year} / {deleteConfirm.major}</strong>؟
          </p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">إلغاء</button>
            <button onClick={() => { deleteGroup(deleteConfirm.id); setDeleteConfirm(null); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">حذف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============ Lectures Tab ============
function LecturesTab() {
  const { lectures, professors, locations, subjects, groups, addLecture, updateLecture, deleteLecture } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    subjectId: subjects[0]?.id || '',
    professorId: professors[0]?.id || '',
    locationId: locations[0]?.id || '',
    groupId: groups[0]?.id || '',
    day: DAYS[0],
    startHour: 9,
    duration: 1,
    type: 'محاضرة',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = lectures.filter(l => {
    const subj = subjects.find(s => s.id === l.subjectId);
    const prof = professors.find(p => p.id === l.professorId);
    return !search || (subj?.name || '').includes(search) || (prof?.name || '').includes(search);
  });

  const openAdd = () => {
    setForm({
      subjectId: subjects[0]?.id || '',
      professorId: professors[0]?.id || '',
      locationId: locations[0]?.id || '',
      groupId: groups[0]?.id || '',
      day: DAYS[0], startHour: 9, duration: 1, type: 'محاضرة',
    });
    setEditItem(null);
    setShowModal(true);
  };

  const openEdit = (l) => {
    setForm({ subjectId: l.subjectId, professorId: l.professorId, locationId: l.locationId, groupId: l.groupId, day: l.day, startHour: l.startHour, duration: l.duration, type: l.type });
    setEditItem(l);
    setShowModal(true);
  };

  const handleSave = () => {
    if (editItem) updateLecture(editItem.id, { ...form, startHour: +form.startHour, duration: +form.duration });
    else addLecture({ ...form, startHour: +form.startHour, duration: +form.duration });
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <i className="fa-solid fa-plus"></i> إضافة محاضرة
        </button>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="بحث بالمادة أو المحاضر..." className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-right">الإجمالي: {filtered.length} محاضرة</div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">#</th>
              <th className="px-3 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">المادة</th>
              <th className="px-3 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">المحاضر</th>
              <th className="px-3 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">المكان</th>
              <th className="px-3 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">الفرقة</th>
              <th className="px-3 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">اليوم</th>
              <th className="px-3 py-3 text-right text-gray-600 dark:text-gray-300 font-medium">الوقت</th>
              <th className="px-3 py-3 text-center text-gray-600 dark:text-gray-300 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((l, i) => {
              const subj = subjects.find(s => s.id === l.subjectId);
              const prof = professors.find(p => p.id === l.professorId);
              const loc = locations.find(x => x.id === l.locationId);
              const grp = groups.find(g => g.id === l.groupId);
              return (
                <tr key={l.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-2.5 text-gray-500 text-xs">{i + 1}</td>
                  <td className="px-3 py-2.5 text-gray-800 dark:text-gray-200 text-xs font-medium">{subj?.name}</td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{prof?.name}</td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{loc?.name}</td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{grp?.year}/{grp?.section}</td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{l.day}</td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{getTimeSlotLabel(l.startHour)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(l)} className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                      <button onClick={() => setDeleteConfirm(l)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><i className="fa-solid fa-trash text-xs"></i></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 text-gray-400">لا توجد محاضرات</p>}
        {filtered.length > 100 && <p className="text-center py-2 text-xs text-gray-400">يتم عرض أول 100 نتيجة. استخدم البحث لتضييق النتائج.</p>}
      </div>

      {showModal && (
        <Modal title={editItem ? 'تعديل محاضرة' : 'إضافة محاضرة'} onClose={() => setShowModal(false)}>
          <SelectField label="المادة" value={form.subjectId} onChange={v => set('subjectId', v)}
            options={subjects.map(s => ({ value: s.id, label: s.name }))} />
          <SelectField label="المحاضر" value={form.professorId} onChange={v => set('professorId', v)}
            options={professors.map(p => ({ value: p.id, label: p.name }))} />
          <SelectField label="المكان" value={form.locationId} onChange={v => set('locationId', v)}
            options={locations.map(l => ({ value: l.id, label: l.name }))} />
          <SelectField label="الفرقة" value={form.groupId} onChange={v => set('groupId', v)}
            options={groups.map(g => ({ value: g.id, label: `${g.year} / ${g.major} / ${g.section}` }))} />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="اليوم" value={form.day} onChange={v => set('day', v)}
              options={DAYS.map(d => ({ value: d, label: d }))} />
            <SelectField label="الوقت" value={form.startHour} onChange={v => set('startHour', +v)}
              options={HOURS.map(h => ({ value: h, label: getTimeSlotLabel(h) }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="المدة" value={form.duration} onChange={v => set('duration', +v)}
              options={[1, 2, 3].map(d => ({ value: d, label: `${d} ساعة` }))} />
            <SelectField label="النوع" value={form.type} onChange={v => set('type', v)}
              options={['محاضرة', 'سكشن', 'معمل'].map(t => ({ value: t, label: t }))} />
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">إلغاء</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">حفظ</button>
          </div>
        </Modal>
      )}
      {deleteConfirm && (
        <Modal title="حذف محاضرة" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-right">
            هل تريد حذف هذه المحاضرة؟
          </p>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">إلغاء</button>
            <button onClick={() => { deleteLecture(deleteConfirm.id); setDeleteConfirm(null); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">حذف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============ Main DataManagement Component ============
export default function DataManagement() {
  const [activeTab, setActiveTab] = useState('professors');

  const tabs = [
    { id: 'professors', label: 'المحاضرون', icon: 'fa-user-tie' },
    { id: 'locations', label: 'الأماكن', icon: 'fa-building' },
    { id: 'subjects', label: 'المواد', icon: 'fa-book' },
    { id: 'groups', label: 'الفرق', icon: 'fa-users' },
    { id: 'lectures', label: 'المحاضرات', icon: 'fa-calendar-check' },
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        {/* Tab Header */}
        <div className="flex items-center gap-1 p-4 border-b border-gray-100 dark:border-gray-700 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'professors' && <ProfessorsTab />}
          {activeTab === 'locations' && <LocationsTab />}
          {activeTab === 'subjects' && <SubjectsTab />}
          {activeTab === 'groups' && <GroupsTab />}
          {activeTab === 'lectures' && <LecturesTab />}
        </div>
      </div>
    </div>
  );
}
