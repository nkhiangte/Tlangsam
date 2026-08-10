import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  ChevronDown, 
  Printer, 
  Copy, 
  Check, 
  Archive, 
  BookOpen, 
  Users, 
  Sparkles,
  Filter,
  Loader2
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { ArchivedProgramme } from '../../types/programme';

const InkhawmProgrammeArchive: React.FC = () => {
  const [archives, setArchives] = useState<ArchivedProgramme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [expandedWeekId, setExpandedWeekId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'programme_archives'), orderBy('weekStartDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ArchivedProgramme[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<ArchivedProgramme, 'id'>)
      }));
      setArchives(list);
      if (list.length > 0 && !expandedWeekId) {
        setExpandedWeekId(list[0].id);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'programme_archives');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Extract unique years from archives
  const availableYears = Array.from(new Set(
    archives.map(a => {
      if (a.weekStartDate) return a.weekStartDate.split('-')[0];
      return new Date().getFullYear().toString();
    })
  )).sort().reverse();

  // Filter archives based on search and year
  const filteredArchives = archives.filter(item => {
    const matchesYear = selectedYear === 'all' || (item.weekStartDate && item.weekStartDate.startsWith(selectedYear));
    
    if (!searchQuery.trim()) return matchesYear;

    const queryLower = searchQuery.toLowerCase();
    const titleMatch = (item.weekTitle || '').toLowerCase().includes(queryLower);
    const themeMatch = (item.theme || '').toLowerCase().includes(queryLower);
    
    // Check inside days and services
    const daysMatch = (item.days || []).some(day => {
      const dayMatch = (day.day || '').toLowerCase().includes(queryLower) || (day.date || '').toLowerCase().includes(queryLower);
      const servicesMatch = (day.services || []).some(srv => {
        const srvTitleMatch = (srv.title || '').toLowerCase().includes(queryLower);
        const fieldsMatch = Object.entries(srv.fields || {}).some(([k, v]) => 
          k.toLowerCase().includes(queryLower) || String(v).toLowerCase().includes(queryLower)
        );
        return srvTitleMatch || fieldsMatch;
      });
      return dayMatch || servicesMatch;
    });

    return matchesYear && (titleMatch || themeMatch || daysMatch);
  });

  const handleCopyText = (prog: ArchivedProgramme) => {
    let text = `==============================\n`;
    text += `TLANGSAM PRESBYTERIAN KOHHRAN\n`;
    text += `INKHAWM PROGRAMME (${prog.weekTitle || prog.weekStartDate})\n`;
    if (prog.theme) text += `Thupui: ${prog.theme}\n`;
    text += `==============================\n\n`;

    if (prog.tunKarRawngbawltute) {
      const tr = prog.tunKarRawngbawltute;
      if (tr.khuangpute?.trim() || tr.hlaHriltu?.trim() || tr.thawhlawmKhawntute?.trim() || tr.lightAndSoundDuty?.trim()) {
        text += `TUN KAR RAWNGBAWLTUTE:\n`;
        if (tr.khuangpute?.trim()) text += `Khuangpute: ${tr.khuangpute}\n`;
        if (tr.hlaHriltu?.trim()) text += `Hla Hriltu: ${tr.hlaHriltu}\n`;
        if (tr.thawhlawmKhawntute?.trim()) text += `Thawhlawm Khawntute: ${tr.thawhlawmKhawntute}\n`;
        if (tr.lightAndSoundDuty?.trim()) text += `Light & Sound Duty: ${tr.lightAndSoundDuty}\n`;
        text += `==============================\n\n`;
      }
    }

    (prog.days || []).forEach(day => {
      text += `📅 ${day.day} (${day.date})\n`;
      text += `------------------------------\n`;
      (day.services || []).forEach(srv => {
        text += `• ${srv.title} [${srv.time}]\n`;
        Object.entries(srv.fields || {}).forEach(([k, v]) => {
          if (v) text += `   ${k}: ${v}\n`;
        });
        if (srv.notes) text += `   Note: ${srv.notes}\n`;
        text += `\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedId(prog.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Page Header */}
      <div className="bg-stone-900 pt-36 pb-16 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-3">
            <Link to="/archive" className="text-stone-400 hover:text-white transition-colors text-xs uppercase tracking-widest flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Archive
            </Link>
            <span className="text-stone-600">/</span>
            <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Inkhawm Programme</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2">Inkhawm Programme Archive</h1>
              <p className="text-stone-400 max-w-2xl text-base">
                Kar tin Pathian biak inkhawm programme kal tawhte vawn thatna leh zawnchhuahna hmun.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/services"
                className="bg-church-gold text-stone-950 font-semibold px-5 py-2.5 rounded-xl hover:bg-yellow-400 transition-all text-sm flex items-center gap-2 shadow-md"
              >
                <Clock className="h-4 w-4" /> Vawiin Kar En Rawh
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search & Filter Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-stone-200 mb-8 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
              <input 
                type="text" 
                placeholder="Zawng rawh (Thusawitu, Hruaitu, Ni, Thupui, Service hming...)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-church-burgundy focus:ring-1 focus:ring-church-burgundy transition-all text-sm"
              />
            </div>
            <div className="md:col-span-4 flex gap-3">
              <div className="relative w-full">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm font-medium focus:outline-none focus:border-church-burgundy cursor-pointer"
                >
                  <option value="all">Kum zawng zawng</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>Kum {yr}</option>
                  ))}
                </select>
              </div>
              {filteredArchives.length > 0 && (
                <button
                  onClick={handlePrint}
                  title="Print programme"
                  className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-all flex items-center justify-center shrink-0"
                >
                  <Printer className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {(searchQuery || selectedYear !== 'all') && (
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Hmuh zat: <strong>{filteredArchives.length}</strong> programme</span>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedYear('all'); }}
                className="text-church-burgundy hover:underline font-semibold"
              >
                Filter thianfai rawh
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-stone-500">
            <Loader2 className="h-10 w-10 text-church-burgundy animate-spin mb-4" />
            <p className="font-serif text-lg">Archive hlui-te lakkhawm mek a ni...</p>
          </div>
        ) : filteredArchives.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-stone-400">
              <Archive className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">Programme Archive hmuh a ni lo</h3>
            <p className="text-stone-500 text-sm mb-6">
              {searchQuery ? `"${searchQuery}" mil zawng hmuh a ni lo.` : "Archive-ah hian programme vawn that a la awm lo."}
            </p>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 bg-church-burgundy text-white font-medium px-6 py-2.5 rounded-xl hover:bg-opacity-90 transition-all text-sm"
            >
              Vawiin Inkhawm Hun En Rawh <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredArchives.map((prog) => {
              const isExpanded = expandedWeekId === prog.id;
              return (
                <div 
                  key={prog.id}
                  className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden transition-all duration-200 hover:border-stone-300"
                >
                  {/* Archive Item Header Accordion */}
                  <div 
                    onClick={() => setExpandedWeekId(isExpanded ? null : prog.id)}
                    className="p-6 sm:p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none bg-stone-50/50 hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-church-burgundy/10 text-church-burgundy flex items-center justify-center shrink-0">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                            {prog.weekTitle || `Kar: ${prog.weekStartDate}`}
                          </h2>
                          {prog.weekStartDate && (
                            <span className="bg-stone-200 text-stone-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                              {prog.weekStartDate}
                            </span>
                          )}
                        </div>
                        {prog.theme && (
                          <p className="text-stone-600 text-sm mt-1 flex items-center gap-1.5 font-medium italic">
                            <Sparkles className="h-3.5 w-3.5 text-church-gold" />
                            Thupui: "{prog.theme}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(prog);
                        }}
                        className="px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                        title="Copy text format"
                      >
                        {copiedId === prog.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-stone-500" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600">
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Programme Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-stone-100 p-6 sm:p-8 space-y-8 bg-white"
                      >
                        {prog.verse && (
                          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-stone-800 text-sm">
                            <span className="font-bold text-amber-900 block mb-1">Weekly Bible Reading / Chang:</span>
                            {prog.verse}
                          </div>
                        )}

                        {prog.tunKarRawngbawltute && (
                          (prog.tunKarRawngbawltute.khuangpute?.trim() ||
                           prog.tunKarRawngbawltute.hlaHriltu?.trim() ||
                           prog.tunKarRawngbawltute.thawhlawmKhawntute?.trim() ||
                           prog.tunKarRawngbawltute.lightAndSoundDuty?.trim())
                        ) && (
                          <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
                            <h4 className="text-base font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
                              <Users className="h-5 w-5 text-church-burgundy" /> Tun Kar Rawngbawltute
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {prog.tunKarRawngbawltute.khuangpute?.trim() && (
                                <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Khuangpute</span>
                                  <span className="text-stone-900 font-semibold text-sm">{prog.tunKarRawngbawltute.khuangpute}</span>
                                </div>
                              )}
                              {prog.tunKarRawngbawltute.hlaHriltu?.trim() && (
                                <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Hla Hriltu</span>
                                  <span className="text-stone-900 font-semibold text-sm">{prog.tunKarRawngbawltute.hlaHriltu}</span>
                                </div>
                              )}
                              {prog.tunKarRawngbawltute.thawhlawmKhawntute?.trim() && (
                                <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Thawhlawm Khawntute</span>
                                  <span className="text-stone-900 font-semibold text-sm">{prog.tunKarRawngbawltute.thawhlawmKhawntute}</span>
                                </div>
                              )}
                              {prog.tunKarRawngbawltute.lightAndSoundDuty?.trim() && (
                                <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Light & Sound Duty</span>
                                  <span className="text-stone-900 font-semibold text-sm">{prog.tunKarRawngbawltute.lightAndSoundDuty}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid gap-6">
                          {(prog.days || []).map((dayGroup, dayIdx) => (
                            <div 
                              key={dayIdx} 
                              className="border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/40"
                            >
                              {/* Day Banner */}
                              <div className="bg-stone-900 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-serif text-lg font-bold text-church-gold tracking-wide">
                                    {dayGroup.day}
                                  </span>
                                  {dayGroup.date && (
                                    <span className="text-stone-300 text-xs bg-stone-800 px-2.5 py-0.5 rounded-md">
                                      {dayGroup.date}
                                    </span>
                                  )}
                                </div>
                                {dayGroup.note && (
                                  <span className="text-xs text-stone-400 italic">{dayGroup.note}</span>
                                )}
                              </div>

                              {/* Services for this Day */}
                              <div className="p-6 divide-y divide-stone-200 space-y-6">
                                {(dayGroup.services || []).map((srv, sIdx) => (
                                  <div key={sIdx} className="first:pt-0 pt-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                      <h4 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-church-burgundy" />
                                        {srv.title}
                                      </h4>
                                      {srv.time && (
                                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-church-burgundy bg-church-burgundy/10 px-3 py-1 rounded-full w-fit">
                                          <Clock className="h-3.5 w-3.5" />
                                          <span>{srv.time}</span>
                                        </div>
                                      )}
                                    </div>

                                    {srv.fields && Object.keys(srv.fields).filter(k => srv.fields![k] && srv.fields![k].trim() !== '').length > 0 && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {Object.entries(srv.fields)
                                          .filter(([_, val]) => val && val.trim() !== '')
                                          .map(([label, val]) => (
                                          <div 
                                            key={label} 
                                            className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs"
                                          >
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                                              {label}
                                            </span>
                                            <span className="text-sm font-semibold text-stone-800">
                                              {val}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {srv.notes && (
                                      <p className="mt-3 text-xs text-stone-500 italic bg-white p-2.5 rounded-lg border border-stone-100">
                                        <strong>Hriattir:</strong> {srv.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Archive Footer Info */}
                        <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-400 gap-2">
                          <span>Archived on: {new Date(prog.archivedAt || Date.now()).toLocaleDateString()}</span>
                          {prog.archivedBy && <span>By: {prog.archivedBy}</span>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InkhawmProgrammeArchive;
