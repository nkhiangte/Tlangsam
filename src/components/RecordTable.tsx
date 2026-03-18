import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Search, Filter, Plus, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, addDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from '../App';

interface RecordTableProps {
  title: string;
  description: string;
  columns: string[];
  collectionName: string;
  schema: { [key: string]: string };
}

export const RecordTable: React.FC<RecordTableProps> = ({ title, description, columns, collectionName, schema }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAdmin, user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(records);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    });

    return unsubscribe;
  }, [collectionName]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, collectionName), {
        ...formData,
        createdAt: Timestamp.now(),
        authorUid: user?.uid
      });
      setShowAddModal(false);
      setFormData({});
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, collectionName);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 bg-church-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-church-burgundy font-medium hover:gap-3 transition-all mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4">{title}</h1>
              <p className="text-stone-600 max-w-2xl">{description}</p>
            </div>
            <div className="flex gap-4">
              {isAdmin && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 bg-church-gold text-stone-900 px-6 py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-lg font-medium"
                >
                  <Plus className="h-4 w-4" /> Add Record
                </button>
              )}
              <button className="flex items-center gap-2 bg-church-burgundy text-white px-6 py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-lg">
                <Download className="h-4 w-4" /> Export Records
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden">
          <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input 
                type="text" 
                placeholder="Search records..." 
                className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-church-gold transition-all"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-stone-200 rounded-xl hover:bg-stone-100 transition-all text-stone-600">
                <Filter className="h-4 w-4" /> Filter
              </button>
              <select className="flex-1 md:flex-none px-6 py-3 border border-stone-200 rounded-xl hover:bg-stone-100 transition-all text-stone-600 bg-white focus:outline-none">
                <option>Sort by Date</option>
                <option>Sort by Name</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="h-8 w-8 text-church-burgundy animate-spin" />
                <p className="text-stone-500 font-medium">Loading records...</p>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-stone-500">No records found.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    {columns.map((col, i) => (
                      <th key={i} className="px-8 py-5 text-sm font-serif font-bold text-stone-900 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                      {Object.keys(schema).map((key, j) => (
                        <td key={j} className="px-8 py-4 text-stone-600 text-sm">
                          {row[key]?.toString() || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex justify-between items-center">
            <p className="text-sm text-stone-500">Showing {data.length} records</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-stone-200 rounded-lg hover:bg-white transition-all text-stone-600 disabled:opacity-50" disabled>Previous</button>
              <button className="px-4 py-2 bg-church-burgundy text-white rounded-lg hover:bg-opacity-90 transition-all">1</button>
              <button className="px-4 py-2 border border-stone-200 rounded-lg hover:bg-white transition-all text-stone-600">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Record Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h2 className="text-2xl font-serif text-stone-900">Add New {title.replace('Records', '').trim()}</h2>
                <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-600 transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleAddRecord} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {Object.entries(schema).map(([key, label]) => (
                    <div key={key} className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-stone-700 uppercase tracking-wider">{label}</label>
                      <input 
                        required
                        type={(label as string).toLowerCase().includes('date') ? 'date' : (label as string).toLowerCase().includes('age') || (label as string).toLowerCase().includes('delegates') ? 'number' : 'text'}
                        placeholder={`Enter ${(label as string).toLowerCase()}...`}
                        className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-church-gold transition-all"
                        value={formData[key] || ''}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-8 py-4 border border-stone-200 rounded-xl font-medium text-stone-600 hover:bg-stone-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-8 py-4 bg-church-burgundy text-white rounded-xl font-medium hover:bg-opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
