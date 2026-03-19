import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

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
              style={{ height: `${logoSize}px`, width: 'auto', maxWidth: '120px' }}
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

export default Footer;
