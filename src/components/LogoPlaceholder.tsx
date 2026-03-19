import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Image as ImageIcon } from 'lucide-react';

interface LogoPlaceholderProps {
  className?: string;
  iconClassName?: string;
}

export const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({ className = "w-20 h-20", iconClassName = "w-10 h-10 text-stone-400" }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'homepage'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className={`${className} bg-stone-100 animate-pulse rounded-xl`} />;
  }

  if (logoUrl) {
    return (
      <img 
        src={logoUrl} 
        alt="Church Logo" 
        className={`${className} object-contain opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return <ImageIcon className={iconClassName} />;
};
