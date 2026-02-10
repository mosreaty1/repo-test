import React, { useState } from 'react';
import { useApp } from '../store.jsx';

const ACTION_LABELS = {
  add_professor: { label: 'إضافة محاضر', icon: 'fa-user-plus', color: 'text-green-600 dark:text-green-400' },
  update_professor: { label: 'تعديل محاضر', icon: 'fa-user-pen', color: 'text-blue-600 dark:text-blue-400' },
  delete_professor: { label: 'حذف محاضر', icon: 'fa-user-minus', color: 'text-red-600 dark:text-red-400' },
  add_location: { label: 'إضافة مكان', icon: 'fa-building-circle-plus', color: 'text-green-600 dark:text-green-400' },
  update_location: { label: 'تعديل مكان', icon: 'fa-building', color: 'text-blue-600 dark:text-blue-400' },
  delete_location: { label: 'حذف مكان', icon: 'fa-building-circle-xmark', color: 'text-red-600 dark:text-red-400' },
  add_subject: { label: 'إضافة مادة', icon: 'fa-book-medical', color: 'text-green-600 dark:text-green-400' },
  update_subject: { label: 'تعديل مادة', icon: 'fa-book', color: 'text-blue-600 dark:text-blue-400' },
  delete_subject: { label: 'حذف مادة', icon: 'fa-book-skull', color: 'text-red-600 dark:text-red-400' },
  add_group: { label: 'إضافة فرقة', icon: 'fa-users', color: 'text-green-600 dark:text-green-400' },
  update_group: { label: 'تعديل فرقة', icon: 'fa-users-gear', color: 'text-blue-600 dark:text-blue-400' },
  delete_group: { label: 'حذف فرقة', icon: 'fa-users-slash', color: 'text-red-600 dark:text-red-400' },
  add_lecture: { label: 'إضافة محاضرة', icon: 'fa-calendar-plus', color: 'text-green-600 dark:text-green-400' },
  update_lecture: { label: 'تعديل محاضرة', icon: 'fa-calendar-pen', color: 'text-blue-600 dark:text-blue-400' },
  delete_lecture: { label: 'حذف محاضرة', icon: 'fa-calendar-minus', color: 'text-red-600 dark:text-red-400' },
  move_lecture: { label: 'نقل محاضرة', icon: 'fa-calendar-days', color: 'text-purple-600 dark:text-purple-400' },
  undo: { label: 'تراجع', icon: 'fa-rotate-left', color: 'text-orange-600 dark:text-orange-400' },
  reset: { label: 'إعادة تعيين', icon: 'fa-rotate', color: 'text-gray-600 dark:text-gray-400' },
};

function formatDate(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function getActionCategory(action) {
  if (action.includes('professor')) return 'professor';
  if (action.includes('location')) return 'location';
  if (action.includes('subject')) return 'subject';
  if (action.includes('group')) return 'group';
  if (action.includes('lecture')) return 'lecture';
  return 'other';
}

export default function ChangeLog() {
  const { changeLog } = useApp();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = changeLog.filter(entry => {
    const matchFilter = filter === 'all' || getActionCategory(entry.action) === filter;
    const matchSearch = search === '' || entry.description.includes(search);
    return matchFilter && matchSearch;
  });

  const stats = {
    total: changeLog.length,
    additions: changeLog.filter(e => e.action.startsWith('add_')).length,
    updates: changeLog.filter(e => e.action.startsWith('update_') || e.action.startsWith('move_')).length,
    deletions: changeLog.filter(e => e.action.startsWith('delete_')).length,
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'إجمالي التغييرات', value: stats.total, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
          { label: 'إضافات', value: stats.additions, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
          { label: 'تعديلات', value: stats.updates, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
          { label: 'حذف', value: stats.deletions, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 text-center`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث في السجل..."
              className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 pe-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
            <i className="fa-solid fa-magnifying-glass absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"></i>
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-blue-500"></i>
            سجل التغييرات
          </h2>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'lecture', label: 'محاضرات' },
            { id: 'professor', label: 'محاضرون' },
            { id: 'location', label: 'أماكن' },
            { id: 'subject', label: 'مواد' },
            { id: 'group', label: 'فرق' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Log List */}
        <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-600">
              <i className="fa-solid fa-inbox text-4xl mb-3 block"></i>
              <p>لا توجد تغييرات مسجلة</p>
              {changeLog.length === 0 && (
                <p className="text-sm mt-1">ستظهر التغييرات هنا بعد إجراء أي عملية</p>
              )}
            </div>
          ) : (
            filtered.map((entry, i) => {
              const actionInfo = ACTION_LABELS[entry.action] || { label: entry.action, icon: 'fa-circle-info', color: 'text-gray-500' };
              return (
                <div key={entry.id || i} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    entry.action.startsWith('add_') ? 'bg-green-100 dark:bg-green-900/30' :
                    entry.action.startsWith('delete_') ? 'bg-red-100 dark:bg-red-900/30' :
                    entry.action === 'undo' ? 'bg-orange-100 dark:bg-orange-900/30' :
                    'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <i className={`fa-solid ${actionInfo.icon} text-sm ${actionInfo.color}`}></i>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {formatDate(entry.timestamp)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${actionInfo.color}`}>
                          {actionInfo.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          entry.action.startsWith('add_') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          entry.action.startsWith('delete_') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {entry.action.startsWith('add_') ? 'إضافة' :
                           entry.action.startsWith('delete_') ? 'حذف' :
                           entry.action === 'undo' ? 'تراجع' : 'تعديل'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{entry.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 text-right">
            عرض {filtered.length} من {changeLog.length} سجل
          </div>
        )}
      </div>
    </div>
  );
}
