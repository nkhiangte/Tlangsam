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
  Sparkles, 
  Camera, 
  Ban, 
  Lock, 
  Unlock, 
  UserPlus,
  ExternalLink,
  Search,
  CheckCircle,
  FileSpreadsheet,
  Phone
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { db, storage, handleFirestoreError, OperationType } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import { useAuth } from '../../context/AuthContext';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { InkhawmProgrammeManager } from '../../components/Admin/InkhawmProgrammeManager';

const DEFAULT_COMMITTEE_LIST = [
  { id: 'kohhran', name: 'Kohhran Committee', description: 'Kohhran inrelbawlna leh hmalakna hrang hrangte reltu leh kengkawhtu bawk.' },
  { id: 'sunday-school', name: 'Sunday School Committee', description: 'Sunday School zirlaibu, zirtirtute leh naupangte enkawlna leh hmalakna.' },
  { id: 'ramthar', name: 'Ramthar Committee', description: 'Chanchin tha puandarhna leh Ramthar rawngbawlna puih leh buaipui kawnga hmalatu.' },
  { id: 'bsi', name: 'BSI Committee', description: 'Bible Society of India rawngbawlna leh Bible thehdarh kawnga Kohhran hmalakna.' },
  { id: 'refreshment', name: 'Refreshment Committee', description: 'Kohhran inkhawmpui, ruai leh programme hrang hranga eitur leh in tur ruahmanna buaipuitu.' },
  { id: 'light-sound', name: 'Light & Sound Committee', description: 'Biak In leh hall hrang hranga eng leh sound system enkawl leh buaipuitu.' }
];

const DEFAULT_OB_ROLES = [
  "Chairman",
  "Vice Chairman",
  "Secretary",
  "Asst. Secretary",
  "Treasurer",
  "Finance Secretary"
];

