import React from 'react';
import { motion } from 'motion/react';
import { Users, Heart, Calendar, BookOpen } from 'lucide-react';

const KohhranHmeichhia = () => {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4">Kohhran Hmeichhia</h1>
          <p className="text-xl text-stone-600 max-w-3xl mx-auto">
            Empowering women in faith, service, and fellowship within Tlangsam Presbyterian Kohhran.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <img 
              src="https://picsum.photos/seed/women-fellowship/800/600" 
              alt="Kohhran Hmeichhia" 
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
            <h2 className="text-3xl font-serif text-stone-900">Our Mission</h2>
            <p className="text-stone-600 leading-relaxed">
              The Kohhran Hmeichhia (Women's Fellowship) is a vital part of our church community. We focus on spiritual growth, supporting church activities, and reaching out to those in need through various ministries and prayer groups.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl shadow-sm border border-stone-100 flex items-start gap-3">
                <Heart className="w-5 h-5 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-medium text-stone-900">Prayer Ministry</h3>
                  <p className="text-sm text-stone-500">Weekly intercessory prayer meetings.</p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-stone-100 flex items-start gap-3">
                <Users className="w-5 h-5 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-medium text-stone-900">Fellowship</h3>
                  <p className="text-sm text-stone-500">Building strong bonds of sisterhood.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            <Calendar className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-serif mb-2">Weekly Meeting</h3>
            <p className="text-stone-600">Every Tuesday at 6:30 PM in the Church Hall.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            <BookOpen className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-serif mb-2">Bible Study</h3>
            <p className="text-stone-600">Monthly deep-dive into Scripture and its application.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            <Heart className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-xl font-serif mb-2">Outreach</h3>
            <p className="text-stone-600">Visiting the sick and supporting local charities.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KohhranHmeichhia;
