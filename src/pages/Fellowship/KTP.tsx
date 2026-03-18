import React from 'react';
import { motion } from 'motion/react';
import { Users, Music, Calendar, Zap } from 'lucide-react';

const KTP = () => {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4">Kristian Thalai Pawl (KTP)</h1>
          <p className="text-xl text-stone-600 max-w-3xl mx-auto">
            Tlangsam Presbyterian Kohhran thalaite inpawlhona leh thlarau lama hmasawnna tura din.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <img 
              src="https://picsum.photos/seed/youth-fellowship/800/600" 
              alt="KTP" 
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
              KTP hi kan kohhran thalaite tana thlarau lama hmasawnna leh rawngbawlna hmun pawimawh tak a ni. Thalaite rinna kawnga chawm len leh, rawngbawlna hrang hrangah an theihna hman thiamtir kan tum a ni.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl shadow-sm border border-stone-100 flex items-start gap-3">
                <Music className="w-5 h-5 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-medium text-stone-900">Inkhawm leh Zai</h3>
                  <p className="text-sm text-stone-500">Praise & Worship leh zai hruaina.</p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-stone-100 flex items-start gap-3">
                <Zap className="w-5 h-5 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-medium text-stone-900">Chanchin Tha Puanchhuah</h3>
                  <p className="text-sm text-stone-500">Thalaite hnena Chanchin Tha hril.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            <Calendar className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-serif mb-2">Thawhtanni Inkhawm</h3>
            <p className="text-stone-600">Thawhtanni zan dar 7:00-ah Biak In Hall-ah.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            <Users className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-serif mb-2">Group Inpawlhona</h3>
            <p className="text-stone-600">Thla tin group hrang hrangah inpawlhona neih thin a ni.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            <Music className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-serif mb-2">Zaipawl Practice</h3>
            <p className="text-stone-600">Inkhawm pawimawh leh thil thleng hrang hrang atana inbuatsaihna.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KTP;
