import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Calendar, 
  FileText, 
  Shield, 
  Loader2, 
  Edit, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Check, 
  ClipboardList, 
  Phone, 
  Camera, 
  Image as ImageIcon,
  Download,
  Upload,
  FileSpreadsheet,
  Search,
  MessageCircle,
  Crown,
  UserCheck,
  ExternalLink,
  Copy
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { db, storage, handleFirestoreError, OperationType } from '../../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';

export interface OfficeBearer {
  role: string;
  name: string;
  phone: string;
}

export interface CommitteeMember {
  name: string;
  phone: string;
}

interface NewsItem {
  title: string;
  content: string;
  imageUrl?: string;
  date: string;
}

interface CommitteePageProps {
  id: string;
  defaultName: string;
  defaultDescription: string;
}

export const DEFAULT_OB_ROLES = [
  "Chairman",
  "Vice Chairman",
  "Secretary",
  "Asst. Secretary",
  "Treasurer",
  "Finance Secretary"
];

// Helper to normalize phone numbers for WhatsApp
const formatWhatsAppNumber = (phoneStr: string): string => {
  const digitsOnly = phoneStr.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`; // Default India country code for 10-digit mobile
  }
  return digitsOnly;
};

// Helper to normalize Office Bearers list
const normalizeOfficeBearers = (rawOB: any): OfficeBearer[] => {
  if (!rawOB || !Array.isArray(rawOB)) {
    return DEFAULT_OB_ROLES.map(role => ({ role, name: '', phone: '' }));
  }

  const obMap = new Map<string, OfficeBearer>();
  const extraOBs: OfficeBearer[] = [];

  rawOB.forEach((item) => {
    if (typeof item === 'string') {
      const parts = item.split(':');
      const role = parts[0]?.trim() || '';
      const name = parts[1]?.trim() || '';
      const matchedRole = DEFAULT_OB_ROLES.find(r => r.toLowerCase() === role.toLowerCase());
      if (matchedRole) {
        obMap.set(matchedRole.toLowerCase(), { role: matchedRole, name, phone: '' });
      } else if (role) {
        extraOBs.push({ role, name, phone: '' });
      }
    } else if (item && typeof item === 'object') {
      const role = item.role || item.position || item.title || '';
      const name = item.name || item.hming || '';
      const phone = String(item.phone || item.contact || item.phoneNumber || item.mobile || '').trim();
      const matchedRole = DEFAULT_OB_ROLES.find(r => r.toLowerCase() === role.toLowerCase());
      if (matchedRole) {
        obMap.set(matchedRole.toLowerCase(), { role: matchedRole, name, phone });
      } else if (role) {
        extraOBs.push({ role, name, phone });
      }
    }
  });

  const standardList = DEFAULT_OB_ROLES.map(role => {
    return obMap.get(role.toLowerCase()) || { role, name: '', phone: '' };
  });

  return [...standardList, ...extraOBs];
};

// Helper to normalize Members list
const normalizeMembers = (rawMembers: any): CommitteeMember[] => {
  if (!rawMembers || !Array.isArray(rawMembers)) return [];
  return rawMembers.map(item => {
    if (typeof item === 'string') {
      return { name: item.trim(), phone: '' };
    }
    if (item && typeof item === 'object') {
      return {
        name: item.name || item.hming || '',
        phone: String(item.phone || item.contact || item.phoneNumber || item.mobile || '').trim()
      };
    }
    return { name: '', phone: '' };
  }).filter(m => m.name.trim() !== '' || m.phone.trim() !== '');
};

const CommitteePage: React.FC<CommitteePageProps> = ({ id, defaultName, defaultDescription }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  
  // Section editing states
  const [isEditingRoster, setIsEditingRoster] = useState(false);
  const [editOB, setEditOB] = useState<OfficeBearer[]>([]);
  const [editMembers, setEditMembers] = useState<CommitteeMember[]>([]);
  const [editingSection, setEditingSection] = useState<'minutes' | 'activities' | 'meeting' | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  
  // Search state for members
  const [searchQuery, setSearchQuery] = useState('');
  
  // Contact Action Modal State
  const [activeContact, setActiveContact] = useState<{ name: string; role?: string; phone: string } | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // File input ref for CSV/Excel upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'committees', id), (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        setData(d);
      } else {
        setData({
          name: defaultName,
          description: defaultDescription,
          meetingTime: "Committee thutkhawm hun leh hmun hrang hrangte.",
          members: [],
          officeBearers: DEFAULT_OB_ROLES.map(role => ({ role, name: '', phone: '' })),
          activities: [],
          reports: []
        });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `committees/${id}`);
    });
    return unsubscribe;
  }, [id, defaultName, defaultDescription]);

  const startEditingRoster = () => {
    setEditOB(normalizeOfficeBearers(data?.officeBearers));
    setEditMembers(normalizeMembers(data?.members));
    setIsEditingRoster(true);
  };

  const cancelEditingRoster = () => {
    setIsEditingRoster(false);
    setEditOB([]);
    setEditMembers([]);
    setImportStatus(null);
  };

  const handleSaveRoster = async () => {
    setIsSaving(true);
    try {
      // Clean up empty members
      const cleanMembers = editMembers.filter(m => m.name.trim() !== '' || m.phone.trim() !== '');
      
      await updateDoc(doc(db, 'committees', id), {
        officeBearers: editOB,
        members: cleanMembers,
        updatedAt: new Date().toISOString()
      });
      setIsEditingRoster(false);
      setImportStatus(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `committees/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeneral = async (field: string, value: any) => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'committees', id), {
        [field]: value,
        updatedAt: new Date().toISOString()
      });
      setEditingSection(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `committees/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Template Download Handler (CSV or Excel)
  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    const templateRows = [
      { Type: "Office Bearer", Role: "Chairman", Name: "Pu Chairman Hming", Phone: "9876543210" },
      { Type: "Office Bearer", Role: "Vice Chairman", Name: "Pu Vice Chairman Hming", Phone: "9876543211" },
      { Type: "Office Bearer", Role: "Secretary", Name: "Pu Secretary Hming", Phone: "9876543212" },
      { Type: "Office Bearer", Role: "Asst. Secretary", Name: "Pu Asst Secretary Hming", Phone: "9876543213" },
      { Type: "Office Bearer", Role: "Treasurer", Name: "Pi Treasurer Hming", Phone: "9876543214" },
      { Type: "Office Bearer", Role: "Finance Secretary", Name: "Pu Finance Secretary Hming", Phone: "9876543215" },
      { Type: "Member", Role: "Member", Name: "Pu Committee Member 1", Phone: "9876543216" },
      { Type: "Member", Role: "Member", Name: "Pi Committee Member 2", Phone: "9876543217" },
      { Type: "Member", Role: "Member", Name: "Pu Committee Member 3", Phone: "9876543218" }
    ];

    const safeTitle = (data?.name || defaultName).replace(/[^a-zA-Z0-9]/g, '_');

    if (format === 'csv') {
      const csv = Papa.unparse(templateRows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${safeTitle}_OB_and_Members_Template.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(templateRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Committee");
      XLSX.writeFile(workbook, `${safeTitle}_OB_and_Members_Template.xlsx`);
    }
  };

  // Upload CSV / Excel Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    const processImportedData = (rows: any[]) => {
      if (!rows || rows.length === 0) {
        alert("The uploaded file does not contain any data rows.");
        return;
      }

      // Prepare target OB list
      const currentOBs = isEditingRoster 
        ? [...editOB] 
        : normalizeOfficeBearers(data?.officeBearers);
      
      const newMembers: CommitteeMember[] = [];
      let obMatchCount = 0;
      let memberCount = 0;

      rows.forEach((row: any) => {
        // Find keys flexibly
        const keys = Object.keys(row);
        const findVal = (terms: string[]) => {
          for (const k of keys) {
            const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const t of terms) {
              if (cleanKey.includes(t)) {
                return String(row[k] || '').trim();
              }
            }
          }
          return '';
        };

        const role = findVal(['role', 'mawhphurhna', 'position', 'post', 'designation', 'type']);
        const name = findVal(['name', 'hming', 'member', 'memberName', 'fullname']);
        const phone = findVal(['phone', 'contact', 'mobile', 'tel', 'cell']);

        if (!name && !phone) return;

        // Check if role corresponds to an OB
        const lowerRole = role.toLowerCase();
        let matchedOBIdx = -1;

        if (lowerRole.includes('vice') && lowerRole.includes('chair')) {
          matchedOBIdx = currentOBs.findIndex(o => o.role.toLowerCase() === 'vice chairman');
        } else if (lowerRole.includes('chair')) {
          matchedOBIdx = currentOBs.findIndex(o => o.role.toLowerCase() === 'chairman');
        } else if (lowerRole.includes('asst') && lowerRole.includes('sec')) {
          matchedOBIdx = currentOBs.findIndex(o => o.role.toLowerCase() === 'asst. secretary');
        } else if (lowerRole.includes('finance') || lowerRole.includes('fin')) {
          matchedOBIdx = currentOBs.findIndex(o => o.role.toLowerCase() === 'finance secretary');
        } else if (lowerRole.includes('treasurer') || lowerRole.includes('sumvawng')) {
          matchedOBIdx = currentOBs.findIndex(o => o.role.toLowerCase() === 'treasurer');
        } else if (lowerRole.includes('sec') || lowerRole.includes('secretary')) {
          matchedOBIdx = currentOBs.findIndex(o => o.role.toLowerCase() === 'secretary');
        }

        if (matchedOBIdx !== -1) {
          currentOBs[matchedOBIdx] = {
            ...currentOBs[matchedOBIdx],
            name: name || currentOBs[matchedOBIdx].name,
            phone: phone || currentOBs[matchedOBIdx].phone
          };
          obMatchCount++;
        } else {
          // It's a committee member
          if (name) {
            newMembers.push({ name, phone });
            memberCount++;
          }
        }
      });

      // Update state
      setEditOB(currentOBs);
      if (newMembers.length > 0) {
        setEditMembers(newMembers);
      }
      setIsEditingRoster(true);
      setImportStatus(`Imported successfully: ${obMatchCount} Office Bearers & ${memberCount} Members. Review below and click "Save Changes".`);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processImportedData(results.data);
        },
        error: (err) => {
          console.error("Error parsing CSV:", err);
          alert("Failed to parse CSV file: " + err.message);
        }
      });
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          processImportedData(jsonData);
        } catch (err: any) {
          console.error("Error parsing Excel:", err);
          alert("Failed to parse Excel file: " + err.message);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      alert("Please upload a valid .csv or .xlsx / .xls file.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number, section: 'activities' | 'minutes') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(`${section}-${index}`);
    try {
      const storageRef = ref(storage, `committees/${id}/${section}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const newList = [...editValue];
      newList[index] = { ...newList[index], imageUrl: downloadURL };
      setEditValue(newList);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Image upload failed');
    } finally {
      setUploadingImage(null);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-12 w-12 text-church-burgundy animate-spin" />
      </div>
    );
  }

  const officeBearers = normalizeOfficeBearers(data?.officeBearers);
  const members = normalizeMembers(data?.members);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hidden File Input for CSV / Excel */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".csv, .xlsx, .xls" 
        onChange={handleFileUpload} 
      />

      {/* Page Header */}
      <div className="bg-stone-900 pt-36 pb-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-8 bg-church-gold"></div>
                <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Committee & Member-te</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3">
                {data?.name || defaultName}
              </h1>
              <p className="text-stone-300 max-w-2xl text-sm sm:text-base leading-relaxed">
                {data?.description || defaultDescription}
              </p>
            </div>

            {/* Admin Quick Action Controls */}
            {isAdmin && (
              <div className="flex flex-wrap items-center gap-3">
                {isEditingRoster ? (
                  <>
                    <button 
                      onClick={handleSaveRoster}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </button>
                    <button 
                      onClick={cancelEditingRoster}
                      className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-bold text-xs uppercase tracking-wider border border-stone-700 transition-all"
                    >
                      <X className="h-4 w-4" /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={startEditingRoster}
                      className="flex items-center gap-2 px-5 py-2.5 bg-church-burgundy hover:bg-opacity-90 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
                    >
                      <Edit className="h-4 w-4" />
                      Edit OB & Members
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-church-gold rounded-xl font-bold text-xs uppercase tracking-wider border border-stone-700 transition-all"
                      title="Upload CSV or Excel file"
                    >
                      <Upload className="h-4 w-4" /> Upload CSV/Excel
                    </button>
                    <div className="relative group">
                      <button 
                        onClick={() => handleDownloadTemplate('xlsx')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold text-xs uppercase tracking-wider border border-stone-700 transition-all"
                        title="Download template"
                      >
                        <Download className="h-4 w-4" /> Template (.xlsx)
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24 space-y-12">
        
        {/* Import notification banner if present */}
        {importStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4 text-emerald-900 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium">{importStatus}</p>
            </div>
            <button 
              onClick={() => setImportStatus(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* 1. OFFICE BEARERS (OB) SECTION */}
        <section className="bg-white rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden">
          <div className="bg-stone-900 px-6 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-church-gold/20 text-church-gold rounded-xl">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                  Office Bearers (Hruaitute)
                </h2>
                <p className="text-stone-400 text-xs mt-0.5">
                  Chairman, Vice Chairman, Secretary, Asst. Secretary, Treasurer, Finance Secretary
                </p>
              </div>
            </div>

            {isAdmin && !isEditingRoster && (
              <button 
                onClick={startEditingRoster}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-church-gold rounded-lg text-xs font-bold transition-all border border-stone-700"
              >
                <Edit className="h-3.5 w-3.5" /> Edit OB
              </button>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {isEditingRoster ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {editOB.map((ob, idx) => (
                    <div 
                      key={idx} 
                      className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-church-burgundy bg-church-burgundy/10 px-2.5 py-1 rounded-md">
                          {ob.role}
                        </span>
                        {/* Only allow deleting custom extra OBs beyond standard 6 */}
                        {idx >= DEFAULT_OB_ROLES.length && (
                          <button 
                            type="button"
                            onClick={() => setEditOB(editOB.filter((_, i) => i !== idx))}
                            className="text-stone-400 hover:text-red-500 p-1"
                            title="Delete role"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                            Hming
                          </label>
                          <input 
                            type="text" 
                            value={ob.name}
                            onChange={(e) => {
                              const updated = [...editOB];
                              updated[idx] = { ...ob, name: e.target.value };
                              setEditOB(updated);
                            }}
                            placeholder={`${ob.role} hming`}
                            className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-church-burgundy"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                            Phone Number
                          </label>
                          <input 
                            type="tel" 
                            value={ob.phone}
                            onChange={(e) => {
                              const updated = [...editOB];
                              updated[idx] = { ...ob, phone: e.target.value };
                              setEditOB(updated);
                            }}
                            placeholder="e.g. 9876543210"
                            className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-church-burgundy"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-100">
                  <button 
                    type="button"
                    onClick={() => setEditOB([...editOB, { role: "Adviser", name: "", phone: "" }])}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="h-4 w-4" /> OB dang belhna
                  </button>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDownloadTemplate('csv')}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Download className="h-3.5 w-3.5" /> CSV Template
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload CSV/Excel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {officeBearers.map((ob, idx) => {
                  const hasName = ob.name && ob.name.trim() !== '';
                  const hasPhone = ob.phone && ob.phone.trim() !== '';

                  return (
                    <div 
                      key={idx}
                      className="p-5 rounded-2xl bg-gradient-to-b from-stone-50 to-white border border-stone-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold tracking-widest text-church-burgundy uppercase bg-church-burgundy/10 px-2.5 py-0.5 rounded-full">
                            {ob.role}
                          </span>
                        </div>
                        <h4 className="text-lg font-serif font-bold text-stone-900 mb-1">
                          {hasName ? ob.name : <span className="text-stone-400 italic text-sm">Hming dah a ni rih lo</span>}
                        </h4>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100">
                        {hasPhone ? (
                          <div className="flex items-center justify-between gap-2">
                            {/* Clickable Phone Number Pill */}
                            <button
                              type="button"
                              onClick={() => setActiveContact({ name: ob.name, role: ob.role, phone: ob.phone })}
                              className="flex items-center gap-2 text-xs font-semibold text-stone-700 hover:text-church-burgundy transition-colors group/phone"
                              title="Click for Call or WhatsApp"
                            >
                              <div className="w-6 h-6 rounded-full bg-church-gold/10 text-church-gold group-hover/phone:bg-church-burgundy group-hover/phone:text-white flex items-center justify-center transition-all">
                                <Phone className="h-3 w-3" />
                              </div>
                              <span className="underline decoration-stone-300 underline-offset-2 font-mono">
                                {ob.phone}
                              </span>
                            </button>

                            {/* Direct Quick Action Buttons */}
                            <div className="flex items-center gap-1.5">
                              <a 
                                href={`tel:${ob.phone.replace(/[^\d+]/g, '')}`}
                                className="p-1.5 bg-stone-100 hover:bg-church-burgundy hover:text-white text-stone-600 rounded-lg transition-all"
                                title={`Call ${ob.name}`}
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </a>
                              <a 
                                href={`https://wa.me/${formatWhatsAppNumber(ob.phone)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 rounded-lg transition-all"
                                title={`WhatsApp ${ob.name}`}
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400 italic">Phone number a awm lo</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 2. COMMITTEE MEMBERS SECTION */}
        <section className="bg-white rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden">
          <div className="bg-stone-900 px-6 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-church-gold/20 text-church-gold rounded-xl">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                    Committee Member-te
                  </h2>
                  <span className="text-xs font-sans font-bold bg-stone-800 text-church-gold px-2.5 py-0.5 rounded-full border border-stone-700">
                    {members.length} Members
                  </span>
                </div>
                <p className="text-stone-400 text-xs mt-0.5">
                  Member list leh an biakpawhna phone number-te
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && !isEditingRoster && (
                <button 
                  onClick={startEditingRoster}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-church-gold rounded-lg text-xs font-bold transition-all border border-stone-700"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit Members
                </button>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {isEditingRoster ? (
              <div className="space-y-4">
                <p className="text-stone-500 text-xs italic">
                  Member hming leh phone number-te ziah luhna. Phone number hian Call leh WhatsApp awlsam takin a thlen theih ang.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {editMembers.map((m, idx) => (
                    <div 
                      key={idx} 
                      className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center gap-2.5"
                    >
                      <span className="text-xs font-bold text-stone-400 w-6 text-right font-mono">
                        {idx + 1}.
                      </span>
                      <input 
                        type="text" 
                        value={m.name}
                        onChange={(e) => {
                          const updated = [...editMembers];
                          updated[idx] = { ...m, name: e.target.value };
                          setEditMembers(updated);
                        }}
                        placeholder="Member hming"
                        className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm text-stone-900 focus:outline-none focus:border-church-burgundy"
                      />
                      <input 
                        type="tel" 
                        value={m.phone}
                        onChange={(e) => {
                          const updated = [...editMembers];
                          updated[idx] = { ...m, phone: e.target.value };
                          setEditMembers(updated);
                        }}
                        placeholder="Phone (optional)"
                        className="w-36 sm:w-44 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm text-stone-900 focus:outline-none focus:border-church-burgundy"
                      />
                      <button 
                        type="button"
                        onClick={() => setEditMembers(editMembers.filter((_, i) => i !== idx))}
                        className="text-stone-400 hover:text-red-500 p-1.5 transition-colors"
                        title="Delete member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-100">
                  <button 
                    type="button"
                    onClick={() => setEditMembers([...editMembers, { name: "", phone: "" }])}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="h-4 w-4" /> Member belhna
                  </button>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleSaveRoster}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-church-burgundy hover:bg-opacity-90 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save All Changes
                    </button>
                    <button 
                      onClick={cancelEditingRoster}
                      className="px-4 py-2.5 bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Search / Filter bar if more than 5 members */}
                {members.length > 5 && (
                  <div className="max-w-md relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search member name or phone..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-church-gold"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {filteredMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMembers.map((m, idx) => (
                      <div 
                        key={idx}
                        className="p-4 bg-stone-50/80 hover:bg-white border border-stone-200/80 hover:border-church-gold/40 rounded-2xl shadow-2xs hover:shadow-sm transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-church-burgundy/10 text-church-burgundy flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:bg-church-burgundy group-hover:text-white transition-colors">
                            {m.name.charAt(0) || 'M'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm text-stone-900 truncate">
                              {m.name}
                            </h4>
                            {m.phone ? (
                              <button
                                type="button"
                                onClick={() => setActiveContact({ name: m.name, role: "Member", phone: m.phone })}
                                className="text-xs text-stone-500 hover:text-church-burgundy flex items-center gap-1 mt-0.5 group/p font-mono"
                              >
                                <Phone className="h-3 w-3 text-church-gold" />
                                <span className="underline decoration-stone-300 underline-offset-2">
                                  {m.phone}
                                </span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-stone-400 italic">No phone</span>
                            )}
                          </div>
                        </div>

                        {/* Quick Contact Icons */}
                        {m.phone && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <a 
                              href={`tel:${m.phone.replace(/[^\d+]/g, '')}`}
                              className="p-2 bg-white hover:bg-church-burgundy hover:text-white text-stone-600 border border-stone-200 rounded-xl transition-all shadow-2xs"
                              title={`Call ${m.name}`}
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                            <a 
                              href={`https://wa.me/${formatWhatsAppNumber(m.phone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 border border-emerald-100 rounded-xl transition-all shadow-2xs"
                              title={`WhatsApp ${m.name}`}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                    <UserCheck className="h-8 w-8 text-stone-400 mx-auto mb-2 opacity-50" />
                    <p className="text-stone-500 text-sm">
                      {searchQuery ? `No members found matching "${searchQuery}"` : "Committee member-te ziah luh a la ni lo."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 3. ADDITIONAL SECTIONS (Activities, Minutes, Meeting Time & Verse) */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Activities Section */}
          <div className="p-8 rounded-[2rem] bg-white shadow-xl border border-stone-100 relative group">
            {isAdmin && !editingSection && (
              <button 
                onClick={() => {
                  setEditingSection('activities');
                  const current = data?.activities || [];
                  if (current.length > 0 && typeof current[0] === 'string') {
                    setEditValue(current.map((s: string) => ({ title: "Activity", content: s, date: new Date().toISOString().split('T')[0] })));
                  } else {
                    setEditValue([...current]);
                  }
                }}
                className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 bg-church-burgundy text-white rounded-full shadow-md hover:bg-church-burgundy/90 transition-all z-10"
              >
                <Edit className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
              </button>
            )}
            
            <div className="w-12 h-12 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-stone-900 mb-2">Hnathawh & Activities</h3>
            <p className="text-stone-600 text-xs sm:text-sm mb-6">Committee hnathawh hrang hrang leh hmachhawp-te.</p>
            
            {editingSection === 'activities' ? (
              <div className="space-y-4">
                {editValue.map((a: NewsItem, i: number) => (
                  <div key={i} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <input 
                        type="text" 
                        placeholder="Activity Title"
                        value={a.title}
                        onChange={(e) => {
                          const newList = [...editValue];
                          newList[i] = { ...a, title: e.target.value };
                          setEditValue(newList);
                        }}
                        className="flex-1 bg-transparent font-bold text-base text-stone-900 focus:outline-none border-b border-stone-300 focus:border-church-burgundy placeholder:text-stone-400"
                      />
                      <button 
                        onClick={() => setEditValue(editValue.filter((_: any, idx: number) => idx !== i))}
                        className="text-stone-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea 
                      placeholder="Content / Hnathawh chanchin..."
                      value={a.content}
                      onChange={(e) => {
                        const newList = [...editValue];
                        newList[i] = { ...a, content: e.target.value };
                        setEditValue(newList);
                      }}
                      rows={4}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-church-burgundy placeholder:text-stone-400"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <input 
                        type="date" 
                        value={a.date}
                        onChange={(e) => {
                          const newList = [...editValue];
                          newList[i] = { ...a, date: e.target.value };
                          setEditValue(newList);
                        }}
                        className="text-xs text-stone-900 font-medium bg-white border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-church-burgundy"
                      />
                      <label className="cursor-pointer flex items-center gap-1.5 text-xs text-church-burgundy font-bold uppercase tracking-wider bg-white border border-church-burgundy/20 px-3 py-1.5 rounded-lg hover:bg-church-burgundy/5">
                        {uploadingImage === `activities-${i}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                        {a.imageUrl ? 'Change Photo' : 'Add Photo'}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, i, 'activities')} />
                      </label>
                    </div>
                    {a.imageUrl && (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-stone-200">
                        <img src={a.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => {
                            const newList = [...editValue];
                            newList[i] = { ...a, imageUrl: undefined };
                            setEditValue(newList);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                <button 
                  onClick={() => setEditValue([...editValue, { title: "", content: "", date: new Date().toISOString().split('T')[0] }])}
                  className="w-full py-2.5 border border-dashed border-stone-300 rounded-xl text-stone-500 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-stone-50 transition-all"
                >
                  <Plus className="h-4 w-4" /> Activity thar belhna
                </button>

                <div className="flex gap-2.5 pt-2">
                  <button 
                    onClick={() => handleSaveGeneral('activities', editValue)}
                    disabled={isSaving}
                    className="flex-1 bg-church-burgundy text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
                  </button>
                  <button 
                    onClick={() => setEditingSection(null)}
                    className="flex-1 bg-stone-200 text-stone-700 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {(data?.activities || []).map((a: NewsItem, i: number) => (
                  <div key={i} className="border-b border-stone-100 last:border-0 pb-5 last:pb-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-church-gold uppercase tracking-widest mb-1.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <h4 className="font-bold text-stone-900 mb-2 text-base">{a.title}</h4>
                    {a.imageUrl && (
                      <div className="mb-3 rounded-2xl overflow-hidden aspect-video bg-stone-100 border border-stone-100">
                        <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <p className="text-stone-600 text-sm leading-relaxed">{a.content}</p>
                  </div>
                ))}
                {(!data?.activities || data.activities.length === 0) && (
                  <p className="text-stone-400 text-xs italic">Activity list a awm rih lo.</p>
                )}
              </div>
            )}
          </div>

          {/* Minutes Section */}
          <div className="p-8 rounded-[2rem] bg-white shadow-xl border border-stone-100 relative group">
            {isAdmin && !editingSection && (
              <button 
                onClick={() => {
                  setEditingSection('minutes');
                  const current = data?.reports || [];
                  if (typeof current === 'string') {
                    setEditValue([{ title: "Minute", content: current, date: new Date().toISOString().split('T')[0] }]);
                  } else {
                    setEditValue([...current]);
                  }
                }}
                className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 bg-church-burgundy text-white rounded-full shadow-md hover:bg-church-burgundy/90 transition-all z-10"
              >
                <Edit className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
              </button>
            )}
            
            <div className="w-12 h-12 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-stone-900 mb-2">Minutes & Report</h3>
            <p className="text-stone-600 text-xs sm:text-sm mb-6">Committee thurel leh report pawimawh vawn thatnate.</p>
            
            {editingSection === 'minutes' ? (
              <div className="space-y-4">
                {editValue.map((a: NewsItem, i: number) => (
                  <div key={i} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <input 
                        type="text" 
                        placeholder="Minute Title"
                        value={a.title}
                        onChange={(e) => {
                          const newList = [...editValue];
                          newList[i] = { ...a, title: e.target.value };
                          setEditValue(newList);
                        }}
                        className="flex-1 bg-transparent font-bold text-base text-stone-900 focus:outline-none border-b border-stone-300 focus:border-church-burgundy placeholder:text-stone-400"
                      />
                      <button 
                        onClick={() => setEditValue(editValue.filter((_: any, idx: number) => idx !== i))}
                        className="text-stone-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea 
                      placeholder="Minute / Thurel kimchang..."
                      value={a.content}
                      onChange={(e) => {
                        const newList = [...editValue];
                        newList[i] = { ...a, content: e.target.value };
                        setEditValue(newList);
                      }}
                      rows={4}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-church-burgundy placeholder:text-stone-400"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <input 
                        type="date" 
                        value={a.date}
                        onChange={(e) => {
                          const newList = [...editValue];
                          newList[i] = { ...a, date: e.target.value };
                          setEditValue(newList);
                        }}
                        className="text-xs text-stone-900 font-medium bg-white border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-church-burgundy"
                      />
                      <label className="cursor-pointer flex items-center gap-1.5 text-xs text-church-burgundy font-bold uppercase tracking-wider bg-white border border-church-burgundy/20 px-3 py-1.5 rounded-lg hover:bg-church-burgundy/5">
                        {uploadingImage === `minutes-${i}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                        {a.imageUrl ? 'Change Photo' : 'Add Photo'}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, i, 'minutes')} />
                      </label>
                    </div>
                    {a.imageUrl && (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-stone-200">
                        <img src={a.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => {
                            const newList = [...editValue];
                            newList[i] = { ...a, imageUrl: undefined };
                            setEditValue(newList);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                <button 
                  onClick={() => setEditValue([...editValue, { title: "", content: "", date: new Date().toISOString().split('T')[0] }])}
                  className="w-full py-2.5 border border-dashed border-stone-300 rounded-xl text-stone-500 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-stone-50 transition-all"
                >
                  <Plus className="h-4 w-4" /> Minute thar belhna
                </button>

                <div className="flex gap-2.5 pt-2">
                  <button 
                    onClick={() => handleSaveGeneral('reports', editValue)}
                    disabled={isSaving}
                    className="flex-1 bg-church-burgundy text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
                  </button>
                  <button 
                    onClick={() => setEditingSection(null)}
                    className="flex-1 bg-stone-200 text-stone-700 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {(data?.reports || []).map((a: NewsItem, i: number) => (
                  <div key={i} className="border-b border-stone-100 last:border-0 pb-5 last:pb-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-church-gold uppercase tracking-widest mb-1.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <h4 className="font-bold text-stone-900 mb-2 text-base">{a.title}</h4>
                    {a.imageUrl && (
                      <div className="mb-3 rounded-2xl overflow-hidden aspect-video bg-stone-100 border border-stone-100">
                        <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <p className="text-stone-600 text-sm leading-relaxed">{a.content}</p>
                  </div>
                ))}
                {(!data?.reports || data.reports.length === 0) && (
                  <p className="text-stone-400 text-xs italic">Minute vawn that a awm rih lo.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4. MEETING TIME & BIBLE VERSE */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Meeting Time */}
          <div className="p-8 rounded-[2rem] bg-white shadow-xl border border-stone-100 relative group">
            {isAdmin && !editingSection && (
              <button 
                onClick={() => {
                  setEditingSection('meeting');
                  setEditValue(data?.meetingTime || "Committee thutkhawm hun leh hmun hrang hrangte.");
                }}
                className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 bg-church-burgundy text-white rounded-full shadow-md hover:bg-church-burgundy/90 transition-all z-10"
              >
                <Edit className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
              </button>
            )}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-church-burgundy/10 text-church-burgundy rounded-xl">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-stone-900">Inkhawm & Thutkhawm Hun</h3>
            </div>
            
            {editingSection === 'meeting' ? (
              <div className="space-y-4">
                <textarea 
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={4}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-church-burgundy"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleSaveGeneral('meetingTime', editValue)}
                    disabled={isSaving}
                    className="flex-1 bg-church-burgundy text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                  >
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                  </button>
                  <button 
                    onClick={() => setEditingSection(null)}
                    className="flex-1 bg-stone-200 text-stone-700 py-2 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
                {data?.meetingTime || "Committee thutkhawm hun leh hmun hrang hrangte."}
              </p>
            )}
          </div>

          {/* Rawngbawlna Thupui */}
          <div className="bg-gradient-to-br from-church-cream via-white to-church-cream/50 rounded-[2rem] p-8 md:p-10 border border-church-gold/30 shadow-xl flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-church-burgundy/10 text-church-burgundy rounded-xl">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-stone-900">Rawngbawlna Thupui</h3>
            </div>
            <p className="text-stone-800 leading-relaxed text-base sm:text-lg italic font-serif">
              "In thawk rimna hi Lalpaah chuan thlawn a ni lo tih in hriat avangin, rinnaah chuan nghet ula, sateh ula, Lalpa hnaah chuan bang lova thawk reng rawh u."
            </p>
            <span className="text-xs font-bold uppercase tracking-widest text-church-burgundy mt-4 block">
              — 1 Korinth 15:58
            </span>
          </div>
        </div>

      </div>

      {/* CONTACT ACTION MODAL (Call or WhatsApp) */}
      <AnimatePresence>
        {activeContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-stone-200 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-stone-900 text-white p-6 relative">
                <button 
                  onClick={() => { setActiveContact(null); setCopiedPhone(false); }}
                  className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 rounded-full hover:bg-stone-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                {activeContact.role && (
                  <span className="inline-block px-2.5 py-1 bg-church-gold/20 text-church-gold font-bold text-[10px] uppercase tracking-widest rounded-md mb-2">
                    {activeContact.role}
                  </span>
                )}
                <h3 className="text-xl font-serif font-bold text-white">
                  {activeContact.name}
                </h3>
                <p className="text-stone-400 text-xs mt-0.5">Biakpawhna & Inbiakna</p>
              </div>

              {/* Phone display with copy */}
              <div className="p-6 space-y-6">
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                      Phone Number
                    </span>
                    <span className="text-lg font-mono font-bold text-stone-900">
                      {activeContact.phone}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(activeContact.phone);
                      setCopiedPhone(true);
                      setTimeout(() => setCopiedPhone(false), 2000);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-200 hover:border-stone-300 text-stone-700 rounded-lg text-xs font-semibold shadow-2xs transition-all"
                  >
                    {copiedPhone ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedPhone ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Primary Action Buttons: Call & WhatsApp */}
                <div className="grid grid-cols-2 gap-3.5">
                  <a 
                    href={`tel:${activeContact.phone.replace(/[^\d+]/g, '')}`}
                    className="flex flex-col items-center justify-center p-4 bg-church-burgundy hover:bg-opacity-95 text-white rounded-2xl shadow-lg transition-all text-center group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 group-hover:scale-110 flex items-center justify-center mb-2 transition-transform">
                      <Phone className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-sm">Call Now</span>
                    <span className="text-[11px] text-white/75 mt-0.5">Direct Voice Call</span>
                  </a>

                  <a 
                    href={`https://wa.me/${formatWhatsAppNumber(activeContact.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg transition-all text-center group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 group-hover:scale-110 flex items-center justify-center mb-2 transition-transform">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-sm">WhatsApp</span>
                    <span className="text-[11px] text-white/75 mt-0.5">Chat / Message</span>
                  </a>
                </div>

                <div className="text-center">
                  <button 
                    onClick={() => { setActiveContact(null); setCopiedPhone(false); }}
                    className="text-stone-500 hover:text-stone-800 text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommitteePage;
