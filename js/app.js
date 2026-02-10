const { createApp, ref, computed, watch, reactive, nextTick } = Vue;

createApp({
  setup() {
    // ===== STATE =====
    const professors = ref(loadStorage('tm_professors', INITIAL_DATA.professors));
    const locations  = ref(loadStorage('tm_locations',  INITIAL_DATA.locations));
    const subjects   = ref(loadStorage('tm_subjects',   INITIAL_DATA.subjects));
    const groups     = ref(loadStorage('tm_groups',     INITIAL_DATA.groups));
    const lectures   = ref(loadStorage('tm_lectures',   INITIAL_DATA.lectures));
    const changeLog  = ref(loadStorage('tm_changelog',  []));
    const undoStack  = ref([]);
    const darkMode   = ref(localStorage.getItem('tm_theme') === 'dark');

    // Page navigation
    const currentPage = ref('dashboard');
    const navItems = [
      { id: 'dashboard', label: 'لوحة المعلومات', icon: 'fa-chart-pie' },
      { id: 'schedule',  label: 'عرض الجداول',    icon: 'fa-calendar-alt' },
      { id: 'data',      label: 'إدارة البيانات',  icon: 'fa-database' },
      { id: 'reports',   label: 'التقارير',         icon: 'fa-file-chart-column' },
      { id: 'changelog', label: 'سجل التغييرات',   icon: 'fa-clock-rotate-left' },
    ];

    // Dashboard collapse state (each section has its own key)
    const openSections = reactive({
      workload: true,
      locations: true,
      quality: true,
      gaps: true,
      heatmap: true,
    });
    const profSearch   = ref('');
    const locSearch    = ref('');
    const heatmapLocId = ref(locations.value[0]?.id || '');

    // Schedule state
    const schedTab = ref('class');
    const scheduleTabs = [
      { id: 'class',     label: 'جدول الفرق الدراسية' },
      { id: 'professor', label: 'جدول المحاضرين' },
      { id: 'location',  label: 'جدول الأماكن' },
    ];
    const sv = reactive({ year: '', major: '', section: '', professor: '', location: '' });
    const showAssistant    = ref(true);
    const showConflictModal = ref(false);
    const showResetModal    = ref(false);
    const compact           = ref(false);

    // Data management state
    const dataTab  = ref('professors');
    const dataTabs = [
      { id: 'professors', label: 'المحاضرون',  icon: 'fa-user-tie' },
      { id: 'locations',  label: 'الأماكن',    icon: 'fa-building' },
      { id: 'subjects',   label: 'المواد',      icon: 'fa-book' },
      { id: 'groups',     label: 'الفرق',       icon: 'fa-users' },
      { id: 'lectures',   label: 'المحاضرات',   icon: 'fa-calendar-check' },
    ];
    const dataSearch = ref('');

    // Reports state
    const reportType  = ref('group');
    const reportTypes = [
      { id: 'group',     label: 'جدول الفرقة' },
      { id: 'professor', label: 'جدول المحاضر' },
      { id: 'location',  label: 'جدول المكان' },
      { id: 'workload',  label: 'أعباء العمل' },
      { id: 'conflicts', label: 'التعارضات' },
    ];
    const rp = reactive({ year: '', major: '', section: '', professor: '', location: '' });

    // Changelog state
    const logSearch = ref('');
    const logFilter = ref('all');
    const logFilters = [
      { id: 'all',      label: 'الكل' },
      { id: 'lecture',  label: 'محاضرات' },
      { id: 'professor', label: 'محاضرون' },
      { id: 'location', label: 'أماكن' },
      { id: 'subject',  label: 'مواد' },
      { id: 'group',    label: 'فرق' },
    ];

    // Modals
    const lectureModal = reactive({
      show: false, id: null,
      form: {
        subjectId: '', professorId: '', locationId: '',
        groupId: '', day: DAYS[0], startHour: 9, duration: 1, type: 'محاضرة'
      }
    });
    const entityModal = reactive({
      show: false, type: '', id: null,
      form: { name: '', capacity: 72, type: 'classroom', code: '', year: 'الفرقة الأولى', major: '', section: 'مجموعة (A)' }
    });
    const deleteModal = reactive({ show: false, message: '', callback: null });

    // Toast notifications
    const toasts = ref([]);
    function showToast(msg, type = 'success') {
      const id = genId();
      toasts.value.push({ id, msg, type });
      setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id); }, 3000);
    }

    // ===== PERSIST =====
    watch(professors, v => localStorage.setItem('tm_professors', JSON.stringify(v)), { deep: true });
    watch(locations,  v => localStorage.setItem('tm_locations',  JSON.stringify(v)), { deep: true });
    watch(subjects,   v => localStorage.setItem('tm_subjects',   JSON.stringify(v)), { deep: true });
    watch(groups,     v => localStorage.setItem('tm_groups',     JSON.stringify(v)), { deep: true });
    watch(lectures,   v => localStorage.setItem('tm_lectures',   JSON.stringify(v)), { deep: true });
    watch(changeLog,  v => localStorage.setItem('tm_changelog',  JSON.stringify(v)), { deep: true });

    // Cascade: when year changes reset major/section, when major changes reset section
    watch(() => sv.year,  () => { sv.major = ''; sv.section = ''; });
    watch(() => sv.major, () => { sv.section = ''; });
    // Reports page cascade
    watch(() => rp.year,  () => { rp.major = ''; rp.section = ''; });
    watch(() => rp.major, () => { rp.section = ''; });

    // ===== DARK MODE =====
    function toggleDark() {
      darkMode.value = !darkMode.value;
      document.documentElement.classList.toggle('dark', darkMode.value);
      localStorage.setItem('tm_theme', darkMode.value ? 'dark' : 'light');
    }
    // Apply on mount
    document.documentElement.classList.toggle('dark', darkMode.value);

    // ===== HELPERS =====
    function getProfessor(id) { return professors.value.find(p => p.id === id) || null; }
    function getLocation(id)  { return locations.value.find(l => l.id === id)  || null; }
    function getSubject(id)   { return subjects.value.find(s => s.id === id)   || null; }
    function getGroup(id)     { return groups.value.find(g => g.id === id)     || null; }

    function addLog(action, description) {
      changeLog.value.unshift({ id: genId(), timestamp: new Date().toISOString(), action, description });
      if (changeLog.value.length > 500) changeLog.value = changeLog.value.slice(0, 500);
    }

    function toggleSection(k) { openSections[k] = !openSections[k]; }

    // Close topmost open modal (for Escape key)
    function closeTopModal() {
      if (lectureModal.show)         { lectureModal.show      = false; return; }
      if (entityModal.show)          { entityModal.show       = false; return; }
      if (deleteModal.show)          { deleteModal.show       = false; return; }
      if (showConflictModal.value)   { showConflictModal.value = false; return; }
      if (showResetModal.value)      { showResetModal.value    = false; return; }
    }

    // Return true if the given Arabic day name is today
    function isToday(day) {
      const MAP = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      return day === MAP[new Date().getDay()];
    }

    // ===== COMPUTED – DASHBOARD =====
    const professorWorkload = computed(() =>
      professors.value.map(p => ({
        ...p,
        count: lectures.value.filter(l => l.professorId === p.id).length,
        hours: lectures.value.filter(l => l.professorId === p.id).reduce((s, l) => s + l.duration, 0)
      })).sort((a, b) => b.hours - a.hours)
    );

    const maxWorkloadHours = computed(() => Math.max(1, ...professorWorkload.value.map(p => p.hours)));

    const filteredWorkload = computed(() =>
      professorWorkload.value.filter(p =>
        p.hours > 0 && (!profSearch.value || p.name.includes(profSearch.value))
      )
    );

    const locationUsage = computed(() =>
      locations.value.map(loc => {
        const hours = lectures.value.filter(l => l.locationId === loc.id).reduce((s, l) => s + l.duration, 0);
        const maxCap = 36; // 6 slots × 6 days
        return { ...loc, hours, pct: Math.round(hours / maxCap * 100) };
      }).filter(l => l.hours > 0).sort((a, b) => b.hours - a.hours)
    );

    const filteredLocUsage = computed(() =>
      locationUsage.value.filter(l => !locSearch.value || l.name.includes(locSearch.value))
    );

    const qualityIndicators = computed(() =>
      professors.value.filter(p => lectures.value.some(l => l.professorId === p.id)).map(p => {
        let gapHours = 0, longDays = 0;
        DAYS.forEach(day => {
          const dl = lectures.value
            .filter(l => l.professorId === p.id && l.day === day)
            .sort((a, b) => a.startHour - b.startHour);
          if (dl.length < 2) return;
          for (let i = 1; i < dl.length; i++) {
            const gap = dl[i].startHour - (dl[i-1].startHour + dl[i-1].duration);
            if (gap > 0) gapHours += gap;
          }
          const span = dl[dl.length-1].startHour + dl[dl.length-1].duration - dl[0].startHour;
          if (span >= 6) longDays++;
        });
        const score = gapHours === 0 && longDays === 0 ? 'ممتاز'
                    : gapHours <= 2 ? 'جيد' : 'يحتاج مراجعة';
        return { ...p, gapHours, longDays, score };
      }).sort((a, b) => b.gapHours - a.gapHours)
    );

    const groupGaps = computed(() =>
      groups.value.filter(g => lectures.value.some(l => l.groupId === g.id)).map(g => {
        let total = 0, days = 0;
        DAYS.forEach(day => {
          const dl = lectures.value
            .filter(l => l.groupId === g.id && l.day === day)
            .sort((a, b) => a.startHour - b.startHour);
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
      DAYS.forEach(d => {
        grid[d] = {};
        HOURS.forEach(h => { grid[d][h] = 0; });
      });
      lectures.value.filter(l => l.locationId === heatmapLocId.value).forEach(l => {
        for (let h = l.startHour; h < l.startHour + l.duration; h++) {
          if (grid[l.day] && h in grid[l.day]) grid[l.day][h]++;
        }
      });
      return grid;
    });

    function heatColor(c) {
      if (c >= 3) return 'bg-purple-700 text-white';
      if (c === 2) return 'bg-purple-400 text-white';
      if (c === 1) return 'bg-purple-100 text-purple-800 dark:bg-purple-800/50 dark:text-purple-200';
      return '';
    }

    // ===== COMPUTED – SCHEDULE =====
    const uniqueYears     = computed(() => [...new Set(groups.value.map(g => g.year))]);
    const currentYear     = computed(() => sv.year    || uniqueYears.value[0]    || '');
    const uniqueMajors    = computed(() => [...new Set(groups.value.filter(g => g.year === currentYear.value).map(g => g.major))]);
    const currentMajor    = computed(() => sv.major   || uniqueMajors.value[0]   || '');
    const uniqueSections  = computed(() => groups.value.filter(g => g.year === currentYear.value && g.major === currentMajor.value).map(g => g.section));
    const currentSection  = computed(() => sv.section || uniqueSections.value[0] || '');
    const currentGroup    = computed(() => groups.value.find(g => g.year === currentYear.value && g.major === currentMajor.value && g.section === currentSection.value) || null);
    const currentProfessor = computed(() => sv.professor || professors.value[0]?.id || '');
    const currentLocation  = computed(() => sv.location  || locations.value[0]?.id  || '');

    const visibleLectures = computed(() => {
      if (schedTab.value === 'class')     return currentGroup.value ? lectures.value.filter(l => l.groupId    === currentGroup.value.id)    : [];
      if (schedTab.value === 'professor') return lectures.value.filter(l => l.professorId === currentProfessor.value);
      if (schedTab.value === 'location')  return lectures.value.filter(l => l.locationId  === currentLocation.value);
      return lectures.value;
    });

    const allConflicts    = computed(() => detectConflicts(lectures.value));
    const conflictsCount  = computed(() => allConflicts.value.length);
    const conflictIdSet   = computed(() => new Set(allConflicts.value.flatMap(c => [c.lectureA.id, c.lectureB.id])));
    function isConflict(id) { return conflictIdSet.value.has(id); }

    function getCellLectures(day, hour) {
      return visibleLectures.value.filter(l => l.day === day && l.startHour === hour);
    }

    const scheduleTitle = computed(() => {
      if (schedTab.value === 'class' && currentGroup.value)
        return `جدول: ${currentYear.value} – ${currentMajor.value} – ${currentSection.value}`;
      if (schedTab.value === 'professor')
        return `جدول المحاضر: ${getProfessor(currentProfessor.value)?.name || ''}`;
      if (schedTab.value === 'location')
        return `جدول المكان: ${getLocation(currentLocation.value)?.name || ''}`;
      return 'الجدول الدراسي';
    });

    const TYPE_COLORS = {
      'محاضرة':  'bg-purple-50  border-purple-400 dark:bg-purple-900/30 dark:border-purple-500',
      'سيكشن':   'bg-blue-50    border-blue-400   dark:bg-blue-900/30   dark:border-blue-500',
      'معمل':    'bg-green-50   border-green-400  dark:bg-green-900/30  dark:border-green-500',
    };

    const PROF_COLORS = [
      'bg-purple-50  border-purple-400 dark:bg-purple-900/30 dark:border-purple-500',
      'bg-blue-50    border-blue-400   dark:bg-blue-900/30   dark:border-blue-500',
      'bg-green-50   border-green-400  dark:bg-green-900/30  dark:border-green-500',
      'bg-yellow-50  border-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-500',
      'bg-pink-50    border-pink-400   dark:bg-pink-900/30   dark:border-pink-500',
      'bg-indigo-50  border-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-500',
      'bg-teal-50    border-teal-400   dark:bg-teal-900/30   dark:border-teal-500',
      'bg-orange-50  border-orange-400 dark:bg-orange-900/30 dark:border-orange-500',
    ];

    function lecColor(lec) {
      const idx = professors.value.findIndex(p => p.id === lec.professorId);
      const safeIdx = idx < 0 ? 0 : idx;
      return PROF_COLORS[safeIdx % PROF_COLORS.length];
    }

    function typeBadgeColor(type) {
      if (type === 'محاضرة') return 'badge-purple';
      if (type === 'سيكشن')  return 'badge-blue';
      if (type === 'معمل')   return 'badge-green';
      return 'badge-gray';
    }

    function isSubjectScheduled(subjectId) {
      return currentGroup.value && lectures.value.some(l => l.subjectId === subjectId && l.groupId === currentGroup.value.id);
    }

    // Unscheduled subjects for the assistant
    const unscheduledSubjects = computed(() => {
      if (!currentGroup.value) return [];
      return subjects.value.filter(s => !lectures.value.some(l => l.subjectId === s.id && l.groupId === currentGroup.value.id));
    });
    const scheduledSubjects = computed(() => {
      if (!currentGroup.value) return [];
      return subjects.value.filter(s => lectures.value.some(l => l.subjectId === s.id && l.groupId === currentGroup.value.id));
    });

    // Coverage percentage of subjects scheduled for current group
    const groupCoverage = computed(() => {
      if (!currentGroup.value || subjects.value.length === 0) return 0;
      return Math.round(scheduledSubjects.value.length / subjects.value.length * 100);
    });

    // Global stats
    const totalHours = computed(() => lectures.value.reduce((s, l) => s + l.duration, 0));
    const todayArabic = computed(() => new Date().toLocaleDateString('ar-EG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }));

    // ===== SCHEDULE ACTIONS =====
    function openAddLecture(day, hour) {
      lectureModal.id = null;
      lectureModal.form = {
        subjectId:   subjects.value[0]?.id   || '',
        professorId: professors.value[0]?.id || '',
        locationId:  locations.value[0]?.id  || '',
        groupId:     currentGroup.value?.id  || groups.value[0]?.id || '',
        day:         day  || DAYS[0],
        startHour:   hour || 9,
        duration:    1,
        type:        'محاضرة',
      };
      lectureModal.show = true;
    }

    function openAddWithSubject(subjectId) {
      openAddLecture(null, null);
      lectureModal.form.subjectId = subjectId;
    }

    function openEditLecture(lec) {
      lectureModal.id   = lec.id;
      lectureModal.form = { ...lec };
      lectureModal.show = true;
    }

    function saveLecture() {
      const f = lectureModal.form;
      if (!f.subjectId || !f.professorId || !f.locationId || !f.groupId) {
        showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
      }
      undoStack.value.push(JSON.stringify(lectures.value));
      if (undoStack.value.length > 20) undoStack.value.shift();
      if (lectureModal.id) {
        const idx = lectures.value.findIndex(l => l.id === lectureModal.id);
        if (idx >= 0) lectures.value[idx] = { ...f, id: lectureModal.id };
        addLog('update_lecture', `تم تعديل محاضرة: ${getSubject(f.subjectId)?.name || ''}`);
      } else {
        lectures.value.push({ ...f, id: genId() });
        addLog('add_lecture', `تم إضافة محاضرة: ${getSubject(f.subjectId)?.name || ''}`);
      }
      lectureModal.show = false;
      showToast(lectureModal.id ? 'تم تعديل المحاضرة' : 'تمت إضافة المحاضرة');
    }

    function confirmDeleteLecture(lec) {
      deleteModal.message  = `هل تريد حذف محاضرة "${getSubject(lec.subjectId)?.name || ''}"؟`;
      deleteModal.show     = true;
      deleteModal.callback = () => {
        undoStack.value.push(JSON.stringify(lectures.value));
        lectures.value = lectures.value.filter(l => l.id !== lec.id);
        addLog('delete_lecture', `تم حذف محاضرة: ${getSubject(lec.subjectId)?.name || ''}`);
        showToast('تم حذف المحاضرة');
      };
    }

    function undo() {
      if (undoStack.value.length === 0) return;
      const prev = undoStack.value.pop();
      lectures.value = JSON.parse(prev);
      addLog('undo', 'تم التراجع عن آخر عملية');
      showToast('تم التراجع');
    }

    function duplicateLecture(lec) {
      undoStack.value.push(JSON.stringify(lectures.value));
      if (undoStack.value.length > 20) undoStack.value.shift();
      lectures.value.push({ ...lec, id: genId() });
      addLog('add_lecture', `تم نسخ محاضرة: ${getSubject(lec.subjectId)?.name || ''}`);
      showToast('تم نسخ المحاضرة');
    }

    function confirmDelete() {
      if (deleteModal.callback) deleteModal.callback();
      deleteModal.show = false;
    }

    // ===== DATA MANAGEMENT =====
    const filteredProfessors = computed(() => professors.value.filter(p => !dataSearch.value || p.name.includes(dataSearch.value)));
    const filteredLocations  = computed(() => locations.value.filter(l => !dataSearch.value || l.name.includes(dataSearch.value)));
    const filteredSubjects   = computed(() => subjects.value.filter(s => !dataSearch.value || s.name.includes(dataSearch.value) || (s.code || '').includes(dataSearch.value)));
    const filteredGroups     = computed(() => groups.value.filter(g => !dataSearch.value || g.year.includes(dataSearch.value) || g.major.includes(dataSearch.value) || g.section.includes(dataSearch.value)));
    const filteredLectures   = computed(() => {
      if (!dataSearch.value) return lectures.value;
      return lectures.value.filter(l => {
        const s = getSubject(l.subjectId), p = getProfessor(l.professorId), loc = getLocation(l.locationId);
        return (s?.name || '').includes(dataSearch.value)
            || (p?.name || '').includes(dataSearch.value)
            || (loc?.name || '').includes(dataSearch.value)
            || l.day.includes(dataSearch.value);
      });
    });

    function locTypeLabel(t) {
      return { classroom: 'قاعة', lecture: 'مدرج', lab: 'معمل', online: 'أونلاين' }[t] || t;
    }
    function locTypeColor(t) {
      return { classroom: 'badge-blue', lecture: 'badge-purple', lab: 'badge-green', online: 'badge-teal' }[t] || 'badge-gray';
    }
    function entityTypeLabel(t) {
      return { professor: 'محاضر', location: 'مكان', subject: 'مادة', group: 'فرقة' }[t] || t;
    }

    function openEntityModal(type, item) {
      entityModal.type = type;
      entityModal.id   = item?.id || null;
      entityModal.form = item
        ? { ...item }
        : { name: '', capacity: 72, type: 'classroom', code: '', year: 'الفرقة الأولى', major: '', section: 'مجموعة (A)' };
      entityModal.show = true;
    }

    function saveEntity() {
      const { type, id, form } = entityModal;
      if (type === 'professor') {
        if (!form.name.trim()) { showToast('الاسم مطلوب', 'error'); return; }
        if (id) {
          const i = professors.value.findIndex(p => p.id === id);
          professors.value[i] = { id, name: form.name.trim() };
          addLog('update_professor', `تم تعديل المحاضر: ${form.name}`);
        } else {
          professors.value.push({ id: genId(), name: form.name.trim() });
          addLog('add_professor', `تم إضافة المحاضر: ${form.name}`);
        }
      } else if (type === 'location') {
        if (!form.name.trim()) { showToast('الاسم مطلوب', 'error'); return; }
        const loc = { id: id || genId(), name: form.name.trim(), capacity: +form.capacity || 72, type: form.type };
        if (id) {
          const i = locations.value.findIndex(l => l.id === id);
          locations.value[i] = loc;
          addLog('update_location', `تم تعديل المكان: ${form.name}`);
        } else {
          locations.value.push(loc);
          addLog('add_location', `تم إضافة المكان: ${form.name}`);
        }
      } else if (type === 'subject') {
        if (!form.name.trim()) { showToast('الاسم مطلوب', 'error'); return; }
        const s = { id: id || genId(), name: form.name.trim(), code: form.code.trim() };
        if (id) {
          const i = subjects.value.findIndex(x => x.id === id);
          subjects.value[i] = s;
          addLog('update_subject', `تم تعديل المادة: ${form.name}`);
        } else {
          subjects.value.push(s);
          addLog('add_subject', `تم إضافة المادة: ${form.name}`);
        }
      } else if (type === 'group') {
        if (!form.major.trim()) { showToast('التخصص مطلوب', 'error'); return; }
        const g = { id: id || genId(), year: form.year, major: form.major.trim(), section: form.section.trim() || 'مجموعة (A)' };
        if (id) {
          const i = groups.value.findIndex(x => x.id === id);
          groups.value[i] = g;
          addLog('update_group', `تم تعديل الفرقة: ${form.year}`);
        } else {
          groups.value.push(g);
          addLog('add_group', `تم إضافة الفرقة: ${form.year} – ${form.major}`);
        }
      }
      entityModal.show = false;
      showToast(id ? 'تم التعديل بنجاح' : 'تمت الإضافة بنجاح');
    }

    function deleteEntity(type, item) {
      deleteModal.message  = `هل تريد حذف "${item.name || item.year + ' – ' + item.major}"؟`;
      deleteModal.show     = true;
      deleteModal.callback = () => {
        if (type === 'professor') {
          professors.value = professors.value.filter(p => p.id !== item.id);
          addLog('delete_professor', `تم حذف المحاضر: ${item.name}`);
        } else if (type === 'location') {
          locations.value = locations.value.filter(l => l.id !== item.id);
          addLog('delete_location', `تم حذف المكان: ${item.name}`);
        } else if (type === 'subject') {
          subjects.value = subjects.value.filter(s => s.id !== item.id);
          addLog('delete_subject', `تم حذف المادة: ${item.name}`);
        } else if (type === 'group') {
          groups.value = groups.value.filter(g => g.id !== item.id);
          addLog('delete_group', `تم حذف الفرقة: ${item.year}`);
        }
        showToast('تم الحذف');
      };
    }

    // ===== REPORTS =====
    const rpUniqueMajors   = computed(() => [...new Set(groups.value.filter(g => g.year === (rp.year || uniqueYears.value[0])).map(g => g.major))]);
    const rpUniqueSections = computed(() => {
      const y = rp.year  || uniqueYears.value[0];
      const m = rp.major || rpUniqueMajors.value[0];
      return groups.value.filter(g => g.year === y && g.major === m).map(g => g.section);
    });
    const reportGroup = computed(() => {
      const y = rp.year    || uniqueYears.value[0];
      const m = rp.major   || rpUniqueMajors.value[0];
      const s = rp.section || rpUniqueSections.value[0];
      return groups.value.find(g => g.year === y && g.major === m && g.section === s) || null;
    });
    const reportLectures = computed(() => {
      if (reportType.value === 'group')     return reportGroup.value ? lectures.value.filter(l => l.groupId    === reportGroup.value.id) : [];
      if (reportType.value === 'professor') return lectures.value.filter(l => l.professorId === (rp.professor || professors.value[0]?.id));
      if (reportType.value === 'location')  return lectures.value.filter(l => l.locationId  === (rp.location  || locations.value[0]?.id));
      return lectures.value;
    });
    const reportTitle = computed(() => {
      if (reportType.value === 'group')     return `جدول: ${reportGroup.value?.year} – ${reportGroup.value?.major} – ${reportGroup.value?.section}`;
      if (reportType.value === 'professor') return `جدول المحاضر: ${getProfessor(rp.professor || professors.value[0]?.id)?.name || ''}`;
      if (reportType.value === 'location')  return `جدول المكان: ${getLocation(rp.location || locations.value[0]?.id)?.name || ''}`;
      return '';
    });

    function getReportCellLectures(day, hour) {
      return reportLectures.value.filter(l => l.day === day && l.startHour === hour);
    }

    function exportCSV() {
      const rows = [['المادة', 'المحاضر', 'المكان', 'الفرقة', 'اليوم', 'الوقت', 'المدة (ساعات)', 'النوع']];
      reportLectures.value.forEach(l => {
        rows.push([
          getSubject(l.subjectId)?.name   || '',
          getProfessor(l.professorId)?.name || '',
          getLocation(l.locationId)?.name  || '',
          `${getGroup(l.groupId)?.year || ''} / ${getGroup(l.groupId)?.section || ''}`,
          l.day,
          formatSlot(l.startHour),
          l.duration,
          l.type
        ]);
      });
      const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'timetable.csv'; a.click();
      URL.revokeObjectURL(url);
      showToast('تم تصدير الجدول بنجاح');
    }

    function printSchedule() {
      window.print();
    }

    // ===== CHANGE LOG =====
    const LOG_META = {
      add_professor:    { label: 'إضافة محاضر',    icon: 'fa-user-plus',            color: 'text-green-600  dark:text-green-400'  },
      update_professor: { label: 'تعديل محاضر',    icon: 'fa-user-pen',             color: 'text-blue-600   dark:text-blue-400'   },
      delete_professor: { label: 'حذف محاضر',      icon: 'fa-user-minus',           color: 'text-red-600    dark:text-red-400'    },
      add_location:     { label: 'إضافة مكان',     icon: 'fa-building-circle-plus', color: 'text-green-600  dark:text-green-400'  },
      update_location:  { label: 'تعديل مكان',     icon: 'fa-building',             color: 'text-blue-600   dark:text-blue-400'   },
      delete_location:  { label: 'حذف مكان',       icon: 'fa-building-circle-xmark',color: 'text-red-600    dark:text-red-400'    },
      add_subject:      { label: 'إضافة مادة',     icon: 'fa-book-medical',         color: 'text-green-600  dark:text-green-400'  },
      update_subject:   { label: 'تعديل مادة',     icon: 'fa-book',                 color: 'text-blue-600   dark:text-blue-400'   },
      delete_subject:   { label: 'حذف مادة',       icon: 'fa-book-skull',           color: 'text-red-600    dark:text-red-400'    },
      add_group:        { label: 'إضافة فرقة',     icon: 'fa-users',                color: 'text-green-600  dark:text-green-400'  },
      update_group:     { label: 'تعديل فرقة',     icon: 'fa-users-gear',           color: 'text-blue-600   dark:text-blue-400'   },
      delete_group:     { label: 'حذف فرقة',       icon: 'fa-users-slash',          color: 'text-red-600    dark:text-red-400'    },
      add_lecture:      { label: 'إضافة محاضرة',   icon: 'fa-calendar-plus',        color: 'text-green-600  dark:text-green-400'  },
      update_lecture:   { label: 'تعديل محاضرة',   icon: 'fa-calendar-pen',         color: 'text-blue-600   dark:text-blue-400'   },
      delete_lecture:   { label: 'حذف محاضرة',     icon: 'fa-calendar-minus',       color: 'text-red-600    dark:text-red-400'    },
      undo:             { label: 'تراجع',           icon: 'fa-rotate-left',          color: 'text-orange-600 dark:text-orange-400' },
      reset:            { label: 'إعادة تعيين',    icon: 'fa-rotate',               color: 'text-gray-500   dark:text-gray-400'   },
    };
    function getLogMeta(a)  { return LOG_META[a] || { label: a, icon: 'fa-circle-info', color: 'text-gray-500' }; }
    function getLogLabel(a) { return getLogMeta(a).label; }
    function getLogIcon(a)  { return getLogMeta(a).icon; }
    function getLogColor(a) { return getLogMeta(a).color; }

    function getLogCategory(action) {
      if (action.includes('professor')) return 'professor';
      if (action.includes('location'))  return 'location';
      if (action.includes('subject'))   return 'subject';
      if (action.includes('group'))     return 'group';
      if (action.includes('lecture'))   return 'lecture';
      return 'other';
    }

    const filteredLog = computed(() =>
      changeLog.value.filter(e => {
        const matchCat    = logFilter.value === 'all' || getLogCategory(e.action) === logFilter.value;
        const matchSearch = !logSearch.value || e.description.includes(logSearch.value);
        return matchCat && matchSearch;
      })
    );

    const logStats = computed(() => [
      { label: 'إجمالي التغييرات', value: changeLog.value.length,                                          colorClass: 'bg-blue-50   dark:bg-blue-900/20   text-blue-700   dark:text-blue-300'   },
      { label: 'إضافات',           value: changeLog.value.filter(e => e.action.startsWith('add_')).length, colorClass: 'bg-green-50  dark:bg-green-900/20  text-green-700  dark:text-green-300'  },
      { label: 'تعديلات',          value: changeLog.value.filter(e => e.action.startsWith('update_')).length, colorClass: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' },
      { label: 'حذف',              value: changeLog.value.filter(e => e.action.startsWith('delete_')).length, colorClass: 'bg-red-50    dark:bg-red-900/20    text-red-700    dark:text-red-300'    },
    ]);

    function formatDate(iso) {
      try {
        return new Date(iso).toLocaleString('ar-EG', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      } catch { return iso; }
    }

    function clearLog() {
      changeLog.value = [];
      showToast('تم مسح السجل');
    }

    // ===== RESET =====
    function resetData() {
      professors.value = JSON.parse(JSON.stringify(INITIAL_DATA.professors));
      locations.value  = JSON.parse(JSON.stringify(INITIAL_DATA.locations));
      subjects.value   = JSON.parse(JSON.stringify(INITIAL_DATA.subjects));
      groups.value     = JSON.parse(JSON.stringify(INITIAL_DATA.groups));
      lectures.value   = JSON.parse(JSON.stringify(INITIAL_DATA.lectures));
      changeLog.value  = [];
      undoStack.value  = [];
      showResetModal.value = false;
      addLog('reset', 'تم إعادة تعيين البيانات للبيانات الافتراضية');
      showToast('تمت إعادة تعيين البيانات');
    }

    return {
      // state
      darkMode, currentPage, navItems,
      professors, locations, subjects, groups, lectures, changeLog, undoStack,
      // dashboard
      profSearch, locSearch, heatmapLocId, openSections, DAYS, HOURS,
      filteredWorkload, maxWorkloadHours, filteredLocUsage, qualityIndicators,
      groupGaps, heatmapGrid, professorWorkload, locationUsage,
      // schedule
      schedTab, scheduleTabs, sv,
      uniqueYears, uniqueMajors, uniqueSections,
      showAssistant, showConflictModal, showResetModal,
      visibleLectures, allConflicts, conflictsCount,
      scheduleTitle, lectureModal, entityModal, deleteModal,
      unscheduledSubjects, scheduledSubjects,
      // reports
      reportType, reportTypes, rp, rpUniqueMajors, rpUniqueSections,
      reportTitle, reportLectures,
      // log
      logSearch, logFilter, logFilters, filteredLog, logStats,
      // toasts
      toasts,
      // methods
      toggleDark, toggleSection, formatSlot, formatSlotRange, heatColor,
      getProfessor, getLocation, getSubject, getGroup,
      isConflict, getCellLectures, lecColor, typeBadgeColor, isSubjectScheduled,
      openAddLecture, openAddWithSubject, openEditLecture, saveLecture, confirmDeleteLecture,
      undo, duplicateLecture, confirmDelete,
      closeTopModal, isToday, compact,
      groupCoverage, totalHours, todayArabic,
      dataTab, dataTabs, dataSearch,
      filteredProfessors, filteredLocations, filteredSubjects, filteredGroups, filteredLectures,
      locTypeLabel, locTypeColor, entityTypeLabel,
      openEntityModal, saveEntity, deleteEntity,
      getReportCellLectures, exportCSV, printSchedule,
      getLogLabel, getLogIcon, getLogColor, formatDate, clearLog,
      resetData,
    };
  }
}).mount('#app');
