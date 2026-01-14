import React from 'react';
import { Shield, X, AlertCircle, Check, Loader2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  authError: string;
  authSuccess: string;
  handleAuth: (e: React.FormEvent) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen, onClose, isRegistering, setIsRegistering,
  email, setEmail, password, setPassword,
  loading, authError, authSuccess, handleAuth
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 animate-in zoom-in-95 duration-300 border border-slate-100">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5 text-slate-400" /></button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"><Shield className="w-8 h-8 text-emerald-600" /></div>
          <h3 className="text-2xl font-black text-slate-900">{isRegistering ? 'Crea Account' : 'Accesso Admin'}</h3>
          <p className="text-sm text-slate-500 mt-1">{isRegistering ? 'Inserisci i tuoi dati per iniziare' : 'Inserisci le credenziali per gestire le pagine'}</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 ml-1">Email</label>
            <input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all text-slate-900"/>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 ml-1">Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all text-slate-900"/>
          </div>
          {authError && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl"><AlertCircle className="w-4 h-4 text-red-500" /><p className="text-xs text-red-600 font-medium">{authError}</p></div>}
          {authSuccess && <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl"><Check className="w-4 h-4 text-emerald-500" /><p className="text-xs text-emerald-600 font-medium">{authSuccess}</p></div>}
          <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">{loading ? <Loader2 className="w-5 h-5 animate-spin"/> : (isRegistering ? 'Registrati Ora' : 'Entra nel Pannello')}</button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-6">
          {isRegistering ? 'Hai già un account?' : 'Non hai un account?'} <button onClick={() => { setIsRegistering(!isRegistering); }} className="font-bold text-emerald-600 hover:underline">{isRegistering ? 'Accedi qui' : 'Registrati ora'}</button>
        </p>
      </div>
    </div>
  );
};