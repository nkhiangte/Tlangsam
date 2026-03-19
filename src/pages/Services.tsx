import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, BookOpen, Users } from 'lucide-react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';

const Services = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'services'), (doc) => {
      if (doc.exists()) {
        setSchedule(doc.data().days || []);
      } else {
        setSchedule([
          {
            day: "Sunday",
            services: [
              { title: "Chawhma (Forenoon)", time: "10:30 AM", fields: { "Tantu": "", "Zirlai": "" } },
              { title: "Chawhnu (Afternoon)", time: "1:30 PM", fields: { "Tantu": "", "Thusawitu": "" } },
              { title: "Zan (Night)", time: "7:00 PM", fields: { "Thusawitu": "" } }
            ]
          },
          {
            day: "Monday",
            services: [
              { title: "KTP Inkhawm", time: "7:00 PM", fields: { "Hruaitu": "", "Tantu": "", "Thusawitu": "" } }
            ]
          },
          {
            day: "Tuesday",
            services: [
              { title: "Kohhran Hmeichhe Inkhawm", time: "7:00 PM", fields: { "Hruaitu": "", "Tantu": "", "Thusawitu": "" } }
            ]
          },
          {
            day: "Wednesday",
            services: [
              { title: "Nilai Zan Inkhawm", time: "7:00 PM", fields: { "Hruaitu": "", "Tantu": "", "Thupui Hawngtu": "" } }
            ]
          },
          {
            day: "Saturday",
            services: [
              { title: "Inrinni zan inkhawm", time: "7:00 PM", fields: { "Tantu": "", "Thusawitu": "" } }
            ]
          }
        ]);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return (
    <div className="pt-32 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-church-burgundy"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page Header */}
      <div className="bg-church-gold pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-8 bg-church-burgundy"></div>
            <span className="text-church-burgundy font-medium uppercase tracking-widest text-xs">Inkhawm Hun-te</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">Service Times</h1>
        </div>
      </div>

      <section className="py-24 bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif mb-4">Inkhawm Hun-te</h2>
            <p className="text-stone-500 max-w-2xl mx-auto">Pathian chibai buk tura kan inkhawmna hun hrang hrangte.</p>
          </div>

          <div className="space-y-12">
            {schedule.map((dayGroup, dayIdx) => (
              <motion.div 
                key={dayIdx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-[2.5rem] shadow-xl border border-stone-100 overflow-hidden"
              >
                <div className="bg-stone-900 px-8 py-4">
                  <h3 className="text-xl font-serif text-church-gold uppercase tracking-widest">{dayGroup.day}</h3>
                </div>
                <div className="p-8 divide-y divide-stone-100">
                  {dayGroup.services.map((service: any, sIdx: number) => (
                    <div key={sIdx} className="py-6 first:pt-0 last:pb-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <h4 className="text-2xl font-serif text-stone-900">{service.title}</h4>
                          <div className="flex items-center gap-2 text-church-burgundy font-medium mt-1">
                            <Clock className="h-4 w-4" />
                            <span>{service.time}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        {Object.entries(service.fields || {}).map(([label, value]: [string, any]) => (
                          <div key={label} className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-1">{label}</span>
                            <span className="text-stone-800 font-medium">{value || '---'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
