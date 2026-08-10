import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  RotateCcw, 
  Archive, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  BookOpen, 
  Check, 
  AlertCircle, 
  CalendarRange, 
  ArrowRight, 
  ArrowLeft, 
  Layers, 
  History,
  Copy,
  Search,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { doc, getDoc, setDoc, collection, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { DayProgramme, WeeklyProgramme, ArchivedProgramme, ServiceItem } from '../../types/programme';
import { 
  getSundayOfWeek, 
  getSaturdayOfWeek, 
  formatDateISO, 
  parseISODate, 
  formatDateDisplay, 
  generateWeekTitle, 
  generateWeekId, 
  generateDefaultProgramme, 
  recalculateDaysForWeek 
} from '../../utils/programmeDateUtils';

const COMMON_PRESET_FIELDS = [
  'Hruaitu',
  'Tantu',
  'Thusawitu',
  'Thupui Hawngtu',
  'Zirlai',
  'Zirtirtu',
  'Zaipawl',
  'Thawhlawm Khawntu',
  'Thawhlawm Hlantu',
  'Sound Duty',
  'Refreshment'
];

const DAY_PRESETS = [
  'Pathian Ni',
  'Thawhtan Zan (KTP)',
  'Thawhleh Zan (Kohhran Hmeichhia)',
  'Nilai Zan',
  'Ningani Zan',
  'Zirtawp Zan',
  'Inrinni Zan'
];

export const InkhawmProgrammeManager: React.FC = () => {
  const { user } = useAuth();
  const [programme, setProgramme] = useState<WeeklyProgramme>(generateDefaultProgramme());
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showArchiveManager, setShowArchiveManager] = useState(false);
  const [archivesList, setArchivesList] = useState<ArchivedProgramme[]>([]);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [customFieldPromptDayIdx, setCustomFieldPromptDayIdx] = useState<number | null>(null);
  const [customFieldPromptSrvIdx, setCustomFieldPromptSrvIdx] = useState<number | null>(null);
  const [customFieldInput, setCustomFieldInput] = useState('');

  // Load current active programme from settings/services
  useEffect(() => {
    const fetchCurrent = async () => {
      try {
        const docRef = doc(db, 'settings', 'services');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          const sunday = getSundayOfWeek();
          const startIso = data.weekStartDate || formatDateISO(sunday);
          const endIso = data.weekEndDate || formatDateISO(getSaturdayOfWeek(parseISODate(startIso)));
          
          setProgramme({
            weekId: data.weekId || generateWeekId(startIso),
            weekTitle: data.weekTitle || generateWeekTitle(startIso, endIso),
            weekStartDate: startIso,
            weekEndDate: endIso,
            theme: data.theme || '',
            verse: data.verse || '',
            days: data.days || generateDefaultProgramme(parseISODate(startIso)).days,
            updatedAt: data.updatedAt
          });
        } else {
          setProgramme(generateDefaultProgramme());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/services');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrent();
  }, []);

  // Listen to archives list for the archive manager modal
  useEffect(() => {
    const q = query(collection(db, 'programme_archives'), orderBy('weekStartDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ArchivedProgramme[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<ArchivedProgramme, 'id'>)
      }));
      setArchivesList(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'programme_archives');
    });

    return unsubscribe;
  }, []);

  // Handlers for week date changes
  const handleStartDateChange = (newStartIso: string) => {
    if (!newStartIso) return;
    const start = parseISODate(newStartIso);
    const end = getSaturdayOfWeek(start);
    const endIso = formatDateISO(end);
    const newTitle = generateWeekTitle(newStartIso, endIso);
    const updatedDays = recalculateDaysForWeek(programme.days, newStartIso);

    setProgramme(prev => ({
      ...prev,
      weekStartDate: newStartIso,
      weekEndDate: endIso,
      weekTitle: newTitle,
      weekId: generateWeekId(newStartIso),
      days: updatedDays
    }));
  };

  const handleJumpToCurrentWeek = () => {
    const sunday = getSundayOfWeek();
    handleStartDateChange(formatDateISO(sunday));
  };

  const handleJumpToNextWeek = () => {
    const current = parseISODate(programme.weekStartDate || formatDateISO(getSundayOfWeek()));
    const nextSunday = new Date(current);
    nextSunday.setDate(nextSunday.getDate() + 7);
    handleStartDateChange(formatDateISO(nextSunday));
  };

  const handleJumpToPrevWeek = () => {
    const current = parseISODate(programme.weekStartDate || formatDateISO(getSundayOfWeek()));
    const prevSunday = new Date(current);
    prevSunday.setDate(prevSunday.getDate() - 7);
    handleStartDateChange(formatDateISO(prevSunday));
  };

  const handleRecalculateDates = () => {
    const updatedDays = recalculateDaysForWeek(programme.days, programme.weekStartDate);
    const end = getSaturdayOfWeek(parseISODate(programme.weekStartDate));
    const endIso = formatDateISO(end);
    setProgramme(prev => ({
      ...prev,
      weekEndDate: endIso,
      weekTitle: generateWeekTitle(prev.weekStartDate, endIso),
      days: updatedDays
    }));
  };

  // Day & Service manipulation
  const handleAddDay = (dayName = "Pathian Ni") => {
    let dayOffset = 0;
    const lower = dayName.toLowerCase();
    if (lower.includes('sunday') || lower.includes('pathian')) dayOffset = 0;
    else if (lower.includes('monday') || lower.includes('thawhtan')) dayOffset = 1;
    else if (lower.includes('tuesday') || lower.includes('thawhleh')) dayOffset = 2;
    else if (lower.includes('wednesday') || lower.includes('nilai')) dayOffset = 3;
    else if (lower.includes('thursday') || lower.includes('ninga')) dayOffset = 4;
    else if (lower.includes('friday') || lower.includes('zirtawp')) dayOffset = 5;
    else if (lower.includes('saturday') || lower.includes('inrin')) dayOffset = 6;

    const sunday = parseISODate(programme.weekStartDate || formatDateISO(getSundayOfWeek()));
    const dayDate = new Date(sunday);
    dayDate.setDate(dayDate.getDate() + dayOffset);

    const newDay: DayProgramme = {
      day: dayName,
      date: formatDateDisplay(dayDate),
      dayOfWeek: dayOffset,
      services: [
        {
          title: `${dayName} Inkhawm`,
          time: "7:00 PM",
          fields: {
            "Hruaitu": "",
            "Tantu": "",
            "Thusawitu": ""
          }
        }
      ]
    };

    setProgramme(prev => ({
      ...prev,
      days: [...prev.days, newDay]
    }));
  };

  const handleDeleteDay = (dayIdx: number) => {
    setProgramme(prev => ({
      ...prev,
      days: prev.days.filter((_, i) => i !== dayIdx)
    }));
  };

  const handleMoveDay = (dayIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? dayIdx - 1 : dayIdx + 1;
    if (targetIdx < 0 || targetIdx >= programme.days.length) return;
    const newDays = [...programme.days];
    const temp = newDays[dayIdx];
    newDays[dayIdx] = newDays[targetIdx];
    newDays[targetIdx] = temp;
    setProgramme(prev => ({ ...prev, days: newDays }));
  };

  const handleAddService = (dayIdx: number) => {
    const newService: ServiceItem = {
      title: "Inkhawm",
      time: "7:00 PM",
      fields: {
        "Hruaitu": "",
        "Tantu": "",
        "Thusawitu": ""
      }
    };
    const newDays = [...programme.days];
    newDays[dayIdx].services.push(newService);
    setProgramme(prev => ({ ...prev, days: newDays }));
  };

  const handleDeleteService = (dayIdx: number, srvIdx: number) => {
    const newDays = [...programme.days];
    newDays[dayIdx].services = newDays[dayIdx].services.filter((_, i) => i !== srvIdx);
    setProgramme(prev => ({ ...prev, days: newDays }));
  };

  const handleAddFieldToService = (dayIdx: number, srvIdx: number, fieldLabel: string) => {
    if (!fieldLabel.trim()) return;
    const newDays = [...programme.days];
    if (!newDays[dayIdx].services[srvIdx].fields) {
      newDays[dayIdx].services[srvIdx].fields = {};
    }
    newDays[dayIdx].services[srvIdx].fields[fieldLabel.trim()] = "";
    setProgramme(prev => ({ ...prev, days: newDays }));
  };

  const handleRemoveField = (dayIdx: number, srvIdx: number, fieldKey: string) => {
    const newDays = [...programme.days];
    delete newDays[dayIdx].services[srvIdx].fields[fieldKey];
    setProgramme(prev => ({ ...prev, days: newDays }));
  };

  const handleUpdateFieldValue = (dayIdx: number, srvIdx: number, fieldKey: string, value: string) => {
    const newDays = [...programme.days];
    newDays[dayIdx].services[srvIdx].fields[fieldKey] = value;
    setProgramme(prev => ({ ...prev, days: newDays }));
  };

  // Main Save Action: Saves to settings/services AND archives in programme_archives
  const handleSaveProgramme = async (showNotification = true) => {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const weekId = programme.weekId || generateWeekId(programme.weekStartDate);
      const weekEndIso = programme.weekEndDate || formatDateISO(getSaturdayOfWeek(parseISODate(programme.weekStartDate)));
      const weekTitle = programme.weekTitle || generateWeekTitle(programme.weekStartDate, weekEndIso);

      const payload: WeeklyProgramme = {
        ...programme,
        weekId,
        weekTitle,
        weekEndDate: weekEndIso,
        updatedAt: now,
        updatedBy: user?.email || 'Admin'
      };

      // 1. Save to active settings/services
      await setDoc(doc(db, 'settings', 'services'), payload);

      // 2. Automatically save/update in programme_archives
      const archivePayload: ArchivedProgramme = {
        ...payload,
        id: weekId,
        archivedAt: now,
        archivedBy: user?.email || 'Admin'
      };
      await setDoc(doc(db, 'programme_archives', weekId), archivePayload);

      setProgramme(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (showNotification) {
        alert("Inkhawm programme vawn that leh Archive-a dah nghal a ni ta!");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/services');
    } finally {
      setIsSaving(false);
    }
  };

  // Archive current programme and prepare clean template for next week
  const handleArchiveAndStartNewWeek = async () => {
    const confirm = window.confirm(
      "He programme hi Archive-ah vawngin, Kar thar pual programme thar i siam duh tak tak em?\n(Programme hlui chu Archive-ah a him ang a, kar thar dates chhut thar a ni ang)"
    );
    if (!confirm) return;

    setIsSaving(true);
    try {
      // 1. Ensure current programme is archived
      const currentWeekId = programme.weekId || generateWeekId(programme.weekStartDate);
      const now = new Date().toISOString();
      const archivePayload: ArchivedProgramme = {
        ...programme,
        id: currentWeekId,
        weekId: currentWeekId,
        archivedAt: now,
        archivedBy: user?.email || 'Admin',
        archiveNotes: 'Manually archived during weekly rollover'
      };
      await setDoc(doc(db, 'programme_archives', currentWeekId), archivePayload);

      // 2. Advance by 7 days to next Sunday
      const currentSunday = parseISODate(programme.weekStartDate || formatDateISO(getSundayOfWeek()));
      const nextSunday = new Date(currentSunday);
      nextSunday.setDate(nextSunday.getDate() + 7);
      const nextStartIso = formatDateISO(nextSunday);
      const nextEndIso = formatDateISO(getSaturdayOfWeek(nextSunday));
      const nextWeekTitle = generateWeekTitle(nextStartIso, nextEndIso);
      const nextWeekId = generateWeekId(nextStartIso);

      // 3. Clear duty bearer field values while preserving structure & keys
      const resetDays = programme.days.map((dayItem) => {
        let dayOffset = dayItem.dayOfWeek ?? 0;
        const dayDate = new Date(nextSunday);
        dayDate.setDate(dayDate.getDate() + dayOffset);

        return {
          ...dayItem,
          date: formatDateDisplay(dayDate),
          services: dayItem.services.map(srv => {
            const clearedFields: Record<string, string> = {};
            Object.keys(srv.fields || {}).forEach(k => {
              clearedFields[k] = "";
            });
            return {
              ...srv,
              fields: clearedFields,
              notes: ""
            };
          }),
          note: ""
        };
      });

      const newProg: WeeklyProgramme = {
        weekId: nextWeekId,
        weekTitle: nextWeekTitle,
        weekStartDate: nextStartIso,
        weekEndDate: nextEndIso,
        theme: "",
        verse: "",
        days: resetDays,
        updatedAt: now,
        updatedBy: user?.email || 'Admin'
      };

      // 4. Save new active programme
      await setDoc(doc(db, 'settings', 'services'), newProg);
      setProgramme(newProg);

      alert(`Kar thar (${nextWeekTitle}) pual programme siam a ni ta! Hming leh hna chanvo-te dah luh theih a ni e.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/services');
    } finally {
      setIsSaving(false);
    }
  };

  // Restore an archived programme to active editor
  const handleRestoreFromArchive = async (archivedItem: ArchivedProgramme) => {
    const confirm = window.confirm(`"${archivedItem.weekTitle || archivedItem.weekStartDate}" hi active programme atan i load duh em?`);
    if (!confirm) return;

    setProgramme({
      weekId: archivedItem.weekId,
      weekTitle: archivedItem.weekTitle,
      weekStartDate: archivedItem.weekStartDate,
      weekEndDate: archivedItem.weekEndDate,
      theme: archivedItem.theme || '',
      verse: archivedItem.verse || '',
      days: archivedItem.days || [],
      updatedAt: archivedItem.updatedAt
    });
    setShowArchiveManager(false);
  };

  // Delete an archive entry
  const handleDeleteArchive = async (archiveId: string) => {
    if (!window.confirm("He archive record hi delete i duh tak tak em?")) return;
    try {
      await deleteDoc(doc(db, 'programme_archives', archiveId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `programme_archives/${archiveId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-500">
        <Loader2 className="h-8 w-8 text-church-burgundy animate-spin mb-3" />
        <p className="font-serif">Programme lak mek a ni...</p>
      </div>
    );
  }

  const filteredArchives = archivesList.filter(a => {
    if (!archiveSearch.trim()) return true;
    const q = archiveSearch.toLowerCase();
    return (a.weekTitle || '').toLowerCase().includes(q) ||
           (a.weekStartDate || '').toLowerCase().includes(q) ||
           (a.theme || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-church-burgundy text-white rounded-full text-xs font-bold uppercase tracking-wider">
              Weekly Service Management
            </span>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 animate-pulse">
                <Check className="h-3.5 w-3.5" /> Vawn that a ni e!
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
            Inkhawm Programme Enkawlna
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Kar tin Pathian biak inkhawm hun, hna chanvo, ni leh thla, leh archive enkawlna.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowArchiveManager(!showArchiveManager)}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border border-stone-200 shadow-2xs"
          >
            <History className="h-4 w-4 text-stone-600" />
            Archive En ({archivesList.length})
          </button>

          <button
            type="button"
            onClick={handleArchiveAndStartNewWeek}
            disabled={isSaving}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            title="Archives current week and prepares a new week template"
          >
            <Archive className="h-4 w-4" />
            Archive & Kar Thar Siam
          </button>

          <button
            type="button"
            onClick={() => handleSaveProgramme(true)}
            disabled={isSaving}
            className="px-6 py-2.5 bg-church-burgundy hover:bg-opacity-90 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Vawng tha rawh
          </button>
        </div>
      </div>

      {/* Archive Manager Modal / Drawer */}
      {showArchiveManager && (
        <div className="bg-stone-900 text-white p-6 rounded-3xl space-y-4 shadow-xl border border-stone-800 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-church-gold" />
              <h3 className="font-serif font-bold text-xl text-church-gold">Programme Archives List</h3>
            </div>
            <button
              onClick={() => setShowArchiveManager(false)}
              className="text-stone-400 hover:text-white text-xs bg-stone-800 px-3 py-1.5 rounded-lg"
            >
              Khar rawh
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Archive zawnna (Week, Ni, Thupui...)"
              value={archiveSearch}
              onChange={(e) => setArchiveSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-800 border border-stone-700 rounded-xl text-white placeholder:text-stone-500 text-sm focus:outline-none focus:border-church-gold"
            />
          </div>

          {filteredArchives.length === 0 ? (
            <p className="text-stone-400 text-sm py-4 text-center">Archive hmuh a ni lo.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-stone-800">
              {filteredArchives.map((arch) => (
                <div key={arch.id} className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                  <div>
                    <div className="font-bold text-stone-100 flex items-center gap-2">
                      <span>{arch.weekTitle || arch.weekStartDate}</span>
                      <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded">
                        {arch.weekStartDate}
                      </span>
                    </div>
                    {arch.theme && <p className="text-xs text-stone-400 italic">Thupui: {arch.theme}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRestoreFromArchive(arch)}
                      className="px-3 py-1 bg-church-gold text-stone-950 hover:bg-yellow-400 rounded-lg text-xs font-bold transition-colors"
                    >
                      Load to Editor
                    </button>
                    <button
                      onClick={() => handleDeleteArchive(arch.id)}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors"
                      title="Delete archive entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="pt-2 flex justify-end">
            <Link
              to="/archive/inkhawm-programme"
              target="_blank"
              className="text-xs text-church-gold hover:underline flex items-center gap-1"
            >
              Public Archive Page en rawh <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Week Date & Automatic Calculator Box */}
      <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-church-burgundy" />
            <h3 className="font-serif font-bold text-lg text-stone-900">Kar leh Ni ruahmanna (Dates & Week Range)</h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Ni leh thla hi he ta tang hian a in-calculate nghal vek ang
          </span>
        </div>

        {/* Quick Date Jumper Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleJumpToPrevWeek}
            className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kar Hmasa (-7 days)
          </button>
          <button
            type="button"
            onClick={handleJumpToCurrentWeek}
            className="px-3.5 py-1.5 bg-church-burgundy text-white hover:bg-opacity-90 text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs"
          >
            <Calendar className="h-3.5 w-3.5" /> Vawiin Kar (This Week)
          </button>
          <button
            type="button"
            onClick={handleJumpToNextWeek}
            className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-2xs"
          >
            Kar Leh (+7 days) <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRecalculateDates}
            className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-lg flex items-center gap-1 ml-auto"
            title="Recalculate day dates based on selected week start date"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Ni & Thla chhut thar rawh
          </button>
        </div>

        {/* Form Inputs for Dates & Themes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Week Start Date (Pathian Ni) *
            </label>
            <input
              type="date"
              value={programme.weekStartDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 text-sm font-semibold focus:outline-none focus:border-church-burgundy focus:ring-1 focus:ring-church-burgundy"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Week Display Title (Kar Hming / Hun Chhung)
            </label>
            <input
              type="text"
              value={programme.weekTitle}
              onChange={(e) => setProgramme(prev => ({ ...prev, weekTitle: e.target.value }))}
              placeholder="e.g. 16 - 22 February, 2025"
              className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 text-sm font-semibold focus:outline-none focus:border-church-burgundy"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Kar Thupui (Weekly Theme / Motto - Optional)
            </label>
            <input
              type="text"
              value={programme.theme || ''}
              onChange={(e) => setProgramme(prev => ({ ...prev, theme: e.target.value }))}
              placeholder="e.g. Kohhran Pum Huap Tawngtai Kar / Thupui..."
              className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 text-sm focus:outline-none focus:border-church-burgundy"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Bible Chang / Chhiar tur (Verse - Optional)
            </label>
            <input
              type="text"
              value={programme.verse || ''}
              onChange={(e) => setProgramme(prev => ({ ...prev, verse: e.target.value }))}
              placeholder="e.g. Sam 23:1 / Johana 3:16"
              className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 text-sm focus:outline-none focus:border-church-burgundy"
            />
          </div>
        </div>
      </div>

      {/* Days & Services Editor Container */}
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-serif font-bold text-2xl text-stone-900 flex items-center gap-2">
            <span>Inkhawm Ni & Chanvote</span>
            <span className="text-xs font-sans font-bold bg-stone-200 text-stone-700 px-2.5 py-0.5 rounded-full">
              {programme.days.length} Ni
            </span>
          </h3>

          <div className="flex items-center gap-2">
            <div className="relative inline-block">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddDay(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="bg-white border border-stone-300 text-stone-800 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-church-burgundy cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>+ Ni thar belhna (Select Day)...</option>
                {DAY_PRESETS.map((dp) => (
                  <option key={dp} value={dp}>+ {dp}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {programme.days.map((dayGroup, dayIdx) => (
          <div 
            key={dayIdx} 
            className="bg-stone-50 rounded-3xl border border-stone-200 overflow-hidden shadow-2xs"
          >
            {/* Day Header Bar */}
            <div className="bg-stone-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                <span className="text-church-gold font-bold text-xs bg-stone-800 px-2.5 py-1 rounded-md">
                  #{dayIdx + 1}
                </span>
                <input
                  type="text"
                  value={dayGroup.day}
                  onChange={(e) => {
                    const newDays = [...programme.days];
                    newDays[dayIdx].day = e.target.value;
                    setProgramme(prev => ({ ...prev, days: newDays }));
                  }}
                  className="bg-stone-800 border border-stone-700 text-church-gold font-serif font-bold text-lg rounded-lg px-3 py-1 focus:outline-none focus:border-church-gold w-48 sm:w-64"
                  placeholder="Day title..."
                />
                <input
                  type="text"
                  value={dayGroup.date || ''}
                  onChange={(e) => {
                    const newDays = [...programme.days];
                    newDays[dayIdx].date = e.target.value;
                    setProgramme(prev => ({ ...prev, days: newDays }));
                  }}
                  className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-church-gold w-36 sm:w-44"
                  placeholder="Date (e.g. 16 Feb, 2025)"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMoveDay(dayIdx, 'up')}
                  disabled={dayIdx === 0}
                  className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-30 rounded-lg transition-colors"
                  title="Move day up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDay(dayIdx, 'down')}
                  disabled={dayIdx === programme.days.length - 1}
                  className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-30 rounded-lg transition-colors"
                  title="Move day down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDay(dayIdx)}
                  className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-400 rounded-lg transition-colors ml-2"
                  title="Delete this entire day"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Services List for this Day */}
            <div className="p-6 sm:p-8 space-y-6">
              {dayGroup.services.map((service, sIdx) => (
                <div 
                  key={sIdx} 
                  className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-5"
                >
                  {/* Service Title & Time Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                          Service Title (e.g. Chawhma / Zan Inkhawm)
                        </label>
                        <input
                          type="text"
                          value={service.title}
                          onChange={(e) => {
                            const newDays = [...programme.days];
                            newDays[dayIdx].services[sIdx].title = e.target.value;
                            setProgramme(prev => ({ ...prev, days: newDays }));
                          }}
                          placeholder="e.g. Chawhma (Sunday School)"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 font-bold text-sm focus:outline-none focus:border-church-burgundy"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                          Time (e.g. 10:30 AM / 7:00 PM)
                        </label>
                        <input
                          type="text"
                          value={service.time}
                          onChange={(e) => {
                            const newDays = [...programme.days];
                            newDays[dayIdx].services[sIdx].time = e.target.value;
                            setProgramme(prev => ({ ...prev, days: newDays }));
                          }}
                          placeholder="e.g. 7:00 PM"
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 font-semibold text-sm focus:outline-none focus:border-church-burgundy"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteService(dayIdx, sIdx)}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors self-end sm:self-center"
                      title="Delete service"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Duty Bearer Fields Grid */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                      Chanvo & Duty Bearer Hrang Hrangte:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(service.fields || {}).map(([fieldLabel, fieldValue]) => (
                        <div 
                          key={fieldLabel} 
                          className="bg-stone-50/70 p-3 rounded-xl border border-stone-200 relative group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-church-burgundy">
                              {fieldLabel}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveField(dayIdx, sIdx, fieldLabel)}
                              className="text-stone-400 hover:text-red-500 p-0.5 rounded transition-colors"
                              title="Remove this duty field"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={fieldValue}
                            onChange={(e) => handleUpdateFieldValue(dayIdx, sIdx, fieldLabel, e.target.value)}
                            placeholder={`Hming / Topic (${fieldLabel})...`}
                            className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-900 text-xs font-medium focus:outline-none focus:border-church-burgundy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick-Add Duty Pill Selector */}
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                      + Quick Add Duty Field:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {COMMON_PRESET_FIELDS.filter(f => !service.fields || !(f in service.fields)).map((fName) => (
                        <button
                          key={fName}
                          type="button"
                          onClick={() => handleAddFieldToService(dayIdx, sIdx, fName)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-church-burgundy hover:text-white text-stone-700 rounded-lg text-xs font-medium transition-colors border border-stone-200"
                        >
                          + {fName}
                        </button>
                      ))}

                      {/* Custom Field Button */}
                      {customFieldPromptDayIdx === dayIdx && customFieldPromptSrvIdx === sIdx ? (
                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-church-burgundy">
                          <input
                            type="text"
                            value={customFieldInput}
                            onChange={(e) => setCustomFieldInput(e.target.value)}
                            placeholder="Custom field name..."
                            className="text-xs px-2 py-0.5 outline-none w-32"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddFieldToService(dayIdx, sIdx, customFieldInput);
                                setCustomFieldInput('');
                                setCustomFieldPromptDayIdx(null);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleAddFieldToService(dayIdx, sIdx, customFieldInput);
                              setCustomFieldInput('');
                              setCustomFieldPromptDayIdx(null);
                            }}
                            className="px-2 py-0.5 bg-church-burgundy text-white text-xs font-bold rounded"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomFieldPromptDayIdx(null)}
                            className="text-stone-400 hover:text-stone-700 px-1 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomFieldPromptDayIdx(dayIdx);
                            setCustomFieldPromptSrvIdx(sIdx);
                            setCustomFieldInput('');
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-600 rounded-lg text-xs font-semibold border border-dashed border-stone-300"
                        >
                          + Custom Field
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Service Note (Optional) */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                      Hriattir / Service Note (Optional):
                    </label>
                    <input
                      type="text"
                      value={service.notes || ''}
                      onChange={(e) => {
                        const newDays = [...programme.days];
                        newDays[dayIdx].services[sIdx].notes = e.target.value;
                        setProgramme(prev => ({ ...prev, days: newDays }));
                      }}
                      placeholder="Special note, meeting after service, etc."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-1.5 text-stone-800 text-xs focus:outline-none focus:border-church-burgundy"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => handleAddService(dayIdx)}
                className="w-full py-3 border-2 border-dashed border-stone-300 hover:border-church-burgundy hover:text-church-burgundy hover:bg-white text-stone-500 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> Service Thar Belhna ({dayGroup.day})
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Save Bar */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-serif font-bold text-stone-900 text-base">Inkhawm Programme Vawnthatna</p>
          <p className="text-stone-500 text-xs">He programme hi save laiah Archive-ah pawh a vawng tel nghal ang.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSaveProgramme(true)}
            disabled={isSaving}
            className="px-8 py-3.5 bg-church-burgundy hover:bg-opacity-90 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Vawng tha rawh
          </button>
        </div>
      </div>
    </div>
  );
};
