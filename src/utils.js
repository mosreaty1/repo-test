export const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
export const HOURS = [8, 9, 10, 11, 12, 13]; // 8am to 2pm
export const LECTURE_TYPES = ['محاضرة', 'سكشن', 'معمل'];

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatHour(h) {
  if (h <= 12) return String(h);
  return String(h - 12);
}

export function getTimeSlotLabel(startHour) {
  const end = startHour + 1;
  return `${formatHour(end)}:${formatHour(startHour)}`;
}

export function lecturesOverlap(a, b) {
  if (a.day !== b.day) return false;
  const aEnd = a.startHour + a.duration;
  const bEnd = b.startHour + b.duration;
  return a.startHour < bEnd && b.startHour < aEnd;
}

export function detectConflicts(lectures) {
  const conflicts = [];
  for (let i = 0; i < lectures.length; i++) {
    for (let j = i + 1; j < lectures.length; j++) {
      const a = lectures[i];
      const b = lectures[j];
      if (!lecturesOverlap(a, b)) continue;
      const types = [];
      if (a.locationId === b.locationId && a.locationId !== 'l1') types.push('مكان');
      if (a.professorId === b.professorId) types.push('محاضر');
      if (a.groupId === b.groupId) types.push('فرقة');
      if (types.length > 0) {
        conflicts.push({ lectureA: a, lectureB: b, types });
      }
    }
  }
  return conflicts;
}

export function getProfessorWorkload(lectures, professors) {
  return professors
    .map(p => ({
      ...p,
      hours: lectures
        .filter(l => l.professorId === p.id)
        .reduce((sum, l) => sum + l.duration, 0),
    }))
    .sort((a, b) => b.hours - a.hours);
}

export function getLocationUsage(lectures, locations) {
  return locations
    .map(loc => {
      const hours = lectures
        .filter(l => l.locationId === loc.id)
        .reduce((sum, l) => sum + l.duration, 0);
      const pct = loc.capacity ? Math.round((hours / loc.capacity) * 100) : 0;
      return { ...loc, hours, pct };
    })
    .filter(l => l.hours > 0)
    .sort((a, b) => b.hours - a.hours);
}

export function getQualityIndicators(lectures, professors) {
  return professors
    .filter(p => lectures.some(l => l.professorId === p.id))
    .map(p => {
      const profLectures = lectures.filter(l => l.professorId === p.id);
      let totalGap = 0;
      let longDays = 0;
      DAYS.forEach(day => {
        const dayLecs = profLectures
          .filter(l => l.day === day)
          .sort((a, b) => a.startHour - b.startHour);
        if (dayLecs.length < 2) return;
        let dayHours = 0;
        for (let i = 1; i < dayLecs.length; i++) {
          const prev = dayLecs[i - 1];
          const curr = dayLecs[i];
          const gap = curr.startHour - (prev.startHour + prev.duration);
          if (gap > 0) totalGap += gap;
        }
        dayLecs.forEach(l => { dayHours += l.duration; });
        const span = (dayLecs[dayLecs.length - 1].startHour + dayLecs[dayLecs.length - 1].duration) - dayLecs[0].startHour;
        if (span >= 6) longDays++;
      });
      return { ...p, gapHours: totalGap, longDays };
    })
    .sort((a, b) => b.gapHours - a.gapHours || b.longDays - a.longDays);
}

export function getGroupTimeGaps(lectures, groups) {
  return groups
    .filter(g => lectures.some(l => l.groupId === g.id))
    .map(g => {
      const gLectures = lectures.filter(l => l.groupId === g.id);
      let totalGap = 0;
      let activeDays = 0;
      DAYS.forEach(day => {
        const dayLecs = gLectures
          .filter(l => l.day === day)
          .sort((a, b) => a.startHour - b.startHour);
        if (dayLecs.length < 2) return;
        activeDays++;
        for (let i = 1; i < dayLecs.length; i++) {
          const prev = dayLecs[i - 1];
          const curr = dayLecs[i];
          const gap = curr.startHour - (prev.startHour + prev.duration);
          if (gap > 0) totalGap += gap;
        }
      });
      const avgGap = activeDays > 0 ? +(totalGap / activeDays).toFixed(1) : 0;
      return { ...g, avgGap, label: `${g.year} / ${g.major} / ${g.section}` };
    })
    .filter(g => g.avgGap > 0)
    .sort((a, b) => b.avgGap - a.avgGap);
}

export function getLocationHeatmap(lectures, locationId) {
  const grid = {};
  DAYS.forEach(d => {
    grid[d] = {};
    HOURS.forEach(h => { grid[d][h] = 0; });
  });
  lectures
    .filter(l => l.locationId === locationId)
    .forEach(l => {
      for (let h = l.startHour; h < l.startHour + l.duration; h++) {
        if (grid[l.day] && h in grid[l.day]) {
          grid[l.day][h]++;
        }
      }
    });
  return grid;
}

export function getUniqueYears(groups) {
  return [...new Set(groups.map(g => g.year))];
}

export function getMajorsForYear(groups, year) {
  return [...new Set(groups.filter(g => g.year === year).map(g => g.major))];
}

export function getSectionsForYearMajor(groups, year, major) {
  return groups.filter(g => g.year === year && g.major === major).map(g => g.section);
}

export function getPctColor(pct) {
  if (pct >= 100) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
  if (pct >= 75) return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
  if (pct >= 50) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
}

export function getHeatColor(count) {
  if (count === 0) return '';
  if (count >= 3) return 'bg-purple-600 text-white';
  if (count === 2) return 'bg-purple-400 text-white';
  return 'bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-white';
}
