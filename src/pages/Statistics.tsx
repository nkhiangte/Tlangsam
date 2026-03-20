import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, Save, X, Loader2, BarChart3, List, Layers } from 'lucide-react';

interface StatisticRecord {
  id: string;
  head: string;
  value: string;
  order: number;
  createdAt: any;
}

const Statistics = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<StatisticRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    head: '',
    value: '',
    order: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'statistics'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StatisticRecord[];
      setStats(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'statistics');
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'statistics'), {
        ...formData,
        order: Number(formData.order),
        createdAt: Timestamp.now()
      });
      setIsAdding(false);
      setFormData({ head: '', value: '', order: stats.length + 1 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'statistics');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateDoc(doc(db, 'statistics', id), {
        ...formData,
        order: Number(formData.order)
      });
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `statistics/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('I delete duh tak tak em?')) return;
    try {
      await deleteDoc(doc(db, 'statistics', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `statistics/${id}`);
    }
  };

  const startEdit = (stat: StatisticRecord) => {
    setEditingId(stat.id);
    setFormData({
      head: stat.head,
      value: stat.value,
      order: stat.order
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-12 w-12 text-church-burgundy animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-serif font-bold text-stone-900 mb-2">Statistics</h1>
            <p className="text-stone-600">Kohhran dinhmun tlangpui leh thil pawimawh hrang hrangte.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setIsAdding(true);
                setFormData({ ...formData, order: stats.length + 1 });
              }}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Add Statistic
            </button>
          )}
        </div>

        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100 mb-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-900">Add New Statistic</h2>
              <button onClick={() => setIsAdding(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Header / Label</label>
                <input
                  type="text"
                  placeholder="e.g., Member Zat"
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold"
                  value={formData.head}
                  onChange={e => setFormData({ ...formData, head: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Value</label>
                <input
                  type="text"
                  placeholder="e.g., 1,234"
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold"
                  value={formData.value}
                  onChange={e => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Order</label>
                <input
                  type="number"
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold"
                  value={formData.order}
                  onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                />
              </div>
              <div className="md:col-span-2 pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-church-burgundy text-white rounded-xl font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg"
                >
                  Save Statistic
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 flex flex-col items-center text-center relative group"
            >
              <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-church-burgundy" />
              </div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{stat.head}</span>
              <span className="text-3xl font-serif font-bold text-stone-900">{stat.value}</span>

              {isAdmin && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => startEdit(stat)}
                    className="p-2 bg-stone-100 text-stone-600 rounded-full hover:bg-stone-200"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(stat.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {stats.length === 0 && (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-stone-100 text-center flex flex-col items-center gap-4">
            <p className="text-stone-400 italic">Statistic engmah a la awm lo.</p>
            {isAdmin && (
              <button
                onClick={() => {
                  setIsAdding(true);
                  setFormData({ ...formData, order: stats.length + 1 });
                }}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg"
              >
                <Plus className="h-5 w-5" />
                Add First Statistic
              </button>
            )}
          </div>
        )}

        {editingId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-stone-900">Edit Statistic</h2>
                <button onClick={() => setEditingId(null)} className="text-stone-400 hover:text-stone-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Header / Label</label>
                  <input
                    type="text"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold"
                    value={formData.head}
                    onChange={e => setFormData({ ...formData, head: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Value</label>
                  <input
                    type="text"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold"
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Order</label>
                  <input
                    type="number"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold"
                    value={formData.order}
                    onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                  />
                </div>
                <div className="flex gap-3 pt-6">
                  <button
                    onClick={() => handleUpdate(editingId)}
                    className="flex-grow py-4 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save className="h-5 w-5" />
                    Update
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-8 py-4 bg-stone-100 text-stone-600 rounded-xl font-bold uppercase tracking-widest hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
