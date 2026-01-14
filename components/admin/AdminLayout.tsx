import React from 'react';
import { Sparkles, LayoutDashboard, Settings, LogOut, Users } from 'lucide-react';
import { UserSession } from '../../types';

interface AdminLayoutProps {
  session: UserSession;
  adminSection: 'pages' | 'settings';
  setAdminSection: (val: 'pages' | 'settings') => void;
  onlineUsersCount: number;
  isMapOpen: boolean;
  setIsMapOpen: (val: boolean) => void;
  handleLogout: () => void;
  onGoHome: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  session, adminSection, setAdminSection, onlineUsersCount, setIsMapOpen, handleLogout, onGoHome, children
}) => {
  return (
    <div className="min-h-screen bg-gray-100 text-slate-800 font-sans">
      <nav className="border-b border-gray-200 bg-white p-4 sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl cursor-pointer" onClick={onGoHome}><Sparkles className="w-6 h-6" /><span>Agdid Admin</span></div>
              <div className="hidden md:flex gap-1 bg-gray-200 p-1 rounded-lg border border-gray-300">
                <button 
                  onClick={() => setAdminSection('pages')} 
                  className={`px-3 py-1.5 rounded text-xs font-bold transition ${adminSection === 'pages' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500 hover:text-slate-900'}`}
                >Generatore</button>
                <button 
                  onClick={() => setAdminSection('settings')} 
                  className={`px-3 py-1.5 rounded text-xs font-bold transition ${adminSection === 'settings' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500 hover:text-slate-900'}`}
                >Impostazioni Sito</button>
              </div>
          </div>
          <div className="flex items-center gap-4">
              <button
                  onClick={() => setIsMapOpen(true)}
                  className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 transition-colors font-semibold py-1 px-3 rounded-full bg-white border border-gray-200 hover:bg-gray-100 shadow-sm"
              >
                  <span className="relative flex h-2.5 w-2.5">
                      {onlineUsersCount > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${onlineUsersCount > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  </span>
                  <span>{onlineUsersCount} Live</span>
              </button>
              <button onClick={onGoHome} className="text-sm text-slate-500 hover:text-slate-900 mr-4">Vedi Sito Pubblico</button>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded text-slate-600 hidden sm:block">{session.email}</span>
              <button onClick={handleLogout} className="p-2 hover:bg-gray-200 rounded-lg transition text-slate-500 hover:text-slate-900"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-12">
        {children}
      </main>
    </div>
  );
};