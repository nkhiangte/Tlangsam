import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Edit, 
  Loader2, 
  UserCircle, 
  BookOpen, 
  Mic2, 
  MessageSquare, 
  Heart 
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, setDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface ExecutiveBody {
  chairman: string;
  secretary: string;
  asstSecretary: string;
  treasurerTualchhung: string;
  treasurerSynod: string;
  financeSecretary: string;
}

interface SundaySchoolHotute {
  superintendent: string;
  asstSuperintendentPTSS: string;
  asstSuperintendentNPSS: string;
  secretary: string;
  asstSecretariesPTSS: string;
  asstSecretariesNPSS: string;
}

interface SundaySchoolDeptLeaders {
  senior: string;
  sacrament: string;
  intermediate: string;
  junior: string;
  primary: string;
  beginner: string;
  preBeginner: string;
}

interface RawngbawltuteData {
  period: string;
  executiveBody: ExecutiveBody;
  sundaySchool: {
    hotute: SundaySchoolHotute;
    deptLeaders: SundaySchoolDeptLeaders;
    puitlingTeachers: string[];
  };
  thuhriltute: {
    pathianniZan: string[];
    pathianniChawhnu: string[];
    inrinniZan: string[];
  };
  nilaiZanThupuiHawngtute: string[];
  tantute: {
    sundaySchool: string[];
    pathianniChawhnu: string[];
    nilaiLehInrinniZan: string[];
  };
  updatedAt?: string;
}

const INITIAL_DATA: RawngbawltuteData = {
  period: "2024-2026",
  executiveBody: {
    chairman: "",
    secretary: "",
    asstSecretary: "",
    treasurerTualchhung: "",
    treasurerSynod: "",
    financeSecretary: ""
  },
  sundaySchool: {
    hotute: {
      superintendent: "",
      asstSuperintendentPTSS: "",
      asstSuperintendentNPSS: "",
      secretary: "",
      asstSecretariesPTSS: "",
      asstSecretariesNPSS: ""
    },
    deptLeaders: {
      senior: "",
      sacrament: "",
      intermediate: "",
      junior: "",
      primary: "",
      beginner: "",
      preBeginner: ""
    },
    puitlingTeachers: []
  },
  thuhriltute: {
    pathianniZan: [],
    pathianniChawhnu: [],
    inrinniZan: []
  },
  nilaiZanThupuiHawngtute: [],
  tantute: {
    sundaySchool: [],
    pathianniChawhnu: [],
    nilaiLehInrinniZan: []
  }
};

