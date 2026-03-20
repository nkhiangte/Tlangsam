import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { getDailyInspiration } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';

const DailyInspiration = () => {
  const [inspiration, setInspiration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isAdmin } = useAuth();

  const fetchInspiration = async () => {
    setLoading(true);
    const data = await getDailyInspiration();
    setInspiration(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInspiration();
  }, []);

  const handleRefresh = async () => {
    if (!isAdmin) return;
    setRefreshing(true);
    try {
      // Clear the cache for today
      await deleteDoc(doc(db, 'settings', 'daily_inspiration_mizo'));
      // Fetch new
      await fetchInspiration();
    } catch (error) {
      console.error("Error refreshing inspiration:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="py-16 bg-stone-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-stone-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="h-24 w-24 text-church-burgundy" />
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-church-gold"></div>
              <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Vawiin Changvawn</span>
            </div>
            {isAdmin && (
              <button 
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="p-2 text-stone-400 hover:text-church-burgundy transition-colors disabled:opacity-50"
                title="Refresh Verse"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
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
