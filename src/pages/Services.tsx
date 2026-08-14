import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  BookOpen, 
  Users, 
  Calendar, 
  Archive, 
  Copy, 
  Check, 
  Printer, 
  Edit3, 
  Sparkles, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { WeeklyProgramme } from '../types/programme';
import { 
  generateDefaultProgramme, 
  formatDateDisplay, 
  checkAndAutoArchivePreviousWeek 
} from '../utils/programmeDateUtils';
import { InkhawmProgrammeManager } from '../components/Admin/InkhawmProgrammeManager';

const Services = () => {
  const [programme, setProgramme] = useState<WeeklyProgramme | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'services'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const loadedProg: WeeklyProgramme = {
          weekId: data.weekId,
          weekTitle: data.weekTitle || '',
          weekStartDate: data.weekStartDate || '',
          weekEndDate: data.weekEndDate || '',
          theme: data.theme || '',
          verse: data.verse || '',
          days: data.days || [],
          updatedAt: data.updatedAt
        };
        setProgramme(loadedProg);

        // Check if this programme is from a previous week and auto-archive it if needed
        checkAndAutoArchivePreviousWeek(data);
      } else {
        // Use auto-calculated default template for current week
        const defaultProg = generateDefaultProgramme();
        setProgramme(defaultProg);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/services');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleCopyBulletin = () => {
    if (!programme) return;
    let text = `==============================\n`;
    text += `TLANGSAM PRESBYTERIAN KOHHRAN\n`;
    text += `INKHAWM PROGRAMME\n`;
    if (programme.weekTitle) text += `(${programme.weekTitle})\n`;
    if (programme.theme) text += `Thupui: "${programme.theme}"\n`;
    if (programme.verse) text += `Bible Chang: ${programme.verse}\n`;
    text += `==============================\n\n`;

    if (programme.tunKarRawngbawltute) {
      const tr = programme.tunKarRawngbawltute;
      if (tr.khuangpute?.trim() || tr.hlaHriltu?.trim() || tr.thawhlawmKhawntute?.trim() || tr.lightAndSoundDuty?.trim()) {
        text += `TUN KAR RAWNGBAWLTUTE:\n`;
        if (tr.khuangpute?.trim()) text += `Khuangpute: ${tr.khuangpute}\n`;
        if (tr.hlaHriltu?.trim()) text += `Hla Hriltu: ${tr.hlaHriltu}\n`;
        if (tr.thawhlawmKhawntute?.trim()) text += `Thawhlawm Khawntute: ${tr.thawhlawmKhawntute}\n`;
        if (tr.lightAndSoundDuty?.trim()) text += `Light & Sound Duty: ${tr.lightAndSoundDuty}\n`;
        text += `==============================\n\n`;
      }
    }

    (programme.days || []).forEach(day => {
      text += `📅 ${day.day}${day.date ? ` (${day.date})` : ''}\n`;
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-40 flex flex-col items-center justify-center bg-stone-50 text-stone-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-church-burgundy mb-4"></div>
        <p className="font-serif">Inkhawm programme lak mek a ni...</p>
      </div>
    );
  }

  const days = programme?.days || [];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Page Header */}
      <div className="bg-stone-900 pt-36 pb-16 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-8 bg-church-gold"></div>
            <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Inkhawm Hun-te & Programme</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2">Service Schedule</h1>
              <p className="text-stone-300 max-w-2xl text-sm sm:text-base">
                Tlangsam Presbyterian Kohhran Pathian biak inkhawm hun leh hna chanvo hrang hrangte.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-stone-800 hover:bg-stone-700 text-white font-medium px-4 py-2.5 rounded-xl border border-stone-700 transition-all text-xs sm:text-sm flex items-center gap-2 shadow-sm"
                >
                  {isEditing ? 'Cancel Edit' : <><Edit3 className="h-4 w-4 text-church-gold" /> Admin Edit</>}
                </button>
              )}

              <Link
                to="/archive/inkhawm-programme"
                className="bg-stone-800 hover:bg-stone-700 text-church-gold font-medium px-4 py-2.5 rounded-xl border border-stone-700 transition-all text-xs sm:text-sm flex items-center gap-2 shadow-sm"
              >
                <Archive className="h-4 w-4" /> Archive En Rawh
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isEditing ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 mb-8">
            <InkhawmProgrammeManager />
          </div>
        ) : (
          <>
            {/* Weekly Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-100">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-church-burgundy/10 text-church-burgundy rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>Kar Thupui & Hun Chhung</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                {programme?.weekTitle || 'Vawiin Kar Programme'}
              </h2>
            </div>

            <div className="flex items-center gap-2.5 print:hidden">
              <button
                type="button"
                onClick={handleCopyBulletin}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border border-stone-200"
                title="Copy text for WhatsApp / Notice"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-stone-600" />
                    <span>Copy Programme</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border border-stone-200"
                title="Print this week's schedule"
              >
                <Printer className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Theme / Bible Reading banner */}
          {(programme?.theme || programme?.verse) && (
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                {programme.theme && (
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="text-stone-900 font-semibold text-sm sm:text-base">
                      <span className="text-amber-900 font-bold">Thupui:</span> "{programme.theme}"
                    </p>
                  </div>
                )}
                {programme.verse && (
                  <p className="text-xs sm:text-sm text-stone-700 pl-6">
                    <span className="font-medium text-stone-900">Chang:</span> {programme.verse}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tun Kar Rawngbawltute Section */}
        {programme?.tunKarRawngbawltute && (
          (programme.tunKarRawngbawltute.khuangpute?.trim() ||
           programme.tunKarRawngbawltute.hlaHriltu?.trim() ||
           programme.tunKarRawngbawltute.thawhlawmKhawntute?.trim() ||
           programme.tunKarRawngbawltute.lightAndSoundDuty?.trim())
        ) && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 mb-8">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-6 flex items-center gap-2">
              <Users className="h-6 w-6 text-church-burgundy" /> Tun Kar Rawngbawltute
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {programme.tunKarRawngbawltute.khuangpute?.trim() && (
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Khuangpute</span>
                  <span className="text-stone-900 font-semibold text-sm">{programme.tunKarRawngbawltute.khuangpute}</span>
                </div>
              )}
              {programme.tunKarRawngbawltute.hlaHriltu?.trim() && (
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Hla Hriltu</span>
                  <span className="text-stone-900 font-semibold text-sm">{programme.tunKarRawngbawltute.hlaHriltu}</span>
                </div>
              )}
              {programme.tunKarRawngbawltute.thawhlawmKhawntute?.trim() && (
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Thawhlawm Khawntute</span>
                  <span className="text-stone-900 font-semibold text-sm">{programme.tunKarRawngbawltute.thawhlawmKhawntute}</span>
                </div>
              )}
              {programme.tunKarRawngbawltute.lightAndSoundDuty?.trim() && (
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Light & Sound Duty</span>
                  <span className="text-stone-900 font-semibold text-sm">{programme.tunKarRawngbawltute.lightAndSoundDuty}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Days & Services List */}
        <div className="space-y-8">
          {days.map((dayGroup, dayIdx) => (
            <motion.div 
              key={dayIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIdx * 0.05 }}
              className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden"
            >
              {/* Day Header */}
              <div className="bg-stone-900 px-6 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl sm:text-2xl font-serif text-church-gold font-bold">
                    {dayGroup.day}
                  </h3>
                  {dayGroup.date && (
                    <span className="bg-stone-800 border border-stone-700 text-stone-200 text-xs font-semibold px-3 py-1 rounded-full">
                      {dayGroup.date}
                    </span>
                  )}
                </div>
                {dayGroup.note && (
                  <span className="text-xs text-stone-400 italic bg-stone-800/80 px-2.5 py-1 rounded-md">
                    {dayGroup.note}
                  </span>
                )}
              </div>

              {/* Day Services */}
              <div className="p-6 sm:p-8 divide-y divide-stone-100">
                {dayGroup.services
                  .filter((service) => service.title !== "Inkhawm")
                  .map((service, sIdx) => (
                  <div key={sIdx} className="py-6 first:pt-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-church-burgundy/10 text-church-burgundy flex items-center justify-center font-bold text-xs">
                          {sIdx + 1}
                        </div>
                        <h4 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                          {service.title}
                        </h4>
                      </div>
                      {service.time && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-church-burgundy bg-church-burgundy/10 px-3.5 py-1.5 rounded-full w-fit">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{service.time}</span>
                        </div>
                      )}
                    </div>
                    
                    {service.fields && Object.keys(service.fields).filter(k => service.fields![k] && service.fields![k].trim() !== '').length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {Object.entries(service.fields)
                          .filter(([_, value]) => value && String(value).trim() !== '')
                          .map(([label, value]) => (
                          <div 
                            key={label} 
                            className="bg-stone-50 hover:bg-stone-100/80 transition-colors p-4 rounded-2xl border border-stone-200/80"
                          >
                            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                              {label}
                            </span>
                            <span className="text-stone-900 font-semibold text-sm">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {service.notes && (
                      <div className="mt-3.5 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
                        <strong className="text-stone-800">Hriattir:</strong> {service.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Archive Navigation Bar */}
        <div className="mt-12 bg-white rounded-3xl p-8 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left print:hidden">
          <div>
            <h3 className="text-xl font-serif font-bold text-stone-900 mb-1">Programme hlui zawn i duh em?</h3>
            <p className="text-stone-500 text-sm">Kar hmasa leh kum hmasa lama inkhawm programme zawng zawng archive-ah a awm vek e.</p>
          </div>
          <Link
            to="/archive/inkhawm-programme"
            className="inline-flex items-center gap-2 bg-church-burgundy text-white font-medium px-6 py-3 rounded-xl hover:bg-opacity-90 transition-all text-sm shrink-0 shadow-sm"
          >
            Archive En Rawh <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default Services;
