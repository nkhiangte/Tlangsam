import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Music, Calendar, Zap, Loader2, Edit, Trash2, Plus, Check, Save, X, Phone, Camera, Image as ImageIcon, FileText, Calculator } from 'lucide-react';
import { doc, onSnapshot, setDoc, collection } from 'firebase/firestore';
import { db, storage, handleFirestoreError, OperationType } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LogoPlaceholder } from '../../components/LogoPlaceholder';
import { useAuth } from '../../context/AuthContext';
import { FellowshipFinance } from '../../components/FellowshipFinance';

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

interface FellowshipData {
  name: string;
  description: string;
  purpose: string;
  imageUrl: string;
  meetingTime: string;
  logoUrl?: string;
  activities: NewsItem[];
  reports?: NewsItem[];
  members?: string[];
  officeBearers?: OfficeBearer[];
}

const DEFAULT_OB_ROLES = [
  "Chairman",
  "Vice Chairman",
  "Secretary",
  "Asst. Secretary",
  "Treasurer",
  "Finance Secretary"
];

interface FellowshipPageProps {
  id: string;
  label: string;
  defaultName: string;
  defaultDescription: string;
  defaultPurpose: string;
  defaultImageUrl: string;
  defaultMeetingTime: string;
  defaultLogoUrl?: string;
  defaultActivities: string[];
  thiltumte?: string[];
  thuvawn?: { text: string; reference: string };
}

