const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const HOURS = [8, 9, 10, 11, 12, 13];

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function formatSlot(h) {
  const fh = n => n <= 12 ? String(n) : String(n - 12);
  return fh(h + 1) + ':' + fh(h);
}

function overlaps(a, b) {
  if (a.day !== b.day) return false;
  return a.startHour < b.startHour + b.duration && b.startHour < a.startHour + a.duration;
}

function detectConflicts(lectures) {
  const result = [];
  for (let i = 0; i < lectures.length; i++) {
    for (let j = i + 1; j < lectures.length; j++) {
      const a = lectures[i], b = lectures[j];
      if (!overlaps(a, b)) continue;
      const types = [];
      if (a.locationId === b.locationId && a.locationId !== 'l1') types.push('مكان');
      if (a.professorId === b.professorId) types.push('محاضر');
      if (a.groupId === b.groupId) types.push('فرقة');
      if (types.length) result.push({ lectureA: a, lectureB: b, types });
    }
  }
  return result;
}

function loadStorage(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
