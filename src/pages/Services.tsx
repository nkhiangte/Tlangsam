import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, BookOpen, Users } from 'lucide-react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'services'), (doc) => {
      if (doc.exists()) {
        setServices(doc.data().list || []);
      } else {
        setServices([
          {
            title: "Pathian Ni Inkhawm",
            time: "10:30 AM",
            description: "Hlabu leh Pathian thu hmanga chibai bukna inkhawm.",
            icon: <Clock className="h-6 w-6" />
          },
          {
            title: "Nilai Zan Thupui Zirna",
            time: "Nilaini 7:00 PM",
            description: "Pathian thu zirhona leh sawihona hun hlu.",
            icon: <BookOpen className="h-6 w-6" />
          },
          {
            title: "Thalai Inkhawm",
            time: "Zirtawpni 6:30 PM",
            description: "Thalaite tana rinna lama thanna leh inpawlhona hun.",
            icon: <Users className="h-6 w-6" />
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
    <div className="pt-24 min-h-screen">
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif mb-4">Inkhawm Hun-te</h2>
            <p className="text-stone-500 max-w-2xl mx-auto">Pathian chibai buk tura kan inkhawmna hun hrang hrangte.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="p-8 rounded-3xl border border-stone-100 bg-stone-50 hover:bg-white hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6">
                  {idx === 0 ? <Clock className="h-6 w-6" /> : idx === 1 ? <BookOpen className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                </div>
                <h3 className="text-2xl font-serif mb-2">{service.title}</h3>
                <p className="text-church-gold font-medium mb-4">{service.time}</p>
                <p className="text-stone-600 leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
