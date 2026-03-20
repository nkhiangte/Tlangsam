import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, Save, X, Loader2, TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface FinanceRecord {
  id: string;
  month: string;
  pathianRam: number;
  ramthar: number;
  tualchhung: number;
  total: number;
  createdAt: any;
}

const Finance = () => {
  const { isAdmin } = useAuth();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const [formData, setFormData] = useState({
    month: '',
    pathianRam: 0,
    ramthar: 0,
    tualchhung: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'finance_records'), orderBy('month', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FinanceRecord[];
      setRecords(data);
      if (data.length > 0 && !selectedMonth) {
        setSelectedMonth(data[0].month);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'finance_records');
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const total = Number(formData.pathianRam) + Number(formData.ramthar) + Number(formData.tualchhung);
      await addDoc(collection(db, 'finance_records'), {
        ...formData,
        pathianRam: Number(formData.pathianRam),
        ramthar: Number(formData.ramthar),
        tualchhung: Number(formData.tualchhung),
        total,
        createdAt: Timestamp.now()
      });
      setIsAdding(false);
      setFormData({ month: '', pathianRam: 0, ramthar: 0, tualchhung: 0 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'finance_records');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const total = Number(formData.pathianRam) + Number(formData.ramthar) + Number(formData.tualchhung);
      await updateDoc(doc(db, 'finance_records', id), {
        ...formData,
        pathianRam: Number(formData.pathianRam),
        ramthar: Number(formData.ramthar),
        tualchhung: Number(formData.tualchhung),
        total
      });
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `finance_records/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('I delete duh tak tak em?')) return;
    try {
      await deleteDoc(doc(db, 'finance_records', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `finance_records/${id}`);
    }
  };

  const startEdit = (record: FinanceRecord) => {
    setEditingId(record.id);
    setFormData({
      month: record.month,
      pathianRam: record.pathianRam,
      ramthar: record.ramthar,
      tualchhung: record.tualchhung
    });
  };

  const currentRecord = records.find(r => r.month === selectedMonth);

  if (loading) {
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
            <h1 className="text-4xl font-serif font-bold text-stone-900 mb-2">Finance</h1>
            <p className="text-stone-600">Monthly Thawhlawm leh sum dinhmun tlangpui.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Add Record
            </button>
          )}
        </div>

        {/* Month Selector */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-8">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-church-burgundy" />
            <span className="font-bold text-stone-700">Thlang rawh:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-grow bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 focus:outline-none focus:border-church-gold"
            >
              {records.map(r => (
                <option key={r.id} value={r.month}>{r.month}</option>
              ))}
            </select>
          </div>
        </div>

        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100 mb-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-900">Add New Monthly Record</h2>
              <button onClick={() => setIsAdding(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Month & Year</label>
                <input
                  type="text"
                  placeholder="e.g., January 2024"
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold"
                  value={formData.month}
                  onChange={e => setFormData({ ...formData, month: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Pathian Ram</label>
                <input
                  type="number"
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold"
                  value={formData.pathianRam}
                  onChange={e => setFormData({ ...formData, pathianRam: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Ramthar</label>
                <input
                  type="number"
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold"
                  value={formData.ramthar}
                  onChange={e => setFormData({ ...formData, ramthar: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Tualchhung</label>
                <input
                  type="number"
                  required
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold"
                  value={formData.tualchhung}
                  onChange={e => setFormData({ ...formData, tualchhung: Number(e.target.value) })}
                />
              </div>
              <div className="md:col-span-2 pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-church-burgundy text-white rounded-xl font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg"
                >
                  Save Record
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {currentRecord ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Pathian Ram</span>
                <span className="text-3xl font-serif font-bold text-stone-900">₹{currentRecord.pathianRam.toLocaleString()}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Ramthar</span>
                <span className="text-3xl font-serif font-bold text-stone-900">₹{currentRecord.ramthar.toLocaleString()}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                </div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Tualchhung</span>
                <span className="text-3xl font-serif font-bold text-stone-900">₹{currentRecord.tualchhung.toLocaleString()}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-church-burgundy p-8 rounded-3xl shadow-xl flex flex-col items-center text-center text-white"
              >
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-church-gold" />
                </div>
                <span className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Total Thawhlawm</span>
                <span className="text-4xl font-serif font-bold text-white">₹{currentRecord.total.toLocaleString()}</span>
              </motion.div>
            </div>

            {isAdmin && (
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => startEdit(currentRecord)}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-all font-bold text-xs uppercase tracking-wider"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(currentRecord.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-bold text-xs uppercase tracking-wider"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-stone-100 text-center">
            <p className="text-stone-400 italic">Record engmah a la awm lo.</p>
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
                <h2 className="text-xl font-bold text-stone-900">Edit Record</h2>
                <button onClick={() => setEditingId(null)} className="text-stone-400 hover:text-stone-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Month & Year</label>
                  <input
                    type="text"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold"
                    value={formData.month}
                    onChange={e => setFormData({ ...formData, month: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Pathian Ram</label>
                    <input
                      type="number"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold"
                      value={formData.pathianRam}
                      onChange={e => setFormData({ ...formData, pathianRam: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Ramthar</label>
                    <input
                      type="number"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold"
                      value={formData.ramthar}
                      onChange={e => setFormData({ ...formData, ramthar: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Tualchhung</label>
                    <input
                      type="number"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold"
                      value={formData.tualchhung}
                      onChange={e => setFormData({ ...formData, tualchhung: Number(e.target.value) })}
                    />
                  </div>
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

export default Finance;
