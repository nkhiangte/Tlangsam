import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { getDailyInspiration } from '../services/geminiService';

const DailyInspiration = () => {
  const [inspiration, setInspiration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInspiration = async () => {
      const data = await getDailyInspiration();
      setInspiration(data);
      setLoading(false);
    };
    fetchInspiration();
  }, []);

  return (
    <section className="py-16 bg-stone-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-stone-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="h-24 w-24 text-church-burgundy" />
          </div>
          
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px w-8 bg-church-gold"></div>
            <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Vawiin Changvawn</span>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-stone-100 rounded w-3/4"></div>
              <div className="h-4 bg-stone-100 rounded w-1/4"></div>
              <div className="h-4 bg-stone-100 rounded w-full"></div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3 className="text-2xl md:text-3xl font-serif text-stone-800 mb-4 italic">
                "{inspiration?.verse}"
              </h3>
              <p className="text-church-burgundy font-medium mb-6">— {inspiration?.reference}</p>
              <p className="text-stone-600 leading-relaxed border-l-2 border-church-gold pl-4">
                {inspiration?.reflection}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DailyInspiration;
