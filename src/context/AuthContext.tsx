import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

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

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