const AdminPanel = () => {
  const { isAdmin, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tabParam = searchParams.get('tab') as 'users' | 'services' | 'records' | 'committees' | 'fellowships' | 'inspiration' | null;
  const [activeTab, setActiveTab] = useState<'users' | 'services' | 'records' | 'committees' | 'fellowships' | 'inspiration'>(
    tabParam && ['users', 'services', 'records', 'committees', 'fellowships', 'inspiration'].includes(tabParam) ? tabParam : 'users'
  );
  
  const [users, setUsers] = useState<any[]>([]);
  const [committees, setCommittees] = useState<any[]>([]);
  const [fellowships, setFellowships] = useState<any[]>([]);
  const [inspiration, setInspiration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Committee Management States
  const [committeeSearch, setCommitteeSearch] = useState('');
  const [isCreateCommitteeModalOpen, setIsCreateCommitteeModalOpen] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommId, setNewCommId] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [newCommMeeting, setNewCommMeeting] = useState('Thla tin Thawhtan zan hmasa ber');
  const [newCommIncludeOB, setNewCommIncludeOB] = useState(true);
  const [isCreatingCommittee, setIsCreatingCommittee] = useState(false);

  // Auto-slugify committee name to ID if ID is not manually modified
  const handleCommNameChange = (val: string) => {
    setNewCommName(val);
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setNewCommId(slug);
  };

  const handleCreateNewCommitteeCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim()) {
      alert("Committee hming ziak rawh le.");
      return;
    }
    
    const finalId = (newCommId.trim() || newCommName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/^-+|-+$/g, '');
    if (!finalId) {
      alert("Committee ID dik tawk lo.");
      return;
    }

    setIsCreatingCommittee(true);
    try {
      const initialOB = newCommIncludeOB 
        ? DEFAULT_OB_ROLES.map(role => ({ role, name: '', phone: '' }))
        : [];

      const newCommitteeDoc = {
        name: newCommName.trim(),
        description: newCommDesc.trim() || `${newCommName.trim()} rawngbawlna leh hmalakna hrang hrangte.`,
        meetingTime: newCommMeeting.trim() || 'Committee thutkhawm hun leh hmun hrang hrangte.',
        officeBearers: initialOB,
        members: [],
        activities: [],
        reports: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'committees', finalId), newCommitteeDoc, { merge: true });
      
      // Reset form
      setNewCommName('');
      setNewCommId('');
      setNewCommDesc('');
      setNewCommMeeting('Thla tin Thawhtan zan hmasa ber');
      setIsCreateCommitteeModalOpen(false);

      alert(`"${newCommitteeDoc.name}" category thar siam a ni ta! Committee page-ah i kal thei e.`);
      navigate(`/committee/${finalId}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `committees/${finalId}`);
    } finally {
      setIsCreatingCommittee(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword || !newUserName) return;
    setIsCreatingUser(true);
    try {
      const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp' + Date.now());
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUserEmail, newUserPassword);
      await firebaseSignOut(secondaryAuth);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: newUserEmail,
        displayName: newUserName,
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString()
      });
      
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      alert('User thar siam a ni ta!');
    } catch (error: any) {
      alert('User siam theih a ni lo: ' + error.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return unsubscribe;
  }, [isAdmin]);

  // Fetch committees
  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = onSnapshot(collection(db, 'committees'), (snapshot) => {
      const dbMap = new Map<string, any>();
      
      // Default baseline
      DEFAULT_COMMITTEE_LIST.forEach(def => {
        dbMap.set(def.id, {
          id: def.id,
          name: def.name,
          description: def.description,
          meetingTime: "Committee thutkhawm hun leh hmun hrang hrangte.",
          officeBearers: DEFAULT_OB_ROLES.map(role => ({ role, name: '', phone: '' })),
          members: [],
          activities: [],
          reports: ''
        });
      });

      // Overlay Firestore data
      snapshot.docs.forEach(docSnap => {
        const d = docSnap.data();
        const existing = dbMap.get(docSnap.id) || {};
        dbMap.set(docSnap.id, {
          id: docSnap.id,
          ...existing,
          ...d
        });
      });

      setCommittees(Array.from(dbMap.values()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'committees');
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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fellowships');
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
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/inspiration');
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

  const updateUserStatus = async (userId: string, newStatus: 'active' | 'banned' | 'blocked') => {
    if (userId === user?.uid) {
      alert("I mahni status i thlak thei lo.");
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
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

  const handleFellowshipLogoUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `fellowships/${id}/logo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const newFellowships = fellowships.map(f => f.id === id ? { ...f, logoUrl: downloadURL } : f);
      setFellowships(newFellowships);
      
      // Auto-save if it's an existing fellowship
      await updateDoc(doc(db, 'fellowships', id), {
        logoUrl: downloadURL,
        updatedAt: new Date().toISOString()
      });
      
      alert('Logo thlak a ni ta!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Logo thlaknaah hian harsatna a awm: ' + (error instanceof Error ? error.message : String(error)));
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
    <div className="min-h-screen bg-stone-50">
      {/* Page Header */}
      <div className="bg-stone-900 pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-8 bg-church-gold"></div>
            <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Enkawltu Pual</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">Admin Control Panel</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-church-burgundy font-medium hover:gap-3 transition-all mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
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
                {/* Header & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
                      Committee Categories ({committees.length})
                    </h2>
                    <p className="text-sm text-stone-500 mt-1">
                      Committee category thar siam leh OB / member-te enkawlna hmun.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input 
                        type="text" 
                        value={committeeSearch}
                        onChange={(e) => setCommitteeSearch(e.target.value)}
                        placeholder="Search committee..."
                        className="pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-church-gold"
                      />
                    </div>
                    <button 
                      onClick={() => setIsCreateCommitteeModalOpen(true)}
                      className="flex items-center gap-2 bg-church-burgundy hover:bg-church-burgundy/90 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4" /> Category Thar Belhna
                    </button>
                  </div>
                </div>

                {/* Modal for Creating New Committee Category */}
                <AnimatePresence>
                  {isCreateCommitteeModalOpen && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-stone-100 overflow-hidden"
                      >
                        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-church-burgundy">Committee Management</span>
                            <h3 className="text-xl font-serif font-bold text-stone-900 mt-1">Committee Category Thar Siamna</h3>
                          </div>
                          <button 
                            onClick={() => setIsCreateCommitteeModalOpen(false)}
                            className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <form onSubmit={handleCreateNewCommitteeCategory} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                              Committee Hming / Category Name <span className="text-red-500">*</span>
                            </label>
                            <input 
                              type="text" 
                              required
                              value={newCommName}
                              onChange={(e) => handleCommNameChange(e.target.value)}
                              placeholder="e.g. Building Committee, Music & Choir Committee"
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 font-medium focus:outline-none focus:border-church-gold"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                              URL Slug / Identifier <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-stone-400 font-mono">/committee/</span>
                              <input 
                                type="text" 
                                required
                                value={newCommId}
                                onChange={(e) => setNewCommId(e.target.value)}
                                placeholder="building-committee"
                                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 font-mono text-sm focus:outline-none focus:border-church-gold"
                              />
                            </div>
                            <p className="text-[11px] text-stone-400 mt-1">Hemi URL hmang hian committee page a in hawng ang.</p>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                              Hrilhfiahna / Description
                            </label>
                            <textarea 
                              value={newCommDesc}
                              onChange={(e) => setNewCommDesc(e.target.value)}
                              rows={2}
                              placeholder="He committee mawhphurhna leh hmalaknate..."
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 text-sm focus:outline-none focus:border-church-gold"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                              Inkhawm / Meeting Time
                            </label>
                            <input 
                              type="text" 
                              value={newCommMeeting}
                              onChange={(e) => setNewCommMeeting(e.target.value)}
                              placeholder="e.g. Thla tin Thawhtan zan hmasa ber"
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 text-sm focus:outline-none focus:border-church-gold"
                            />
                          </div>

                          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex items-center gap-3 cursor-pointer" onClick={() => setNewCommIncludeOB(!newCommIncludeOB)}>
                            <input 
                              type="checkbox"
                              checked={newCommIncludeOB}
                              onChange={(e) => setNewCommIncludeOB(e.target.checked)}
                              className="h-4 w-4 rounded accent-church-burgundy"
                            />
                            <div className="text-xs">
                              <span className="font-bold text-stone-800">Office Bearer (OB) pangngai 6 te telh nghal rawh</span>
                              <p className="text-stone-500 mt-0.5">Chairman, Vice Chairman, Secretary, Asst. Secretary, Treasurer, Finance Secretary</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                            <button 
                              type="button"
                              onClick={() => setIsCreateCommitteeModalOpen(false)}
                              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit"
                              disabled={isCreatingCommittee}
                              className="flex items-center gap-2 px-6 py-2.5 bg-church-burgundy hover:bg-church-burgundy/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all disabled:opacity-50"
                            >
                              {isCreatingCommittee ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                              Siam & Open Page
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Committees List */}
                <div className="grid gap-6">
                  {committees
                    .filter(c => 
                      !committeeSearch || 
                      (c.name || '').toLowerCase().includes(committeeSearch.toLowerCase()) || 
                      (c.id || '').toLowerCase().includes(committeeSearch.toLowerCase())
                    )
                    .map((committee) => (
                    <div key={committee.id} className="p-6 border border-stone-200 rounded-3xl bg-white shadow-sm space-y-5 hover:border-church-gold/40 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-church-burgundy/10 text-church-burgundy flex items-center justify-center font-bold font-serif text-lg">
                            {committee.name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-serif font-bold text-stone-900">
                                {committee.name || committee.id}
                              </h3>
                              <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md font-mono text-[11px]">
                                /committee/{committee.id}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 line-clamp-1">{committee.description || "No description"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/committee/${committee.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-church-gold/10 hover:bg-church-gold/20 text-church-gold rounded-xl text-xs font-bold transition-all"
                            title="Open Public Committee Page"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Open Page & CSV
                          </Link>
                          <button 
                            onClick={() => handleSaveCommittee(committee.id, committee)}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                            title="Save Changes"
                          >
                            <Save className="h-3.5 w-3.5" /> Save
                          </button>
                          <button 
                            onClick={() => handleDeleteCommittee(committee.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete this committee category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Hming (Committee Name)</label>
                          <input 
                            type="text" 
                            value={committee.name || ""}
                            onChange={(e) => {
                              const newList = committees.map(c => c.id === committee.id ? { ...c, name: e.target.value } : c);
                              setCommittees(newList);
                            }}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 text-sm focus:outline-none focus:border-church-gold"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Hrilhfiahna (Description)</label>
                          <input 
                            type="text" 
                            value={committee.description || ""}
                            onChange={(e) => {
                              const newList = committees.map(c => c.id === committee.id ? { ...c, description: e.target.value } : c);
                              setCommittees(newList);
                            }}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 text-sm focus:outline-none focus:border-church-gold"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Inkhawm Hun / Meeting Time</label>
                          <input 
                            type="text" 
                            value={committee.meetingTime || ""}
                            onChange={(e) => {
                              const newList = committees.map(c => c.id === committee.id ? { ...c, meetingTime: e.target.value } : c);
                              setCommittees(newList);
                            }}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-900 text-sm focus:outline-none focus:border-church-gold"
                          />
                        </div>

                        {/* Office Bearers in Admin Panel */}
                        <div className="md:col-span-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                              Office Bearers ({committee.officeBearers?.length || 0})
                            </label>
                            <button 
                              onClick={() => {
                                const newList = [...(committee.officeBearers || []), { role: "Role Thar", name: "", phone: "" }];
                                const newCommittees = committees.map(c => c.id === committee.id ? { ...c, officeBearers: newList } : c);
                                setCommittees(newCommittees);
                              }}
                              className="text-xs font-bold text-church-burgundy hover:text-church-gold transition-colors flex items-center gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> OB Belhna
                            </button>
                          </div>

                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(committee.officeBearers || []).map((ob: any, obIdx: number) => {
                              const isStructured = typeof ob === 'object' && ob !== null;
                              const role = isStructured ? ob.role : ob.split(':')[0];
                              const name = isStructured ? ob.name : ob.split(':')[1];
                              const phone = isStructured ? (ob.phone || "") : "";
                              
                              return (
                                <div key={obIdx} className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
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
                                      className="text-xs font-bold text-church-burgundy uppercase tracking-wider bg-transparent border-none p-0 focus:ring-0 w-full placeholder:text-stone-400"
                                      placeholder="Role"
                                    />
                                    <button 
                                      onClick={() => {
                                        const newList = committee.officeBearers.filter((_: any, i: number) => i !== obIdx);
                                        const newCommittees = committees.map(c => c.id === committee.id ? { ...c, officeBearers: newList } : c);
                                        setCommittees(newCommittees);
                                      }}
                                      className="text-red-400 hover:text-red-600 p-1"
                                      title="Remove OB"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
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
                                    className="w-full text-sm bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-900 font-medium placeholder:text-stone-400"
                                  />
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                    <input 
                                      type="text" 
                                      value={phone}
                                      onChange={(e) => {
                                        const newList = [...committee.officeBearers];
                                        newList[obIdx] = { role, name, phone: e.target.value };
                                        const newCommittees = committees.map(c => c.id === committee.id ? { ...c, officeBearers: newList } : c);
                                        setCommittees(newCommittees);
                                      }}
                                      placeholder="Phone number"
                                      className="w-full text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-stone-700 placeholder:text-stone-400"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Members Summary / Link */}
                        <div className="md:col-span-3 bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                              Committee Members ({Array.isArray(committee.members) ? committee.members.length : 0} members)
                            </span>
                            <p className="text-xs text-stone-500 mt-0.5">
                              Committee member-te hi CSV/Excel hmangin awlsam takin a upload theih a, phone number nen call/WhatsApp theih a ni.
                            </p>
                          </div>
                          <Link 
                            to={`/committee/${committee.id}`}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap"
                          >
                            <FileSpreadsheet className="h-4 w-4 text-church-gold" /> Upload CSV / Manage Members
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}

                  {committees.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-3xl">
                      <p className="text-stone-400 text-sm">Committee category engmah hmuh a ni lo.</p>
                      <button 
                        onClick={() => setIsCreateCommitteeModalOpen(true)}
                        className="mt-3 text-church-burgundy font-bold text-xs uppercase tracking-wider hover:underline"
                      >
                        + Category Thar Belh Rawh
                      </button>
                    </div>
                  )}
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
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Logo</label>
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200">
                                {fellowship.logoUrl ? (
                                  <img src={fellowship.logoUrl} alt="" className="w-full h-full object-contain" />
                                ) : (
                                  <Users className="w-8 h-8 text-stone-300" />
                                )}
                              </div>
                              <label className="cursor-pointer bg-stone-100 hover:bg-stone-200 text-stone-600 px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2">
                                <Camera className="h-4 w-4" />
                                <span>Logo thlakna</span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={(e) => handleFellowshipLogoUpload(fellowship.id, e)}
                                />
                              </label>
                            </div>
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
                      Save
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
                
                {/* Create New User Form */}
                <div className="bg-stone-50 border border-stone-100 p-6 rounded-2xl mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-4 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" /> User Thar Siamna
                  </h3>
                  <form onSubmit={handleCreateUser} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full">
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Hming</label>
                      <input 
                        type="text" 
                        value={newUserName}
                        onChange={e => setNewUserName(e.target.value)}
                        required
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-burgundy"
                      />
                    </div>
                    <div className="w-full">
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Email</label>
                      <input 
                        type="email" 
                        value={newUserEmail}
                        onChange={e => setNewUserEmail(e.target.value)}
                        required
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-burgundy"
                      />
                    </div>
                    <div className="w-full">
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Password</label>
                      <input 
                        type="password" 
                        value={newUserPassword}
                        onChange={e => setNewUserPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-church-burgundy"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isCreatingUser}
                      className="w-full md:w-auto bg-church-burgundy text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      {isCreatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Siam Rawh'}
                    </button>
                  </form>
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
                              <div className="flex flex-col">
                                <span className="font-medium text-stone-900">{u.displayName}</span>
                                {u.status && u.status !== 'active' && (
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${u.status === 'banned' ? 'text-red-500' : 'text-orange-500'}`}>
                                    {u.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-stone-600">{u.email}</td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-church-gold/20 text-church-gold' : 'bg-stone-100 text-stone-500'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Role Toggle */}
                              <button 
                                onClick={() => toggleUserRole(u.id, u.role)}
                                disabled={u.id === user?.uid}
                                className={`p-2 rounded-lg transition-all ${u.id === user?.uid ? 'opacity-30 cursor-not-allowed' : 'hover:bg-stone-200 text-stone-600'}`}
                                title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                              >
                                {u.role === 'admin' ? <UserMinus className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                              </button>

                              {/* Block/Unblock */}
                              <button 
                                onClick={() => updateUserStatus(u.id, u.status === 'blocked' ? 'active' : 'blocked')}
                                disabled={u.id === user?.uid}
                                className={`p-2 rounded-lg transition-all ${u.id === user?.uid ? 'opacity-30 cursor-not-allowed' : 'hover:bg-stone-200 text-orange-500'}`}
                                title={u.status === 'blocked' ? 'Unblock User' : 'Block User'}
                              >
                                {u.status === 'blocked' ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                              </button>

                              {/* Ban/Unban */}
                              <button 
                                onClick={() => {
                                  if (u.status === 'banned') {
                                    updateUserStatus(u.id, 'active');
                                  } else {
                                    if (window.confirm(`${u.displayName} hi ban i duh tak tak em?`)) {
                                      updateUserStatus(u.id, 'banned');
                                    }
                                  }
                                }}
                                disabled={u.id === user?.uid}
                                className={`p-2 rounded-lg transition-all ${u.id === user?.uid ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-50 text-red-500'}`}
                                title={u.status === 'banned' ? 'Unban User' : 'Ban User'}
                              >
                                <Ban className="h-5 w-5" />
                              </button>
                            </div>
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
              >
                <InkhawmProgrammeManager />
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
