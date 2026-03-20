import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Plus, X, Loader2, Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, onSnapshot, addDoc, query, orderBy, Timestamp, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';

interface WeeklyReport {
  id: string;
  date: string;
  puitlingHmingZiak: number;
  puitlingInkhawmZat: number;
  puitlingChhimtuZat: number;
  puitlingThawhlawm: number;
  naupangHmingZiak: number;
  naupangInkhawmZat: number;
  naupangChhimtuZat: number;
  naupangThawhlawm: number;
  remarks?: string;
  createdAt: any;
}

export const WeeklyReportPage: React.FC = () => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAdmin, user } = useAuth();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    puitlingHmingZiak: 0,
    puitlingInkhawmZat: 0,
    puitlingChhimtuZat: 0,
    puitlingThawhlawm: 0,
    naupangHmingZiak: 0,
    naupangInkhawmZat: 0,
    naupangChhimtuZat: 0,
    naupangThawhlawm: 0,
    remarks: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'sunday_school_reports'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WeeklyReport[];
      setReports(records);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sunday_school_reports');
    });

    return unsubscribe;
  }, []);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await setDoc(doc(db, 'sunday_school_reports', editingId), {
          ...formData,
          updatedAt: Timestamp.now(),
          updatedBy: user?.uid
        }, { merge: true });
      } else {
        await addDoc(collection(db, 'sunday_school_reports'), {
          ...formData,
          createdAt: Timestamp.now(),
          authorUid: user?.uid
        });
      }
      setShowAddModal(false);
      setEditingId(null);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'sunday_school_reports');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      puitlingHmingZiak: 0,
      puitlingInkhawmZat: 0,
      puitlingChhimtuZat: 0,
      puitlingThawhlawm: 0,
      naupangHmingZiak: 0,
      naupangInkhawmZat: 0,
      naupangChhimtuZat: 0,
      naupangThawhlawm: 0,
      remarks: ''
    });
  };

  const handleEdit = (report: WeeklyReport) => {
    setEditingId(report.id);
    setFormData({
      date: report.date,
      puitlingHmingZiak: report.puitlingHmingZiak || 0,
      puitlingInkhawmZat: report.puitlingInkhawmZat || 0,
      puitlingChhimtuZat: report.puitlingChhimtuZat || 0,
      puitlingThawhlawm: report.puitlingThawhlawm || 0,
      naupangHmingZiak: report.naupangHmingZiak || 0,
      naupangInkhawmZat: report.naupangInkhawmZat || 0,
      naupangChhimtuZat: report.naupangChhimtuZat || 0,
      naupangThawhlawm: report.naupangThawhlawm || 0,
      remarks: report.remarks || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('He report hi i paih duh tak tak em?')) return;
    try {
      await deleteDoc(doc(db, 'sunday_school_reports', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sunday_school_reports/${id}`);
    }
  };

  const exportToExcel = () => {
    const exportData = reports.map(r => ({
      'Ni (Date)': r.date,
      'Puitling Hming Ziak': r.puitlingHmingZiak,
      'Puitling Inkhawm': r.puitlingInkhawmZat,
      'Puitling Chhimtu': r.puitlingChhimtuZat,
      'Puitling Thawhlawm': r.puitlingThawhlawm,
      'Naupang Hming Ziak': r.naupangHmingZiak,
      'Naupang Inkhawm': r.naupangInkhawmZat,
      'Naupang Chhimtu': r.naupangChhimtuZat,
      'Naupang Thawhlawm': r.naupangThawhlawm,
      'Grand Total Hming Ziak': (r.puitlingHmingZiak || 0) + (r.naupangHmingZiak || 0),
      'Grand Total Inkhawm': (r.puitlingInkhawmZat || 0) + (r.naupangInkhawmZat || 0),
      'Grand Total Chhimtu': (r.puitlingChhimtuZat || 0) + (r.naupangChhimtuZat || 0),
      'Grand Total Thawhlawm': (r.puitlingThawhlawm || 0) + (r.naupangThawhlawm || 0),
      'Remarks': r.remarks || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Weekly Report");
    XLSX.writeFile(wb, "Sunday_School_Weekly_Report.xlsx");
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
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Weekly Report</h1>
              <p className="text-stone-400 max-w-2xl">Sunday School attendance leh thawhlawm report-te tarlan a ni.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {isAdmin && (
                <button 
                  onClick={() => { resetForm(); setEditingId(null); setShowAddModal(true); }}
                  className="flex items-center gap-2 bg-church-gold text-stone-900 px-6 py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-lg font-medium"
                >
                  <Plus className="h-4 w-4" /> Record thar
                </button>
              )}
              <button 
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-church-burgundy text-white px-6 py-3 rounded-xl hover:bg-opacity-90 transition-all shadow-lg font-medium"
              >
                <Download className="h-4 w-4" /> Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-24">
        <div className="bg-white rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="h-8 w-8 text-church-burgundy animate-spin" />
                <p className="text-stone-500 font-medium">Record-te lak chhuah mek a ni...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-stone-500">Record hmuh a ni lo.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200">
                    <th rowSpan={2} className="px-4 py-5 text-xs font-serif font-bold text-stone-900 uppercase tracking-wider sticky left-0 bg-stone-100 z-20 border-r border-stone-200">Ni (Date)</th>
                    <th colSpan={4} className="px-4 py-3 text-xs font-serif font-bold text-stone-900 uppercase tracking-wider text-center border-r border-stone-200 bg-stone-50">Puitling Report</th>
                    <th colSpan={4} className="px-4 py-3 text-xs font-serif font-bold text-stone-900 uppercase tracking-wider text-center border-r border-stone-200 bg-stone-50">Naupang Report</th>
                    <th colSpan={4} className="px-4 py-3 text-xs font-serif font-bold text-stone-900 uppercase tracking-wider text-center border-r border-stone-200 bg-stone-100">Grand Total</th>
                    {isAdmin && <th rowSpan={2} className="px-4 py-5 text-xs font-serif font-bold text-stone-900 uppercase tracking-wider text-right">Action</th>}
                  </tr>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    {/* Puitling */}
                    <th className="px-4 py-3 text-[10px] font-bold text-stone-600 uppercase tracking-tight border-r border-stone-100">Hming Ziak</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-stone-600 uppercase tracking-tight border-r border-stone-100">Inkhawm</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-stone-600 uppercase tracking-tight border-r border-stone-100">Chhimtu</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-stone-600 uppercase tracking-tight border-r border-stone-200">Thawhlawm</th>
                    {/* Naupang */}
                    <th className="px-4 py-3 text-[10px] font-bold text-stone-600 uppercase tracking-tight border-r border-stone-100">Hming Ziak</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-stone-600 uppercase tracking-tight border-r border-stone-100">Inkhawm</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-stone-600 uppercase tracking-tight border-r border-stone-100">Chhimtu</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-stone-600 uppercase tracking-tight border-r border-stone-200">Thawhlawm</th>
                    {/* Grand Total */}
                    <th className="px-4 py-3 text-[10px] font-bold text-church-burgundy uppercase tracking-tight border-r border-stone-100">Hming Ziak</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-church-burgundy uppercase tracking-tight border-r border-stone-100">Inkhawm</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-church-burgundy uppercase tracking-tight border-r border-stone-100">Chhimtu</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-church-burgundy uppercase tracking-tight border-r border-stone-200">Thawhlawm</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => {
                    const totalHming = (report.puitlingHmingZiak || 0) + (report.naupangHmingZiak || 0);
                    const totalInkhawm = (report.puitlingInkhawmZat || 0) + (report.naupangInkhawmZat || 0);
                    const totalChhimtu = (report.puitlingChhimtuZat || 0) + (report.naupangChhimtuZat || 0);
                    const totalThawhlawm = (report.puitlingThawhlawm || 0) + (report.naupangThawhlawm || 0);

                    return (
                      <tr key={report.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors group">
                        <td className="px-4 py-4 text-stone-900 font-medium text-sm sticky left-0 bg-white group-hover:bg-stone-50 transition-colors border-r border-stone-100">
                          {new Date(report.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        {/* Puitling */}
                        <td className="px-4 py-4 text-stone-600 text-sm border-r border-stone-50">{report.puitlingHmingZiak || 0}</td>
                        <td className="px-4 py-4 text-stone-600 text-sm border-r border-stone-50">{report.puitlingInkhawmZat || 0}</td>
                        <td className="px-4 py-4 text-stone-600 text-sm border-r border-stone-50">{report.puitlingChhimtuZat || 0}</td>
                        <td className="px-4 py-4 text-stone-600 text-sm border-r border-stone-200">₹{report.puitlingThawhlawm?.toLocaleString() || 0}</td>
                        {/* Naupang */}
                        <td className="px-4 py-4 text-stone-600 text-sm border-r border-stone-50">{report.naupangHmingZiak || 0}</td>
                        <td className="px-4 py-4 text-stone-600 text-sm border-r border-stone-50">{report.naupangInkhawmZat || 0}</td>
                        <td className="px-4 py-4 text-stone-600 text-sm border-r border-stone-50">{report.naupangChhimtuZat || 0}</td>
                        <td className="px-4 py-4 text-stone-600 text-sm border-r border-stone-200">₹{report.naupangThawhlawm?.toLocaleString() || 0}</td>
                        {/* Grand Total */}
                        <td className="px-4 py-4 text-church-burgundy font-bold text-sm border-r border-stone-50 bg-stone-50/30">{totalHming}</td>
                        <td className="px-4 py-4 text-church-burgundy font-bold text-sm border-r border-stone-50 bg-stone-50/30">{totalInkhawm}</td>
                        <td className="px-4 py-4 text-church-burgundy font-bold text-sm border-r border-stone-50 bg-stone-50/30">{totalChhimtu}</td>
                        <td className="px-4 py-4 text-church-burgundy font-bold text-sm border-r border-stone-200 bg-stone-50/30">₹{totalThawhlawm.toLocaleString()}</td>
                        
                        {isAdmin && (
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => handleEdit(report)}
                                className="p-2 text-church-gold hover:bg-church-gold/10 rounded-lg transition-all"
                                title="Edit rawh"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(report.id)}
                                className="p-2 text-stone-300 hover:text-red-500 transition-all"
                                title="Paih rawh"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
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
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h2 className="text-2xl font-serif text-stone-900">
                  {editingId ? 'Weekly Report siamthatna' : 'Weekly Report thar dahna'}
                </h2>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleAddRecord} className="p-8 max-h-[70vh] overflow-y-auto">
                <div className="mb-8">
                  <label className="text-sm font-bold text-stone-700 uppercase tracking-wider mb-2 block">Ni (Date)</label>
                  <input 
                    required
                    type="date"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-church-gold transition-all text-lg text-stone-900"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Puitling Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-stone-100">
                      <div className="h-2 w-2 rounded-full bg-church-gold"></div>
                      <h3 className="text-lg font-serif font-bold text-stone-900">Puitling Report</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-stone-500 uppercase">Hming Ziak</label>
                        <input 
                          type="number"
                          className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-church-gold transition-all"
                          value={formData.puitlingHmingZiak}
                          onChange={(e) => setFormData({ ...formData, puitlingHmingZiak: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-stone-500 uppercase">Inkhawm Zat</label>
                        <input 
                          type="number"
                          className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-church-gold transition-all"
                          value={formData.puitlingInkhawmZat}
                          onChange={(e) => setFormData({ ...formData, puitlingInkhawmZat: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-stone-500 uppercase">Chhimtu Zat</label>
                        <input 
                          type="number"
                          className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-church-gold transition-all"
                          value={formData.puitlingChhimtuZat}
                          onChange={(e) => setFormData({ ...formData, puitlingChhimtuZat: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-stone-500 uppercase">Thawhlawm</label>
                        <input 
                          type="number"
                          className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-church-gold transition-all"
                          value={formData.puitlingThawhlawm}
                          onChange={(e) => setFormData({ ...formData, puitlingThawhlawm: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Naupang Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-stone-100">
                      <div className="h-2 w-2 rounded-full bg-church-burgundy"></div>
                      <h3 className="text-lg font-serif font-bold text-stone-900">Naupang Report</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-stone-500 uppercase">Hming Ziak</label>
                        <input 
                          type="number"
                          className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-church-gold transition-all"
                          value={formData.naupangHmingZiak}
                          onChange={(e) => setFormData({ ...formData, naupangHmingZiak: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-stone-500 uppercase">Inkhawm Zat</label>
                        <input 
                          type="number"
                          className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-church-gold transition-all"
                          value={formData.naupangInkhawmZat}
                          onChange={(e) => setFormData({ ...formData, naupangInkhawmZat: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-stone-500 uppercase">Chhimtu Zat</label>
                        <input 
                          type="number"
                          className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-church-gold transition-all"
                          value={formData.naupangChhimtuZat}
                          onChange={(e) => setFormData({ ...formData, naupangChhimtuZat: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-stone-500 uppercase">Thawhlawm</label>
                        <input 
                          type="number"
                          className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-church-gold transition-all"
                          value={formData.naupangThawhlawm}
                          onChange={(e) => setFormData({ ...formData, naupangThawhlawm: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <label className="text-sm font-bold text-stone-700 uppercase tracking-wider mb-2 block">Remarks</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-church-gold transition-all text-lg text-stone-900"
                    rows={3}
                    placeholder="Sawi duh dang a awm chuan..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>

                <div className="mt-8 p-6 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="flex justify-between items-center">
                    <span className="font-serif font-bold text-stone-900">Grand Total:</span>
                    <div className="flex gap-6 text-sm">
                      <div className="flex flex-col items-center">
                        <span className="text-stone-500 text-[10px] uppercase">Hming</span>
                        <span className="font-bold text-church-burgundy">{(formData.puitlingHmingZiak || 0) + (formData.naupangHmingZiak || 0)}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-stone-500 text-[10px] uppercase">Inkhawm</span>
                        <span className="font-bold text-church-burgundy">{(formData.puitlingInkhawmZat || 0) + (formData.naupangInkhawmZat || 0)}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-stone-500 text-[10px] uppercase">Thawhlawm</span>
                        <span className="font-bold text-church-burgundy">₹{((formData.puitlingThawhlawm || 0) + (formData.naupangThawhlawm || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
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
