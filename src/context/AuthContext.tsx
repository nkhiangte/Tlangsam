import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Shield } from 'lucide-react';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  isBlocked: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within a FirebaseProvider');
  return context;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

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
            setIsBanned(data.status === 'banned');
            setIsBlocked(data.status === 'blocked');

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
              status: 'active',
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: new Date().toISOString()
            });
            setIsAdmin(isDefaultAdmin);
            setIsBanned(false);
            setIsBlocked(false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          // Fallback to email check if DB fails
          setIsAdmin(isDefaultAdmin);
        }
      } else {
        setIsAdmin(false);
        setIsBanned(false);
        setIsBlocked(false);
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
    <AuthContext.Provider value={{ user, loading, isAdmin, isBanned, isBlocked, login, logout }}>
      {isBanned ? (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-red-100">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 mb-4">Account Banned</h1>
            <p className="text-stone-600 mb-8">
              I account hi enkawltute'n an ban rih a ni. Hriat chian duh i neih chuan enkawltute be pawp rawh.
            </p>
            <button 
              onClick={logout}
              className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-stone-800 transition-all"
            >
              Chhuak rawh
            </button>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
