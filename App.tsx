import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import QuoteWizard from './components/QuoteForm';
import QuoteResultView from './components/QuoteResult';
import SettingsView from './components/Settings';
import AdBanner from './components/AdBanner';
import { AppView, QuoteData, QuoteResult, ModuleDefinition } from './types';
import { saveProject, loadProjects, deleteProject, clearStorage, loadSettings } from './services/storageService';
import { generateQuote } from './services/geminiService';
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
      const result = await generateQuote(data, settings);
      
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
      alert("Erro na IA. Verifique sua chave API ou conexão.");
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

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar currentView={view} onChangeView={setView} />
      
      <div className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        {/* Top Bar / Breadcrumb area could go here */}
        
        <div className="max-w-6xl mx-auto">
          {view === AppView.DASHBOARD && (
             <>
               <AdBanner position="top" />
               <Dashboard 
                 projects={projects}
                 onNewProject={handleNewProject}
                 onEditProject={handleEditProject}
                 onDeleteProject={handleDeleteProject}
               />
             </>
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