import React from 'react';
import { QuoteData, AppView } from '../types';
import { FileText, Calculator, PenTool, Trash2, Plus } from 'lucide-react';
import AdBanner from './AdBanner';

interface DashboardProps {
  projects: QuoteData[];
  onNewProject: () => void;
  onEditProject: (project: QuoteData) => void;
  onDeleteProject: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, onNewProject, onEditProject, onDeleteProject }) => {
  const approvedCount = projects.filter(p => p.project.status === 'Done').length;
  const draftCount = projects.filter(p => p.project.status === 'Draft').length;

  return (
    <div className="space-y-8 animate-fade-in">
      <AdBanner position="top" />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Painel de Controle</h1>
          <p className="text-gray-500">Gerencie seus orçamentos e projetos</p>
        </div>
        <button 
          onClick={onNewProject}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg shadow-md font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Novo Orçamento
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Projetos</p>
            <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-lg text-green-600">
            <Calculator size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Aprovados</p>
            <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-yellow-50 p-3 rounded-lg text-yellow-600">
            <PenTool size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Em Rascunho</p>
            <p className="text-2xl font-bold text-gray-900">{draftCount}</p>
          </div>
        </div>
      </div>

      {/* Recent Projects List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="px-6 py-4 border-b border-gray-100">
           <h3 className="font-bold text-gray-800">Orçamentos Recentes</h3>
         </div>
         
         {projects.length === 0 ? (
           <div className="p-8 text-center text-gray-400">
             <p>Nenhum projeto encontrado. Crie o primeiro!</p>
           </div>
         ) : (
           <ul className="divide-y divide-gray-50">
             {projects.map((item) => (
               <li key={item.project.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between transition-colors">
                 <div className="flex items-center gap-4">
                   <div className="bg-slate-100 h-10 w-10 rounded-lg flex items-center justify-center text-slate-500">
                      <PenTool size={18} />
                   </div>
                   <div>
                     <p className="font-semibold text-gray-800">{item.project.projectName || 'Sem nome'}</p>
                     <p className="text-xs text-gray-500">{item.project.clientName} • {item.project.dateCreated}</p>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.project.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {item.project.status === 'Done' ? 'Aprovado' : 'Rascunho'}
                    </span>
                    <button 
                      onClick={() => onDeleteProject(item.project.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => onEditProject(item)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                 </div>
               </li>
             ))}
           </ul>
         )}
      </div>
    </div>
  );
};

export default Dashboard;
