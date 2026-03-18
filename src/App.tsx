import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Church, 
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
  User
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
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
        // Check if user is admin
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().role === 'admin');
        } else {
          // Create user doc if it doesn't exist
          const isDefaultAdmin = user.email === 'nkhiangte@gmail.com';
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            role: isDefaultAdmin ? 'admin' : 'user',
            displayName: user.displayName,
            photoURL: user.photoURL
          });
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
    { name: 'Home', href: '/' },
    { name: 'About', href: '/#about' },
    { name: 'Services', href: '/#services' },
    { name: 'Records', href: '/#records' },
    { name: 'Archive', href: '/#archive' },
    { name: 'Events', href: '/#events' },
    { name: 'Contact', href: '/#contact' },
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
          <Link to="/" className="flex items-center gap-2">
            <Church className={`h-8 w-8 ${scrolled ? 'text-church-burgundy' : 'text-white'}`} />
            <span className={`text-xl font-serif font-bold tracking-tight ${scrolled ? 'text-stone-900' : 'text-white'}`}>
              Tlangsam Presbyterian
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.href.startsWith('/#') ? (
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
                <div className="flex items-center gap-2">
                  <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-stone-200" />
                  <span className={`text-sm font-medium ${scrolled ? 'text-stone-900' : 'text-white'}`}>
                    {isAdmin ? 'Admin' : 'Member'}
                  </span>
                </div>
                <button 
                  onClick={logout}
                  className="bg-stone-100 text-stone-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-stone-200 transition-all flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                className="bg-church-burgundy text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-all shadow-lg flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" /> Login
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
              link.href.startsWith('/#') ? (
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
                <LogOut className="h-4 w-4" /> Logout
              </button>
            ) : (
              <button 
                onClick={() => { login(); setIsOpen(false); }}
                className="bg-church-burgundy text-white px-6 py-3 rounded-xl text-center font-medium flex items-center justify-center gap-2"
              >
                <LogIn className="h-4 w-4" /> Login
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop" 
          alt="Church Interior" 
          className="w-full h-full object-cover brightness-50"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-church-gold font-medium tracking-[0.2em] uppercase text-sm mb-4 block">Welcome to our community</span>
          <h1 className="text-5xl md:text-7xl text-white font-serif mb-6 leading-tight">
            Faith, Hope, and Love in the Heart of Tlangsam
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 font-light max-w-2xl mx-auto">
            Join us as we worship together, grow in faith, and serve our community with the grace of God.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto bg-white text-stone-900 px-8 py-4 rounded-full font-medium hover:bg-stone-100 transition-all flex items-center justify-center gap-2">
              Join Us This Sunday <ChevronRight className="h-4 w-4" />
            </button>
            <button className="w-full sm:w-auto border border-white/30 text-white backdrop-blur-sm px-8 py-4 rounded-full font-medium hover:bg-white/10 transition-all">
              Learn Our Story
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
            <span className="text-church-gold font-medium uppercase tracking-widest text-xs">Daily Inspiration</span>
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
  const services = [
    {
      title: "Sunday Worship",
      time: "10:30 AM",
      description: "A traditional service with hymns, scripture, and a message of hope.",
      icon: <Clock className="h-6 w-6" />
    },
    {
      title: "Bible Study",
      time: "Wednesday 7:00 PM",
      description: "Deepen your understanding of the Word in an interactive group setting.",
      icon: <BookOpen className="h-6 w-6" />
    },
    {
      title: "Youth Fellowship",
      time: "Friday 6:30 PM",
      description: "A vibrant space for young people to connect and grow in faith.",
      icon: <Users className="h-6 w-6" />
    }
  ];

  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif mb-4">Join Us in Worship</h2>
          <p className="text-stone-500 max-w-2xl mx-auto">We offer various opportunities to gather, learn, and grow together throughout the week.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl border border-stone-100 bg-stone-50 hover:bg-white hover:shadow-xl transition-all duration-300"
            >
              <div className="w-12 h-12 bg-church-burgundy/10 rounded-2xl flex items-center justify-center text-church-burgundy mb-6">
                {service.icon}
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
  const [activeTab, setActiveTab] = useState('Baptism');

  const tabs = [
    { name: 'Baptism', icon: <Droplets className="h-5 w-5" /> },
    { name: 'Wedding', icon: <Heart className="h-5 w-5" /> },
    { name: 'Funeral', icon: <FileText className="h-5 w-5" /> },
    { name: 'Conference', icon: <Mic className="h-5 w-5" /> },
    { name: 'Pem Dawnsawn', icon: <ArrowRightLeft className="h-5 w-5" /> },
    { name: 'Pawl Dang atanga lo lut', icon: <UserPlus className="h-5 w-5" /> },
  ];

  const recordContent: Record<string, any> = {
    'Baptism': {
      title: 'Baptism Records',
      description: 'Records of holy baptism administered at Tlangsam Presbyterian Church.',
      stats: 'Over 1,200 baptisms recorded since inception.',
      recent: ['Lalthlamuana (2024)', 'Zosangzuali (2024)', 'Lalrinawma (2023)'],
      link: '/records/baptism'
    },
    'Wedding': {
      title: 'Wedding Records',
      description: 'Sacred unions blessed and recorded in our church registry.',
      stats: '450+ marriages solemnized.',
      recent: ['Rohlua & Pari (2024)', 'Sanga & Mawii (2023)', 'Tluanga & Tei (2023)'],
      link: '/records/wedding'
    },
    'Funeral': {
      title: 'Funeral Records',
      description: 'Honoring the lives of our members who have gone to be with the Lord.',
      stats: 'Respectful records of our departed brothers and sisters.',
      recent: ['Pi Liani (2024)', 'Pu Thanga (2024)', 'Pi Pari (2023)'],
      link: '/records/funeral'
    },
    'Conference': {
      title: 'Conference Records',
      description: 'Minutes and reports from various church conferences and meetings.',
      stats: 'Annual and biennial conference proceedings.',
      recent: ['KTP General Conference (2024)', 'Presbytery Meeting (2023)', 'Kohhran Inkhawmpui (2023)'],
      link: '/records/conference'
    },
    'Pem Dawnsawn': {
      title: 'Pem Dawnsawn (Transfer In)',
      description: 'Records of members who have transferred their membership to Tlangsam.',
      stats: 'Welcoming new members into our local fold.',
      recent: ['Lalduhawmi from Aizawl', 'Zothana from Lunglei', 'Rina from Champhai'],
      link: '/records/pem-dawnsawn'
    },
    'Pawl Dang atanga lo lut': {
      title: 'Pawl Dang atanga lo lut',
      description: 'Members joining us from other denominations.',
      stats: 'Growing our family through diverse spiritual backgrounds.',
      recent: ['Lalremruata (2024)', 'Zuali (2024)', 'Mawia (2023)'],
      link: '/records/pawl-dang'
    }
  };

  const current = recordContent[activeTab];

  return (
    <section id="records" className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif mb-4">Church Records</h2>
          <p className="text-stone-500 max-w-2xl mx-auto">Maintaining the history and milestones of our congregation with diligence and care.</p>
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
                      Open Full Records <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                  
                  <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100">
                    <h4 className="font-serif text-xl mb-6 text-stone-800 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-church-gold" />
                      Recent Entries
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
                      View Full Registry <ChevronRight className="h-4 w-4" />
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
      description: "Official records of church committee meetings and decisions.",
      icon: <ScrollText className="h-6 w-6" />,
      link: "/archive/minutes"
    },
    {
      title: "Upa kal ta te",
      description: "Honoring the memory and service of our deceased elders.",
      icon: <History className="h-6 w-6" />,
      link: "/archive/upa-kal-ta-te"
    },
    {
      title: "Gallery",
      description: "Visual journey of our church life, events, and community.",
      icon: <ImageIcon className="h-6 w-6" />,
      link: "/archive/gallery"
    }
  ];

  return (
    <section id="archive" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif mb-4">Church Archive</h2>
          <p className="text-stone-500 max-w-2xl mx-auto">Preserving our heritage and documenting our journey of faith for future generations.</p>
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
                Explore Archive <ChevronRight className="h-4 w-4" />
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
              <p className="font-serif text-2xl italic mb-2">"For where two or three gather in my name, there am I with them."</p>
              <p className="text-sm opacity-80">— Matthew 18:20</p>
            </div>
          </div>

          <div>
            <span className="text-church-gold font-medium uppercase tracking-widest text-sm mb-4 block">Our Story</span>
            <h2 className="text-4xl md:text-5xl font-serif mb-8 leading-tight">A Legacy of Faith in Tlangsam</h2>
            <div className="space-y-6 text-stone-600 leading-relaxed text-lg">
              <p>
                Tlangsam Presbyterian Church has been a cornerstone of spiritual life in our community for generations. Founded on the principles of reformed theology, we strive to be a light on the hill, sharing the transformative power of the Gospel.
              </p>
              <p>
                Our mission is to glorify God by making disciples of Jesus Christ through gospel-centered worship, community, and mission. We believe in the power of prayer, the authority of Scripture, and the necessity of grace.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-6">
                <div>
                  <h4 className="text-stone-900 font-serif text-xl mb-2">Our Vision</h4>
                  <p className="text-sm">To see Tlangsam renewed by the grace of God through a vibrant, gospel-centered community.</p>
                </div>
                <div>
                  <h4 className="text-stone-900 font-serif text-xl mb-2">Our Values</h4>
                  <p className="text-sm">Scripture, Prayer, Community, Service, and Extravagant Grace.</p>
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
            <h2 className="text-4xl md:text-5xl font-serif mb-8">Get in Touch</h2>
            <p className="text-white/60 mb-12 text-lg">Whether you have a prayer request, a question about our services, or just want to say hello, we'd love to hear from you.</p>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-church-gold">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-serif text-xl mb-1">Our Location</h4>
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
                  <label className="block text-sm font-medium text-white/60 mb-2">First Name</label>
                  <input type="text" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Last Name</label>
                  <input type="text" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Email Address</label>
                <input type="email" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Message</label>
                <textarea rows={4} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-church-gold transition-all"></textarea>
              </div>
              <button className="w-full bg-church-gold text-stone-900 font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all">
                Send Message
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
          <div className="flex items-center gap-2">
            <Church className="h-6 w-6 text-church-gold" />
            <span className="text-lg font-serif font-bold tracking-tight">
              Tlangsam Presbyterian
            </span>
          </div>
          
          <div className="flex gap-8 text-sm text-white/40">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Sitemap</a>
          </div>

          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Tlangsam Presbyterian Church. All rights reserved.
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
            <Route path="/records/baptism" element={<Baptism />} />
            <Route path="/records/wedding" element={<Wedding />} />
            <Route path="/records/funeral" element={<Funeral />} />
            <Route path="/records/conference" element={<Conference />} />
            <Route path="/records/pem-dawnsawn" element={<PemDawnsawn />} />
            <Route path="/records/pawl-dang" element={<PawlDang />} />
            <Route path="/archive/minutes" element={<Minutes />} />
            <Route path="/archive/upa-kal-ta-te" element={<UpaKalTaTe />} />
            <Route path="/archive/gallery" element={<Gallery />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </FirebaseProvider>
  );
}
