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
    <footer className="bg-stone-950 text-white py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2 shadow-inner overflow-hidden">
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
            &copy; {new Date().getFullYear()} Tlangsam Presbyterian Kohhran. 
          </p>
        </div>

        <div className="pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">
            Powered by <a href="tel:9612447703" className="hover:text-white transition-colors underline underline-offset-8 decoration-white/10 hover:decoration-white/40">MegaBits</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
