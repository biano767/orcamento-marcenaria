import React from 'react';
import { LayoutDashboard, Settings, PlusCircle, Ruler } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isOpen?: boolean; // mobile drawer state
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen = false, onClose }) => {
  // Desktop: always visible (w-64). Mobile: act as drawer using transform.
  const baseClasses = 'bg-slate-900 h-screen flex flex-col flex-shrink-0 text-white fixed left-0 top-0 z-50';
  const desktopVisible = 'w-64 hidden md:flex';
  const mobileVisible = `w-64 md:hidden transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;

  return (
    <>
      <div className={`${baseClasses} ${desktopVisible}`} aria-hidden={!isOpen}>
        {/* Desktop sidebar (md and up) */}
        <SidebarContent currentView={currentView} onChangeView={onChangeView} />
      </div>

      {/* Mobile drawer */}
      <div className={`${baseClasses} ${mobileVisible}`} role="dialog" aria-modal={isOpen}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ruler className="text-orange-500 h-8 w-8" />
            <span className="text-lg font-bold">OrçaMDF</span>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white p-2">
            ✕
          </button>
        </div>
        <SidebarContent currentView={currentView} onChangeView={(v)=>{ onChangeView(v); onClose && onClose(); }} />
      </div>
    </>
  );
};

const SidebarContent: React.FC<{ currentView: AppView; onChangeView: (view: AppView) => void }> = ({ currentView, onChangeView }) => {
  const navItemClass = (view: AppView) => 
    `flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors cursor-pointer ${
      currentView === view 
        ? 'bg-orange-500 text-white shadow-md' 
        : 'text-gray-400 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <>
      {/* Logo */}
      <div className="p-6 flex items-center space-x-2 border-b border-slate-800">
        <Ruler className="text-orange-500 h-8 w-8" />
        <span className="text-xl font-bold">OrçaMDF</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 mt-4">
        <button 
          onClick={() => onChangeView(AppView.DASHBOARD)}
          className={navItemClass(AppView.DASHBOARD)}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>

        <button 
          onClick={() => onChangeView(AppView.SETTINGS)}
          className={navItemClass(AppView.SETTINGS)}
        >
          <Settings size={20} />
          <span>Configurações</span>
        </button>

        <div className="pt-8">
          <button 
             onClick={() => onChangeView(AppView.WIZARD)}
             className="w-full bg-slate-800 border border-slate-700 text-orange-500 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
          >
             <PlusCircle size={18} />
             <span>Novo Projeto</span>
          </button>
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-6 border-t border-slate-800 text-xs text-slate-500">
        <p className="font-semibold mb-1">v1.0 MVP</p>
        <p>Powered by Gemini AI</p>
      </div>
    </>
  );
};

export default Sidebar;