const Rawngbawltute = () => {
  const [data, setData] = useState<RawngbawltuteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<RawngbawltuteData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    // We'll fetch the latest period. For now, we use a fixed ID or fetch the most recent.
    // Let's try to fetch the most recent one.
    const q = query(collection(db, 'rawngbawltute'), orderBy('updatedAt', 'desc'), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setData(snapshot.docs[0].data() as RawngbawltuteData);
      } else {
        setData(INITIAL_DATA);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'rawngbawltute');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStartEdit = () => {
    setEditData(JSON.parse(JSON.stringify(data || INITIAL_DATA)));
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editData) return;
    setIsSaving(true);
    try {
      const docId = editData.period.replace(/\s+/g, '-').toLowerCase();
      await setDoc(doc(db, 'rawngbawltute', docId), {
        ...editData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'rawngbawltute');
    } finally {
      setIsSaving(false);
    }
  };

  const addArrayItem = (path: string[]) => {
    if (!editData) return;
    const newData = { ...editData };
    let current: any = newData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    const lastKey = path[path.length - 1];
    current[lastKey] = [...current[lastKey], ""];
    setEditData(newData);
  };

  const updateArrayItem = (path: string[], index: number, value: string) => {
    if (!editData) return;
    const newData = { ...editData };
    let current: any = newData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    const lastKey = path[path.length - 1];
    const newArr = [...current[lastKey]];
    newArr[index] = value;
    current[lastKey] = newArr;
    setEditData(newData);
  };

  const removeArrayItem = (path: string[], index: number) => {
    if (!editData) return;
    const newData = { ...editData };
    let current: any = newData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    const lastKey = path[path.length - 1];
    current[lastKey] = current[lastKey].filter((_: any, i: number) => i !== index);
    setEditData(newData);
  };

  const updateField = (path: string[], value: string) => {
    if (!editData) return;
    const newData = { ...editData };
    let current: any = newData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setEditData(newData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-12 w-12 text-church-burgundy animate-spin" />
      </div>
    );
  }

  const renderArrayField = (title: string, path: string[], items: string[]) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold uppercase tracking-widest text-stone-900">{title}</h4>
        {isEditing && (
          <button 
            onClick={() => addArrayItem(path)}
            className="p-1 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded-xl border border-stone-100 shadow-sm group">
            {isEditing ? (
              <>
                <input 
                  type="text"
                  value={item}
                  onChange={(e) => updateArrayItem(path, idx, e.target.value)}
                  className="flex-grow bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-church-gold"
                  placeholder="Hming dah rawh"
                />
                <button 
                  onClick={() => removeArrayItem(path, idx)}
                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <span className="text-stone-700 font-medium">{item}</span>
            )}
          </div>
        ))}
        {!isEditing && items.length === 0 && (
          <p className="text-stone-400 text-sm italic">Awm rih lo</p>
        )}
      </div>
    </div>
  );

  const renderInputField = (label: string, path: string[], value: string) => (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-900">{label}</label>
      {isEditing ? (
        <input 
          type="text"
          value={value}
          onChange={(e) => updateField(path, e.target.value)}
          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-900 focus:outline-none focus:border-church-gold"
          placeholder={`${label} hming`}
        />
      ) : (
        <p className="text-stone-800 font-medium">{value || "—"}</p>
      )}
    </div>
  );

  const displayData = isEditing ? editData! : data!;

  return (
    <div className="min-h-screen bg-stone-50 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-church-gold"></div>
              <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Church Workers</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4">Rawngbawltute</h1>
            <div className="flex items-center gap-4">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-900 uppercase tracking-wider">Period:</span>
                  <input 
                    type="text"
                    value={displayData.period}
                    onChange={(e) => updateField(['period'], e.target.value)}
                    className="bg-white border border-stone-200 rounded-lg px-3 py-1 text-sm font-bold text-church-burgundy focus:outline-none focus:border-church-gold"
                  />
                </div>
              ) : (
                <p className="text-church-burgundy font-bold text-lg uppercase tracking-widest">{displayData.period}</p>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-bold text-sm uppercase tracking-wider shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-6 py-3 bg-stone-200 text-stone-600 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-stone-300 transition-all"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleStartEdit}
                  className="flex items-center gap-2 px-6 py-3 bg-church-burgundy text-white rounded-full font-bold text-sm uppercase tracking-wider shadow-lg hover:bg-opacity-90 transition-all"
                >
                  <Edit className="h-4 w-4" />
                  Edit Workers
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-12">
          {/* 1. EXECUTIVE BODY */}
          <section className="bg-white rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden">
            <div className="bg-stone-900 px-8 py-6 flex items-center gap-4">
              <div className="p-3 bg-church-gold/20 rounded-2xl">
                <UserCircle className="h-6 w-6 text-church-gold" />
              </div>
              <h2 className="text-2xl font-serif text-white">1. EXECUTIVE BODY</h2>
            </div>
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {renderInputField("Chairman", ["executiveBody", "chairman"], displayData.executiveBody.chairman)}
              {renderInputField("Secretary", ["executiveBody", "secretary"], displayData.executiveBody.secretary)}
              {renderInputField("Asst. Secretary", ["executiveBody", "asstSecretary"], displayData.executiveBody.asstSecretary)}
              {renderInputField("Treasurer (Tualchhung)", ["executiveBody", "treasurerTualchhung"], displayData.executiveBody.treasurerTualchhung)}
              {renderInputField("Treasurer (Synod)", ["executiveBody", "treasurerSynod"], displayData.executiveBody.treasurerSynod)}
              {renderInputField("Finance Secretary", ["executiveBody", "financeSecretary"], displayData.executiveBody.financeSecretary)}
            </div>
          </section>

          {/* 2. SUNDAY SCHOOL */}
          <section className="bg-white rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden">
            <div className="bg-stone-900 px-8 py-6 flex items-center gap-4">
              <div className="p-3 bg-church-gold/20 rounded-2xl">
                <BookOpen className="h-6 w-6 text-church-gold" />
              </div>
              <h2 className="text-2xl font-serif text-white">2. SUNDAY SCHOOL</h2>
            </div>
            <div className="p-8 space-y-12">
              {/* A - Hotute */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-church-burgundy border-b border-stone-100 pb-2">A — Hotute</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {renderInputField("Superintendent", ["sundaySchool", "hotute", "superintendent"], displayData.sundaySchool.hotute.superintendent)}
                  {renderInputField("Asst. Superintendent (PTSS)", ["sundaySchool", "hotute", "asstSuperintendentPTSS"], displayData.sundaySchool.hotute.asstSuperintendentPTSS)}
                  {renderInputField("Asst. Superintendent (NPSS)", ["sundaySchool", "hotute", "asstSuperintendentNPSS"], displayData.sundaySchool.hotute.asstSuperintendentNPSS)}
                  {renderInputField("Secretary", ["sundaySchool", "hotute", "secretary"], displayData.sundaySchool.hotute.secretary)}
                  {renderInputField("Asst. Secretaries (PTSS)", ["sundaySchool", "hotute", "asstSecretariesPTSS"], displayData.sundaySchool.hotute.asstSecretariesPTSS)}
                  {renderInputField("Asst. Secretaries (NPSS)", ["sundaySchool", "hotute", "asstSecretariesNPSS"], displayData.sundaySchool.hotute.asstSecretariesNPSS)}
                </div>
              </div>

              {/* B - Department Leaders */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-church-burgundy border-b border-stone-100 pb-2">B — Department Leaders</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {renderInputField("Senior Dept.", ["sundaySchool", "deptLeaders", "senior"], displayData.sundaySchool.deptLeaders.senior)}
                  {renderInputField("Sacrament Dept.", ["sundaySchool", "deptLeaders", "sacrament"], displayData.sundaySchool.deptLeaders.sacrament)}
                  {renderInputField("Intermediate Dept.", ["sundaySchool", "deptLeaders", "intermediate"], displayData.sundaySchool.deptLeaders.intermediate)}
                  {renderInputField("Junior Dept.", ["sundaySchool", "deptLeaders", "junior"], displayData.sundaySchool.deptLeaders.junior)}
                  {renderInputField("Primary Dept.", ["sundaySchool", "deptLeaders", "primary"], displayData.sundaySchool.deptLeaders.primary)}
                  {renderInputField("Beginner Dept.", ["sundaySchool", "deptLeaders", "beginner"], displayData.sundaySchool.deptLeaders.beginner)}
                  {renderInputField("Pre-Beginner Dept.", ["sundaySchool", "deptLeaders", "preBeginner"], displayData.sundaySchool.deptLeaders.preBeginner)}
                </div>
              </div>

              {/* C - Puitling Sunday School Zirtirtute */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-church-burgundy border-b border-stone-100 pb-2">C — Puitling Sunday School Zirtirtute</h3>
                {renderArrayField("Zirtirtute", ["sundaySchool", "puitlingTeachers"], displayData.sundaySchool.puitlingTeachers)}
              </div>
            </div>
          </section>

          {/* 3. THUHRILTUTE */}
          <section className="bg-white rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden">
            <div className="bg-stone-900 px-8 py-6 flex items-center gap-4">
              <div className="p-3 bg-church-gold/20 rounded-2xl">
                <Mic2 className="h-6 w-6 text-church-gold" />
              </div>
              <h2 className="text-2xl font-serif text-white">3. THUHRILTUTE</h2>
            </div>
            <div className="p-8 space-y-12">
              {renderArrayField("A — Pathianni Zan", ["thuhriltute", "pathianniZan"], displayData.thuhriltute.pathianniZan)}
              {renderArrayField("B — Pathianni Chawhnu", ["thuhriltute", "pathianniChawhnu"], displayData.thuhriltute.pathianniChawhnu)}
              {renderArrayField("C — Inrinni Zan", ["thuhriltute", "inrinniZan"], displayData.thuhriltute.inrinniZan)}
            </div>
          </section>

          {/* 4. NILAI ZAN THUPUI HAWNGTUTE */}
          <section className="bg-white rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden">
            <div className="bg-stone-900 px-8 py-6 flex items-center gap-4">
              <div className="p-3 bg-church-gold/20 rounded-2xl">
                <MessageSquare className="h-6 w-6 text-church-gold" />
              </div>
              <h2 className="text-2xl font-serif text-white">4. NILAI ZAN THUPUI HAWNGTUTE</h2>
            </div>
            <div className="p-8">
              {renderArrayField("Thupui Hawngtute", ["nilaiZanThupuiHawngtute"], displayData.nilaiZanThupuiHawngtute)}
            </div>
          </section>

          {/* 5. TANTUTE */}
          <section className="bg-white rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden">
            <div className="bg-stone-900 px-8 py-6 flex items-center gap-4">
              <div className="p-3 bg-church-gold/20 rounded-2xl">
                <Heart className="h-6 w-6 text-church-gold" />
              </div>
              <h2 className="text-2xl font-serif text-white">5. TANTUTE</h2>
            </div>
            <div className="p-8 space-y-12">
              {renderArrayField("A — Sunday School", ["tantute", "sundaySchool"], displayData.tantute.sundaySchool)}
              {renderArrayField("B — Pathianni Chawhnu", ["tantute", "pathianniChawhnu"], displayData.tantute.pathianniChawhnu)}
              {renderArrayField("C — Nilai leh Inrinni Zan", ["tantute", "nilaiLehInrinniZan"], displayData.tantute.nilaiLehInrinniZan)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Rawngbawltute;
