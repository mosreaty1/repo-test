import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { sampleData } from './sampleData.js';
import { generateId } from './utils.js';

const AppContext = createContext(null);

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('tm_theme') === 'dark');
  const [professors, setProfessors] = useState(() => load('tm_professors', sampleData.professors));
  const [locations, setLocations] = useState(() => load('tm_locations', sampleData.locations));
  const [subjects, setSubjects] = useState(() => load('tm_subjects', sampleData.subjects));
  const [groups, setGroups] = useState(() => load('tm_groups', sampleData.groups));
  const [lectures, setLectures] = useState(() => load('tm_lectures', sampleData.lectures));
  const [changeLog, setChangeLog] = useState(() => load('tm_changelog', []));
  const [undoStack, setUndoStack] = useState([]);
  const [scheduleFilters, setScheduleFilters] = useState({
    year: '', major: '', section: '',
    tab: 'class', professor: '', location: '',
  });

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('tm_professors', JSON.stringify(professors)); }, [professors]);
  useEffect(() => { localStorage.setItem('tm_locations', JSON.stringify(locations)); }, [locations]);
  useEffect(() => { localStorage.setItem('tm_subjects', JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem('tm_groups', JSON.stringify(groups)); }, [groups]);
  useEffect(() => { localStorage.setItem('tm_lectures', JSON.stringify(lectures)); }, [lectures]);
  useEffect(() => { localStorage.setItem('tm_changelog', JSON.stringify(changeLog)); }, [changeLog]);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tm_theme', 'light');
    }
  }, [darkMode]);

  const addLogEntry = useCallback((action, description, data) => {
    setChangeLog(prev => [{
      id: generateId(),
      timestamp: new Date().toISOString(),
      action,
      description,
      data,
    }, ...prev].slice(0, 500));
  }, []);

  const pushUndo = useCallback((snapshot) => {
    setUndoStack(prev => [...prev.slice(-19), snapshot]);
  }, []);

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setLectures(last);
      addLogEntry('undo', 'تم التراجع عن آخر عملية');
      return prev.slice(0, -1);
    });
  }, [addLogEntry]);

  // Professors CRUD
  const addProfessor = useCallback((data) => {
    const p = { id: generateId(), ...data };
    setProfessors(prev => [...prev, p]);
    addLogEntry('add_professor', `تم إضافة المحاضر: ${p.name}`, p);
    return p;
  }, [addLogEntry]);

  const updateProfessor = useCallback((id, data) => {
    setProfessors(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    addLogEntry('update_professor', `تم تعديل المحاضر: ${data.name}`, { id, ...data });
  }, [addLogEntry]);

  const deleteProfessor = useCallback((id) => {
    setProfessors(prev => {
      const p = prev.find(x => x.id === id);
      addLogEntry('delete_professor', `تم حذف المحاضر: ${p?.name}`, { id });
      return prev.filter(x => x.id !== id);
    });
  }, [addLogEntry]);

  // Locations CRUD
  const addLocation = useCallback((data) => {
    const l = { id: generateId(), ...data };
    setLocations(prev => [...prev, l]);
    addLogEntry('add_location', `تم إضافة المكان: ${l.name}`, l);
    return l;
  }, [addLogEntry]);

  const updateLocation = useCallback((id, data) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    addLogEntry('update_location', `تم تعديل المكان: ${data.name}`, { id, ...data });
  }, [addLogEntry]);

  const deleteLocation = useCallback((id) => {
    setLocations(prev => {
      const l = prev.find(x => x.id === id);
      addLogEntry('delete_location', `تم حذف المكان: ${l?.name}`, { id });
      return prev.filter(x => x.id !== id);
    });
  }, [addLogEntry]);

  // Subjects CRUD
  const addSubject = useCallback((data) => {
    const s = { id: generateId(), ...data };
    setSubjects(prev => [...prev, s]);
    addLogEntry('add_subject', `تم إضافة المادة: ${s.name}`, s);
    return s;
  }, [addLogEntry]);

  const updateSubject = useCallback((id, data) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    addLogEntry('update_subject', `تم تعديل المادة: ${data.name}`, { id, ...data });
  }, [addLogEntry]);

  const deleteSubject = useCallback((id) => {
    setSubjects(prev => {
      const s = prev.find(x => x.id === id);
      addLogEntry('delete_subject', `تم حذف المادة: ${s?.name}`, { id });
      return prev.filter(x => x.id !== id);
    });
  }, [addLogEntry]);

  // Groups CRUD
  const addGroup = useCallback((data) => {
    const g = { id: generateId(), ...data };
    setGroups(prev => [...prev, g]);
    addLogEntry('add_group', `تم إضافة الفرقة: ${g.year} / ${g.major}`, g);
    return g;
  }, [addLogEntry]);

  const updateGroup = useCallback((id, data) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
    addLogEntry('update_group', `تم تعديل الفرقة`, { id, ...data });
  }, [addLogEntry]);

  const deleteGroup = useCallback((id) => {
    setGroups(prev => {
      const g = prev.find(x => x.id === id);
      addLogEntry('delete_group', `تم حذف الفرقة: ${g?.year}`, { id });
      return prev.filter(x => x.id !== id);
    });
  }, [addLogEntry]);

  // Lectures CRUD
  const addLecture = useCallback((data) => {
    pushUndo(lectures);
    const lec = { id: generateId(), duration: 1, type: 'محاضرة', ...data };
    setLectures(prev => {
      const next = [...prev, lec];
      addLogEntry('add_lecture', `تم إضافة محاضرة`, lec);
      return next;
    });
    return lec;
  }, [lectures, pushUndo, addLogEntry]);

  const updateLecture = useCallback((id, data) => {
    pushUndo(lectures);
    setLectures(prev => {
      const next = prev.map(l => l.id === id ? { ...l, ...data } : l);
      addLogEntry('update_lecture', `تم تعديل محاضرة`, { id, ...data });
      return next;
    });
  }, [lectures, pushUndo, addLogEntry]);

  const deleteLecture = useCallback((id) => {
    pushUndo(lectures);
    setLectures(prev => {
      const lec = prev.find(x => x.id === id);
      addLogEntry('delete_lecture', `تم حذف محاضرة`, lec);
      return prev.filter(x => x.id !== id);
    });
  }, [lectures, pushUndo, addLogEntry]);

  const moveLecture = useCallback((id, day, startHour) => {
    pushUndo(lectures);
    setLectures(prev => {
      const next = prev.map(l => l.id === id ? { ...l, day, startHour } : l);
      addLogEntry('move_lecture', `تم نقل محاضرة إلى ${day} ${startHour}:00`, { id, day, startHour });
      return next;
    });
  }, [lectures, pushUndo, addLogEntry]);

  const resetData = useCallback(() => {
    setProfessors(sampleData.professors);
    setLocations(sampleData.locations);
    setSubjects(sampleData.subjects);
    setGroups(sampleData.groups);
    setLectures(sampleData.lectures);
    setChangeLog([]);
    setUndoStack([]);
    addLogEntry('reset', 'تم إعادة تعيين البيانات للبيانات الافتراضية');
  }, [addLogEntry]);

  const value = {
    currentPage, setCurrentPage,
    darkMode, setDarkMode,
    professors, locations, subjects, groups, lectures, changeLog,
    undoStack, undo,
    scheduleFilters, setScheduleFilters,
    addProfessor, updateProfessor, deleteProfessor,
    addLocation, updateLocation, deleteLocation,
    addSubject, updateSubject, deleteSubject,
    addGroup, updateGroup, deleteGroup,
    addLecture, updateLecture, deleteLecture, moveLecture,
    resetData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
