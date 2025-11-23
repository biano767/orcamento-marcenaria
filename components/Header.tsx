import React from 'react';
import { Ruler, Home } from 'lucide-react';

interface HeaderProps {
  onGoHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ onGoHome }) => {
  return (
    <header className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div 
          className="flex items-center space-x-2 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={onGoHome}
        >
          <Ruler className="h-8 w-8 text-yellow-400" />
          <div>
            <h1 className="text-xl font-bold leading-none">OrçaMDF <span className="text-yellow-400 font-light">Lite</span></h1>
            <p className="text-xs text-blue-200">MicroSaaS para Marceneiros</p>
          </div>
        </div>
        
        <button 
          onClick={onGoHome}
          className="p-2 hover:bg-blue-800 rounded-full transition-colors"
          aria-label="Voltar para Home"
        >
          <Home size={24} />
        </button>
      </div>
    </header>
  );
};

export default Header;