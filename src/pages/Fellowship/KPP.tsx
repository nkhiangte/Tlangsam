import React from 'react';
import { motion } from 'motion/react';
import { Users, Shield, Calendar, BookOpen } from 'lucide-react';

const KPP = () => {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4">Kohhran Pa Pawl (KPP)</h1>
          <p className="text-xl text-stone-600 max-w-3xl mx-auto">
            Tlangsam Presbyterian Kohhran pa-te rinna leh hruaitu nihna kawnga thuam chakna.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <img 
              src="https://picsum.photos/seed/men-fellowship/800/600" 
              alt="KPP" 
              className="rounded-2xl shadow-xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-serif text-stone-900">Kan Thiltum</h2>
            <p className="text-stone-600 leading-relaxed">
              KPP hi kan kohhran pa-te tana thlarau lama hmasawnna leh inpawlhona hmun pawimawh tak a ni. Kristian hruaitu tha tak nih leh, kohhran hna hrang hrang thlawp leh inunauna tha zawk siam kan tum a ni.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl shadow-sm border border-stone-100 flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-medium text-stone-900">Hruaitu Nihna</h3>
                  <p className="text-sm text-stone-500">Kohhran hruaitu tha ni tura inbuatsaihna.</p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-stone-100 flex items-start gap-3">
                <Users className="w-5 h-5 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-medium text-stone-900">Inunauna</h3>
                  <p className="text-sm text-stone-500">Rinna kawnga inunauna tha zawk.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            <Calendar className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-serif mb-2">Thla tin Inkhawm</h3>
            <p className="text-stone-600">Thla tin Inrinni hmasa ber zan dar 6:00-ah.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            <BookOpen className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-serif mb-2">Bible Zirna</h3>
            <p className="text-stone-600">Kristian pa-te mawhphurhna leh hruaitu nihna zirhona.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            <Users className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-serif mb-2">Rawngbawlna</h3>
            <p className="text-stone-600">Biak In enkawl leh hmun hrang hranga rawngbawlna.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPP;
