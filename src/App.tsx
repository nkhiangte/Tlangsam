import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  ChevronRight, 
  Heart, 
  Users, 
  BookOpen,
  Menu,
  X,
  Sparkles,
  Droplets,
  Cross,
  Mic,
  ArrowRightLeft,
  UserPlus,
  FileText,
  ExternalLink,
  Archive as ArchiveIcon,
  History,
  Image as ImageIcon,
  ScrollText,
  LogIn,
  LogOut,
  User,
  Camera,
  Upload,
  Loader2,
  Shield
} from 'lucide-react';
import { getDailyInspiration } from './services/geminiService';
import Baptism from './pages/Records/Baptism';
import Wedding from './pages/Records/Wedding';
import Funeral from './pages/Records/Funeral';
import Conference from './pages/Records/Conference';
import PemDawnsawn from './pages/Records/PemDawnsawn';
import PawlDang from './pages/Records/PawlDang';
import Minutes from './pages/Archive/Minutes';
import UpaKalTaTe from './pages/Archive/UpaKalTaTe';
import Gallery from './pages/Archive/Gallery';
import KohhranHmeichhia from './pages/Fellowship/KohhranHmeichhia';
import KTP from './pages/Fellowship/KTP';
import KPP from './pages/Fellowship/KPP';
import AdminPanel from './pages/Admin/AdminPanel';
import { auth, db, storage } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase Context
interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within a FirebaseProvider');
  return context;
};

