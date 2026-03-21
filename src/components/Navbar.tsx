import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  ChevronRight, 
  Shield, 
  LogOut, 
  LogIn, 
  Image as ImageIcon, 
  Upload, 
  Settings, 
  Loader2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const [logoUrl, setLogoUrl] = useState('https://storage.googleapis.com/static-content-ais-build/applets/oq4isheib3jbvhiqgatqar/logo.png');
  const [logoSize, setLogoSize] = useState(48);
  const [logoError, setLogoError] = useState(false);
  const [showSizeSlider, setShowSizeSlider] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerUploading, setBannerUploading] = useState(false);
  const { user, login, logout, isAdmin } = useAuth();

  const isHomePage = pathname === '/';
  const isDarkNav = scrolled || !isHomePage;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const unsubscribeHomepage = onSnapshot(doc(db, 'settings', 'homepage'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
          setLogoError(false);
          // Update favicon dynamically
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) {
            link.href = data.logoUrl;
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = data.logoUrl;
            document.head.appendChild(newLink);
          }
        }
        if (data.logoSize) setLogoSize(data.logoSize);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/homepage');
    });

    const unsubscribeBranding = onSnapshot(doc(db, 'settings', 'branding'), (doc) => {
      if (doc.exists() && doc.data().bannerUrl) {
        setBannerUrl(doc.data().bannerUrl);
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribeHomepage();
      unsubscribeBranding();
    };
  }, []);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const storageRef = ref(storage, `branding/banner_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await setDoc(doc(db, 'settings', 'branding'), { bannerUrl: url }, { merge: true });
      alert('Banner thlak a ni ta!');
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert('Banner thlaknaah harsatna a awm.');
    } finally {
      setBannerUploading(false);
    }
  };

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
    { name: 'Home', href: '/' },
    { name: 'Rawngbawltute', href: '/rawngbawltute' },
    { name: 'Latest News', href: '/news' },
    { name: 'Chanchin', href: '/about' },
    { name: 'Inkhawm', href: '/services' },
    { 
      name: 'Fellowships', 
      href: '#',
      dropdown: [
        { name: 'Kohhran Hmeichhia', href: '/fellowship/hmeichhia' },
        { name: 'KTP', href: '/fellowship/ktp' },
        { name: 'KPP', href: '/fellowship/kpp' },
      ]
    },
    { 
      name: 'Committee', 
      href: '#',
      dropdown: [
        { name: 'Kohhran Committee', href: '/committee/kohhran' },
        { name: 'Sunday School Committee', href: '/committee/sunday-school' },
        { name: 'Ramthar Committee', href: '/committee/ramthar' },
        { name: 'BSI Committee', href: '/committee/bsi' },
        { name: 'Refreshment Committee', href: '/committee/refreshment' },
        { name: 'Light & Sound Committee', href: '/committee/light-sound' },
      ]
    },
    { name: 'Sunday School', 
      href: '#',
      dropdown: [
        { name: 'Weekly Report', href: '/sunday-school/weekly-report' },
        { name: 'Puitling', href: '/sunday-school/puitling' },
        { name: 'Senior', href: '/sunday-school/senior' },
        { name: 'Sacrament', href: '/sunday-school/sacrament' },
        { name: 'Intermediate', href: '/sunday-school/intermediate' },
        { name: 'Junior', href: '/sunday-school/junior' },
        { name: 'Primary', href: '/sunday-school/primary' },
        { name: 'Beginner', href: '/sunday-school/beginner' },
      ]
    },
    { name: 'Finance', href: '/finance' },
    { name: 'Statistics', href: '/statistics' },
    { name: 'Record-te', href: '/records' },
    { name: 'Archive', href: '/archive' },
    { name: 'Biak Pawhna', href: '/contact' },
  ];

  const handleNavClick = (href: string) => {
    setIsOpen(false);
  };

  return (
    <nav className="fixed w-full z-50 top-0 left-0 shadow-lg h-[80px] sm:h-[120px] md:h-[160px] lg:h-[200px] flex flex-col justify-center">
      {/* Banner Background Layer */}
      <div className="absolute inset-0 z-[-1] bg-[#f5c48c]">
        {bannerUrl ? (
          <img 
            src={bannerUrl} 
            alt="" 
            className="w-full h-full object-cover md:object-contain"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400 text-[10px] uppercase tracking-widest font-bold">
            Banner Background
          </div>
        )}
        {/* Overlay to ensure menu readability if needed */}
        <div className={`absolute inset-0 transition-colors duration-300 ${isDarkNav ? 'bg-white/40 backdrop-blur-[2px]' : 'bg-black/10'}`} />
        
        {isAdmin && (
          <label className="absolute top-2 right-2 bg-church-burgundy text-white p-1.5 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform z-20">
            {bannerUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} disabled={bannerUploading} />
          </label>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row: Logo & Auth */}
        <div className="flex justify-between items-center py-3 md:py-4">
          <div className="flex items-center gap-4 group relative">
            <div className="relative flex items-center min-w-[40px] md:min-w-[48px] justify-center">
              <Link to="/" className="block transition-transform hover:scale-105">
                {!logoError ? (
                    <img 
                      src={logoUrl} 
                      alt="Tlangsam Presbyterian Logo" 
                      onError={() => setLogoError(true)}
                      style={{ 
                        height: `${logoSize}px`, 
                        width: 'auto',
                        imageRendering: 'auto'
                      }}
                      className="object-contain transition-all duration-300 drop-shadow-md max-h-[32px] sm:max-h-[40px] md:max-h-[60px]"
                      referrerPolicy="no-referrer"
                    />
                ) : (
                  <div 
                    className={`flex items-center justify-center rounded-full border-2 ${isDarkNav ? 'border-church-burgundy bg-stone-50' : 'border-church-gold bg-white/10'}`}
                    style={{ height: `${logoSize}px`, width: `${logoSize}px` }}
                  >
                    <ImageIcon className={`h-1/2 w-1/2 ${isDarkNav ? 'text-church-burgundy' : 'text-church-gold'}`} />
                  </div>
                )}
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
              <span className={`text-base md:text-xl font-serif font-bold leading-none tracking-tight ${isDarkNav ? 'text-stone-900' : 'text-white'}`}>
                Tlangsam
              </span>
              <span className={`text-[8px] md:text-sm font-serif font-medium leading-none mt-1 opacity-90 ${isDarkNav ? 'text-church-burgundy' : 'text-church-gold'}`}>
                Presbyterian Church
              </span>
            </Link>
          </div>

          {/* Desktop Auth & Admin */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className={`text-sm font-semibold transition-colors hover:text-church-gold flex items-center gap-1 ${isDarkNav ? 'text-stone-900' : 'text-white/90'}`}
                  >
                    <Shield className="h-4 w-4" /> Admin Panel
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-7 h-7 rounded-full border border-stone-200" />
                  <span className={`text-xs font-medium ${isDarkNav ? 'text-stone-900' : 'text-white'}`}>
                    {isAdmin ? 'Admin' : 'Member'}
                  </span>
                </div>
                <button 
                  onClick={logout}
                  className="bg-stone-100 text-stone-900 px-3 py-1 rounded-full text-xs font-medium hover:bg-stone-200 transition-all flex items-center gap-1"
                >
                  <LogOut className="h-3 w-3" /> Chhuak rawh
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                className="bg-church-burgundy text-white px-5 py-1.5 rounded-full text-xs font-medium hover:bg-opacity-90 transition-all shadow-lg flex items-center gap-1"
              >
                <LogIn className="h-3 w-3" /> Lut rawh
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-3">
            {!user && (
              <button 
                onClick={login}
                className="p-2 rounded-full transition-colors text-church-burgundy hover:bg-white/20"
                title="Lut rawh"
              >
                <LogIn className="h-6 w-6" />
              </button>
            )}
            {user && (
              <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-stone-200" />
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="text-stone-900">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Bottom Row: Desktop Navigation */}
        <div className="hidden md:block border-t border-black/5">
          <div className="flex items-center justify-center gap-4 lg:gap-6 py-2">
            {navLinks.map((link) => (
              link.dropdown ? (
                <div key={link.name} className="relative group">
                  <button className="text-xs lg:text-sm font-bold transition-colors hover:text-church-burgundy flex items-center gap-1 text-stone-900 uppercase tracking-wider">
                    {link.name} <ChevronRight className="h-3 w-3 rotate-90" />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-stone-100 z-50">
                    {link.dropdown.map((sub) => (
                      <Link 
                        key={sub.name} 
                        to={sub.href}
                        className="block px-4 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:text-church-burgundy transition-colors font-bold uppercase tracking-wider"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link 
                  key={link.name} 
                  to={link.href}
                  className="text-xs lg:text-sm font-bold transition-colors hover:text-church-burgundy text-stone-900 uppercase tracking-wider"
                >
                  {link.name}
                </Link>
              )
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white absolute top-full left-0 w-full shadow-xl py-4 px-4 flex flex-col gap-4 max-h-[calc(100vh-100px)] overflow-y-auto"
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
              <div className="flex flex-col gap-3">
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    onClick={() => setIsOpen(false)}
                    className="bg-stone-50 text-church-burgundy px-6 py-3 rounded-xl text-center font-medium flex items-center justify-center gap-2 border border-stone-100"
                  >
                    <Shield className="h-4 w-4" /> Admin Panel
                  </Link>
                )}
                <button 
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="bg-stone-100 text-stone-900 px-6 py-3 rounded-xl text-center font-medium flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Chhuak rawh
                </button>
              </div>
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

export default Navbar;
