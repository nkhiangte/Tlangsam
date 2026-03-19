import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Calendar, FileText, Shield, Loader2, Edit, Plus, Trash2, Save, X, Check, ClipboardList, Zap, Phone, Camera, Image as ImageIcon } from 'lucide-react';
import { db, storage, handleFirestoreError, OperationType } from '../../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';

interface NewsItem {
  title: string;
  content: string;
  imageUrl?: string;
  date: string;
}

interface OfficeBearer {
  role: string;
  name: string;
  phone: string;
}

interface CommitteePageProps {
  id: string;
  defaultName: string;
  defaultDescription: string;
}

const DEFAULT_OB_ROLES = [
  "Chairman",
  "Vice Chairman",
  "Secretary",
  "Asst. Secretary",
  "Treasurer",
  "Finance Secretary"
];

const CommitteePage: React.FC<CommitteePageProps> = ({ id, defaultName, defaultDescription }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  
  // Editing states
  const [editingSection, setEditingSection] = useState<'members' | 'minutes' | 'activities' | 'ob' | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

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
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `committees/${id}`);
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
    if (section === 'ob') {
      const currentOB = data?.officeBearers || [];
      // If it's the old string array format, try to convert or start fresh with placeholders
      if (currentOB.length > 0 && typeof currentOB[0] === 'string') {
        const migrated = DEFAULT_OB_ROLES.map(role => ({
          role,
          name: currentOB.find((s: string) => s.toLowerCase().includes(role.toLowerCase()))?.split(':')[1]?.trim() || "",
          phone: ""
        }));
        setEditValue(migrated);
      } else if (currentOB.length === 0) {
        setEditValue(DEFAULT_OB_ROLES.map(role => ({ role, name: "", phone: "" })));
      } else {
        setEditValue([...currentOB]);
      }
    }
    if (section === 'activities') {
      const current = data?.activities || [];
      if (current.length > 0 && typeof current[0] === 'string') {
        setEditValue(current.map((s: string) => ({ title: "Activity", content: s, date: new Date().toISOString().split('T')[0] })));
      } else {
        setEditValue([...current]);
      }
    }
    if (section === 'minutes') {
      const current = data?.reports || [];
      if (typeof current === 'string') {
        setEditValue([{ title: "Minute", content: current, date: new Date().toISOString().split('T')[0] }]);
      } else {
        setEditValue([...current]);
      }
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
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-church-burgundy animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page Header */}
      <div className="bg-stone-900 pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-church-gold"></div>
              <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Committee</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">{data?.name || defaultName}</h1>
            <p className="text-stone-400 max-w-2xl">{data?.description || defaultDescription}</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-24">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Members Section */}
          <div className="p-8 rounded-3xl bg-white shadow-xl border border-stone-100 relative group">
              {isAdmin && !editingSection && (
                <button 
                  onClick={() => startEditing('members')}
                  className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-church-burgundy text-white rounded-full shadow-lg hover:bg-church-burgundy/90 transition-all z-10"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
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
            <div className="p-8 rounded-3xl bg-white shadow-xl border border-stone-100 relative group">
              {isAdmin && !editingSection && (
                <button 
                  onClick={() => startEditing('activities')}
                  className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-church-burgundy text-white rounded-full shadow-lg hover:bg-church-burgundy/90 transition-all z-10"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
                </button>
              )}
              
              <div className="w-12 h-12 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6">
                <ClipboardList className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif mb-2">Hnathawh & Activities</h3>
              <p className="text-stone-600 text-sm mb-4">Committee hnathawh hrang hrang leh hmachhawp-te.</p>
              
              {editingSection === 'activities' ? (
                <div className="space-y-4">
                  {editValue.map((a: NewsItem, i: number) => (
                    <div key={i} className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <input 
                          type="text" 
                          placeholder="Title"
                          value={a.title}
                          onChange={(e) => {
                            const newList = [...editValue];
                            newList[i] = { ...a, title: e.target.value };
                            setEditValue(newList);
                          }}
                          className="flex-1 bg-transparent font-bold text-xl text-stone-900 focus:outline-none border-b border-transparent focus:border-church-gold placeholder:text-stone-400"
                        />
                        <button 
                          onClick={() => setEditValue(editValue.filter((_: any, idx: number) => idx !== i))}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <textarea 
                        placeholder="Content"
                        value={a.content}
                        onChange={(e) => {
                          const newList = [...editValue];
                          newList[i] = { ...a, content: e.target.value };
                          setEditValue(newList);
                        }}
                        rows={6}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-base text-stone-900 focus:outline-none focus:border-church-gold placeholder:text-stone-400"
                      />
                      <div className="flex items-center gap-4">
                        <input 
                          type="date" 
                          value={a.date}
                          onChange={(e) => {
                            const newList = [...editValue];
                            newList[i] = { ...a, date: e.target.value };
                            setEditValue(newList);
                          }}
                          className="text-sm text-stone-900 font-medium bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 focus:outline-none focus:border-church-gold"
                        />
                        <label className="cursor-pointer flex items-center gap-1.5 text-xs text-church-burgundy font-bold uppercase tracking-wider">
                          {uploadingImage === `activities-${i}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                          {a.imageUrl ? 'Change Image' : 'Add Image'}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, i, 'activities')} />
                        </label>
                      </div>
                      {a.imageUrl && (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-stone-100">
                          <img src={a.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => {
                              const newList = [...editValue];
                              newList[i] = { ...a, imageUrl: undefined };
                              setEditValue(newList);
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditValue([...editValue, { title: "", content: "", date: new Date().toISOString().split('T')[0] }])}
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
                <div className="space-y-6">
                  {(data?.activities || []).map((a: NewsItem, i: number) => (
                    <div key={i} className="border-b border-stone-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-church-gold uppercase tracking-widest mb-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <h4 className="font-bold text-stone-800 mb-2">{a.title}</h4>
                      {a.imageUrl && (
                        <div className="mb-3 rounded-xl overflow-hidden aspect-video bg-stone-100">
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
            <div className="p-8 rounded-3xl bg-white shadow-xl border border-stone-100 relative group">
              {isAdmin && !editingSection && (
                <button 
                  onClick={() => startEditing('minutes')}
                  className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-church-burgundy text-white rounded-full shadow-lg hover:bg-church-burgundy/90 transition-all z-10"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
                </button>
              )}
              
              <div className="w-12 h-12 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif mb-2">Minutes & Report</h3>
              <p className="text-stone-600 text-sm mb-4">Committee thurel leh report pawimawh vawn thatnate.</p>
              
              {editingSection === 'minutes' ? (
                <div className="space-y-4">
                  {editValue.map((a: NewsItem, i: number) => (
                    <div key={i} className="p-4 bg-white border border-stone-200 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <input 
                          type="text" 
                          placeholder="Title"
                          value={a.title}
                          onChange={(e) => {
                            const newList = [...editValue];
                            newList[i] = { ...a, title: e.target.value };
                            setEditValue(newList);
                          }}
                          className="flex-1 bg-transparent font-bold text-xl text-stone-900 focus:outline-none border-b border-transparent focus:border-church-gold placeholder:text-stone-400"
                        />
                        <button 
                          onClick={() => setEditValue(editValue.filter((_: any, idx: number) => idx !== i))}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <textarea 
                        placeholder="Content"
                        value={a.content}
                        onChange={(e) => {
                          const newList = [...editValue];
                          newList[i] = { ...a, content: e.target.value };
                          setEditValue(newList);
                        }}
                        rows={6}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-base text-stone-900 focus:outline-none focus:border-church-gold placeholder:text-stone-400"
                      />
                      <div className="flex items-center gap-4">
                        <input 
                          type="date" 
                          value={a.date}
                          onChange={(e) => {
                            const newList = [...editValue];
                            newList[i] = { ...a, date: e.target.value };
                            setEditValue(newList);
                          }}
                          className="text-sm text-stone-900 font-medium bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 focus:outline-none focus:border-church-gold"
                        />
                        <label className="cursor-pointer flex items-center gap-1.5 text-xs text-church-burgundy font-bold uppercase tracking-wider">
                          {uploadingImage === `minutes-${i}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                          {a.imageUrl ? 'Change Image' : 'Add Image'}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, i, 'minutes')} />
                        </label>
                      </div>
                      {a.imageUrl && (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-stone-100">
                          <img src={a.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => {
                              const newList = [...editValue];
                              newList[i] = { ...a, imageUrl: undefined };
                              setEditValue(newList);
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditValue([...editValue, { title: "", content: "", date: new Date().toISOString().split('T')[0] }])}
                    className="w-full py-2 border border-dashed border-stone-300 rounded-lg text-stone-400 text-xs flex items-center justify-center gap-1 hover:bg-stone-100 transition-all"
                  >
                    <Plus className="h-3 w-3" /> Minute belhna
                  </button>
                  <div className="flex gap-2 pt-2">
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
                <div className="space-y-6">
                  {(data?.reports || []).map((a: NewsItem, i: number) => (
                    <div key={i} className="border-b border-stone-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-church-gold uppercase tracking-widest mb-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <h4 className="font-bold text-stone-800 mb-2">{a.title}</h4>
                      {a.imageUrl && (
                        <div className="mb-3 rounded-xl overflow-hidden aspect-video bg-stone-100">
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

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Meeting Time & OB */}
            <div className="p-8 rounded-3xl bg-white shadow-xl border border-stone-100 relative group">
              {isAdmin && !editingSection && (
                <button 
                  onClick={() => startEditing('ob')}
                  className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-church-burgundy text-white rounded-full shadow-lg hover:bg-church-burgundy/90 transition-all z-10"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
                </button>
              )}
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-6 w-6 text-church-burgundy" />
                <h3 className="text-xl font-serif">Inkhawm Hun & OB</h3>
              </div>
              
              <p className="text-stone-600 text-sm mb-6">{data?.meetingTime || "Committee thutkhawm hun leh hmun hrang hrangte."}</p>
              
              {editingSection === 'ob' ? (
                <div className="space-y-4">
                  {editValue.map((ob: OfficeBearer, i: number) => (
                    <div key={i} className="p-4 bg-white border border-stone-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-church-burgundy uppercase tracking-wider">{ob.role}</span>
                        <button 
                          onClick={() => setEditValue(editValue.filter((_: any, idx: number) => idx !== i))}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          placeholder="Hming"
                          value={ob.name}
                          onChange={(e) => {
                            const newList = [...editValue];
                            newList[i] = { ...ob, name: e.target.value };
                            setEditValue(newList);
                          }}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-church-gold placeholder:text-stone-400"
                        />
                        <input 
                          type="text" 
                          placeholder="Phone"
                          value={ob.phone}
                          onChange={(e) => {
                            const newList = [...editValue];
                            newList[i] = { ...ob, phone: e.target.value };
                            setEditValue(newList);
                          }}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-church-gold placeholder:text-stone-400"
                        />
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditValue([...editValue, { role: "Other", name: "", phone: "" }])}
                    className="w-full py-2 border border-dashed border-stone-300 rounded-lg text-stone-400 text-xs flex items-center justify-center gap-1 hover:bg-stone-100 transition-all"
                  >
                    <Plus className="h-3 w-3" /> OB dang belhna
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-4">Office Bearers</h4>
                  <div className="space-y-4">
                    {(data?.officeBearers || []).map((ob: any, i: number) => {
                      const isStructured = typeof ob === 'object' && ob !== null;
                      const role = isStructured ? ob.role : ob.split(':')[0];
                      const name = isStructured ? ob.name : ob.split(':')[1];
                      const phone = isStructured ? ob.phone : "";

                      return (
                        <div key={i} className="flex flex-col">
                          <span className="text-[10px] font-bold text-church-gold uppercase tracking-widest mb-0.5">{role}</span>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-800 text-sm font-medium">{name || "—"}</span>
                            {phone && (
                              <div className="flex items-center gap-2">
                                <a 
                                  href={`tel:${phone}`}
                                  className="p-1.5 bg-church-burgundy/5 text-church-burgundy rounded-lg hover:bg-church-burgundy hover:text-white transition-all"
                                  title="Call"
                                >
                                  <Phone className="h-3 w-3" />
                                </a>
                                <a 
                                  href={`https://wa.me/${phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                                  title="WhatsApp"
                                >
                                  <Zap className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {(!data?.officeBearers || data.officeBearers.length === 0) && (
                      <div className="text-stone-400 text-xs italic">OB list a awm rih lo.</div>
                    )}
                  </div>
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
      </div>
  );
};

export default CommitteePage;
