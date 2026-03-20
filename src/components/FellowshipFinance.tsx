import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Edit, Trash2, Save, X, Calculator, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FinanceItem {
  head: string;
  amount: number;
}

interface FellowshipFinanceReport {
  id?: string;
  fellowshipId: string;
  year: number;
  month: number;
  openingBalance: number;
  income: number;
  expenditure: number;
  closingBalance: number;
  incomeItems?: FinanceItem[];
  expenditureItems?: FinanceItem[];
  details: string;
  updatedAt: string;
}

interface FellowshipFinanceProps {
  fellowshipId: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const calculateTotal = (items: FinanceItem[] = []) => {
  return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
};

interface FinanceTableProps {
  items: FinanceItem[];
  title: string;
  type: 'income' | 'expenditure';
  isEdit?: boolean;
  onAdd?: (type: 'income' | 'expenditure') => void;
  onUpdate?: (type: 'income' | 'expenditure', index: number, field: keyof FinanceItem, value: string | number) => void;
  onRemove?: (type: 'income' | 'expenditure', index: number) => void;
}

const FinanceTable = ({ items, title, type, isEdit, onAdd, onUpdate, onRemove }: FinanceTableProps) => {
  const total = calculateTotal(items);
  const accentColor = type === 'income' ? 'emerald' : 'red';

  return (
    <div className={`bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm`}>
      <div className={`bg-${accentColor}-50 px-6 py-4 border-b border-${accentColor}-100 flex justify-between items-center`}>
        <h4 className={`text-sm font-bold uppercase tracking-widest text-${accentColor}-800`}>{title}</h4>
        {isEdit && onAdd && (
          <button 
            onClick={() => onAdd(type)}
            className={`p-1.5 bg-${accentColor}-600 text-white rounded-lg hover:bg-${accentColor}-700 transition-all`}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 w-16">Sl.No</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-stone-400">Head</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 text-right">Amount</th>
              {isEdit && <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 w-16"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-3 text-sm text-stone-400 font-mono">{index + 1}</td>
                <td className="px-6 py-3">
                  {isEdit && onUpdate ? (
                    <input 
                      type="text"
                      value={item.head}
                      onChange={(e) => onUpdate(type, index, 'head', e.target.value)}
                      className="w-full bg-transparent border-b border-stone-200 focus:border-emerald-500 focus:outline-none py-1 text-sm"
                      placeholder="Description"
                    />
                  ) : (
                    <span className="text-sm text-stone-700">{item.head}</span>
                  )}
                </td>
                <td className="px-6 py-3 text-right">
                  {isEdit && onUpdate ? (
                    <input 
                      type="number"
                      value={item.amount}
                      onChange={(e) => onUpdate(type, index, 'amount', Number(e.target.value))}
                      className="w-24 bg-transparent border-b border-stone-200 focus:border-emerald-500 focus:outline-none py-1 text-sm text-right"
                    />
                  ) : (
                    <span className="text-sm font-medium text-stone-900">{formatCurrency(item.amount)}</span>
                  )}
                </td>
                {isEdit && onRemove && (
                  <td className="px-6 py-3 text-right">
                    <button 
                      onClick={() => onRemove(type, index)}
                      className="text-stone-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={isEdit ? 4 : 3} className="px-6 py-8 text-center text-stone-400 text-xs italic">
                  No items added yet.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className={`bg-${accentColor}-50/30 font-bold`}>
              <td colSpan={2} className="px-6 py-4 text-sm text-stone-900">Grand Total</td>
              <td className={`px-6 py-4 text-right text-sm text-${accentColor}-700`}>{formatCurrency(total)}</td>
              {isEdit && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export const FellowshipFinance: React.FC<FellowshipFinanceProps> = ({ fellowshipId }) => {
  const { isAdmin } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState<FellowshipFinanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<FellowshipFinanceReport>>({});

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'fellowship_finance_reports'),
      where('fellowshipId', '==', fellowshipId),
      where('year', '==', selectedYear),
      where('month', '==', selectedMonth)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        setReport({ id: snapshot.docs[0].id, ...docData } as FellowshipFinanceReport);
      } else {
        setReport(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fellowship_finance_reports');
      setLoading(false);
    });

    return () => unsub();
  }, [fellowshipId, selectedYear, selectedMonth]);

  const handleStartEdit = () => {
    if (report) {
      setEditData({
        ...report,
        incomeItems: report.incomeItems || [],
        expenditureItems: report.expenditureItems || []
      });
    } else {
      setEditData({
        fellowshipId,
        year: selectedYear,
        month: selectedMonth,
        openingBalance: 0,
        income: 0,
        expenditure: 0,
        closingBalance: 0,
        incomeItems: [],
        expenditureItems: [],
        details: ""
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docId = report?.id || `${fellowshipId}_${selectedYear}_${selectedMonth}`;
      
      const income = calculateTotal(editData.incomeItems);
      const expenditure = calculateTotal(editData.expenditureItems);
      const closingBalance = (Number(editData.openingBalance) || 0) + income - expenditure;
      
      const finalData = {
        ...editData,
        fellowshipId,
        year: selectedYear,
        month: selectedMonth,
        income,
        expenditure,
        closingBalance,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'fellowship_finance_reports', docId), finalData, { merge: true });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'fellowship_finance_reports');
    } finally {
      setIsSaving(false);
    }
  };

  const addFinanceItem = (type: 'income' | 'expenditure') => {
    const field = type === 'income' ? 'incomeItems' : 'expenditureItems';
    const current = editData[field] || [];
    setEditData({
      ...editData,
      [field]: [...current, { head: "", amount: 0 }]
    });
  };

  const updateFinanceItem = (type: 'income' | 'expenditure', index: number, field: keyof FinanceItem, value: string | number) => {
    const listField = type === 'income' ? 'incomeItems' : 'expenditureItems';
    const newList = [...(editData[listField] || [])];
    newList[index] = { ...newList[index], [field]: value };
    setEditData({ ...editData, [listField]: newList });
  };

  const removeFinanceItem = (type: 'income' | 'expenditure', index: number) => {
    const listField = type === 'income' ? 'incomeItems' : 'expenditureItems';
    const newList = (editData[listField] || []).filter((_, i) => i !== index);
    setEditData({ ...editData, [listField]: newList });
  };

  const handleDelete = async () => {
    if (!report?.id || !window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await deleteDoc(doc(db, 'fellowship_finance_reports', report.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'fellowship_finance_reports');
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-stone-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <Calculator className="w-8 h-8 text-emerald-600" />
          <h3 className="text-2xl font-serif text-stone-900">Finance Report</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-emerald-500"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-emerald-500"
          >
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          
          {isAdmin && !isEditing && (
            <button 
              onClick={handleStartEdit}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 transition-all text-sm font-bold uppercase tracking-wider"
            >
              {report ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {report ? 'Edit Report' : 'Add Report'}
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
            className="space-y-8 bg-stone-50 p-6 rounded-2xl border border-stone-200"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Opening Balance</label>
                <input 
                  type="number"
                  value={editData.openingBalance}
                  onChange={(e) => setEditData({ ...editData, openingBalance: Number(e.target.value) })}
                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-stone-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">Total Income (Luh lam)</label>
                <div className="text-xl font-serif text-emerald-900">{formatCurrency(calculateTotal(editData.incomeItems))}</div>
              </div>
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-red-600 mb-1">Total Expenditure (Hman lam)</label>
                <div className="text-xl font-serif text-red-900">{formatCurrency(calculateTotal(editData.expenditureItems))}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <FinanceTable 
                items={editData.incomeItems || []} 
                title="Income Breakdown" 
                type="income" 
                isEdit 
                onAdd={addFinanceItem}
                onUpdate={updateFinanceItem}
                onRemove={removeFinanceItem}
              />
              <FinanceTable 
                items={editData.expenditureItems || []} 
                title="Expenditure Breakdown" 
                type="expenditure" 
                isEdit 
                onAdd={addFinanceItem}
                onUpdate={updateFinanceItem}
                onRemove={removeFinanceItem}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Additional Remarks</label>
              <textarea 
                value={editData.details}
                onChange={(e) => setEditData({ ...editData, details: e.target.value })}
                rows={3}
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-stone-900 focus:outline-none focus:border-emerald-500"
                placeholder="Enter financial details..."
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Save Report
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 bg-stone-200 text-stone-600 rounded-xl font-bold uppercase tracking-wider hover:bg-stone-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
            <p className="text-stone-400 text-sm font-medium">Loading report...</p>
          </div>
        ) : report ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-2 text-stone-400 mb-2">
                  <Wallet className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Opening Balance</span>
                </div>
                <div className="text-2xl font-serif text-stone-900">{formatCurrency(report.openingBalance)}</div>
              </div>
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Income (Luh lam)</span>
                </div>
                <div className="text-2xl font-serif text-emerald-900">+{formatCurrency(report.income)}</div>
              </div>
              <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Expenditure (Hman lam)</span>
                </div>
                <div className="text-2xl font-serif text-red-900">-{formatCurrency(report.expenditure)}</div>
              </div>
              <div className="p-6 bg-stone-900 rounded-2xl shadow-lg">
                <div className="flex items-center gap-2 text-stone-400 mb-2">
                  <Calculator className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Closing Balance</span>
                </div>
                <div className="text-2xl font-serif text-white">{formatCurrency(report.closingBalance)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <FinanceTable 
                items={report.incomeItems || []} 
                title="Income Breakdown" 
                type="income" 
              />
              <FinanceTable 
                items={report.expenditureItems || []} 
                title="Expenditure Breakdown" 
                type="expenditure" 
              />
            </div>

            {report.details && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-stone-400">Additional Remarks</h4>
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 text-stone-600 whitespace-pre-wrap leading-relaxed">
                  {report.details}
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="flex justify-end">
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
          <div className="flex flex-col items-center justify-center py-20 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <Calculator className="w-12 h-12 text-stone-200 mb-4" />
            <p className="text-stone-400 text-sm font-medium">No report found for {MONTHS[selectedMonth - 1]} {selectedYear}</p>
            {isAdmin && (
              <button 
                onClick={handleStartEdit}
                className="mt-4 flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 transition-all text-sm font-bold uppercase tracking-wider"
              >
                <Plus className="h-4 w-4" />
                Add Report
              </button>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
