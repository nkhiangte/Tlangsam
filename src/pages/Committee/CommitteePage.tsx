import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Calendar, FileText, Shield, Loader2, Edit, Plus, Trash2, Save, X, Check, ClipboardList } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../App';

interface CommitteePageProps {
  id: string;
  defaultName: string;
  defaultDescription: string;
}

const CommitteePage: React.FC<CommitteePageProps> = ({ id, defaultName, defaultDescription }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  
  // Editing states
  const [editingSection, setEditingSection] = useState<'members' | 'minutes' | 'activities' | 'ob' | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'committees', id), (doc) => {
      if (doc.exists()) {
        setData(doc.data());
      } else {
        setData({
          name: defaultName,
          description: defaultDescription,
          meetingTime: "Committee thutkhawm hun leh hmun hrang hrangte.",
          members: [],
          officeBearers: [],
          activities: [],
          reports: ""
        });
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [id, defaultName, defaultDescription]);

  const handleSave = async (field: string, value: any) => {
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

  const startEditing = (section: 'members' | 'minutes' | 'activities' | 'ob') => {
    setEditingSection(section);
    if (section === 'members') setEditValue([...(data?.members || [])]);
    if (section === 'ob') setEditValue([...(data?.officeBearers || [])]);
    if (section === 'activities') setEditValue([...(data?.activities || [])]);
    if (section === 'minutes') setEditValue(data?.reports || "");
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-church-burgundy animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen">
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="text-church-gold font-medium uppercase tracking-widest text-sm mb-4 block">Committee</span>
            <h2 className="text-4xl md:text-5xl font-serif mb-4">{data?.name || defaultName}</h2>
            <p className="text-stone-500 max-w-2xl mx-auto">{data?.description || defaultDescription}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Members Section */}
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100 relative group">
              {isAdmin && !editingSection && (
                <button 
                  onClick={() => startEditing('members')}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm text-stone-400 hover:text-church-burgundy transition-all opacity-0 group-hover:opacity-100"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              
              <div className="w-12 h-12 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif mb-2">Member-te</h3>
              <p className="text-stone-600 text-sm mb-4">Committee member-te leh an mawhphurhna hrang hrangte.</p>
              
              {editingSection === 'members' ? (
                <div className="space-y-3">
                  {editValue.map((m: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={m}
                        onChange={(e) => {
                          const newList = [...editValue];
                          newList[i] = e.target.value;
                          setEditValue(newList);
                        }}
                        className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-church-gold"
                      />
                      <button 
                        onClick={() => setEditValue(editValue.filter((_: any, idx: number) => idx !== i))}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditValue([...editValue, ""])}
                    className="w-full py-2 border border-dashed border-stone-300 rounded-lg text-stone-400 text-xs flex items-center justify-center gap-1 hover:bg-stone-100 transition-all"
                  >
                    <Plus className="h-3 w-3" /> Member belhna
                  </button>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleSave('members', editValue)}
                      disabled={isSaving}
                      className="flex-1 bg-church-burgundy text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    >
                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                    </button>
                    <button 
                      onClick={() => setEditingSection(null)}
                      className="flex-1 bg-stone-200 text-stone-600 py-2 rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-1">
                  {(data?.members || []).map((m: string, i: number) => (
                    <li key={i} className="text-stone-700 text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                      {m}
                    </li>
                  ))}
                  {(!data?.members || data.members.length === 0) && (
                    <li className="text-stone-400 text-xs italic">Member list a awm rih lo.</li>
                  )}
                </ul>
              )}
            </div>

            {/* Activities Section */}
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100 relative group">
              {isAdmin && !editingSection && (
                <button 
                  onClick={() => startEditing('activities')}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm text-stone-400 hover:text-church-burgundy transition-all opacity-0 group-hover:opacity-100"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              
              <div className="w-12 h-12 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6">
                <ClipboardList className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif mb-2">Hnathawh & Activities</h3>
              <p className="text-stone-600 text-sm mb-4">Committee hnathawh hrang hrang leh hmachhawp-te.</p>
              
              {editingSection === 'activities' ? (
                <div className="space-y-3">
                  {editValue.map((a: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={a}
                        onChange={(e) => {
                          const newList = [...editValue];
                          newList[i] = e.target.value;
                          setEditValue(newList);
                        }}
                        className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-church-gold"
                      />
                      <button 
                        onClick={() => setEditValue(editValue.filter((_: any, idx: number) => idx !== i))}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditValue([...editValue, ""])}
                    className="w-full py-2 border border-dashed border-stone-300 rounded-lg text-stone-400 text-xs flex items-center justify-center gap-1 hover:bg-stone-100 transition-all"
                  >
                    <Plus className="h-3 w-3" /> Activity belhna
                  </button>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleSave('activities', editValue)}
                      disabled={isSaving}
                      className="flex-1 bg-church-burgundy text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    >
                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                    </button>
                    <button 
                      onClick={() => setEditingSection(null)}
                      className="flex-1 bg-stone-200 text-stone-600 py-2 rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {(data?.activities || []).map((a: string, i: number) => (
                    <li key={i} className="text-stone-700 text-sm flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-church-burgundy mt-1.5" />
                      {a}
                    </li>
                  ))}
                  {(!data?.activities || data.activities.length === 0) && (
                    <li className="text-stone-400 text-xs italic">Activity list a awm rih lo.</li>
                  )}
                </ul>
              )}
            </div>

            {/* Minutes Section */}
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100 relative group">
              {isAdmin && !editingSection && (
                <button 
                  onClick={() => startEditing('minutes')}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm text-stone-400 hover:text-church-burgundy transition-all opacity-0 group-hover:opacity-100"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              
              <div className="w-12 h-12 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif mb-2">Minutes & Report</h3>
              <p className="text-stone-600 text-sm mb-4">Committee thurel leh report pawimawh vawn thatnate.</p>
              
              {editingSection === 'minutes' ? (
                <div className="space-y-3">
                  <textarea 
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={6}
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-church-gold transition-all"
                    placeholder="Committee thurel tlangpui dah rawh..."
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSave('reports', editValue)}
                      disabled={isSaving}
                      className="flex-1 bg-church-burgundy text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    >
                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                    </button>
                    <button 
                      onClick={() => setEditingSection(null)}
                      className="flex-1 bg-stone-200 text-stone-600 py-2 rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-white rounded-xl border border-stone-200 text-stone-700 text-sm italic line-clamp-6">
                  {data?.reports || "Report vawn that a awm rih lo."}
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Meeting Time & OB */}
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100 relative group">
              {isAdmin && !editingSection && (
                <button 
                  onClick={() => startEditing('ob')}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm text-stone-400 hover:text-church-burgundy transition-all opacity-0 group-hover:opacity-100"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-6 w-6 text-church-burgundy" />
                <h3 className="text-xl font-serif">Inkhawm Hun & OB</h3>
              </div>
              
              <p className="text-stone-600 text-sm mb-6">{data?.meetingTime || "Committee thutkhawm hun leh hmun hrang hrangte."}</p>
              
              {editingSection === 'ob' ? (
                <div className="space-y-3">
                  {editValue.map((ob: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={ob}
                        onChange={(e) => {
                          const newList = [...editValue];
                          newList[i] = e.target.value;
                          setEditValue(newList);
                        }}
                        className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-church-gold"
                        placeholder="e.g. Chairman: Rev. John"
                      />
                      <button 
                        onClick={() => setEditValue(editValue.filter((_: any, idx: number) => idx !== i))}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditValue([...editValue, ""])}
                    className="w-full py-2 border border-dashed border-stone-300 rounded-lg text-stone-400 text-xs flex items-center justify-center gap-1 hover:bg-stone-100 transition-all"
                  >
                    <Plus className="h-3 w-3" /> OB belhna
                  </button>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleSave('officeBearers', editValue)}
                      disabled={isSaving}
                      className="flex-1 bg-church-burgundy text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    >
                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                    </button>
                    <button 
                      onClick={() => setEditingSection(null)}
                      className="flex-1 bg-stone-200 text-stone-600 py-2 rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-6 border-t border-stone-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Office Bearers</h4>
                  <ul className="space-y-2">
                    {(data?.officeBearers || []).map((ob: string, i: number) => (
                      <li key={i} className="text-stone-800 text-sm font-medium">{ob}</li>
                    ))}
                    {(!data?.officeBearers || data.officeBearers.length === 0) && (
                      <li className="text-stone-400 text-xs italic">OB list a awm rih lo.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-church-cream rounded-[2rem] p-8 md:p-12 border border-church-gold/20 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-8">
                <Shield className="h-6 w-6 text-church-burgundy" />
                <h3 className="text-2xl font-serif text-stone-900">Rawngbawlna Thupui</h3>
              </div>
              <p className="text-stone-700 leading-relaxed text-lg italic">
                "In thawk rimna hi Lalpaah chuan thlawn a ni lo tih in hriat avangin, rinnaah chuan nghet ula, sateh ula, Lalpa hnaah chuan bang lova thawk reng rawh u."
                <br />
                <span className="text-sm font-bold not-italic mt-4 block">— 1 Korinth 15:58</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CommitteePage;
