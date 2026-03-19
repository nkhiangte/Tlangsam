import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  FileText, 
  Shield, 
  UserCheck, 
  UserMinus, 
  Edit, 
  Save, 
  X,
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  getDocs,
  query,
  where,
  deleteDoc
} from 'firebase/firestore';
import { useAuth } from '../../App';

const AdminPanel = () => {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'services' | 'records' | 'committees' | 'fellowships' | 'inspiration'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [committees, setCommittees] = useState<any[]>([]);
  const [fellowships, setFellowships] = useState<any[]>([]);
  const [inspiration, setInspiration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  // Fetch users
  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userList);
      setLoading(false);
    });
    return unsubscribe;
  }, [isAdmin]);

  // Fetch services
  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = onSnapshot(doc(db, 'settings', 'services'), (doc) => {
      if (doc.exists()) {
        setServices(doc.data().list || []);
      } else {
        // Initial default services
        const defaultServices = [
          { title: "Pathian Ni Inkhawm", time: "10:30 AM", description: "Hlabu leh Pathian thu hmanga chibai bukna inkhawm." },
          { title: "Nilai Zan Thupui Zirna", time: "Nilaini 7:00 PM", description: "Pathian thu zirhona leh sawihona hun hlu." },
          { title: "Thalai Inkhawm", time: "Zirtawpni 6:30 PM", description: "Thalaite tana rinna lama thanna leh inpawlhona hun." }
        ];
        setServices(defaultServices);
      }
    });
    return unsubscribe;
  }, [isAdmin]);

  // Fetch committees
  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = onSnapshot(collection(db, 'committees'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCommittees(list);
    });
    return unsubscribe;
  }, [isAdmin]);

  // Fetch fellowships
  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = onSnapshot(collection(db, 'fellowships'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFellowships(list);
    });
    return unsubscribe;
  }, [isAdmin]);

  // Fetch inspiration
  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = onSnapshot(doc(db, 'settings', 'inspiration'), (doc) => {
      if (doc.exists()) {
        setInspiration(doc.data());
      }
    });
    return unsubscribe;
  }, [isAdmin]);

  const toggleUserRole = async (userId: string, currentRole: string) => {
    if (userId === user?.uid) {
      alert("I mahni role i thlak thei lo.");
      return;
    }
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const saveServices = async (newServices: any[]) => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'services'), {
        list: newServices,
        updatedAt: new Date().toISOString()
      });
      alert("Inkhawm hun-te vawn that a ni ta.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/services');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCommittee = async (id: string, data: any) => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'committees', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
      alert("Committee data vawn that a ni ta.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `committees/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCommittee = async (id: string) => {
    if (!window.confirm("I delete duh tak tak em?")) return;
    try {
      await deleteDoc(doc(db, 'committees', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `committees/${id}`);
    }
  };

  const handleSaveFellowship = async (id: string, data: any) => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'fellowships', id), {
        ...data,
        updatedAt: new Date().toISOString()
      });
      alert("Fellowship data vawn that a ni ta.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `fellowships/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFellowship = async (id: string) => {
    if (!window.confirm("I delete duh tak tak em?")) return;
    try {
      await deleteDoc(doc(db, 'fellowships', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `fellowships/${id}`);
    }
  };

  const handleSaveInspiration = async (data: any) => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'inspiration'), {
        ...data,
        updatedAt: new Date().toISOString()
      });
      alert("Vawiin Changvawn vawn that a ni ta.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/inspiration');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-church-cream">
        <Loader2 className="h-12 w-12 text-church-burgundy animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 bg-church-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-church-burgundy font-medium hover:gap-3 transition-all mb-6">
            <ArrowLeft className="h-4 w-4" /> In-ah let leh rawh
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4">Admin Panel</h1>
              <p className="text-stone-600 max-w-2xl">Kohhran enkawlna leh record vawn thatna hmun.</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-church-burgundy text-white shadow-lg' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
          >
            <Users className="h-4 w-4" /> User Management
          </button>
          <button 
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'services' ? 'bg-church-burgundy text-white shadow-lg' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
          >
            <Clock className="h-4 w-4" /> Inkhawm Edit
          </button>
          <button 
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'records' ? 'bg-church-burgundy text-white shadow-lg' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
          >
            <FileText className="h-4 w-4" /> Record Edit
          </button>
          <button 
            onClick={() => setActiveTab('committees')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'committees' ? 'bg-church-burgundy text-white shadow-lg' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
          >
            <Shield className="h-4 w-4" /> Committees
          </button>
          <button 
            onClick={() => setActiveTab('fellowships')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'fellowships' ? 'bg-church-burgundy text-white shadow-lg' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
          >
            <Users className="h-4 w-4" /> Fellowships
          </button>
          <button 
            onClick={() => setActiveTab('inspiration')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === 'inspiration' ? 'bg-church-burgundy text-white shadow-lg' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
          >
            <Sparkles className="h-4 w-4" /> Vawiin Changvawn
          </button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'committees' && (
              <motion.div
                key="committees"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif">Committee Management</h2>
                  <button 
                    onClick={() => {
                      const id = prompt("Committee ID (e.g. kohhran, sunday-school):");
                      if (id) handleSaveCommittee(id, { name: "", description: "", meetingTime: "", members: [], officeBearers: [], activities: [], reports: "" });
                    }}
                    className="flex items-center gap-2 text-church-burgundy hover:text-church-gold transition-all font-medium"
                  >
                    <Plus className="h-4 w-4" /> Committee thar belhna
                  </button>
                </div>

                <div className="grid gap-6">
                  {committees.map((committee) => (
                    <div key={committee.id} className="p-6 border border-stone-100 rounded-2xl bg-stone-50/50 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Hming</label>
                            <input 
                              type="text" 
                              value={committee.name}
                              onChange={(e) => {
                                const newList = committees.map(c => c.id === committee.id ? { ...c, name: e.target.value } : c);
                                setCommittees(newList);
                              }}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-base text-stone-900 placeholder:text-stone-400"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Hrilhfiahna</label>
                            <input 
                              type="text" 
                              value={committee.description}
                              onChange={(e) => {
                                const newList = committees.map(c => c.id === committee.id ? { ...c, description: e.target.value } : c);
                                setCommittees(newList);
                              }}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-base text-stone-900 placeholder:text-stone-400"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Inkhawm Hun / Meeting Time</label>
                            <input 
                              type="text" 
                              value={committee.meetingTime || ""}
                              onChange={(e) => {
                                const newList = committees.map(c => c.id === committee.id ? { ...c, meetingTime: e.target.value } : c);
                                setCommittees(newList);
                              }}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-base text-stone-900 placeholder:text-stone-400"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Office Bearers</label>
                            <div className="grid sm:grid-cols-2 gap-4">
                              {(committee.officeBearers || []).map((ob: any, obIdx: number) => {
                                const isStructured = typeof ob === 'object' && ob !== null;
                                const role = isStructured ? ob.role : ob.split(':')[0];
                                const name = isStructured ? ob.name : ob.split(':')[1];
                                const phone = isStructured ? ob.phone : "";
                                
                                return (
                                  <div key={obIdx} className="p-3 bg-white border border-stone-200 rounded-xl space-y-2">
                                    <div className="flex justify-between items-center">
                                      <input 
                                        type="text" 
                                        value={role}
                                        onChange={(e) => {
                                          const newList = [...committee.officeBearers];
                                          newList[obIdx] = { role: e.target.value, name, phone };
                                          const newCommittees = committees.map(c => c.id === committee.id ? { ...c, officeBearers: newList } : c);
                                          setCommittees(newCommittees);
                                        }}
                                        className="text-xs font-bold text-church-burgundy uppercase tracking-widest bg-transparent border-none p-0 focus:ring-0 w-full placeholder:text-stone-400"
                                        placeholder="Role"
                                      />
                                      <button 
                                        onClick={() => {
                                          const newList = committee.officeBearers.filter((_: any, i: number) => i !== obIdx);
                                          const newCommittees = committees.map(c => c.id === committee.id ? { ...c, officeBearers: newList } : c);
                                          setCommittees(newCommittees);
                                        }}
                                        className="text-red-400 hover:text-red-600"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <input 
                                      type="text" 
                                      value={name}
                                      onChange={(e) => {
                                        const newList = [...committee.officeBearers];
                                        newList[obIdx] = { role, name: e.target.value, phone };
                                        const newCommittees = committees.map(c => c.id === committee.id ? { ...c, officeBearers: newList } : c);
                                        setCommittees(newCommittees);
                                      }}
                                      placeholder="Hming"
                                      className="w-full text-base border-none p-0 focus:ring-0 text-stone-900 font-medium placeholder:text-stone-400"
                                    />
                                    <input 
                                      type="text" 
                                      value={phone}
                                      onChange={(e) => {
                                        const newList = [...committee.officeBearers];
                                        newList[obIdx] = { role, name, phone: e.target.value };
                                        const newCommittees = committees.map(c => c.id === committee.id ? { ...c, officeBearers: newList } : c);
                                        setCommittees(newCommittees);
                                      }}
                                      placeholder="Phone"
                                      className="w-full text-sm border-none p-0 focus:ring-0 text-stone-600 placeholder:text-stone-400"
                                    />
                                  </div>
                                );
                              })}
                              <button 
                                onClick={() => {
                                  const newList = [...(committee.officeBearers || []), { role: "New Role", name: "", phone: "" }];
                                  const newCommittees = committees.map(c => c.id === committee.id ? { ...c, officeBearers: newList } : c);
                                  setCommittees(newCommittees);
                                }}
                                className="border border-dashed border-stone-300 rounded-xl p-4 text-stone-400 text-xs flex items-center justify-center gap-2 hover:bg-stone-50 transition-all"
                              >
                                <Plus className="h-4 w-4" /> OB belhna
                              </button>
                            </div>
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Member-te (Comma separated)</label>
                            <textarea 
                              value={committee.members?.join(', ') || ""}
                              onChange={(e) => {
                                const newList = committees.map(c => c.id === committee.id ? { ...c, members: e.target.value.split(',').map(s => s.trim()) } : c);
                                setCommittees(newList);
                              }}
                              rows={2}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-base text-stone-900 placeholder:text-stone-400"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Activities (Comma separated)</label>
                            <textarea 
                              value={committee.activities?.join(', ') || ""}
                              onChange={(e) => {
                                const newList = committees.map(c => c.id === committee.id ? { ...c, activities: e.target.value.split(',').map(s => s.trim()) } : c);
                                setCommittees(newList);
                              }}
                              rows={2}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-base text-stone-900 placeholder:text-stone-400"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Reports / Minutes Summary</label>
                            <textarea 
                              value={committee.reports || ""}
                              onChange={(e) => {
                                const newList = committees.map(c => c.id === committee.id ? { ...c, reports: e.target.value } : c);
                                setCommittees(newList);
                              }}
                              rows={3}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-base text-stone-900 placeholder:text-stone-400"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button 
                            onClick={() => handleSaveCommittee(committee.id, committee)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Save"
                          >
                            <Save className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCommittee(committee.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'fellowships' && (
              <motion.div
                key="fellowships"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif">Fellowship Management</h2>
                  <button 
                    onClick={() => {
                      const id = prompt("Fellowship ID (e.g. ktp, kpp, kohhran-hmeichhia):");
                      if (id) handleSaveFellowship(id, { name: "", description: "", purpose: "", imageUrl: "", meetingTime: "", activities: [], members: [], officeBearers: [] });
                    }}
                    className="flex items-center gap-2 text-church-burgundy hover:text-church-gold transition-all font-medium"
                  >
                    <Plus className="h-4 w-4" /> Fellowship thar belhna
                  </button>
                </div>

                <div className="grid gap-6">
                  {fellowships.map((fellowship) => (
                    <div key={fellowship.id} className="p-6 border border-stone-100 rounded-2xl bg-stone-50/50 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Hming</label>
                            <input 
                              type="text" 
                              value={fellowship.name}
                              onChange={(e) => {
                                const newList = fellowships.map(f => f.id === fellowship.id ? { ...f, name: e.target.value } : f);
                                setFellowships(newList);
                              }}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-base text-stone-900 placeholder:text-stone-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Image URL</label>
                            <input 
                              type="text" 
                              value={fellowship.imageUrl || ""}
                              onChange={(e) => {
                                const newList = fellowships.map(f => f.id === fellowship.id ? { ...f, imageUrl: e.target.value } : f);
                                setFellowships(newList);
                              }}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-base text-stone-900 placeholder:text-stone-400"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Hrilhfiahna</label>
                            <input 
                              type="text" 
                              value={fellowship.description}
                              onChange={(e) => {
                                const newList = fellowships.map(f => f.id === fellowship.id ? { ...f, description: e.target.value } : f);
                                setFellowships(newList);
                              }}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-base text-stone-900 placeholder:text-stone-400"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Kan Thiltum / Purpose</label>
                            <textarea 
                              value={fellowship.purpose || ""}
                              onChange={(e) => {
                                const newList = fellowships.map(f => f.id === fellowship.id ? { ...f, purpose: e.target.value } : f);
                                setFellowships(newList);
                              }}
                              rows={2}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-base text-stone-900 placeholder:text-stone-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Inkhawm Hun</label>
                            <input 
                              type="text" 
                              value={fellowship.meetingTime || ""}
                              onChange={(e) => {
                                const newList = fellowships.map(f => f.id === fellowship.id ? { ...f, meetingTime: e.target.value } : f);
                                setFellowships(newList);
                              }}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-base text-stone-900 placeholder:text-stone-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Activities (Comma separated)</label>
                            <input 
                              type="text" 
                              value={fellowship.activities?.join(', ') || ""}
                              onChange={(e) => {
                                const newList = fellowships.map(f => f.id === fellowship.id ? { ...f, activities: e.target.value.split(',').map(s => s.trim()) } : f);
                                setFellowships(newList);
                              }}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-base text-stone-900 placeholder:text-stone-400"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Office Bearers</label>
                            <div className="grid sm:grid-cols-2 gap-4">
                              {(fellowship.officeBearers || []).map((ob: any, obIdx: number) => {
                                const isStructured = typeof ob === 'object' && ob !== null;
                                const role = isStructured ? ob.role : ob.split(':')[0];
                                const name = isStructured ? ob.name : ob.split(':')[1];
                                const phone = isStructured ? ob.phone : "";
                                
                                return (
                                  <div key={obIdx} className="p-3 bg-white border border-stone-200 rounded-xl space-y-2">
                                    <div className="flex justify-between items-center">
                                      <input 
                                        type="text" 
                                        value={role}
                                        onChange={(e) => {
                                          const newList = [...fellowship.officeBearers];
                                          newList[obIdx] = { role: e.target.value, name, phone };
                                          const newFellowships = fellowships.map(f => f.id === fellowship.id ? { ...f, officeBearers: newList } : f);
                                          setFellowships(newFellowships);
                                        }}
                                        className="text-sm font-bold text-emerald-600 uppercase tracking-widest bg-transparent border-none p-0 focus:ring-0 w-full placeholder:text-stone-400"
                                        placeholder="Role"
                                      />
                                      <button 
                                        onClick={() => {
                                          const newList = fellowship.officeBearers.filter((_: any, i: number) => i !== obIdx);
                                          const newFellowships = fellowships.map(f => f.id === fellowship.id ? { ...f, officeBearers: newList } : f);
                                          setFellowships(newFellowships);
                                        }}
                                        className="text-red-400 hover:text-red-600"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <input 
                                      type="text" 
                                      value={name}
                                      onChange={(e) => {
                                        const newList = [...fellowship.officeBearers];
                                        newList[obIdx] = { role, name: e.target.value, phone };
                                        const newFellowships = fellowships.map(f => f.id === fellowship.id ? { ...f, officeBearers: newList } : f);
                                        setFellowships(newFellowships);
                                      }}
                                      placeholder="Hming"
                                      className="w-full text-base border-none p-0 focus:ring-0 text-stone-900 font-medium placeholder:text-stone-400"
                                    />
                                    <input 
                                      type="text" 
                                      value={phone}
                                      onChange={(e) => {
                                        const newList = [...fellowship.officeBearers];
                                        newList[obIdx] = { role, name, phone: e.target.value };
                                        const newFellowships = fellowships.map(f => f.id === fellowship.id ? { ...f, officeBearers: newList } : f);
                                        setFellowships(newFellowships);
                                      }}
                                      placeholder="Phone"
                                      className="w-full text-sm border-none p-0 focus:ring-0 text-stone-600 placeholder:text-stone-400"
                                    />
                                  </div>
                                );
                              })}
                              <button 
                                onClick={() => {
                                  const newList = [...(fellowship.officeBearers || []), { role: "New Role", name: "", phone: "" }];
                                  const newFellowships = fellowships.map(f => f.id === fellowship.id ? { ...f, officeBearers: newList } : f);
                                  setFellowships(newFellowships);
                                }}
                                className="border border-dashed border-stone-300 rounded-xl p-4 text-stone-400 text-xs flex items-center justify-center gap-2 hover:bg-stone-50 transition-all"
                              >
                                <Plus className="h-4 w-4" /> OB belhna
                              </button>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Member-te (Comma separated)</label>
                            <textarea 
                              value={fellowship.members?.join(', ') || ""}
                              onChange={(e) => {
                                const newList = fellowships.map(f => f.id === fellowship.id ? { ...f, members: e.target.value.split(',').map(s => s.trim()) } : f);
                                setFellowships(newList);
                              }}
                              rows={2}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all text-base text-stone-900 placeholder:text-stone-400"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button 
                            onClick={() => handleSaveFellowship(fellowship.id, fellowship)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Save"
                          >
                            <Save className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteFellowship(fellowship.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'inspiration' && (
              <motion.div
                key="inspiration"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-serif">Vawiin Changvawn Management</h2>
                  <p className="text-stone-500">Daily verse leh reflection edit-na hmun.</p>
                </div>

                <div className="p-8 border border-stone-100 rounded-3xl bg-stone-50/50 space-y-6">
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Changvawn (Verse)</label>
                      <textarea 
                        value={inspiration?.verse || ""}
                        onChange={(e) => setInspiration({ ...inspiration, verse: e.target.value })}
                        rows={2}
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all"
                        placeholder="Bible chang dah rawh..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Reference</label>
                      <input 
                        type="text" 
                        value={inspiration?.reference || ""}
                        onChange={(e) => setInspiration({ ...inspiration, reference: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all"
                        placeholder="e.g. John 3:16"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Reflection / Hrilhfiahna</label>
                      <textarea 
                        value={inspiration?.reflection || ""}
                        onChange={(e) => setInspiration({ ...inspiration, reflection: e.target.value })}
                        rows={4}
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all"
                        placeholder="Changvawn hrilhfiahna tawite..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleSaveInspiration(inspiration)}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-church-burgundy text-white px-8 py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-lg font-bold disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                      Vawng tha rawh
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif">Kohhran Member-te</h2>
                  <span className="bg-stone-100 text-stone-600 px-4 py-1 rounded-full text-sm">{users.length} members</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-stone-100">
                        <th className="pb-4 font-medium text-stone-400">Member</th>
                        <th className="pb-4 font-medium text-stone-400">Email</th>
                        <th className="pb-4 font-medium text-stone-400">Role</th>
                        <th className="pb-4 font-medium text-stone-400 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {users.map((u) => (
                        <tr key={u.id} className="group hover:bg-stone-50/50 transition-all">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full border border-stone-200" />
                              <span className="font-medium text-stone-900">{u.displayName}</span>
                            </div>
                          </td>
                          <td className="py-4 text-stone-600">{u.email}</td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-church-gold/20 text-church-gold' : 'bg-stone-100 text-stone-500'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => toggleUserRole(u.id, u.role)}
                              disabled={u.id === user?.uid}
                              className={`p-2 rounded-lg transition-all ${u.id === user?.uid ? 'opacity-30 cursor-not-allowed' : 'hover:bg-stone-200 text-stone-600'}`}
                              title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                            >
                              {u.role === 'admin' ? <UserMinus className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'services' && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif">Inkhawm Hun-te Edit-na</h2>
                  <button 
                    onClick={() => setServices([...services, { title: "", time: "", description: "" }])}
                    className="flex items-center gap-2 text-church-burgundy hover:text-church-gold transition-all font-medium"
                  >
                    <Plus className="h-4 w-4" /> Inkhawm thar belhna
                  </button>
                </div>

                <div className="grid gap-6">
                  {services.map((service, idx) => (
                    <div key={idx} className="p-6 border border-stone-100 rounded-2xl bg-stone-50/50 space-y-4 relative group">
                      <button 
                        onClick={() => setServices(services.filter((_, i) => i !== idx))}
                        className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Inkhawm Hming</label>
                          <input 
                            type="text" 
                            value={service.title}
                            onChange={(e) => {
                              const newServices = [...services];
                              newServices[idx].title = e.target.value;
                              setServices(newServices);
                            }}
                            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all"
                            placeholder="e.g. Pathian Ni Inkhawm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">A Hun</label>
                          <input 
                            type="text" 
                            value={service.time}
                            onChange={(e) => {
                              const newServices = [...services];
                              newServices[idx].time = e.target.value;
                              setServices(newServices);
                            }}
                            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all"
                            placeholder="e.g. 10:30 AM"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Hrilhfiahna</label>
                        <textarea 
                          value={service.description}
                          onChange={(e) => {
                            const newServices = [...services];
                            newServices[idx].description = e.target.value;
                            setServices(newServices);
                          }}
                          rows={2}
                          className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all"
                          placeholder="Inkhawm chungchang hrilhfiahna tawite..."
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-6">
                  <button 
                    onClick={() => saveServices(services)}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-church-burgundy text-white px-8 py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-lg font-bold disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Vawng tha rawh
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'records' && (
              <motion.div
                key="records"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-serif">Record Edit Feature</h2>
                  <p className="text-stone-500">Record hrang hrangte edit leh manage-na hmun.</p>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Baptisma', href: '/records/baptism' },
                    { name: 'Inneihna', href: '/records/wedding' },
                    { name: 'Mitthi', href: '/records/funeral' },
                    { name: 'Inkhawmpui', href: '/records/conference' },
                    { name: 'Pem Dawnsawn', href: '/records/pem-dawnsawn' },
                    { name: 'Pawl Dang', href: '/records/pawl-dang' },
                    { name: 'Minutes', href: '/archive/minutes' },
                    { name: 'Upa kal ta te', href: '/archive/upa-kal-ta-te' },
                  ].map((record) => (
                    <Link 
                      key={record.name}
                      to={record.href}
                      className="p-6 bg-stone-50 border border-stone-100 rounded-2xl hover:bg-white hover:shadow-xl transition-all group flex items-center justify-between"
                    >
                      <span className="font-serif text-lg text-stone-900">{record.name}</span>
                      <Edit className="h-5 w-5 text-stone-400 group-hover:text-church-gold transition-all" />
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
