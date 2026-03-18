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
            The Youth Fellowship of Tlangsam Presbyterian Kohhran, dedicated to spiritual growth and service.
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
            <h2 className="text-3xl font-serif text-stone-900">Our Vision</h2>
            <p className="text-stone-600 leading-relaxed">
              KTP is the heartbeat of our church's youth. We aim to nurture young believers in their faith, equip them for service, and provide a vibrant community for fellowship and growth.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl shadow-sm border border-stone-100 flex items-start gap-3">
                <Music className="w-5 h-5 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-medium text-stone-900">Worship & Music</h3>
                  <p className="text-sm text-stone-500">Leading praise and worship sessions.</p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-stone-100 flex items-start gap-3">
                <Zap className="w-5 h-5 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-medium text-stone-900">Evangelism</h3>
                  <p className="text-sm text-stone-500">Sharing the Gospel with the youth.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            <Calendar className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-serif mb-2">Weekly Meeting</h3>
            <p className="text-stone-600">Every Monday at 7:00 PM in the Church Hall.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            <Users className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-serif mb-2">Fellowship Groups</h3>
            <p className="text-stone-600">Monthly small group gatherings for deeper connection.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            <Music className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-serif mb-2">Choir Practice</h3>
            <p className="text-stone-600">Weekly practice for special services and events.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KTP;
