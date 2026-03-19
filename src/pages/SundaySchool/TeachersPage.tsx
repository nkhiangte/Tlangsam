import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Loader2, UserPlus, Shield, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, onSnapshot, query, where, orderBy, addDoc, deleteDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['Leader', 'Asst. Leader', 'Secretary', 'Teacher'];

interface TeacherRecord {
  id: string;
  name: string;
  role: string;
  department: string;
  order: number;
  createdAt: any;
}

export const SundaySchoolTeachersPage: React.FC = () => {
  const { department } = useParams<{ department: string }>();
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', role: 'Teacher' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAdmin, user } = useAuth();

  const deptName = department ? department.charAt(0).toUpperCase() + department.slice(1) : '';

  useEffect(() => {
    if (!deptName) return;

    const q = query(
      collection(db, 'sunday_school_teachers'),
      where('department', '==', deptName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TeacherRecord[];

      // Sort by role priority and then by name or order
      const rolePriority: { [key: string]: number } = {
        'Leader': 1,
        'Asst. Leader': 2,
        'Secretary': 3,
        'Teacher': 4
      };

      records.sort((a, b) => {
        const priorityA = rolePriority[a.role] || 5;
        const priorityB = rolePriority[b.role] || 5;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name);
      });

      setTeachers(records);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sunday_school_teachers');
    });

    return unsubscribe;
  }, [deptName]);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await setDoc(doc(db, 'sunday_school_teachers', editingId), {
          ...formData,
          department: deptName,
          updatedAt: Timestamp.now(),
        }, { merge: true });
      } else {
        await addDoc(collection(db, 'sunday_school_teachers'), {
          ...formData,
          department: deptName,
          order: teachers.length,
          createdAt: Timestamp.now(),
          authorUid: user?.uid
        });
      }
      setShowAddModal(false);
      setEditingId(null);
      setFormData({ name: '', role: 'Teacher' });
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'sunday_school_teachers');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (teacher: any) => {
    setEditingId(teacher.id);
    setFormData({ name: teacher.name, role: teacher.role });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('He zirtirtu hi i paih duh tak tak em?')) return;
    try {
      await deleteDoc(doc(db, 'sunday_school_teachers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sunday_school_teachers/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page Header */}
      <div className="bg-stone-900 pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-church-gold font-medium hover:gap-3 transition-all mb-8">
            <ArrowLeft className="h-4 w-4" /> In-ah let leh rawh
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-8 bg-church-gold"></div>
                <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Sunday School</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">{deptName} Department</h1>
              <p className="text-stone-400 max-w-2xl">Zirtirtu leh hruaitute seniarity leh mawhphurhna ang zela tarlan an ni.</p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-church-gold text-stone-900 px-6 py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-lg font-medium"
              >
                <UserPlus className="h-4 w-4" /> Zirtirtu thar dahna
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-24">
        <div className="bg-white rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="h-8 w-8 text-church-burgundy animate-spin" />
                <p className="text-stone-500 font-medium">Zirtirtu seniarity lak chhuah mek a ni...</p>
              </div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-stone-500">Zirtirtu hmuh a ni lo.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="px-8 py-5 text-sm font-serif font-bold text-stone-900 uppercase tracking-wider">Hming</th>
                    <th className="px-8 py-5 text-sm font-serif font-bold text-stone-900 uppercase tracking-wider">Mawhphurhna</th>
                    {isAdmin && <th className="px-8 py-5 text-sm font-serif font-bold text-stone-900 uppercase tracking-wider text-right">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher, i) => (
                    <tr key={teacher.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            teacher.role === 'Leader' ? 'bg-church-gold/20 text-church-gold' : 
                            teacher.role === 'Asst. Leader' ? 'bg-amber-100 text-amber-600' :
                            teacher.role === 'Secretary' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-stone-100 text-stone-500'
                          }`}>
                            {teacher.role === 'Leader' ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
                          </div>
                          <span className="font-medium text-stone-900">{teacher.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          teacher.role === 'Leader' ? 'bg-church-gold text-stone-900' : 
                          teacher.role === 'Asst. Leader' ? 'bg-amber-500 text-white' :
                          teacher.role === 'Secretary' ? 'bg-emerald-500 text-white' :
                          'bg-stone-200 text-stone-600'
                        }`}>
                          {teacher.role}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => handleEdit(teacher)}
                              className="p-2 text-church-gold hover:bg-church-gold/10 rounded-lg transition-all"
                              title="Edit rawh"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(teacher.id)}
                              className="p-2 text-stone-300 hover:text-red-500 transition-all"
                              title="Paih rawh"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
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
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h2 className="text-2xl font-serif text-stone-900">
                  {editingId ? 'Zirtirtu siamthatna' : 'Zirtirtu thar dahna'}
                </h2>
              </div>
              <form onSubmit={handleAddTeacher} className="p-8">
                <div className="space-y-6 mb-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-stone-700 uppercase tracking-wider">Hming</label>
                    <input 
                      required
                      type="text"
                      placeholder="Hming dah rawh..."
                      className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-church-gold transition-all text-lg text-stone-900 placeholder:text-stone-400"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-stone-700 uppercase tracking-wider">Mawhphurhna</label>
                    <select 
                      className="px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-church-gold transition-all text-lg text-stone-900"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      {ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-8 py-4 border border-stone-200 rounded-xl font-medium text-stone-600 hover:bg-stone-50 transition-all"
                  >
                    Bansan
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-8 py-4 bg-church-burgundy text-white rounded-xl font-medium hover:bg-opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingId ? 'Update rawh' : 'Save rawh')}
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
