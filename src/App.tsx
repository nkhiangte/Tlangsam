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
  Shield,
  Settings
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
import About from './pages/About';
import ServicesPage from './pages/Services';
import RecordsPage from './pages/Records';
import ArchivePage from './pages/Archive';
import ContactPage from './pages/Contact';
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
  const [logoUrl, setLogoUrl] = useState('https://storage.googleapis.com/static-content-ais-build/applets/oq4isheib3jbvhiqgatqar/logo.png');
  const [logoSize, setLogoSize] = useState(48);
  const [showSizeSlider, setShowSizeSlider] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user, login, logout, isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const unsubscribe = onSnapshot(doc(db, 'settings', 'homepage'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.logoSize) setLogoSize(data.logoSize);
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  const handleLogoSizeChange = async (newSize: number) => {
    setLogoSize(newSize);
    try {
      await setDoc(doc(db, 'settings', 'homepage'), {
        logoSize: newSize,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating logo size:', error);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `branding/logo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await setDoc(doc(db, 'settings', 'homepage'), {
        logoUrl: downloadURL,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      alert('Logo thlak a ni ta!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Logo thlaknaah hian harsatna a awm: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setUploading(false);
    }
  };

  const navLinks = [
    { name: 'Inlam', href: '/' },
    { name: 'Chanchin', href: '/about' },
    { name: 'Inkhawm', href: '/services' },
    { 
      name: 'Pawl Hrang Hrang', 
      href: '#',
      dropdown: [
        { name: 'Kohhran Hmeichhia', href: '/fellowship/hmeichhia' },
        { name: 'KTP', href: '/fellowship/ktp' },
        { name: 'KPP', href: '/fellowship/kpp' },
      ]
    },
    { name: 'Record-te', href: '/records' },
    { name: 'Archive', href: '/archive' },
    { name: 'Biak Pawhna', href: '/contact' },
  ];

  const handleNavClick = (href: string) => {
    setIsOpen(false);
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4 group relative">
            <div className="relative flex items-center">
              <Link to="/" className="block transition-transform hover:scale-105">
                <img 
                  src={logoUrl} 
                  alt="Tlangsam Presbyterian Logo" 
                  style={{ 
                    height: `${logoSize}px`, 
                    width: 'auto',
                    maxHeight: scrolled ? '80px' : '120px',
                    imageRendering: 'auto'
                  }}
                  className="object-contain transition-all duration-300 drop-shadow-sm"
                  referrerPolicy="no-referrer"
                />
              </Link>
              {isAdmin && (
                <div className="absolute -bottom-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <label className="bg-church-burgundy text-white p-1 rounded-full cursor-pointer shadow-lg">
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                  </label>
                  <button 
                    onClick={() => setShowSizeSlider(!showSizeSlider)}
                    className="bg-church-gold text-white p-1 rounded-full cursor-pointer shadow-lg"
                  >
                    <Settings className="h-3 w-3" />
                  </button>
                  
                  {showSizeSlider && (
                    <div className="absolute top-full mt-2 left-0 bg-white p-3 rounded-xl shadow-xl border border-stone-100 w-48 z-50">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400 mb-2">Logo Size: {logoSize}px</p>
                      <input 
                        type="range" 
                        min="32" 
                        max="300" 
                        value={logoSize} 
                        onChange={(e) => handleLogoSizeChange(parseInt(e.target.value))}
                        className="w-full h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-church-gold"
                      />
                      <div className="flex justify-between text-[8px] text-stone-400 mt-1">
                        <span>Small</span>
                        <span>Large</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Link to="/" className="flex flex-col justify-center">
              <span className={`text-xl font-serif font-bold leading-none tracking-tight ${scrolled ? 'text-stone-900' : 'text-white'}`}>
                Tlangsam
              </span>
              <span className={`text-sm font-serif font-medium leading-none mt-1 opacity-90 ${scrolled ? 'text-church-burgundy' : 'text-church-gold'}`}>
                Presbyterian Church
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.dropdown ? (
                <div key={link.name} className="relative group">
                  <button className={`text-lg font-semibold transition-colors hover:text-church-gold flex items-center gap-1 ${scrolled ? 'text-stone-600' : 'text-white/90'}`}>
                    {link.name} <ChevronRight className="h-4 w-4 rotate-90" />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-stone-100">
                    {link.dropdown.map((sub) => (
                      <Link 
                        key={sub.name} 
                        to={sub.href}
                        className="block px-4 py-2 text-base text-stone-600 hover:bg-stone-50 hover:text-church-burgundy transition-colors"
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
                  className={`text-lg font-semibold transition-colors hover:text-church-gold ${scrolled ? 'text-stone-600' : 'text-white/90'}`}
                >
                  {link.name}
                </a>
              ) : (
                <Link 
                  key={link.name} 
                  to={link.href}
                  className={`text-lg font-semibold transition-colors hover:text-church-gold ${scrolled ? 'text-stone-600' : 'text-white/90'}`}
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
                    className={`text-lg font-semibold transition-colors hover:text-church-gold flex items-center gap-1 ${scrolled ? 'text-stone-600' : 'text-white/90'}`}
                  >
                    <Shield className="h-5 w-5" /> Admin Panel
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
            <p className="text-xl md:text-2xl text-white/90 font-serif font-normal mb-3">
              Mizoram Synod
            </p>
            <h1 className="text-3xl md:text-5xl text-white font-serif font-bold leading-tight tracking-tight whitespace-nowrap">
              Tlangsam Presbyterian Kohhran
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/services" className="w-full sm:w-auto bg-white text-stone-900 px-8 py-4 rounded-full font-medium hover:bg-stone-100 transition-all flex items-center justify-center gap-2">
              Pathian Ni Inkhawm <ChevronRight className="h-4 w-4" />
            </Link>
            <Link to="/about" className="w-full sm:w-auto border border-white/30 text-white backdrop-blur-sm px-8 py-4 rounded-full font-medium hover:bg-white/10 transition-all text-center">
              Kan Chanchin
            </Link>
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

const Footer = () => {
  const [logoUrl, setLogoUrl] = useState('https://storage.googleapis.com/static-content-ais-build/applets/oq4isheib3jbvhiqgatqar/logo.png');
  const [logoSize, setLogoSize] = useState(40);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'homepage'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.logoSize) setLogoSize(Math.max(32, data.logoSize * 0.8)); // Footer logo slightly smaller
      }
    });
    return unsubscribe;
  }, []);

  return (
    <footer className="bg-stone-950 text-white py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img 
              src={logoUrl} 
              alt="Tlangsam Presbyterian Logo" 
              style={{ height: `${logoSize}px`, width: `${logoSize}px` }}
              className="object-contain brightness-0 invert"
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
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/contact" element={<ContactPage />} />
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
