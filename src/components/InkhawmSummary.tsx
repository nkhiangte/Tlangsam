import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, Users, ChevronRight, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const InkhawmSummary = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const docRef = doc(db, 'settings', 'services');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().days) {
          setSchedule(docSnap.data().days.slice(0, 2)); // Just show Sunday and maybe Monday
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
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-church-burgundy flex items-center gap-3">
            <Clock className="h-6 w-6 md:h-8 md:w-8" />
            Inkhawm Hun
          </h2>
          <Link to="/services" className="text-sm font-semibold text-stone-600 hover:text-church-burgundy transition-colors flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-church-burgundy animate-spin" />
          </div>
        ) : schedule.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {schedule.map((dayData, index) => (
              <div key={index} className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
                <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 border-b border-stone-200 pb-3">
                  <CalendarIconForDay day={dayData.day} />
                  {dayData.day}
                </h3>
                <div className="space-y-6">
                  {dayData.services?.map((service: any, sIdx: number) => (
                    <div key={sIdx} className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-church-burgundy">{service.title}</h4>
                        <span className="text-sm font-semibold text-stone-500 bg-stone-100 px-2 py-1 rounded-md">{service.time}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {Object.entries(service.fields || {}).map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-stone-400 text-xs font-medium uppercase tracking-wider">{key}</span>
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
          <div className="bg-stone-50 rounded-2xl border border-stone-100 p-8 text-center text-stone-500">
            Inkhawm hun tarlan a ni rih lo.
          </div>
        )}
      </div>
    </section>
  );
};

const CalendarIconForDay = ({ day }: { day: string }) => {
  if (day.toLowerCase().includes('sunday') || day.toLowerCase().includes('pathianni')) {
    return <BookOpen className="h-5 w-5 text-church-gold" />;
  }
  return <Users className="h-5 w-5 text-church-burgundy" />;
};

export default InkhawmSummary;
