import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      onClose();
    } catch (err: any) {
      setError('Email emaw password a dik lo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-serif font-bold text-stone-900">Lut Rawh</h2>
                <p className="text-stone-500 text-sm mt-1">Tlangsam Presbyterian Kohhran</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                {error && (
                  <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl border border-red-100 text-center">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-church-burgundy focus:ring-1 focus:ring-church-burgundy transition-all"
                      placeholder="I email..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-church-burgundy focus:ring-1 focus:ring-church-burgundy transition-all"
                      placeholder="I password..."
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-church-burgundy text-white py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Lut Rawh'}
                </button>
              </form>

              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute inset-x-0 h-px bg-stone-200"></div>
                <span className="relative bg-white px-4 text-xs font-bold uppercase tracking-wider text-stone-400">Emaw</span>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white border-2 border-stone-100 text-stone-700 py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-stone-50 hover:border-stone-200 transition-all"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Google hmangin lut rawh
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
