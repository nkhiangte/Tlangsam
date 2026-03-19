import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Hero = () => {
  const { isAdmin } = useAuth();
  const [bgImage, setBgImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'homepage'), (doc) => {
      if (doc.exists() && doc.data().backgroundImage) {
        setBgImage(doc.data().backgroundImage);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/homepage');
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
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-stone-900">
      <div className="absolute inset-0 z-0">
        {bgImage ? (
          <>
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat bg-fixed"
              style={{ backgroundImage: `url(${bgImage})` }}
            />
            <div className="absolute inset-0 bg-black/50" />
          </>
        ) : (
          <div className="w-full h-full bg-stone-900" />
        )}
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
            <h1 className="text-2xl sm:text-3xl md:text-5xl text-white font-serif font-bold leading-tight tracking-tight whitespace-normal">
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

export default Hero;
