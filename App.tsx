import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import QuoteWizard from './components/QuoteForm';
import QuoteResultView from './components/QuoteResult';
import SettingsView from './components/Settings';
import { AppView, QuoteData, QuoteResult, ModuleDefinition } from './types';
import { saveProject, loadProjects, deleteProject, clearStorage, loadSettings } from './services/storageService';
import { generateLocalQuote } from './services/localQuoteService';
import { generatePDF } from './services/pdfService';

const createDefaultModule = (id: string, name: string): ModuleDefinition => ({
  id,
  name,
  type: 'Armário Padrão',
  dimensions: { width: 800, height: 700, depth: 500 },
  materials: {
    colorInternal: 'MDF Branco TX 15mm',
    colorExternal: 'MDF Madeirado 15mm',
    backingType: 'Fundo de 6mm (Padrão)',
    installationType: 'Suspenso (Parede)',
    visibleSides: 0
  },
  internals: { 
    shelves: 1, 
    drawers: 0, 
    drawerSideHeight: 150, 
    drawerSlideType: 'Telescópica',
    shoeShelves: 0, 
    clothesRails: 0 
  },
  hardware: { doorType: 'Giro (Dobradiças)', doorCount: 2, handleModel: 'Puxador Perfil / Alça (Padrão)' },
  imageBase64: undefined // Initialize empty
});

const initialQuoteData: QuoteData = {
  project: {
    id: '',
    projectName: '',
    clientName: '',
    description: '',
    dateCreated: '',
    status: 'Draft'
  },
  modules: [createDefaultModule('1', 'Módulo Principal')]
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [projects, setProjects] = useState<QuoteData[]>([]);
  const [currentProject, setCurrentProject] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load Data on Mount
  useEffect(() => {
    setProjects(loadProjects());
    // Clear storage on close
    const cleanup = () => clearStorage();
    window.addEventListener('beforeunload', cleanup);
    return () => window.removeEventListener('beforeunload', cleanup);
  }, []);

  const refreshProjects = () => {
    setProjects(loadProjects());
  };

  // Handlers
  const handleNewProject = () => {
    const newProject: QuoteData = {
      ...initialQuoteData,
      project: {
        ...initialQuoteData.project,
        id: Date.now().toString(),
        dateCreated: new Date().toLocaleDateString(),
      },
      modules: [createDefaultModule(Date.now().toString(), 'Módulo Principal')]
    };
    setCurrentProject(newProject);
    setView(AppView.WIZARD);
  };

  const handleEditProject = (project: QuoteData) => {
    setCurrentProject(project);
    setView(project.result ? AppView.RESULT : AppView.WIZARD);
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      deleteProject(id);
      refreshProjects();
    }
  };

  const handleSubmitWizard = async (data: QuoteData) => {
    setCurrentProject(data);
    setIsLoading(true);
    
    // Save draft before calculation
    saveProject(data);

    try {
      const settings = loadSettings();
      const result = generateLocalQuote(data, settings);

      const finishedProject: QuoteData = {
        ...data,
        result,
        project: { ...data.project, status: 'Done' }
      };
      
      setCurrentProject(finishedProject);
      saveProject(finishedProject);
      refreshProjects();
      setView(AppView.RESULT);
    } catch (error) {
      alert("Erro ao gerar orçamento localmente.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = (type: 'client' | 'internal') => {
    if (currentProject && currentProject.result) {
       const totalWidth = currentProject.modules.reduce((sum, m) => sum + m.dimensions.width, 0);
       const maxHeight = Math.max(...currentProject.modules.map(m => m.dimensions.height));
       const maxDepth = Math.max(...currentProject.modules.map(m => m.dimensions.depth));
       const totalDoors = currentProject.modules.reduce((sum, m) => sum + m.hardware.doorCount, 0);
       const totalDrawers = currentProject.modules.reduce((sum, m) => sum + m.internals.drawers, 0);

       const formDataAdapter = {
          width: totalWidth,
          height: maxHeight,
          depth: maxDepth,
          doors: totalDoors,
          drawers: totalDrawers,
          description: `${currentProject.project.description} - ${currentProject.project.projectName} (${currentProject.project.clientName})`,
          project: currentProject.project // Pass full project info for cleaner PDF
       };
       
       generatePDF(formDataAdapter, currentProject.result, currentProject.modules, type);
    }
  };

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar currentView={view} onChangeView={setView} isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={closeSidebar} aria-hidden />
      )}

      <div className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen">
        {/* Mobile top bar with hamburger */}
        <div className="md:hidden flex items-center justify-between px-2 py-3"> 
          <button onClick={openSidebar} className="p-2 rounded-md bg-white/5 text-slate-800 hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="text-sm text-slate-600">OrçaMDF</div>
          <div style={{ width: 36 }} />
        </div>

        {/* Top Bar / Breadcrumb area could go here */}
        {/* Top Bar / Breadcrumb area could go here */}
        
        <div className="max-w-6xl mx-auto">
          {view === AppView.DASHBOARD && (
             <Dashboard 
               projects={projects}
               onNewProject={handleNewProject}
               onEditProject={handleEditProject}
               onDeleteProject={handleDeleteProject}
             />
          )}

          {view === AppView.SETTINGS && (
            <SettingsView onSave={() => setView(AppView.DASHBOARD)} />
          )}

          {view === AppView.WIZARD && currentProject && (
            <QuoteWizard 
               initialData={currentProject}
               onSubmit={handleSubmitWizard}
               onCancel={() => setView(AppView.DASHBOARD)}
               isLoading={isLoading}
            />
          )}

          {view === AppView.RESULT && currentProject && currentProject.result && (
            <div className="space-y-6">
               <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <button onClick={() => setView(AppView.DASHBOARD)} className="hover:text-orange-500">Dashboard</button>
                  <span>/</span>
                  <span>{currentProject.project.projectName}</span>
               </div>

               {/* Reuse existing Result Component but pass props */}
               <QuoteResultView 
                 result={currentProject.result}
                 projectData={currentProject}
                 onGeneratePDF={handleDownloadPDF}
                 onClear={() => setView(AppView.DASHBOARD)}
               />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;