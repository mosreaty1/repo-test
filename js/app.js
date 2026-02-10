const { createApp, ref, computed, watch, reactive } = Vue;

createApp({
  setup() {
    // ===== STATE =====
    const professors = ref(loadStorage('tm_professors', INITIAL_DATA.professors));
    const locations = ref(loadStorage('tm_locations', INITIAL_DATA.locations));
    const subjects = ref(loadStorage('tm_subjects', INITIAL_DATA.subjects));
    const groups = ref(loadStorage('tm_groups', INITIAL_DATA.groups));
    const lectures = ref(loadStorage('tm_lectures', INITIAL_DATA.lectures));
    const changeLog = ref(loadStorage('tm_changelog', []));
    const undoStack = ref([]);
    const mounted = ref(true);
    const darkMode = ref(localStorage.getItem('tm_theme') === 'dark');

    // Page navigation
    const currentPage = ref('dashboard');
    const navItems = [
      { id: 'data', label: 'إدارة البيانات' },
      { id: 'changelog', label: 'سجل التغييرات' },
      { id: 'reports', label: 'التقارير' },
      { id: 'schedule', label: 'عرض الجداول' },
      { id: 'dashboard', label: 'لوحة المعلومات' },
    ];

    // Dashboard state
    const profSearch = ref('');
    const locSearch = ref('');
    const heatmapLocId = ref(locations.value[0]?.id || '');
    const openSections = reactive({ general: true, quality: true, gaps: true, heatmap: true });

    // Schedule state
    const schedTab = ref('class');
    const scheduleTabs = [
      { id: 'class', label: 'جدول الفرق الدراسية' },
      { id: 'professor', label: 'جدول المحاضرين' },
      { id: 'location', label: 'جدول الأماكن' },
    ];
    const sv = reactive({
      year: '',
      major: '',
      section: '',
      professor: '',
      location: '',
    });
    const showAssistant = ref(true);
    const showConflictModal = ref(false);
    const showResetModal = ref(false);

    // Data management state
    const dataTab = ref('professors');
    const dataTabs = [
      { id: 'professors', label: 'المحاضرون', icon: 'fa-user-tie' },
      { id: 'locations', label: 'الأماكن', icon: 'fa-building' },
      { id: 'subjects', label: 'المواد', icon: 'fa-book' },
      { id: 'groups', label: 'الفرق', icon: 'fa-users' },
      { id: 'lectures', label: 'المحاضرات', icon: 'fa-calendar-check' },
    ];
    const dataSearch = ref('');

    // Reports state
    const reportType = ref('group');
    const reportTypes = [
      { id: 'group', label: 'جدول الفرقة' },
      { id: 'professor', label: 'جدول المحاضر' },
      { id: 'location', label: 'جدول المكان' },
      { id: 'workload', label: 'أعباء العمل' },
      { id: 'conflicts', label: 'التعارضات' },
    ];
    const rp = reactive({ year: '', major: '', section: '', professor: '', location: '' });

    // Changelog state
    const logSearch = ref('');
    const logFilter = ref('all');
    const logFilters = [
      { id: 'all', label: 'الكل' },
      { id: 'lecture', label: 'محاضرات' },
      { id: 'professor', label: 'محاضرون' },
      { id: 'location', label: 'أماكن' },
      { id: 'subject', label: 'مواد' },
      { id: 'group', label: 'فرق' },
    ];

    // Modals
    const lectureModal = reactive({
      show: false, id: null,
      form: { subjectId: '', professorId: '', locationId: '', groupId: '', day: DAYS[0], startHour: 9, duration: 1, type: 'محاضرة' }
    });
    const entityModal = reactive({
      show: false, type: '', id: null,
      form: { name: '', capacity: 72, type: 'classroom', code: '', year: 'الفرقة الأولى', major: '', section: 'مجموعة (A)' }
    });
    const deleteModal = reactive({
      show: false, message: '', callback: null
    });

    // ===== PERSIST =====
    watch(professors, v => localStorage.setItem('tm_professors', JSON.stringify(v)), { deep: true });
    watch(locations, v => localStorage.setItem('tm_locations', JSON.stringify(v)), { deep: true });
    watch(subjects, v => localStorage.setItem('tm_subjects', JSON.stringify(v)), { deep: true });
    watch(groups, v => localStorage.setItem('tm_groups', JSON.stringify(v)), { deep: true });
    watch(lectures, v => localStorage.setItem('tm_lectures', JSON.stringify(v)), { deep: true });
    watch(changeLog, v => localStorage.setItem('tm_changelog', JSON.stringify(v)), { deep: true });

    // ===== DARK MODE =====
    function toggleDark() {
      darkMode.value = !darkMode.value;
      document.documentElement.classList.toggle('dark', darkMode.value);
      localStorage.setItem('tm_theme', darkMode.value ? 'dark' : 'light');
    }

    // ===== HELPERS =====
    function getProfessor(id) { return professors.value.find(p => p.id === id); }
    function getLocation(id) { return locations.value.find(l => l.id === id); }
    function getSubject(id) { return subjects.value.find(s => s.id === id); }
    function getGroup(id) { return groups.value.find(g => g.id === id); }

    function addLog(action, description) {
      changeLog.value.unshift({ id: genId(), timestamp: new Date().toISOString(), action, description });
      if (changeLog.value.length > 500) changeLog.value = changeLog.value.slice(0, 500);
    }

    function toggleSection(k) { openSections[k] = !openSections[k]; }

    // ===== COMPUTED - DASHBOARD =====
    const professorWorkload = computed(() =>
      professors.value.map(p => ({
        ...p,
        hours: lectures.value.filter(l => l.professorId === p.id).reduce((s, l) => s + l.duration, 0)
      })).sort((a, b) => b.hours - a.hours)
    );

    const filteredWorkload = computed(() =>
      professorWorkload.value.filter(p => p.hours > 0 && (!profSearch.value || p.name.includes(profSearch.value)))
    );

    const locationUsage = computed(() =>
      locations.value.map(loc => {
        const hours = lectures.value.filter(l => l.locationId === loc.id).reduce((s, l) => s + l.duration, 0);
        return { ...loc, hours, pct: loc.capacity ? Math.round(hours / loc.capacity * 100) : 0 };
      }).filter(l => l.hours > 0).sort((a, b) => b.hours - a.hours)
    );

    const filteredLocUsage = computed(() =>
      locationUsage.value.filter(l => !locSearch.value || l.name.includes(locSearch.value))
    );

    const qualityIndicators = computed(() =>
      professors.value.filter(p => lectures.value.some(l => l.professorId === p.id)).map(p => {
        let gapHours = 0, longDays = 0;
        DAYS.forEach(day => {
          const dl = lectures.value.filter(l => l.professorId === p.id && l.day === day).sort((a, b) => a.startHour - b.startHour);
          if (dl.length < 2) return;
          for (let i = 1; i < dl.length; i++) {
            const gap = dl[i].startHour - (dl[i-1].startHour + dl[i-1].duration);
            if (gap > 0) gapHours += gap;
          }
          const span = dl[dl.length-1].startHour + dl[dl.length-1].duration - dl[0].startHour;
          if (span >= 6) longDays++;
        });
        return { ...p, gapHours, longDays };
      }).sort((a, b) => b.gapHours - a.gapHours)
    );

    const groupGaps = computed(() =>
      groups.value.filter(g => lectures.value.some(l => l.groupId === g.id)).map(g => {
        let total = 0, days = 0;
        DAYS.forEach(day => {
          const dl = lectures.value.filter(l => l.groupId === g.id && l.day === day).sort((a, b) => a.startHour - b.startHour);
          if (dl.length < 2) return;
          days++;
          for (let i = 1; i < dl.length; i++) {
            const gap = dl[i].startHour - (dl[i-1].startHour + dl[i-1].duration);
            if (gap > 0) total += gap;
          }
        });
        return { ...g, avgGap: days > 0 ? +(total / days).toFixed(1) : 0 };
      }).filter(g => g.avgGap > 0).sort((a, b) => b.avgGap - a.avgGap)
    );

    const heatmapGrid = computed(() => {
      const grid = {};
      DAYS.forEach(d => { grid[d] = {}; HOURS.forEach(h => grid[d][h] = 0); });
      lectures.value.filter(l => l.locationId === heatmapLocId.value).forEach(l => {
        for (let h = l.startHour; h < l.startHour + l.duration; h++) {
          if (grid[l.day] && h in grid[l.day]) grid[l.day][h]++;
        }
      });
      return grid;
    });

    function heatColor(c) {
      if (c >= 3) return 'bg-purple-600 text-white';
      if (c === 2) return 'bg-purple-400 text-white';
      return 'bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-white';
    }

    // ===== COMPUTED - SCHEDULE =====
    const uniqueYears = computed(() => [...new Set(groups.value.map(g => g.year))]);
    const currentYear = computed(() => sv.year || uniqueYears.value[0] || '');
    const uniqueMajors = computed(() => [...new Set(groups.value.filter(g => g.year === currentYear.value).map(g => g.major))]);
    const currentMajor = computed(() => sv.major || uniqueMajors.value[0] || '');
    const uniqueSections = computed(() => groups.value.filter(g => g.year === currentYear.value && g.major === currentMajor.value).map(g => g.section));
    const currentSection = computed(() => sv.section || uniqueSections.value[0] || '');
    const currentGroup = computed(() => groups.value.find(g => g.year === currentYear.value && g.major === currentMajor.value && g.section === currentSection.value));
    const currentProfessor = computed(() => sv.professor || professors.value[0]?.id || '');
    const currentLocation = computed(() => sv.location || locations.value[0]?.id || '');

    const visibleLectures = computed(() => {
      if (schedTab.value === 'class') return currentGroup.value ? lectures.value.filter(l => l.groupId === currentGroup.value.id) : [];
      if (schedTab.value === 'professor') return lectures.value.filter(l => l.professorId === currentProfessor.value);
      if (schedTab.value === 'location') return lectures.value.filter(l => l.locationId === currentLocation.value);
      return lectures.value;
    });

    const allConflicts = computed(() => detectConflicts(lectures.value));
    const conflictsCount = computed(() => allConflicts.value.length);
    const conflictIdSet = computed(() => new Set(allConflicts.value.flatMap(c => [c.lectureA.id, c.lectureB.id])));

    function isConflict(id) { return conflictIdSet.value.has(id); }

    function getCellLectures(day, hour) {
      return visibleLectures.value.filter(l => l.day === day && l.startHour === hour);
    }

    const scheduleTitle = computed(() => {
      if (schedTab.value === 'class' && currentGroup.value) {
        return `جدول: ${currentYear.value} - ${currentMajor.value} - ${currentSection.value}`;
      }
      if (schedTab.value === 'professor') return `جدول المحاضر: ${getProfessor(currentProfessor.value)?.name || ''}`;
      if (schedTab.value === 'location') return `جدول المكان: ${getLocation(currentLocation.value)?.name || ''}`;
      return 'جدول كامل';
    });

    const LECTURE_COLORS = [
      'bg-purple-100 border-purple-400 dark:bg-purple-900/40 dark:border-purple-500',
      'bg-blue-100 border-blue-400 dark:bg-blue-900/40 dark:border-blue-500',
      'bg-green-100 border-green-400 dark:bg-green-900/40 dark:border-green-500',
      'bg-yellow-100 border-yellow-400 dark:bg-yellow-900/40 dark:border-yellow-500',
      'bg-pink-100 border-pink-400 dark:bg-pink-900/40 dark:border-pink-500',
      'bg-indigo-100 border-indigo-400 dark:bg-indigo-900/40 dark:border-indigo-500',
    ];
    function lecColor(lec) {
      const idx = professors.value.findIndex(p => p.id === lec.professorId);
      return LECTURE_COLORS[idx % LECTURE_COLORS.length];
    }

    function isSubjectScheduled(subjectId) {
      return currentGroup.value && lectures.value.some(l => l.subjectId === subjectId && l.groupId === currentGroup.value.id);
    }

    // ===== SCHEDULE ACTIONS =====
    function openAddLecture(day, hour) {
      lectureModal.id = null;
      lectureModal.form = {
        subjectId: subjects.value[0]?.id || '',
        professorId: professors.value[0]?.id || '',
        locationId: locations.value[0]?.id || '',
        groupId: currentGroup.value?.id || groups.value[0]?.id || '',
        day: day || DAYS[0],
        startHour: hour || 9,
        duration: 1,
        type: 'محاضرة',
      };
      lectureModal.show = true;
    }

    function openAddWithSubject(subjectId) {
      openAddLecture(null, null);
      lectureModal.form.subjectId = subjectId;
    }

    function openEditLecture(lec) {
      lectureModal.id = lec.id;
      lectureModal.form = { ...lec };
      lectureModal.show = true;
    }

    function saveLecture() {
      undoStack.value.push(JSON.stringify(lectures.value));
      if (undoStack.value.length > 20) undoStack.value.shift();
      if (lectureModal.id) {
        const idx = lectures.value.findIndex(l => l.id === lectureModal.id);
        if (idx >= 0) lectures.value[idx] = { ...lectureModal.form, id: lectureModal.id };
        addLog('update_lecture', `تم تعديل محاضرة`);
      } else {
        const subj = getSubject(lectureModal.form.subjectId);
        lectures.value.push({ ...lectureModal.form, id: genId() });
        addLog('add_lecture', `تم إضافة محاضرة: ${subj?.name || ''}`);
      }
      lectureModal.show = false;
    }

    function confirmDeleteLecture(lec) {
      deleteModal.message = `هل تريد حذف هذه المحاضرة؟`;
      deleteModal.show = true;
      deleteModal.callback = () => {
        undoStack.value.push(JSON.stringify(lectures.value));
        lectures.value = lectures.value.filter(l => l.id !== lec.id);
        addLog('delete_lecture', `تم حذف محاضرة`);
      };
    }

    function undo() {
      if (undoStack.value.length === 0) return;
      const prev = undoStack.value.pop();
      lectures.value = JSON.parse(prev);
      addLog('undo', 'تم التراجع عن آخر عملية');
    }

    function confirmDelete() {
      if (deleteModal.callback) deleteModal.callback();
      deleteModal.show = false;
    }

    // ===== DATA MANAGEMENT =====
    const filteredProfessors = computed(() => professors.value.filter(p => !dataSearch.value || p.name.includes(dataSearch.value)));
    const filteredLocations = computed(() => locations.value.filter(l => !dataSearch.value || l.name.includes(dataSearch.value)));
    const filteredSubjects = computed(() => subjects.value.filter(s => !dataSearch.value || s.name.includes(dataSearch.value) || s.code.includes(dataSearch.value)));
    const filteredGroups = computed(() => groups.value.filter(g => !dataSearch.value || g.year.includes(dataSearch.value) || g.major.includes(dataSearch.value)));
    const filteredLectures = computed(() => {
      if (!dataSearch.value) return lectures.value;
      return lectures.value.filter(l => {
        const s = getSubject(l.subjectId), p = getProfessor(l.professorId);
        return (s?.name || '').includes(dataSearch.value) || (p?.name || '').includes(dataSearch.value);
      });
    });

    function locTypeLabel(t) { return { classroom: 'قاعة', lecture: 'مدرج', lab: 'معمل', online: 'أونلاين' }[t] || t; }
    function entityTypeLabel(t) { return { professor: 'محاضر', location: 'مكان', subject: 'مادة', group: 'فرقة' }[t] || t; }

    function openEntityModal(type, item) {
      entityModal.type = type;
      entityModal.id = item?.id || null;
      entityModal.form = item ? { ...item } : { name: '', capacity: 72, type: 'classroom', code: '', year: 'الفرقة الأولى', major: '', section: 'مجموعة (A)' };
      entityModal.show = true;
    }

    function saveEntity() {
      const { type, id, form } = entityModal;
      if (type === 'professor') {
        if (!form.name.trim()) return;
        if (id) { const i = professors.value.findIndex(p => p.id === id); professors.value[i] = { id, name: form.name }; addLog('update_professor', `تم تعديل المحاضر: ${form.name}`); }
        else { professors.value.push({ id: genId(), name: form.name }); addLog('add_professor', `تم إضافة المحاضر: ${form.name}`); }
      } else if (type === 'location') {
        if (!form.name.trim()) return;
        const loc = { id: id || genId(), name: form.name, capacity: +form.capacity || 72, type: form.type };
        if (id) { const i = locations.value.findIndex(l => l.id === id); locations.value[i] = loc; addLog('update_location', `تم تعديل المكان: ${form.name}`); }
        else { locations.value.push(loc); addLog('add_location', `تم إضافة المكان: ${form.name}`); }
      } else if (type === 'subject') {
        if (!form.name.trim()) return;
        const s = { id: id || genId(), name: form.name, code: form.code };
        if (id) { const i = subjects.value.findIndex(x => x.id === id); subjects.value[i] = s; addLog('update_subject', `تم تعديل المادة: ${form.name}`); }
        else { subjects.value.push(s); addLog('add_subject', `تم إضافة المادة: ${form.name}`); }
      } else if (type === 'group') {
        if (!form.major.trim()) return;
        const g = { id: id || genId(), year: form.year, major: form.major, section: form.section || 'مجموعة (A)' };
        if (id) { const i = groups.value.findIndex(x => x.id === id); groups.value[i] = g; addLog('update_group', `تم تعديل الفرقة`); }
        else { groups.value.push(g); addLog('add_group', `تم إضافة الفرقة: ${form.year}`); }
      }
      entityModal.show = false;
    }

    function deleteEntity(type, item) {
      deleteModal.message = `هل تريد حذف "${item.name || item.year}"؟`;
      deleteModal.show = true;
      deleteModal.callback = () => {
        if (type === 'professor') { professors.value = professors.value.filter(p => p.id !== item.id); addLog('delete_professor', `تم حذف المحاضر: ${item.name}`); }
        else if (type === 'location') { locations.value = locations.value.filter(l => l.id !== item.id); addLog('delete_location', `تم حذف المكان: ${item.name}`); }
        else if (type === 'subject') { subjects.value = subjects.value.filter(s => s.id !== item.id); addLog('delete_subject', `تم حذف المادة: ${item.name}`); }
        else if (type === 'group') { groups.value = groups.value.filter(g => g.id !== item.id); addLog('delete_group', `تم حذف الفرقة`); }
      };
    }

    // ===== REPORTS =====
    const rpUniqueMajors = computed(() => [...new Set(groups.value.filter(g => g.year === (rp.year || uniqueYears.value[0])).map(g => g.major))]);
    const rpUniqueSections = computed(() => {
      const y = rp.year || uniqueYears.value[0];
      const m = rp.major || rpUniqueMajors.value[0];
      return groups.value.filter(g => g.year === y && g.major === m).map(g => g.section);
    });
    const reportGroup = computed(() => {
      const y = rp.year || uniqueYears.value[0];
      const m = rp.major || rpUniqueMajors.value[0];
      const s = rp.section || rpUniqueSections.value[0];
      return groups.value.find(g => g.year === y && g.major === m && g.section === s);
    });
    const reportLectures = computed(() => {
      if (reportType.value === 'group') return reportGroup.value ? lectures.value.filter(l => l.groupId === reportGroup.value.id) : [];
      if (reportType.value === 'professor') return lectures.value.filter(l => l.professorId === (rp.professor || professors.value[0]?.id));
      if (reportType.value === 'location') return lectures.value.filter(l => l.locationId === (rp.location || locations.value[0]?.id));
      return lectures.value;
    });
    const reportTitle = computed(() => {
      if (reportType.value === 'group') return `جدول: ${reportGroup.value?.year} - ${reportGroup.value?.major} - ${reportGroup.value?.section}`;
      if (reportType.value === 'professor') return `جدول المحاضر: ${getProfessor(rp.professor || professors.value[0]?.id)?.name || ''}`;
      if (reportType.value === 'location') return `جدول المكان: ${getLocation(rp.location || locations.value[0]?.id)?.name || ''}`;
      return '';
    });
    function getReportCellLectures(day, hour) {
      return reportLectures.value.filter(l => l.day === day && l.startHour === hour);
    }
    function exportCSV() {
      const rows = [['المادة','المحاضر','المكان','الفرقة','اليوم','الوقت','المدة','النوع']];
      reportLectures.value.forEach(l => {
        rows.push([
          getSubject(l.subjectId)?.name||'', getProfessor(l.professorId)?.name||'',
          getLocation(l.locationId)?.name||'',
          `${getGroup(l.groupId)?.year||''} / ${getGroup(l.groupId)?.section||''}`,
          l.day, formatSlot(l.startHour), l.duration, l.type
        ]);
      });
      const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'timetable.csv'; a.click();
      URL.revokeObjectURL(url);
    }

    // ===== CHANGE LOG =====
    const LOG_META = {
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
      undo: { label: 'تراجع', icon: 'fa-rotate-left', color: 'text-orange-600 dark:text-orange-400' },
      reset: { label: 'إعادة تعيين', icon: 'fa-rotate', color: 'text-gray-600 dark:text-gray-400' },
    };
    function getLogMeta(action) { return LOG_META[action] || { label: action, icon: 'fa-circle-info', color: 'text-gray-500' }; }
    function getLogLabel(action) { return getLogMeta(action).label; }
    function getLogIcon(action) { return getLogMeta(action).icon; }
    function getLogColor(action) { return getLogMeta(action).color; }

    function getLogCategory(action) {
      if (action.includes('professor')) return 'professor';
      if (action.includes('location')) return 'location';
      if (action.includes('subject')) return 'subject';
      if (action.includes('group')) return 'group';
      if (action.includes('lecture')) return 'lecture';
      return 'other';
    }

    const filteredLog = computed(() =>
      changeLog.value.filter(e => {
        const matchCat = logFilter.value === 'all' || getLogCategory(e.action) === logFilter.value;
        const matchSearch = !logSearch.value || e.description.includes(logSearch.value);
        return matchCat && matchSearch;
      })
    );

    const logStats = computed(() => [
      { label: 'إجمالي التغييرات', value: changeLog.value.length, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
      { label: 'إضافات', value: changeLog.value.filter(e => e.action.startsWith('add_')).length, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
      { label: 'تعديلات', value: changeLog.value.filter(e => e.action.startsWith('update_') || e.action === 'move_lecture').length, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
      { label: 'حذف', value: changeLog.value.filter(e => e.action.startsWith('delete_')).length, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
    ]);

    function formatDate(iso) {
      try { return new Date(iso).toLocaleString('ar-EG', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }); }
      catch { return iso; }
    }

    // ===== RESET =====
    function resetData() {
      professors.value = JSON.parse(JSON.stringify(INITIAL_DATA.professors));
      locations.value = JSON.parse(JSON.stringify(INITIAL_DATA.locations));
      subjects.value = JSON.parse(JSON.stringify(INITIAL_DATA.subjects));
      groups.value = JSON.parse(JSON.stringify(INITIAL_DATA.groups));
      lectures.value = JSON.parse(JSON.stringify(INITIAL_DATA.lectures));
      changeLog.value = [];
      undoStack.value = [];
      showResetModal.value = false;
      addLog('reset', 'تم إعادة تعيين البيانات للبيانات الافتراضية');
    }

    return {
      // State
      mounted, darkMode, currentPage, navItems,
      professors, locations, subjects, groups, lectures, changeLog, undoStack,
      // Dashboard
      profSearch, locSearch, heatmapLocId, openSections, DAYS, HOURS,
      filteredWorkload, filteredLocUsage, qualityIndicators, groupGaps, heatmapGrid,
      professorWorkload, locationUsage,
      // Schedule
      schedTab, scheduleTabs, sv,
      uniqueYears, uniqueMajors, uniqueSections,
      showAssistant, showConflictModal, showResetModal,
      visibleLectures, allConflicts, conflictsCount,
      scheduleTitle, lectureModal, entityModal, deleteModal,
      // Reports
      reportType, reportTypes, rp, rpUniqueMajors, rpUniqueSections, reportTitle, reportLectures,
      // Log
      logSearch, logFilter, logFilters, filteredLog, logStats,
      // Methods
      toggleDark, toggleSection, formatSlot, heatColor,
      getProfessor, getLocation, getSubject, getGroup,
      isConflict, getCellLectures, lecColor, isSubjectScheduled,
      openAddLecture, openAddWithSubject, openEditLecture, saveLecture, confirmDeleteLecture,
      undo, confirmDelete,
      dataTab, dataTabs, dataSearch,
      filteredProfessors, filteredLocations, filteredSubjects, filteredGroups, filteredLectures,
      locTypeLabel, entityTypeLabel, openEntityModal, saveEntity, deleteEntity,
      getReportCellLectures, exportCSV,
      getLogLabel, getLogIcon, getLogColor, formatDate,
      resetData,
    };
  }
}).mount('#app');
