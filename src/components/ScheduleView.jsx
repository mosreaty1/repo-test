import React, { useState, useRef } from 'react';
import { useApp } from '../store.jsx';
import {
  DAYS, HOURS, getTimeSlotLabel, detectConflicts, lecturesOverlap,
  getUniqueYears, getMajorsForYear, getSectionsForYearMajor
} from '../utils.js';

const CELL_COLORS = [
  'bg-purple-100 border-purple-400 dark:bg-purple-900/40 dark:border-purple-500',
  'bg-blue-100 border-blue-400 dark:bg-blue-900/40 dark:border-blue-500',
  'bg-green-100 border-green-400 dark:bg-green-900/40 dark:border-green-500',
  'bg-yellow-100 border-yellow-400 dark:bg-yellow-900/40 dark:border-yellow-500',
  'bg-pink-100 border-pink-400 dark:bg-pink-900/40 dark:border-pink-500',
  'bg-indigo-100 border-indigo-400 dark:bg-indigo-900/40 dark:border-indigo-500',
];

function getLectureColor(idx) {
  return CELL_COLORS[idx % CELL_COLORS.length];
}

function LectureForm({ lecture, professors, locations, subjects, groups, onSave, onClose }) {
  const [form, setForm] = useState(lecture || {
    subjectId: subjects[0]?.id || '',
    professorId: professors[0]?.id || '',
    locationId: locations[0]?.id || '',
    groupId: groups[0]?.id || '',
    day: DAYS[0],
    startHour: 9,
    duration: 1,
    type: 'محاضرة',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {lecture ? 'تعديل محاضرة' : 'إضافة محاضرة'}
          </h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">المادة</label>
            <select value={form.subjectId} onChange={e => set('subjectId', e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">المحاضر</label>
            <select value={form.professorId} onChange={e => set('professorId', e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">المكان</label>
            <select value={form.locationId} onChange={e => set('locationId', e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">الفرقة</label>
            <select value={form.groupId} onChange={e => set('groupId', e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {groups.map(g => <option key={g.id} value={g.id}>{g.year} / {g.major} / {g.section}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">اليوم</label>
              <select value={form.day} onChange={e => set('day', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">الوقت</label>
              <select value={form.startHour} onChange={e => set('startHour', +e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {HOURS.map(h => <option key={h} value={h}>{getTimeSlotLabel(h)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">المدة (ساعات)</label>
              <select value={form.duration} onChange={e => set('duration', +e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[1, 2, 3].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-right">النوع</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['محاضرة', 'سكشن', 'معمل'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
            إلغاء
          </button>
          <button onClick={() => onSave(form)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

function ConflictModal({ conflicts, professors, locations, subjects, groups, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-orange-500"></i>
            التعارضات ({conflicts.length})
          </h2>
        </div>
        {conflicts.length === 0 ? (
          <p className="text-green-600 dark:text-green-400 text-center py-4">لا توجد تعارضات في الجدول</p>
        ) : (
          <div className="space-y-3">
            {conflicts.map((c, i) => {
              const profA = professors.find(p => p.id === c.lectureA.professorId);
              const profB = professors.find(p => p.id === c.lectureB.professorId);
              const subA = subjects.find(s => s.id === c.lectureA.subjectId);
              const subB = subjects.find(s => s.id === c.lectureB.subjectId);
              const locA = locations.find(l => l.id === c.lectureA.locationId);
              const groupA = groups.find(g => g.id === c.lectureA.groupId);
              const groupB = groups.find(g => g.id === c.lectureB.groupId);
              return (
                <div key={i} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {c.types.map(t => (
                      <span key={t} className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                        تعارض {t}
                      </span>
                    ))}
                    <span className="text-xs text-gray-500 dark:text-gray-400 me-auto">{c.lectureA.day} - {getTimeSlotLabel(c.lectureA.startHour)}</span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-book text-blue-500 w-4"></i>
                      <span>{subA?.name} — {profA?.name} — {groupA?.year}/{groupA?.section}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-book text-purple-500 w-4"></i>
                      <span>{subB?.name} — {profB?.name} — {groupB?.year}/{groupB?.section}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduleGrid({ visibleLectures, professors, locations, subjects, groups, onCellClick, onLectureClick, highlightConflicts }) {
  const allConflicts = highlightConflicts ? detectConflicts(visibleLectures) : [];
  const conflictIds = new Set(allConflicts.flatMap(c => [c.lectureA.id, c.lectureB.id]));

  const getCellLectures = (day, hour) =>
    visibleLectures.filter(l => l.day === day && l.startHour <= hour && l.startHour + l.duration > hour);

  const isFirstHour = (lec, hour) => lec.startHour === hour;

  // Track rendered lectures to avoid duplicate rendering
  const rendered = new Set();

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full border-collapse text-sm min-w-max">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700">
            <th className="border-b border-gray-200 dark:border-gray-600 px-3 py-2 text-right text-gray-600 dark:text-gray-300 font-medium w-20">
              اليوم/الوقت
            </th>
            {HOURS.map(h => (
              <th key={h} className="border-b border-gray-200 dark:border-gray-600 px-3 py-2 text-center text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
                {getTimeSlotLabel(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, dayIdx) => (
            <tr key={day} className={dayIdx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}>
              <td className="border-t border-gray-100 dark:border-gray-700 px-3 py-3 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {day}
              </td>
              {HOURS.map(hour => {
                const cellLectures = getCellLectures(day, hour);
                // Filter only first-hour lectures
                const firstHourLectures = cellLectures.filter(l => isFirstHour(l, hour));
                // Skip already-rendered cells
                const toRender = firstHourLectures.filter(l => !rendered.has(l.id));
                toRender.forEach(l => rendered.add(l.id));

                return (
                  <td
                    key={hour}
                    className="border-t border-gray-100 dark:border-gray-700 border-s border-gray-100 dark:border-gray-700 p-1 min-w-[120px] align-top cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                    onClick={() => onCellClick && onCellClick(day, hour)}
                  >
                    {toRender.map((lec, idx) => {
                      const prof = professors.find(p => p.id === lec.professorId);
                      const subj = subjects.find(s => s.id === lec.subjectId);
                      const loc = locations.find(l => l.id === lec.locationId);
                      const isConflict = conflictIds.has(lec.id);
                      const colorClass = getLectureColor(
                        professors.findIndex(p => p.id === lec.professorId)
                      );
                      return (
                        <div
                          key={lec.id}
                          className={`rounded-lg p-1.5 mb-1 border-s-4 cursor-pointer hover:opacity-80 transition-opacity text-xs ${
                            isConflict ? 'bg-red-100 border-red-500 dark:bg-red-900/40 dark:border-red-500' : colorClass
                          }`}
                          onClick={e => { e.stopPropagation(); onLectureClick && onLectureClick(lec); }}
                          title={`${subj?.name} - ${prof?.name} - ${loc?.name}`}
                        >
                          {isConflict && <i className="fa-solid fa-triangle-exclamation text-red-500 text-xs mb-0.5 block"></i>}
                          <div className="font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate">
                            {subj?.name}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 leading-tight truncate">{prof?.name}</div>
                          <div className="text-gray-500 dark:text-gray-500 leading-tight flex items-center gap-1">
                            <i className="fa-solid fa-location-dot text-[10px]"></i>
                            <span className="truncate">{loc?.name}</span>
                          </div>
                          {lec.duration > 1 && (
                            <div className="text-gray-400 text-[10px]">({lec.duration} ساعات)</div>
                          )}
                        </div>
                      );
                    })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ScheduleView() {
  const { professors, locations, subjects, groups, lectures, addLecture, updateLecture, deleteLecture, scheduleFilters, setScheduleFilters } = useApp();

  const years = getUniqueYears(groups);
  const year = scheduleFilters.year || years[0] || '';
  const majors = getMajorsForYear(groups, year);
  const major = scheduleFilters.major || majors[0] || '';
  const sections = getSectionsForYearMajor(groups, year, major);
  const section = scheduleFilters.section || sections[0] || '';

  const currentGroup = groups.find(g => g.year === year && g.major === major && g.section === section);

  const tab = scheduleFilters.tab || 'class';
  const selProf = scheduleFilters.professor || (professors[0]?.id || '');
  const selLoc = scheduleFilters.location || (locations[0]?.id || '');

  const [showAssistant, setShowAssistant] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editLecture, setEditLecture] = useState(null);
  const [showConflicts, setShowConflicts] = useState(false);
  const [addDefaults, setAddDefaults] = useState({});

  const setFilter = (key, val) => setScheduleFilters(prev => ({ ...prev, [key]: val }));

  // Get lectures for current view
  const visibleLectures = (() => {
    if (tab === 'class') return currentGroup ? lectures.filter(l => l.groupId === currentGroup.id) : [];
    if (tab === 'professor') return selProf ? lectures.filter(l => l.professorId === selProf) : [];
    if (tab === 'location') return selLoc ? lectures.filter(l => l.locationId === selLoc) : [];
    if (tab === 'multi') return lectures; // show all
    return [];
  })();

  const conflicts = detectConflicts(lectures);

  // Unscheduled subjects for assistant (subjects without any lecture in current group)
  const scheduledSubjectIds = currentGroup
    ? new Set(lectures.filter(l => l.groupId === currentGroup.id).map(l => l.subjectId))
    : new Set();
  const unscheduledSubjects = subjects.filter(s => !scheduledSubjectIds.has(s.id));

  const getTitle = () => {
    if (tab === 'class') return currentGroup ? `جدول: ${year} - ${major} - ${section}` : 'اختر فرقة';
    if (tab === 'professor') return `جدول المحاضر: ${professors.find(p => p.id === selProf)?.name || ''}`;
    if (tab === 'location') return `جدول المكان: ${locations.find(l => l.id === selLoc)?.name || ''}`;
    return 'العرض المتعدد';
  };

  const handleSaveLecture = (form) => {
    if (editLecture?.id) {
      updateLecture(editLecture.id, form);
    } else {
      addLecture(form);
    }
    setShowAddModal(false);
    setEditLecture(null);
  };

  const handleCellClick = (day, hour) => {
    setAddDefaults({
      day,
      startHour: hour,
      groupId: currentGroup?.id || groups[0]?.id,
    });
    setShowAddModal(true);
  };

  const handleLectureClick = (lec) => {
    setEditLecture(lec);
    setShowAddModal(true);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      alert('تم نسخ الرابط');
    }
  };

  return (
    <div className="p-4 max-w-[1600px] mx-auto">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('tab', 'class')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'class' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'}`}
            >
              جدول الفرق الدراسية
            </button>
            <button
              onClick={() => setFilter('tab', 'professor')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'professor' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'}`}
            >
              جدول المحاضرين
            </button>
            <button
              onClick={() => setFilter('tab', 'location')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'location' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'}`}
            >
              جدول الأماكن
            </button>
            <button
              onClick={() => setFilter('tab', 'multi')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'multi' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'}`}
            >
              العرض المتعدد
            </button>
          </div>
          <div className="text-sm font-bold text-gray-600 dark:text-gray-400">فلترة الجدول</div>
        </div>

        {tab === 'class' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <select value={year} onChange={e => setFilter('year', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <select value={major} onChange={e => setFilter('major', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {majors.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <select value={section} onChange={e => setFilter('section', e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}

        {tab === 'professor' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={selProf} onChange={e => setFilter('professor', e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        {tab === 'location' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={selLoc} onChange={e => setFilter('location', e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
        >
          <i className="fa-solid fa-share-nodes"></i>
          مشاركة
        </button>
        <button
          onClick={() => { setEditLecture(null); setAddDefaults({}); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <i className="fa-solid fa-plus"></i>
          إضافة محاضرة
        </button>
        <button
          onClick={() => setShowConflicts(true)}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
            conflicts.length > 0
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <i className="fa-solid fa-triangle-exclamation"></i>
          عرض التعارضات
          {conflicts.length > 0 && (
            <span className="bg-white text-orange-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {conflicts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setShowAssistant(!showAssistant)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium border ${
            showAssistant
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
          }`}
        >
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          مساعد الجدولة
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium border border-gray-200 dark:border-gray-600"
        >
          <i className="fa-solid fa-print"></i>
          طباعة
        </button>
      </div>

      {/* Main content: Grid + Assistant */}
      <div className="flex gap-4">
        {/* Schedule Grid */}
        <div className="flex-1 min-w-0 printable-area">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3 text-center">{getTitle()}</h2>
          <ScheduleGrid
            visibleLectures={visibleLectures}
            professors={professors}
            locations={locations}
            subjects={subjects}
            groups={groups}
            onCellClick={tab === 'class' ? handleCellClick : undefined}
            onLectureClick={handleLectureClick}
            highlightConflicts={true}
          />
          {visibleLectures.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-600">
              <i className="fa-solid fa-calendar-xmark text-4xl mb-3 block"></i>
              <p className="text-lg">لا توجد محاضرات مسجلة لهذا الاختيار</p>
              <p className="text-sm mt-1">انقر على خلية في الجدول لإضافة محاضرة</p>
            </div>
          )}
        </div>

        {/* Schedule Assistant */}
        {showAssistant && tab === 'class' && (
          <div className="w-64 flex-shrink-0 no-print">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sticky top-20">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setShowAssistant(false)} className="text-gray-400 hover:text-gray-600 text-sm">
                  <i className="fa-solid fa-xmark"></i>
                </button>
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-pencil text-purple-500 text-sm"></i>
                  <span className="font-bold text-gray-800 dark:text-white text-sm">مساعد الجدولة</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-right">
                اسحب المحاضرات أو السكاشن والمعامل المجدولة لنسخها إلى وقت جديد.
              </p>

              {/* Scheduled subjects */}
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {subjects.slice(0, 15).map(subj => {
                  const grpLecs = currentGroup
                    ? lectures.filter(l => l.subjectId === subj.id && l.groupId === currentGroup.id)
                    : [];
                  const isScheduled = grpLecs.length > 0;
                  return (
                    <div key={subj.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isScheduled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {isScheduled ? 'تمت الجدولة' : 'غير مجدول'}
                        </span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{subj.name}</span>
                      </div>
                      {isScheduled ? (
                        grpLecs.map(lec => (
                          <button
                            key={lec.id}
                            onClick={() => handleLectureClick(lec)}
                            className="w-full text-xs text-purple-600 dark:text-purple-400 hover:underline text-right block"
                          >
                            <i className="fa-solid fa-star text-yellow-400 me-1 text-[10px]"></i>
                            اقتراح وقت للمحاضرة
                          </button>
                        ))
                      ) : (
                        <button
                          onClick={() => { setAddDefaults({ subjectId: subj.id, groupId: currentGroup?.id }); setShowAddModal(true); }}
                          className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline text-right block mt-1"
                        >
                          <i className="fa-solid fa-plus text-blue-400 me-1 text-[10px]"></i>
                          إضافة سكشن/معمل جديد
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <LectureForm
          lecture={editLecture ? { ...editLecture } : { ...addDefaults }}
          professors={professors}
          locations={locations}
          subjects={subjects}
          groups={groups}
          onSave={handleSaveLecture}
          onClose={() => { setShowAddModal(false); setEditLecture(null); }}
        />
      )}

      {showConflicts && (
        <ConflictModal
          conflicts={conflicts}
          professors={professors}
          locations={locations}
          subjects={subjects}
          groups={groups}
          onClose={() => setShowConflicts(false)}
        />
      )}
    </div>
  );
}