const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const isDefaultAdmin = user.email === 'nkhiangte@gmail.com';
        
        try {
          // Check if user is admin in DB
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (isDefaultAdmin && data.role !== 'admin') {
              // Try to upgrade to admin in DB if it's the default admin
              await setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
              setIsAdmin(true);
            } else {
              setIsAdmin(data.role === 'admin' || isDefaultAdmin);
            }
          } else {
            // Create user doc if it doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              role: isDefaultAdmin ? 'admin' : 'user',
              displayName: user.displayName,
              photoURL: user.photoURL
            });
            setIsAdmin(isDefaultAdmin);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          // Fallback to email check if DB fails
          setIsAdmin(isDefaultAdmin);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, login, logout, isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inlam', href: '/' },
    { name: 'Chanchin', href: '/#about' },
    { name: 'Inkhawm', href: '/#services' },
    { 
      name: 'Pawl Hrang Hrang', 
      href: '#',
      dropdown: [
        { name: 'Kohhran Hmeichhia', href: '/fellowship/hmeichhia' },
        { name: 'KTP', href: '/fellowship/ktp' },
        { name: 'KPP', href: '/fellowship/kpp' },
      ]
    },
    { name: 'Record-te', href: '/#records' },
    { name: 'Archive', href: '/#archive' },
    { name: 'Biak Pawhna', href: '/#contact' },
  ];

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith('/#')) {
      const id = href.replace('/#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="https://storage.googleapis.com/static-content-ais-build/applets/oq4isheib3jbvhiqgatqar/logo.png" 
              alt="Tlangsam Presbyterian Logo" 
              className="h-12 w-12 object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <span className={`text-xl font-serif font-bold leading-tight tracking-tight ${scrolled ? 'text-stone-900' : 'text-white'}`}>
                Tlangsam
              </span>
              <span className={`text-sm font-serif font-medium leading-tight opacity-90 ${scrolled ? 'text-church-burgundy' : 'text-church-gold'}`}>
                Presbyterian Church
              </span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.dropdown ? (
                <div key={link.name} className="relative group">
                  <button className={`text-sm font-medium transition-colors hover:text-church-gold flex items-center gap-1 ${scrolled ? 'text-stone-600' : 'text-white/90'}`}>
                    {link.name} <ChevronRight className="h-3 w-3 rotate-90" />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-stone-100">
                    {link.dropdown.map((sub) => (
                      <Link 
                        key={sub.name} 
                        to={sub.href}
                        className="block px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-church-burgundy transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : link.href.startsWith('/#') ? (
                <a 
                  key={link.name} 
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className={`text-sm font-medium transition-colors hover:text-church-gold ${scrolled ? 'text-stone-600' : 'text-white/90'}`}
                >
                  {link.name}
                </a>
              ) : (
                <Link 
                  key={link.name} 
                  to={link.href}
                  className={`text-sm font-medium transition-colors hover:text-church-gold ${scrolled ? 'text-stone-600' : 'text-white/90'}`}
                >
                  {link.name}
                </Link>
              )
            ))}
            
            {user ? (
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className={`text-sm font-medium transition-colors hover:text-church-gold flex items-center gap-1 ${scrolled ? 'text-stone-600' : 'text-white/90'}`}
                  >
                    <Shield className="h-4 w-4" /> Admin Panel
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-stone-200" />
                  <span className={`text-sm font-medium ${scrolled ? 'text-stone-900' : 'text-white'}`}>
                    {isAdmin ? 'Admin' : 'Kohhran Member'}
                  </span>
                </div>
                <button 
                  onClick={logout}
                  className="bg-stone-100 text-stone-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-stone-200 transition-all flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Chhuak rawh
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                className="bg-church-burgundy text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-all shadow-lg flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" /> Lut rawh
              </button>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className={scrolled ? 'text-stone-900' : 'text-white'}>
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white absolute top-full left-0 w-full shadow-xl py-4 px-4 flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              link.dropdown ? (
                <div key={link.name} className="flex flex-col gap-2">
                  <span className="text-stone-400 text-xs font-bold uppercase tracking-widest px-2">{link.name}</span>
                  {link.dropdown.map((sub) => (
                    <Link 
                      key={sub.name} 
                      to={sub.href}
                      onClick={() => setIsOpen(false)}
                      className="text-stone-600 font-medium py-2 px-4 border-l-2 border-stone-100 hover:border-church-burgundy hover:bg-stone-50 transition-all"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              ) : link.href.startsWith('/#') ? (
                <a 
                  key={link.name} 
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className="text-stone-600 font-medium py-2 border-b border-stone-100"
                >
                  {link.name}
                </a>
              ) : (
                <Link 
                  key={link.name} 
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-stone-600 font-medium py-2 border-b border-stone-100"
                >
                  {link.name}
                </Link>
              )
            ))}
            {user ? (
              <button 
                onClick={() => { logout(); setIsOpen(false); }}
                className="bg-stone-100 text-stone-900 px-6 py-3 rounded-xl text-center font-medium flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" /> Chhuak rawh
              </button>
            ) : (
              <button 
                onClick={() => { login(); setIsOpen(false); }}
                className="bg-church-burgundy text-white px-6 py-3 rounded-xl text-center font-medium flex items-center justify-center gap-2"
              >
                <LogIn className="h-4 w-4" /> Lut rawh
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  const { isAdmin } = useAuth();
  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'homepage'), (doc) => {
      if (doc.exists() && doc.data().backgroundImage) {
        setBgImage(doc.data().backgroundImage);
      }
    });
    return unsubscribe;
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `homepage/background_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await setDoc(doc(db, 'settings', 'homepage'), {
        backgroundImage: downloadURL,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      alert('Background thlak a ni ta!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Background thlaknaah hian harsatna a awm: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          alt="Church Interior" 
          className="w-full h-full object-cover brightness-50"
          referrerPolicy="no-referrer"
        />
      </div>
      
      {isAdmin && (
        <div className="absolute top-24 right-4 z-20">
          <label className="cursor-pointer bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all flex items-center gap-2 text-sm">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            <span className="hidden md:inline">Background thlakna</span>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>
        </div>
      )}
      
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-church-gold font-medium tracking-[0.2em] uppercase text-sm mb-6 block">Kan kohhranah kan lo lawm a che</span>
          <div className="mb-12">
            <p className="text-2xl md:text-3xl text-white/90 font-serif font-normal mb-3">
              Mizoram Synod
            </p>
            <h1 className="text-5xl md:text-8xl text-white font-serif font-bold leading-tight tracking-tight">
              Tlangsam Presbyterian Kohhran
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto bg-white text-stone-900 px-8 py-4 rounded-full font-medium hover:bg-stone-100 transition-all flex items-center justify-center gap-2">
              Pathian Ni Inkhawm <ChevronRight className="h-4 w-4" />
            </button>
            <button className="w-full sm:w-auto border border-white/30 text-white backdrop-blur-sm px-8 py-4 rounded-full font-medium hover:bg-white/10 transition-all">
              Kan Chanchin
            </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
          <div className="w-1 h-2 bg-white rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

const DailyInspiration = () => {
  const [inspiration, setInspiration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInspiration = async () => {
      const data = await getDailyInspiration();
      setInspiration(data);
      setLoading(false);
    };
    fetchInspiration();
  }, []);

  return (
    <section className="py-16 bg-stone-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-stone-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="h-24 w-24 text-church-burgundy" />
          </div>
          
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px w-8 bg-church-gold"></div>
            <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Ni tina chakna</span>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-stone-100 rounded w-3/4"></div>
              <div className="h-4 bg-stone-100 rounded w-1/4"></div>
              <div className="h-4 bg-stone-100 rounded w-full"></div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3 className="text-2xl md:text-3xl font-serif text-stone-800 mb-4 italic">
                "{inspiration?.verse}"
              </h3>
              <p className="text-church-burgundy font-medium mb-6">— {inspiration?.reference}</p>
              <p className="text-stone-600 leading-relaxed border-l-2 border-church-gold pl-4">
                {inspiration?.reflection}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'services'), (doc) => {
      if (doc.exists()) {
        setServices(doc.data().list || []);
      } else {
        // Default services if not set in DB
        setServices([
          {
            title: "Pathian Ni Inkhawm",
            time: "10:30 AM",
            description: "Hlabu leh Pathian thu hmanga chibai bukna inkhawm.",
            icon: <Clock className="h-6 w-6" />
          },
          {
            title: "Nilai Zan Thupui Zirna",
            time: "Nilaini 7:00 PM",
            description: "Pathian thu zirhona leh sawihona hun hlu.",
            icon: <BookOpen className="h-6 w-6" />
          },
          {
            title: "Thalai Inkhawm",
            time: "Zirtawpni 6:30 PM",
            description: "Thalaite tana rinna lama thanna leh inpawlhona hun.",
            icon: <Users className="h-6 w-6" />
          }
        ]);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null;

  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif mb-4">Inkhawm Hun-te</h2>
          <p className="text-stone-500 max-w-2xl mx-auto">Pathian chibai buk tura kan inkhawmna hun hrang hrangte.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl border border-stone-100 bg-stone-50 hover:bg-white hover:shadow-xl transition-all duration-300"
            >
              <div className="w-12 h-12 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6">
                {idx === 0 ? <Clock className="h-6 w-6" /> : idx === 1 ? <BookOpen className="h-6 w-6" /> : <Users className="h-6 w-6" />}
              </div>
              <h3 className="text-2xl font-serif mb-2">{service.title}</h3>
              <p className="text-church-gold font-medium mb-4">{service.time}</p>
              <p className="text-stone-600 leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Records = () => {
  const [activeTab, setActiveTab] = useState('Baptisma');

  const tabs = [
    { name: 'Baptisma', icon: <Droplets className="h-5 w-5" /> },
    { name: 'Inneihna', icon: <Heart className="h-5 w-5" /> },
    { name: 'Mitthi', icon: <FileText className="h-5 w-5" /> },
    { name: 'Inkhawmpui', icon: <Mic className="h-5 w-5" /> },
    { name: 'Pem Dawnsawn', icon: <ArrowRightLeft className="h-5 w-5" /> },
    { name: 'Pawl Dang', icon: <UserPlus className="h-5 w-5" /> },
  ];

  const recordContent: Record<string, any> = {
    'Baptisma': {
      title: 'Baptisma Record-te',
      description: 'Tlangsam Presbyterian Kohhran-a baptisma chang tawh zawng zawngte record.',
      stats: 'Baptisma chang tawh 1,200 chuang an awm tawh a ni.',
      recent: ['Lalthlamuana (2024)', 'Zosangzuali (2024)', 'Lalrinawma (2023)'],
      link: '/records/baptism'
    },
    'Inneihna': {
      title: 'Inneihna Record-te',
      description: 'Kan kohhran-a innei tawh zawng zawngte record.',
      stats: 'Inneihna 450 chuang buatsaih a ni tawh a ni.',
      recent: ['Rohlua & Pari (2024)', 'Sanga & Mawii (2023)', 'Tluanga & Tei (2023)'],
      link: '/records/wedding'
    },
    'Mitthi': {
      title: 'Mitthi Record-te',
      description: 'Lalpa hnena chawl tawh kan kohhran member-te record.',
      stats: 'Lalpa hnena chawl tawh kan unaute hriatrengna.',
      recent: ['Pi Liani (2024)', 'Pu Thanga (2024)', 'Pi Pari (2023)'],
      link: '/records/funeral'
    },
    'Inkhawmpui': {
      title: 'Inkhawmpui Record-te',
      description: 'Kohhran inkhawmpui hrang hrang minutes leh report-te.',
      stats: 'Kum tina inkhawmpui thurelte.',
      recent: ['KTP General Conference (2024)', 'Presbytery Meeting (2023)', 'Kohhran Inkhawmpui (2023)'],
      link: '/records/conference'
    },
    'Pem Dawnsawn': {
      title: 'Pem Dawnsawn',
      description: 'Hmun dang atanga kan kohhran-a pem lut tharte record.',
      stats: 'Member thar kan lo lawmte.',
      recent: ['Lalduhawmi from Aizawl', 'Zothana from Lunglei', 'Rina from Champhai'],
      link: '/records/pem-dawnsawn'
    },
    'Pawl Dang': {
      title: 'Pawl Dang atanga lo lut',
      description: 'Pawl dang atanga kan kohhran-a lo lut tharte record.',
      stats: 'Rinna kawng danga kan unau lo zawm ve tute.',
      recent: ['Lalremruata (2024)', 'Zuali (2024)', 'Mawia (2023)'],
      link: '/records/pawl-dang'
    }
  };

  const current = recordContent[activeTab];

  return (
    <section id="records" className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif mb-4">Kohhran Record-te</h2>
          <p className="text-stone-500 max-w-2xl mx-auto">Kan kohhran chanchin leh thil thleng pawimawhte vawn thatna.</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-stone-100">
          <div className="flex flex-wrap border-b border-stone-100 bg-stone-50/50">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative ${
                  activeTab === tab.name 
                    ? 'text-church-burgundy bg-white' 
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`}
              >
                {tab.icon}
                {tab.name}
                {activeTab === tab.name && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-church-burgundy"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid md:grid-cols-2 gap-12 items-start">
                  <div>
                    <h3 className="text-3xl font-serif mb-4 text-stone-900">{current.title}</h3>
                    <p className="text-stone-600 mb-8 leading-relaxed text-lg">
                      {current.description}
                    </p>
                    <div className="bg-church-cream p-6 rounded-2xl border border-church-gold/20">
                      <p className="text-church-burgundy font-medium italic">
                        {current.stats}
                      </p>
                    </div>
                    <Link 
                      to={current.link}
                      className="mt-8 inline-flex items-center gap-2 bg-church-burgundy text-white px-8 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all shadow-lg"
                    >
                      Record-te En rawh <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                  
                  <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100">
                    <h4 className="font-serif text-xl mb-6 text-stone-800 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-church-gold" />
                      Thil thleng thar-te
                    </h4>
                    <ul className="space-y-4">
                      {current.recent.map((entry: string, i: number) => (
                        <li key={i} className="flex items-center gap-3 text-stone-600 pb-3 border-b border-stone-200 last:border-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-church-gold"></div>
                          {entry}
                        </li>
                      ))}
                    </ul>
                    <Link to={current.link} className="mt-8 text-church-burgundy font-medium flex items-center gap-2 hover:gap-3 transition-all">
                      Registry En vek rawh <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

const Archive = () => {
  const archives = [
    {
      title: "Minutes",
      description: "Kohhran committee thureltute vawn thatna.",
      icon: <ScrollText className="h-6 w-6" />,
      link: "/archive/minutes"
    },
    {
      title: "Upa kal ta te",
      description: "Kan kohhran upa hmasa, Lalpa hnena chawl tawhte hriatrengna.",
      icon: <History className="h-6 w-6" />,
      link: "/archive/upa-kal-ta-te"
    },
    {
      title: "Thlalak",
      description: "Kohhran thil thleng hrang hrang thlalakte.",
      icon: <ImageIcon className="h-6 w-6" />,
      link: "/archive/gallery"
    }
  ];

  return (
    <section id="archive" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif mb-4">Kohhran Archive</h2>
          <p className="text-stone-500 max-w-2xl mx-auto">Kan kohhran kal tawh hnu leh thil thlengte vawn thatna.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {archives.map((item, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -10 }}
              className="group p-8 rounded-3xl border border-stone-100 bg-stone-50 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-2xl font-serif mb-4">{item.title}</h3>
              <p className="text-stone-600 leading-relaxed mb-8">{item.description}</p>
              <Link 
                to={item.link}
                className="mt-auto inline-flex items-center gap-2 text-church-burgundy font-medium hover:gap-3 transition-all"
              >
                Archive En rawh <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const About = () => {
  return (
    <section id="about" className="py-24 bg-church-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1548625361-195fe57724e1?q=80&w=1935&auto=format&fit=crop" 
                alt="Church Community" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 bg-church-burgundy p-8 rounded-3xl text-white hidden md:block max-w-xs shadow-xl">
              <p className="font-serif text-2xl italic mb-2">"Khawiah pawh mi pahnih emaw pathum emaw ka hminga an inkhawmna apiangah chuan an zingah ka awm thin a ni."</p>
              <p className="text-sm opacity-80">— Matthaia 18:20</p>
            </div>
          </div>

          <div>
            <span className="text-church-gold font-medium uppercase tracking-widest text-sm mb-4 block">Kan Chanchin</span>
            <h2 className="text-4xl md:text-5xl font-serif mb-8 leading-tight">Tlangsam-a Rinna Hlu</h2>
            <div className="space-y-6 text-stone-600 leading-relaxed text-lg">
              <p>
                Tlangsam Presbyterian Kohhran hi kan khawtlang tana rinna lungphum pawimawh tak a ni a. Pathian thu dik tak vawng nungin, khawvelah Isua Krista chanchin tha puang chhuaktu nih kan tum tlat a ni.
              </p>
              <p>
                Kan thupui ber chu Isua Krista zirtir siam leh Pathian chawimawi a ni a. Tawngtai te, Pathian thu zir te, leh rawngbawlna hrang hrang hmangin kan thawk chhuak thin a ni.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-6">
                <div>
                  <h4 className="text-stone-900 font-serif text-xl mb-2">Kan Vision</h4>
                  <p className="text-sm">Tlangsam khua hi Pathian khawngaihna hmanga tih thar a nih nan.</p>
                </div>
                <div>
                  <h4 className="text-stone-900 font-serif text-xl mb-2">Kan Hlutna</h4>
                  <p className="text-sm">Pathian Thu, Tawngtai, Inpawlhona, Rawngbawlna, leh Khawngaihna.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Contact = () => {
  return (
    <section id="contact" className="py-24 bg-stone-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif mb-8">Biak Pawhna</h2>
            <p className="text-white/60 mb-12 text-lg">Tawngtaipui i ngaihna emaw, zawhna i neih chuan min lo be pawh rawh.</p>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-church-gold">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-serif text-xl mb-1">Kan awmna</h4>
                  <p className="text-white/60">Tlangsam Village, Mizoram, India</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-church-gold">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-serif text-xl mb-1">Phone</h4>
                  <p className="text-white/60">+91 123 456 7890</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-church-gold">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-serif text-xl mb-1">Email</h4>
                  <p className="text-white/60">info@tlangsampresbyterian.org</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-8 md:p-12 rounded-3xl backdrop-blur-sm border border-white/10">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Hming Hmasa</label>
                  <input type="text" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Hming Hnuhnung</label>
                  <input type="text" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Email</label>
                <input type="email" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Thuchah</label>
                <textarea rows={4} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all"></textarea>
              </div>
              <button className="w-full bg-church-gold text-stone-900 font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all">
                Thawn rawh
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-stone-950 text-white py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img 
              src="https://storage.googleapis.com/static-content-ais-build/applets/oq4isheib3jbvhiqgatqar/logo.png" 
              alt="Tlangsam Presbyterian Logo" 
              className="h-10 w-10 object-contain brightness-0 invert"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <span className="text-lg font-serif font-bold tracking-tight">
                Tlangsam
              </span>
              <span className="text-xs font-serif font-medium text-church-gold opacity-80">
                Presbyterian Church
              </span>
            </div>
          </div>
          
          <div className="flex gap-8 text-sm text-white/40">
            <a href="#" className="hover:text-white transition-colors">Vawn Himna</a>
            <a href="#" className="hover:text-white transition-colors">Inkaihhruaina</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
          </div>

          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Tlangsam Presbyterian Kohhran. Dikna zawng zawng vawn a ni.
          </p>
        </div>
      </div>
    </footer>
  );
};

const Home = () => {
  return (
    <>
      <Hero />
      <DailyInspiration />
      <Services />
      <Records />
      <Archive />
      <About />
      <Contact />
    </>
  );
};

export default function App() {
  return (
    <FirebaseProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/records/baptism" element={<Baptism />} />
            <Route path="/records/wedding" element={<Wedding />} />
            <Route path="/records/funeral" element={<Funeral />} />
            <Route path="/records/conference" element={<Conference />} />
            <Route path="/records/pem-dawnsawn" element={<PemDawnsawn />} />
            <Route path="/records/pawl-dang" element={<PawlDang />} />
            <Route path="/archive/minutes" element={<Minutes />} />
            <Route path="/archive/upa-kal-ta-te" element={<UpaKalTaTe />} />
            <Route path="/archive/gallery" element={<Gallery />} />
            <Route path="/fellowship/hmeichhia" element={<KohhranHmeichhia />} />
            <Route path="/fellowship/ktp" element={<KTP />} />
            <Route path="/fellowship/kpp" element={<KPP />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </FirebaseProvider>
  );
}