const FellowshipPage: React.FC<FellowshipPageProps> = ({ 
  id, 
  label,
  defaultName, 
  defaultDescription,
  defaultPurpose,
  defaultImageUrl,
  defaultLogoUrl,
  defaultMeetingTime,
  defaultActivities,
  thiltumte,
  thuvawn
}) => {
  const [data, setData] = useState<FellowshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  // Editing states
  const [editingSection, setEditingSection] = useState<'ob' | 'activities' | 'minutes' | 'header' | 'purpose' | null>(null);
  const [editValue, setEditValue] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'fellowships', id), (doc) => {
      if (doc.exists()) {
        setData(doc.data() as FellowshipData);
      } else {
        setData({
          name: defaultName,
          description: defaultDescription,
          purpose: defaultPurpose,
          imageUrl: defaultImageUrl,
          logoUrl: defaultLogoUrl || "",
          meetingTime: defaultMeetingTime,
          activities: defaultActivities.map(a => ({ title: "Activity", content: a, date: new Date().toISOString().split('T')[0] })),
          reports: [],
          officeBearers: []
        });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `fellowships/${id}`);
    });

    return () => unsub();
  }, [id, defaultName, defaultDescription, defaultPurpose, defaultImageUrl, defaultMeetingTime, defaultActivities]);

  const handleSave = async (fieldOrUpdates: string | any, value?: any) => {
    setIsSaving(true);
    try {
      const updates = typeof fieldOrUpdates === 'string' 
        ? { [fieldOrUpdates]: value } 
        : fieldOrUpdates;

      // Clean undefined values
      const cleanUpdates = { ...updates };
      Object.keys(cleanUpdates).forEach(key => {
        if (cleanUpdates[key] === undefined) {
          delete cleanUpdates[key];
        }
      });

      await setDoc(doc(db, 'fellowships', id), {
        ...cleanUpdates,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setEditingSection(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `fellowships/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (section: 'ob' | 'activities' | 'minutes' | 'header' | 'purpose') => {
    setEditingSection(section);
    if (section === 'header') {
      setEditValue({
        ...data,
        name: data.name || '',
        description: data.description || ''
      });
    } else if (section === 'purpose') {
      setEditValue({
        ...data,
        purpose: data.purpose || '',
        meetingTime: data.meetingTime || '',
        members: data.members || []
      });
    } else if (section === 'ob') {
      const currentOB = data?.officeBearers || [];
      // Migration check
      if (currentOB.length > 0 && typeof currentOB[0] === 'string') {
        const migrated = DEFAULT_OB_ROLES.map(role => ({
          role,
          name: (currentOB as any).find((s: string) => s.toLowerCase().includes(role.toLowerCase()))?.split(':')[1]?.trim() || "",
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
      const storageRef = ref(storage, `fellowships/${id}/${section}_${Date.now()}`);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage('logo');
    try {
      const storageRef = ref(storage, `fellowships/${id}/logo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await setDoc(doc(db, 'fellowships', id), {
        logoUrl: downloadURL,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Logo upload failed');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage('main');
    try {
      const storageRef = ref(storage, `fellowships/${id}/main_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await setDoc(doc(db, 'fellowships', id), {
        imageUrl: downloadURL,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error uploading main image:', error);
      alert('Image upload failed');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove the logo?')) return;
    
    try {
      await setDoc(doc(db, 'fellowships', id), {
        logoUrl: "",
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `fellowships/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

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
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-4">
              {data.logoUrl ? (
                <div className="relative group">
                  <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
                    <img 
                      src={data.logoUrl} 
                      alt={`${data.name} Logo`} 
                      className="max-w-full max-h-full object-contain drop-shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {isAdmin && (
                    <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <label className="p-1.5 bg-emerald-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-emerald-700 transition-all">
                        <Camera className="h-3 w-3" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </label>
                      <button 
                        onClick={handleRemoveLogo}
                        className="p-1.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                isAdmin && (
                  <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-stone-700 flex flex-col items-center justify-center gap-2 text-stone-500 hover:text-emerald-500 hover:border-emerald-500 transition-all cursor-pointer bg-stone-800/50">
                    {uploadingImage === 'logo' ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-6 w-6" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Add Logo</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                )
              )}
              <div className="flex-grow relative group">
                {isAdmin && !editingSection && (
                  <button 
                    onClick={() => startEditing('header')}
                    className="absolute -top-2 -right-2 p-2 bg-emerald-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
                
                {editingSection === 'header' ? (
                  <div className="space-y-4 bg-stone-900/50 p-6 rounded-2xl border border-white/10">
                    <input 
                      type="text"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-2xl font-serif text-white focus:outline-none focus:border-church-gold"
                      value={editValue.name}
                      onChange={(e) => setEditValue({ ...editValue, name: e.target.value })}
                      placeholder="Fellowship Name"
                    />
                    <textarea 
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white/80 focus:outline-none focus:border-church-gold"
                      value={editValue.description}
                      onChange={(e) => setEditValue({ ...editValue, description: e.target.value })}
                      placeholder="Description"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleSave({ name: editValue.name, description: editValue.description })} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-emerald-700">Save</button>
                      <button onClick={() => setEditingSection(null)} className="px-4 py-2 bg-stone-700 text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-stone-600">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-px w-8 bg-church-gold"></div>
                      <span className="text-church-gold font-medium uppercase tracking-widest text-xs">{label}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">{data.name}</h1>
                    <p className="text-stone-400 max-w-2xl">{data.description}</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20 bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-stone-100">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative rounded-2xl shadow-xl overflow-hidden aspect-[4/3] bg-stone-200 flex items-center justify-center group/main">
              {data.imageUrl ? (
                <>
                  <img 
                    src={data.imageUrl} 
                    alt={data.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {isAdmin && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/main:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="p-3 bg-white text-stone-900 rounded-full shadow-xl cursor-pointer hover:scale-110 transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                        <Camera className="h-4 w-4" />
                        Thalak thlakna
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMainImageUpload(e)} />
                      </label>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <LogoPlaceholder className="w-40 h-40" iconClassName="w-20 h-20 text-stone-400" />
                  {isAdmin && (
                    <label className="px-6 py-3 bg-emerald-600 text-white rounded-full shadow-xl cursor-pointer hover:bg-emerald-700 transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                      {uploadingImage === 'main' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Thalak dahna
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMainImageUpload(e)} />
                    </label>
                  )}
                </div>
              )}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 relative group"
          >
            {isAdmin && !editingSection && (
              <button 
                onClick={() => startEditing('purpose')}
                className="absolute -top-2 -right-2 p-2 bg-emerald-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}

            <h2 className="text-3xl font-serif text-stone-900">Kan Thiltum</h2>
            
            {thuvawn && (
              <div className="bg-stone-50 p-6 rounded-2xl border-l-4 border-church-gold italic">
                <p className="text-xl text-stone-800 mb-2">"{thuvawn.text}"</p>
                <p className="text-sm font-bold text-stone-500">— {thuvawn.reference}</p>
              </div>
            )}

            {thiltumte && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  Thiltumte
                </h3>
                <ul className="space-y-2">
                  {thiltumte.map((t, i) => (
                    <li key={i} className="flex gap-3 text-stone-600">
                      <span className="font-bold text-emerald-600">{i + 1}.</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {editingSection === 'purpose' ? (
              <div className="space-y-4 bg-stone-50 p-6 rounded-2xl border border-stone-200">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Purpose</label>
                  <textarea 
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-stone-900 focus:outline-none focus:border-church-gold"
                    value={editValue.purpose}
                    onChange={(e) => setEditValue({ ...editValue, purpose: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Inkhawm Hun</label>
                  <input 
                    type="text"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-stone-900 focus:outline-none focus:border-church-gold"
                    value={editValue.meetingTime}
                    onChange={(e) => setEditValue({ ...editValue, meetingTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Member-te (Comma separated)</label>
                  <textarea 
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-stone-900 focus:outline-none focus:border-church-gold"
                    value={editValue.members.join(', ')}
                    onChange={(e) => setEditValue({ ...editValue, members: e.target.value.split(',').map(s => s.trim()) })}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSave({ purpose: editValue.purpose, meetingTime: editValue.meetingTime, members: editValue.members })} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-emerald-700">Save</button>
                  <button onClick={() => setEditingSection(null)} className="px-4 py-2 bg-stone-200 text-stone-600 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-stone-300">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-stone-600 leading-relaxed">
                  {data.purpose}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-xl shadow-sm border border-stone-100 flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-emerald-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-stone-900">Inkhawm Hun</h3>
                      <p className="text-sm text-stone-500">{data.meetingTime}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white rounded-xl shadow-sm border border-stone-100 flex items-start gap-3">
                    <Users className="w-5 h-5 text-emerald-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-stone-900">Member-te</h3>
                      <p className="text-sm text-stone-500">
                        {data.members && data.members.length > 0 
                          ? data.members.join(', ') 
                          : "Kohhran member zawng zawngte."}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {((data.officeBearers && data.officeBearers.length > 0) || isAdmin) && (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 relative group">
                {isAdmin && !editingSection && (
                  <button 
                    onClick={() => startEditing('ob')}
                    className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all z-10"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
                  </button>
                )}
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 mb-4">Office Bearers</h3>
                
                {editingSection === 'ob' ? (
                  <div className="space-y-4">
                    {editValue.map((ob: OfficeBearer, i: number) => (
                      <div key={i} className="p-4 bg-white border border-emerald-100 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{ob.role}</span>
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
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-emerald-500 placeholder:text-stone-400"
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
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-emerald-500 placeholder:text-stone-400"
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => setEditValue([...editValue, { role: "Other", name: "", phone: "" }])}
                      className="w-full py-2 border border-dashed border-emerald-200 rounded-lg text-emerald-400 text-[10px] flex items-center justify-center gap-1 hover:bg-emerald-100/50 transition-all"
                    >
                      <Plus className="h-3 w-3" /> OB belhna
                    </button>
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => handleSave('officeBearers', editValue)}
                        disabled={isSaving}
                        className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    {(data.officeBearers || []).map((ob: any, i) => {
                      const isStructured = typeof ob === 'object' && ob !== null;
                      const role = isStructured ? ob.role : ob.split(':')[0];
                      const name = isStructured ? ob.name : ob.split(':')[1];
                      const phone = isStructured ? ob.phone : "";

                      return (
                        <div key={i} className="flex flex-col">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">{role}</span>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-700 text-sm font-medium">{name || "—"}</span>
                            {phone && (
                              <div className="flex items-center gap-2">
                                <a 
                                  href={`tel:${phone}`}
                                  className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                                  title="Call"
                                >
                                  <Phone className="h-3 w-3" />
                                </a>
                                <a 
                                  href={`https://wa.me/${phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
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
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        <div className="mb-12">
          <FellowshipFinance fellowshipId={id} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Activities Section */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-stone-100 relative group">
            {isAdmin && !editingSection && (
              <button 
                onClick={() => startEditing('activities')}
                className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all z-10"
              >
                <Edit className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
              </button>
            )}
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-8 h-8 text-emerald-600" />
              <h3 className="text-2xl font-serif text-stone-900">Hmalakna & Activities</h3>
            </div>
            
            {editingSection === 'activities' ? (
              <div className="space-y-4">
                {editValue.map((a: NewsItem, i: number) => (
                  <div key={i} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
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
                        className="flex-1 bg-transparent font-bold text-xl text-stone-900 focus:outline-none border-b border-transparent focus:border-emerald-500 placeholder:text-stone-400"
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
                      className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 text-base text-stone-900 focus:outline-none focus:border-emerald-500 placeholder:text-stone-400"
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
                        className="text-sm text-stone-900 font-medium bg-white border border-stone-200 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                      />
                      <label className="cursor-pointer flex items-center gap-1.5 text-xs text-emerald-600 font-bold uppercase tracking-wider">
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
                            newList[i] = { ...a, imageUrl: null };
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
                    className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
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
                {(data.activities || []).map((activity: any, index) => {
                  const isStructured = typeof activity === 'object' && activity !== null;
                  const title = isStructured ? activity.title : `Hmalakna ${index + 1}`;
                  const content = isStructured ? activity.content : activity;
                  const date = isStructured ? activity.date : null;
                  const imageUrl = isStructured ? activity.imageUrl : null;

                  return (
                    <div key={index} className="border-b border-stone-100 last:border-0 pb-4 last:pb-0">
                      {date && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                      <h4 className="font-bold text-stone-800 mb-2">{title}</h4>
                      {imageUrl && (
                        <div className="mb-3 rounded-xl overflow-hidden aspect-video bg-stone-100">
                          <img src={imageUrl} alt={title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <p className="text-stone-600 text-sm leading-relaxed">{content}</p>
                    </div>
                  );
                })}
                {(!data.activities || data.activities.length === 0) && (
                  <p className="text-stone-400 text-xs italic">Activity list a awm rih lo.</p>
                )}
              </div>
            )}
          </div>

          {/* Minutes Section */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-stone-100 relative group">
            {isAdmin && !editingSection && (
              <button 
                onClick={() => startEditing('minutes')}
                className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all z-10"
              >
                <Edit className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
              </button>
            )}
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-emerald-600" />
              <h3 className="text-2xl font-serif text-stone-900">Minutes & Report</h3>
            </div>
            
            {editingSection === 'minutes' ? (
              <div className="space-y-4">
                {editValue.map((a: NewsItem, i: number) => (
                  <div key={i} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
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
                        className="flex-1 bg-transparent font-bold text-xl text-stone-900 focus:outline-none border-b border-transparent focus:border-emerald-500 placeholder:text-stone-400"
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
                      className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 text-base text-stone-900 focus:outline-none focus:border-emerald-500 placeholder:text-stone-400"
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
                        className="text-sm text-stone-900 font-medium bg-white border border-stone-200 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                      />
                      <label className="cursor-pointer flex items-center gap-1.5 text-xs text-emerald-600 font-bold uppercase tracking-wider">
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
                            newList[i] = { ...a, imageUrl: null };
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
                    className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
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
                {(data.reports || []).map((a: NewsItem, i: number) => (
                  <div key={i} className="border-b border-stone-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
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
                {(!data.reports || data.reports.length === 0) && (
                  <p className="text-stone-400 text-xs italic">Minute vawn that a awm rih lo.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FellowshipPage;
