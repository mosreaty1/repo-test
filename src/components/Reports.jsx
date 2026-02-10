import React, { useState } from 'react';
import { useApp } from '../store.jsx';
import {
  DAYS, HOURS, getTimeSlotLabel, getProfessorWorkload,
  getLocationUsage, detectConflicts, getUniqueYears, getMajorsForYear, getSectionsForYearMajor
} from '../utils.js';

function ScheduleTable({ lectures, professors, locations, subjects, title }) {
  const getCellLectures = (day, hour) =>
    lectures.filter(l => l.day === day && l.startHour <= hour && l.startHour + l.duration > hour && l.startHour === hour);

  return (
    <div className="printable-area mb-8">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs border border-gray-300 dark:border-gray-600">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-right">اليوم / الوقت</th>
              {HOURS.map(h => (
                <th key={h} className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center whitespace-nowrap">
                  {getTimeSlotLabel(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, di) => (
              <tr key={day} className={di % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/70'}>
                <td className="border border-gray-200 dark:border-gray-600 px-2 py-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{day}</td>
                {HOURS.map(hour => {
                  const cellLecs = getCellLectures(day, hour);
                  return (
                    <td key={hour} className="border border-gray-200 dark:border-gray-600 px-1 py-1 align-top min-w-[100px]">
                      {cellLecs.map(lec => {
                        const prof = professors.find(p => p.id === lec.professorId);
                        const subj = subjects.find(s => s.id === lec.subjectId);
                        const loc = locations.find(l => l.id === lec.locationId);
                        return (
                          <div key={lec.id} className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded p-1 text-xs">
                            <div className="font-semibold text-gray-800 dark:text-gray-200">{subj?.name}</div>
                            <div className="text-gray-600 dark:text-gray-400">{prof?.name}</div>
                            <div className="text-gray-500 dark:text-gray-500">{loc?.name}</div>
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
    </div>
  );
}

export default function Reports() {
  const { professors, locations, subjects, groups, lectures } = useApp();

  const [reportType, setReportType] = useState('group');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState(professors[0]?.id || '');
  const [selectedLocation, setSelectedLocation] = useState(locations[0]?.id || '');

  const years = getUniqueYears(groups);
  const year = selectedYear || years[0] || '';
  const majors = getMajorsForYear(groups, year);
  const major = selectedMajor || majors[0] || '';
  const sections = getSectionsForYearMajor(groups, year, major);
  const section = selectedSection || sections[0] || '';

  const currentGroup = groups.find(g => g.year === year && g.major === major && g.section === section);

  const getReportLectures = () => {
    if (reportType === 'group') return currentGroup ? lectures.filter(l => l.groupId === currentGroup.id) : [];
    if (reportType === 'professor') return lectures.filter(l => l.professorId === selectedProfessor);
    if (reportType === 'location') return lectures.filter(l => l.locationId === selectedLocation);
    if (reportType === 'all') return lectures;
    return [];
  };

  const reportLectures = getReportLectures();
  const workload = getProfessorWorkload(lectures, professors);
  const locUsage = getLocationUsage(lectures, locations);
  const conflicts = detectConflicts(lectures);

  const getTitle = () => {
    if (reportType === 'group') return currentGroup ? `جدول: ${year} - ${major} - ${section}` : '';
    if (reportType === 'professor') return `جدول المحاضر: ${professors.find(p => p.id === selectedProfessor)?.name || ''}`;
    if (reportType === 'location') return `جدول المكان: ${locations.find(l => l.id === selectedLocation)?.name || ''}`;
    return 'تقرير شامل';
  };

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const rows = [
      ['المادة', 'المحاضر', 'المكان', 'الفرقة', 'اليوم', 'الوقت', 'المدة', 'النوع'],
      ...reportLectures.map(l => {
        const subj = subjects.find(s => s.id === l.subjectId);
        const prof = professors.find(p => p.id === l.professorId);
        const loc = locations.find(x => x.id === l.locationId);
        const grp = groups.find(g => g.id === l.groupId);
        return [
          subj?.name || '', prof?.name || '', loc?.name || '',
          `${grp?.year || ''} / ${grp?.section || ''}`,
          l.day, getTimeSlotLabel(l.startHour), l.duration, l.type
        ];
      })
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timetable_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Report Controls */}
      <div className="no-print bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 text-right">
          <i className="fa-solid fa-chart-bar me-2 text-blue-500"></i>
          التقارير
        </h2>

        {/* Report Type */}
        <div className="flex gap-2 flex-wrap mb-4">
          {[
            { id: 'group', label: 'جدول الفرقة' },
            { id: 'professor', label: 'جدول المحاضر' },
            { id: 'location', label: 'جدول المكان' },
            { id: 'workload', label: 'أعباء العمل' },
            { id: 'conflicts', label: 'التعارضات' },
          ].map(rt => (
            <button
              key={rt.id}
              onClick={() => setReportType(rt.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                reportType === rt.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {rt.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        {reportType === 'group' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <select value={year} onChange={e => setSelectedYear(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={major} onChange={e => setSelectedMajor(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {majors.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={section} onChange={e => setSelectedSection(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        {reportType === 'professor' && (
          <div className="mb-4">
            <select value={selectedProfessor} onChange={e => setSelectedProfessor(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64">
              {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        {reportType === 'location' && (
          <div className="mb-4">
            <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64">
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <i className="fa-solid fa-print"></i>
            طباعة
          </button>
          {(reportType === 'group' || reportType === 'professor' || reportType === 'location') && (
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              <i className="fa-solid fa-file-csv"></i>
              تصدير CSV
            </button>
          )}
        </div>
      </div>

      {/* Report Content */}
      {(reportType === 'group' || reportType === 'professor' || reportType === 'location') && (
        <ScheduleTable
          lectures={reportLectures}
          professors={professors}
          locations={locations}
          subjects={subjects}
          title={getTitle()}
        />
      )}

      {/* Workload Report */}
      {reportType === 'workload' && (
        <div className="printable-area bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
            تقرير أعباء العمل
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Professor Workload */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 text-right border-b border-gray-200 dark:border-gray-600 pb-2">
                عبء عمل المحاضرين
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">المحاضر</th>
                    <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">الساعات</th>
                    <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">المحاضرات</th>
                  </tr>
                </thead>
                <tbody>
                  {workload.filter(p => p.hours > 0).map((p, i) => (
                    <tr key={p.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{p.name}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.hours >= 12 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          p.hours >= 8 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}>{p.hours}س</span>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                        {lectures.filter(l => l.professorId === p.id).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Location Usage */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 text-right border-b border-gray-200 dark:border-gray-600 pb-2">
                استخدام الأماكن
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">المكان</th>
                    <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">الساعات</th>
                    <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">%</th>
                  </tr>
                </thead>
                <tbody>
                  {locUsage.map((l, i) => (
                    <tr key={l.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{l.name}</td>
                      <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{l.hours}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          l.pct >= 100 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          l.pct >= 75 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>{l.pct}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Conflicts Report */}
      {reportType === 'conflicts' && (
        <div className="printable-area bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center flex items-center justify-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-orange-500"></i>
            تقرير التعارضات ({conflicts.length})
          </h2>

          {conflicts.length === 0 ? (
            <div className="text-center py-8">
              <i className="fa-solid fa-check-circle text-5xl text-green-500 mb-3 block"></i>
              <p className="text-lg text-green-600 dark:text-green-400 font-medium">لا توجد تعارضات في الجدول</p>
            </div>
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
                  <div key={i} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-red-700 dark:text-red-400">تعارض #{i + 1}</span>
                      {c.types.map(t => (
                        <span key={t} className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                      <span className="text-xs text-gray-500 dark:text-gray-400 ms-auto">
                        {c.lectureA.day} — {getTimeSlotLabel(c.lectureA.startHour)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-100 dark:border-red-800/50">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{subA?.name}</div>
                        <div className="text-gray-600 dark:text-gray-400">{profA?.name}</div>
                        <div className="text-gray-500 dark:text-gray-500 text-xs">{groupA?.year} / {groupA?.section}</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-100 dark:border-red-800/50">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{subB?.name}</div>
                        <div className="text-gray-600 dark:text-gray-400">{profB?.name}</div>
                        <div className="text-gray-500 dark:text-gray-500 text-xs">{groupB?.year} / {groupB?.section}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
