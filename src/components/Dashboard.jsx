import React, { useState } from 'react';
import { useApp } from '../store.jsx';
import {
  getProfessorWorkload, getLocationUsage, getQualityIndicators,
  getGroupTimeGaps, getLocationHeatmap, getPctColor, getHeatColor,
  DAYS, HOURS, getTimeSlotLabel
} from '../utils.js';

function StatsCard({ icon, color, label, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
      <div className="text-right">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</div>
        <div className="text-3xl font-bold text-gray-800 dark:text-white">{value}</div>
      </div>
      <div className={`w-16 h-16 ${color} rounded-full flex items-center justify-center text-white text-2xl`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative mb-3">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2 pe-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <i className="fa-solid fa-magnifying-glass absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"></i>
    </div>
  );
}

export default function Dashboard() {
  const { professors, locations, subjects, groups, lectures } = useApp();

  const [profSearch, setProfSearch] = useState('');
  const [locSearch, setLocSearch] = useState('');
  const [selectedHeatmapLoc, setSelectedHeatmapLoc] = useState(locations[0]?.id || '');
  const [showGeneral, setShowGeneral] = useState(true);
  const [showQuality, setShowQuality] = useState(true);
  const [showGaps, setShowGaps] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const workload = getProfessorWorkload(lectures, professors);
  const locUsage = getLocationUsage(lectures, locations);
  const quality = getQualityIndicators(lectures, professors);
  const groupGaps = getGroupTimeGaps(lectures, groups);
  const heatmap = getLocationHeatmap(lectures, selectedHeatmapLoc);

  const filteredWorkload = workload.filter(p =>
    profSearch === '' || p.name.includes(profSearch)
  );
  const filteredLocUsage = locUsage.filter(l =>
    locSearch === '' || l.name.includes(locSearch)
  );

  const maxHeatCount = Math.max(1, ...DAYS.flatMap(d => HOURS.map(h => heatmap[d]?.[h] || 0)));

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard icon="fa-calendar-check" color="bg-purple-500" label="إجمالي المحاضرات المسجلة" value={lectures.length} />
        <StatsCard icon="fa-building" color="bg-green-500" label="إجمالي الأماكن" value={locations.length} />
        <StatsCard icon="fa-user-tie" color="bg-blue-500" label="إجمالي المحاضرين" value={professors.length} />
      </div>

      {/* General Info Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <button
          onClick={() => setShowGeneral(!showGeneral)}
          className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
        >
          <i className={`fa-solid fa-chevron-${showGeneral ? 'up' : 'down'} text-gray-400`}></i>
          <div className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white">
            <i className="fa-solid fa-circle-info text-blue-500"></i>
            لوحة المعلومات العامة
          </div>
        </button>

        {showGeneral && (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Instructor Workload */}
            <div>
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3 text-right">
                عبء عمل المحاضرين (بالساعات)
              </h3>
              <SearchInput value={profSearch} onChange={setProfSearch} placeholder="ابحث عن محاضر..." />
              <div className="max-h-72 overflow-y-auto">
                {filteredWorkload.filter(p => p.hours > 0).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      p.hours >= 12 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      p.hours >= 8 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {p.hours} ساعة
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{p.name}</span>
                  </div>
                ))}
                {filteredWorkload.filter(p => p.hours > 0).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">لا توجد نتائج</p>
                )}
              </div>
            </div>

            {/* Location Usage */}
            <div>
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3 text-right">
                استخدام الأماكن (بالساعات)
              </h3>
              <SearchInput value={locSearch} onChange={setLocSearch} placeholder="ابحث عن مكان..." />
              <div className="max-h-72 overflow-y-auto">
                {filteredLocUsage.map(l => (
                  <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPctColor(l.pct)}`}>
                      {l.hours} ساعة ({l.pct}%)
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{l.name}</span>
                  </div>
                ))}
                {filteredLocUsage.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">لا توجد أماكن مستخدمة</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quality Indicators */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <button
          onClick={() => setShowQuality(!showQuality)}
          className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
        >
          <i className={`fa-solid fa-chevron-${showQuality ? 'up' : 'down'} text-gray-400`}></i>
          <div className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white">
            <i className="fa-solid fa-star text-yellow-500"></i>
            لوحة مؤشرات جودة الجدول
          </div>
        </button>
        {showQuality && (
          <div className="p-4">
            <div className="mb-3 text-right">
              <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">مؤشر رضا المحاضرين</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                تحليل لجودة جداول المحاضرين بناءً على الفجوات الزمنية والأيام الطويلة. الجداول ذات النقاط الأعلى قد تحتاج للمراجعة.
              </p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {quality.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                      p.longDays > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      <i className="fa-solid fa-xmark text-xs"></i>
                      {p.longDays} أيام طويلة
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                      p.gapHours > 0 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      <i className="fa-solid fa-xmark text-xs"></i>
                      {p.gapHours} س فجوات
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{p.name}</span>
                </div>
              ))}
              {quality.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">لا توجد بيانات</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Time Gap Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <button
          onClick={() => setShowGaps(!showGaps)}
          className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
        >
          <i className={`fa-solid fa-chevron-${showGaps ? 'up' : 'down'} text-gray-400`}></i>
          <div className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white">
            <i className="fa-solid fa-clock text-purple-500"></i>
            تحليل الفجوات الزمنية للفرق
          </div>
        </button>
        {showGaps && (
          <div className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 text-right">
              متوسط عدد الساعات الفارغة يومياً بين محاضرات كل فرقة. القيم الأعلى تشير إلى جدول &quot;مشتت&quot; للطلاب.
            </p>
            <div className="max-h-72 overflow-y-auto">
              {groupGaps.map(g => (
                <div key={g.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    g.avgGap >= 2 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    g.avgGap >= 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {g.avgGap} ساعة
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{g.label}</span>
                </div>
              ))}
              {groupGaps.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">لا توجد فجوات زمنية محسوبة</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Location Heatmap */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
        >
          <i className={`fa-solid fa-chevron-${showHeatmap ? 'up' : 'down'} text-gray-400`}></i>
          <div className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-white">
            <i className="fa-solid fa-fire text-orange-500"></i>
            خريطة الاستخدام الحراري للأماكن
          </div>
        </button>
        {showHeatmap && (
          <div className="p-4">
            <div className="mb-4 text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">اختر مكاناً لعرض خريطة استخدامه على مدار الأسبوع</p>
              <select
                value={selectedHeatmapLoc}
                onChange={e => setSelectedHeatmapLoc(e.target.value)}
                className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-right text-gray-500 dark:text-gray-400 font-medium">اليوم</th>
                    {HOURS.map(h => (
                      <th key={h} className="px-2 py-1 text-center text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                        {getTimeSlotLabel(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(day => (
                    <tr key={day} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-2 py-2 text-right text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">{day}</td>
                      {HOURS.map(h => {
                        const count = heatmap[day]?.[h] || 0;
                        return (
                          <td key={h} className="px-1 py-1 text-center">
                            <div className={`w-full py-1.5 rounded text-xs font-medium ${
                              count > 0 ? getHeatColor(count) : 'bg-gray-50 dark:bg-gray-700/50 text-transparent'
                            }`}>
                              {count > 0 ? count : '-'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
