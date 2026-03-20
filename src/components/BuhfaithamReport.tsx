import React, { useState, useEffect, useRef } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { 
  Loader2, Plus, Edit, Trash2, Save, X, FileSpreadsheet, 
  Scale, IndianRupee, Download, Upload, Search, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

interface BuhfaithamRecord {
  name: string;
  weight: number;
  amount: number;
}

interface BuhfaithamReport {
  id?: string;
  year: number;
  month: number;
  records: BuhfaithamRecord[];
  totalWeight: number;
  totalAmount: number;
  updatedAt: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const BuhfaithamReport: React.FC = () => {
  const { isAdmin } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState<BuhfaithamReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<BuhfaithamReport>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'buhfaitham_reports'),
      where('year', '==', selectedYear),
      where('month', '==', selectedMonth)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data() as BuhfaithamReport;
        setReport({ ...docData, id: snapshot.docs[0].id });
      } else {
        setReport(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'buhfaitham_reports');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedYear, selectedMonth]);

  const calculateTotals = (records: BuhfaithamRecord[]) => {
    const totalWeight = records.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
    const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    return { totalWeight, totalAmount };
  };

  const handleStartEdit = () => {
    if (report) {
      setEditData({ ...report });
    } else {
      setEditData({
        year: selectedYear,
        month: selectedMonth,
        records: [],
        totalWeight: 0,
        totalAmount: 0
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const records = editData.records || [];
      const { totalWeight, totalAmount } = calculateTotals(records);
      const docId = report?.id || `${selectedYear}_${selectedMonth}`;
      
      const finalData = {
        ...editData,
        year: selectedYear,
        month: selectedMonth,
        records,
        totalWeight,
        totalAmount,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'buhfaitham_reports', docId), finalData, { merge: true });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'buhfaitham_reports');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!report?.id || !window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await deleteDoc(doc(db, 'buhfaitham_reports', report.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'buhfaitham_reports');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const newRecords: BuhfaithamRecord[] = data.map(row => ({
        name: row.Name || row.name || row.Hming || "",
        weight: Number(row.Weight || row.weight || row.Kg || 0),
        amount: Number(row.Amount || row.amount || row.Pawisa || 0)
      })).filter(r => r.name);

      const { totalWeight, totalAmount } = calculateTotals(newRecords);
      setEditData(prev => ({
        ...prev,
        records: newRecords,
        totalWeight,
        totalAmount
      }));
    };
    reader.readAsBinaryString(file);
  };

  const addRecord = () => {
    const records = [...(editData.records || []), { name: "", weight: 0, amount: 0 }];
    setEditData({ ...editData, records });
  };

  const updateRecord = (index: number, field: keyof BuhfaithamRecord, value: string | number) => {
    const records = [...(editData.records || [])];
    records[index] = { ...records[index], [field]: value };
    setEditData({ ...editData, records });
  };

  const removeRecord = (index: number) => {
    const records = (editData.records || []).filter((_, i) => i !== index);
    setEditData({ ...editData, records });
  };

  const exportToExcel = () => {
    if (!report) return;
    const ws = XLSX.utils.json_to_sheet(report.records.map((r, i) => ({
      "Sl.No": i + 1,
      "Name": r.name,
      "Weight (kg)": r.weight,
      "Amount (₹)": r.amount
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Buhfaitham");
    XLSX.writeFile(wb, `Buhfaitham_${MONTHS[selectedMonth-1]}_${selectedYear}.xlsx`);
  };

  const filteredRecords = (isEditing ? editData.records : report?.records)?.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-stone-100">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-stone-900 rounded-xl">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-serif text-stone-900">Buhfaitham Report</h3>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">Monthly Rice Collection</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-stone-400" />
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-sm font-medium focus:outline-none"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="w-px h-4 bg-stone-200 mx-1" />
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-sm font-medium focus:outline-none"
            >
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          
          {isAdmin && !isEditing && (
            <button 
              onClick={handleStartEdit}
              className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-xl shadow-lg hover:bg-stone-800 transition-all text-sm font-bold uppercase tracking-wider"
            >
              {report ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {report ? 'Edit Report' : 'Add Report'}
            </button>
          )}

          {report && !isEditing && (
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition-all text-sm font-bold uppercase tracking-wider"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 bg-stone-50 p-6 rounded-2xl border border-stone-200">
              <div className="flex gap-4">
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Total Weight</label>
                  <div className="text-xl font-serif text-stone-900 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-stone-400" />
                    {calculateTotals(editData.records || []).totalWeight.toFixed(2)} kg
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Total Amount</label>
                  <div className="text-xl font-serif text-stone-900 flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-stone-400" />
                    ₹{calculateTotals(editData.records || []).totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all text-xs font-bold uppercase tracking-wider"
                >
                  <Upload className="h-4 w-4" />
                  Import Excel
                </button>
                <button 
                  onClick={addRecord}
                  className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-all text-xs font-bold uppercase tracking-wider"
                >
                  <Plus className="h-4 w-4" />
                  Add Row
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-400 w-16">Sl.No</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">Name / Hming</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-400 w-40">Weight (kg)</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-400 w-40">Amount (₹)</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-stone-400 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {editData.records?.map((record, index) => (
                      <tr key={index} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-stone-400 font-mono">{index + 1}</td>
                        <td className="px-6 py-4">
                          <input 
                            type="text"
                            value={record.name}
                            onChange={(e) => updateRecord(index, 'name', e.target.value)}
                            className="w-full bg-transparent border-b border-stone-200 focus:border-stone-900 focus:outline-none py-1 text-sm"
                            placeholder="Name"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number"
                            value={record.weight}
                            onChange={(e) => updateRecord(index, 'weight', Number(e.target.value))}
                            className="w-full bg-transparent border-b border-stone-200 focus:border-stone-900 focus:outline-none py-1 text-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number"
                            value={record.amount}
                            onChange={(e) => updateRecord(index, 'amount', Number(e.target.value))}
                            className="w-full bg-transparent border-b border-stone-200 focus:border-stone-900 focus:outline-none py-1 text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => removeRecord(index)}
                            className="text-stone-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-stone-900 text-white py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-stone-800 transition-all disabled:opacity-50 shadow-lg"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Save Report
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-8 py-4 bg-stone-200 text-stone-600 rounded-xl font-bold uppercase tracking-wider hover:bg-stone-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-stone-900 animate-spin mb-4" />
            <p className="text-stone-400 text-sm font-medium">Fetching report data...</p>
          </div>
        ) : report ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-8 bg-stone-900 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Scale className="w-24 h-24 text-white" />
                </div>
                <div className="relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2 block">Total Weight Collected</span>
                  <div className="text-4xl font-serif text-white">{report.totalWeight.toFixed(2)} <span className="text-xl text-stone-500">kg</span></div>
                </div>
              </div>
              <div className="p-8 bg-white rounded-3xl border border-stone-100 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <IndianRupee className="w-24 h-24 text-stone-900" />
                </div>
                <div className="relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2 block">Total Amount Value</span>
                  <div className="text-4xl font-serif text-stone-900">₹{report.totalAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-widest text-stone-400">Detailed Breakdown</h4>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                  <input 
                    type="text"
                    placeholder="Search name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-stone-50 border border-stone-100 rounded-full text-sm focus:outline-none focus:border-stone-200 w-64"
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100">
                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-wider text-stone-400 w-20">Sl.No</th>
                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-wider text-stone-400">Name / Hming</th>
                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-wider text-stone-400 text-right">Weight (kg)</th>
                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-wider text-stone-400 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {filteredRecords.map((record, index) => (
                        <tr key={index} className="hover:bg-stone-50/50 transition-colors">
                          <td className="px-8 py-5 text-sm text-stone-400 font-mono">{index + 1}</td>
                          <td className="px-8 py-5 text-sm font-medium text-stone-900">{record.name}</td>
                          <td className="px-8 py-5 text-sm text-stone-600 text-right font-mono">{record.weight.toFixed(2)}</td>
                          <td className="px-8 py-5 text-sm text-stone-900 text-right font-medium">₹{record.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                      {filteredRecords.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center text-stone-400 text-sm italic">
                            No records found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-red-400 hover:text-red-600 transition-colors text-xs font-bold uppercase tracking-wider"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Report
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
            <FileSpreadsheet className="w-12 h-12 text-stone-200 mb-4" />
            <h4 className="text-lg font-serif text-stone-900 mb-2">No Report Found</h4>
            <p className="text-stone-400 text-sm max-w-xs text-center mb-8">
              There is no Buhfaitham report for {MONTHS[selectedMonth-1]} {selectedYear} yet.
            </p>
            {isAdmin && (
              <button 
                onClick={handleStartEdit}
                className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl shadow-lg hover:bg-stone-800 transition-all text-sm font-bold uppercase tracking-wider"
              >
                <Plus className="h-4 w-4" />
                Create New Report
              </button>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
