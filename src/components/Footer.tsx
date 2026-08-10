import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

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
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/homepage');
    });
    return unsubscribe;
  }, []);

  return (
    <footer className="bg-white text-stone-900 py-12 border-t border-stone-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12 hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center p-2 overflow-hidden">
              <img 
                src={logoUrl} 
                alt="Tlangsam Presbyterian Logo" 
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-serif font-bold tracking-tight">
                Tlangsam
              </span>
              <span className="text-xs font-serif font-medium text-church-burgundy opacity-80">
                Presbyterian Church
              </span>
            </div>
          </div>
        </div>
          
        <div className="flex flex-col items-center gap-3 text-center w-full">
          <div className="flex flex-col items-center gap-3 text-xs text-stone-500 font-semibold tracking-wider">
            <a href="#" className="hover:text-church-burgundy transition-colors">Vawn Himna</a>
            <a href="#" className="hover:text-church-burgundy transition-colors">Inkaihhruaina</a>
            <a href="#" className="hover:text-church-burgundy transition-colors">Sitemap</a>
          </div>

          <p className="text-xs text-stone-500 font-medium mt-4">
            &copy; 2026 Tlangsam Presbyterian Kohhran.
          </p>

          <p className="text-[10px] text-stone-400 uppercase tracking-[0.3em] font-bold mt-1">
            Powered by <a href="tel:9612447703" className="text-church-burgundy hover:text-stone-900 transition-colors">MegaBits</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
