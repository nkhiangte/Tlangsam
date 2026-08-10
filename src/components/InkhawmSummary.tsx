import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, Users, ChevronRight, Loader2, Calendar, Archive } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const InkhawmSummary = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [weekTitle, setWeekTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const docRef = doc(db, 'settings', 'services');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.weekTitle) {
            setWeekTitle(data.weekTitle);
          }
          if (data.days) {
            setSchedule(data.days.slice(0, 2)); // Show primary upcoming services (e.g. Sunday & Monday)
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/services');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <section className="py-12 bg-white border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-church-burgundy font-bold uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {weekTitle || 'Vawiin Kar Programme'}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
              <Clock className="h-6 w-6 md:h-7 md:w-7 text-church-burgundy" />
              Inkhawm Hun & Programme
            </h2>
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link 
              to="/archive/inkhawm-programme" 
              className="text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1"
            >
              <Archive className="h-4 w-4" />
              Archive
            </Link>
            <Link 
              to="/services" 
              className="text-church-burgundy hover:text-church-burgundy/80 transition-colors flex items-center gap-1 bg-church-burgundy/10 px-3.5 py-1.5 rounded-lg"
            >
              Kimchang En Rawh <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-church-burgundy animate-spin" />
          </div>
        ) : schedule.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {schedule.map((dayData, index) => (
              <div key={index} className="bg-stone-50 rounded-2xl p-6 border border-stone-200">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
                    <CalendarIconForDay day={dayData.day} />
                    {dayData.day}
                  </h3>
                  {dayData.date && (
                    <span className="text-xs font-semibold bg-white border border-stone-200 text-stone-700 px-2.5 py-1 rounded-md">
                      {dayData.date}
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  {dayData.services?.map((service: any, sIdx: number) => (
                    <div key={sIdx} className="bg-white rounded-xl p-4 shadow-2xs border border-stone-200">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-church-burgundy text-base">{service.title}</h4>
                        <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md">
                          {service.time}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {Object.entries(service.fields || {}).map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-stone-400 text-[11px] font-bold uppercase tracking-wider">{key}</span>
                            <span className="text-stone-800 font-medium">{(value as string) || '-'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-8 text-center text-stone-500">
            Inkhawm hun tarlan a ni rih lo.
          </div>
        )}
      </div>
    </section>
  );
};

const CalendarIconForDay = ({ day }: { day: string }) => {
  if (day.toLowerCase().includes('sunday') || day.toLowerCase().includes('pathian')) {
    return <BookOpen className="h-5 w-5 text-church-gold" />;
  }
  return <Users className="h-5 w-5 text-church-burgundy" />;
};

export default InkhawmSummary;
