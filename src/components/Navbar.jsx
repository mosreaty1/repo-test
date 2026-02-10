import React, { useState } from 'react';
import { useApp } from '../store.jsx';
import { detectConflicts } from '../utils.js';

export default function Navbar() {
  const { currentPage, setCurrentPage, darkMode, setDarkMode, undo, undoStack, lectures, professors, groups, subjects, locations, resetData } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const conflicts = detectConflicts(lectures);

  const navItems = [
    { id: 'data', label: 'إدارة البيانات', icon: 'fa-database' },
    { id: 'changelog', label: 'سجل التغييرات', icon: 'fa-clock-rotate-left' },
    { id: 'reports', label: 'التقارير', icon: 'fa-chart-bar' },
    { id: 'schedule', label: 'عرض الجداول', icon: 'fa-table' },
    { id: 'dashboard', label: 'لوحة المعلومات', icon: 'fa-gauge' },
  ];

  return (
    <>
      <nav className="no-print bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-2 flex items-center gap-2">
          {/* Logo / Title (right side in RTL) */}
          <div className="flex items-center gap-2 ms-auto">
            <span className="text-xl font-bold text-gray-800 dark:text-white whitespace-nowrap">
              منظم الجداول الدراسية
            </span>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg">
              <i className="fa-solid fa-calendar-days"></i>
            </div>
          </div>

          {/* Nav Items */}
          <div className="flex items-center gap-1 flex-1 justify-center flex-wrap">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right side controls (left in RTL = start) */}
          <div className="flex items-center gap-2">
            {/* Conflict badge */}
            {conflicts.length > 0 && (
              <button
                onClick={() => setCurrentPage('schedule')}
                className="relative px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold flex items-center gap-1"
                title="تعارضات في الجدول"
              >
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>{conflicts.length}</span>
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="إعادة تحميل البيانات الافتراضية"
            >
              <i className="fa-solid fa-rotate"></i>
            </button>

            {/* Undo */}
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40"
              title="تراجع"
            >
              <i className="fa-solid fa-rotate-left"></i>
            </button>

            {/* Dark mode */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="الوضع الليلي"
            >
              <i className={`fa-solid ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>

            {/* Search */}
            {showSearch && (
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث..."
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-1 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onBlur={() => { if (!searchQuery) setShowSearch(false); }}
              />
            )}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="بحث"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>

            {/* User info */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  Timetable_amr
                </span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                  professor
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </button>
              {showUserMenu && (
                <div className="absolute top-full start-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 w-48 z-50">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2 py-1">
                    مرحباً بك
                  </div>
                  <hr className="my-1 border-gray-200 dark:border-gray-600" />
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                    المحاضرات: {lectures.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                    المحاضرون: {professors.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                    الأماكن: {locations.length}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Reset Confirm Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">إعادة تعيين البيانات</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              هل تريد إعادة تعيين جميع البيانات للبيانات الافتراضية؟ سيتم فقدان جميع التغييرات.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                إلغاء
              </button>
              <button
                onClick={() => { resetData(); setShowResetConfirm(false); }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                إعادة تعيين
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
      )}
    </>
  );
}
