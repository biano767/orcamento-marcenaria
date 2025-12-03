import React, { useState } from 'react';
import { QuoteData, ModuleDefinition } from '../types';
import { ChevronRight, Camera, FileText, Ruler, Box, Settings, Calculator, Trash2 } from 'lucide-react';
import { fileToBase64 } from '../services/storageService';

interface QuoteWizardProps {
  initialData: QuoteData;
  onSubmit: (data: QuoteData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const TABS = [
  { id: 0, label: 'Projeto', icon: FileText },
  { id: 1, label: 'Dimensões & Mat.', icon: Ruler },
  { id: 2, label: 'Interno', icon: Box },
  { id: 3, label: 'Ferragens', icon: Settings },
];

const QuoteWizard: React.FC<QuoteWizardProps> = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<QuoteData>(initialData);
  const [activeModuleId, setActiveModuleId] = useState<string>(initialData.modules[0]?.id || '1');

  // Helper to get active module index
  const activeModuleIndex = data.modules.findIndex(m => m.id === activeModuleId);
  const activeModule = data.modules[activeModuleIndex];

  // --- Project Field Updates ---
  const updateProjectField = (field: string, value: any) => {
    setData(prev => ({
      ...prev,
      project: {
        ...prev.project,
        [field]: value
      }
    }));
  };

  // --- Module Management ---

  const handleAddModule = () => {
    const newId = Date.now().toString();
    const newModule: ModuleDefinition = {
      id: newId,
      name: `Módulo ${data.modules.length + 1}`,
      type: 'Armário Padrão',
      // Copy dimensions/materials from current module for easier editing
      dimensions: { ...activeModule.dimensions },
      materials: { ...activeModule.materials },
      internals: { ...activeModule.internals },
      hardware: { ...activeModule.hardware },
      imageBase64: undefined
    };

    setData(prev => ({
      ...prev,
      modules: [...prev.modules, newModule]
    }));
    setActiveModuleId(newId);
  };

  const handleRemoveModule = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.modules.length <= 1) return; // Prevent deleting last module

    const newModules = data.modules.filter(m => m.id !== id);
    setData(prev => ({ ...prev, modules: newModules }));
    
    // If we deleted the active one, switch to the first available
    if (id === activeModuleId) {
      setActiveModuleId(newModules[0].id);
    }
  };

  const updateModuleField = (section: keyof ModuleDefinition, field: string, value: any) => {
    setData(prev => {
      const newModules = [...prev.modules];
      const index = newModules.findIndex(m => m.id === activeModuleId);
      if (index === -1) return prev;

      if (section === 'name' || section === 'type' || section === 'imageBase64') {
        // Direct property update
        (newModules[index] as any)[section] = value;
      } else {
        // Nested object update (dimensions, materials, etc)
        (newModules[index] as any)[section] = {
          ...(newModules[index] as any)[section],
          [field]: value
        };
      }
      return { ...prev, modules: newModules };
    });
  };

  const handleModuleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const base64 = await fileToBase64(e.target.files[0]);
       updateModuleField('imageBase64', '', base64);
    }
  };

  // --- Navigation ---

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onSubmit(data);
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
    else onCancel();
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
      {/* Header / Nav */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-800">
           &lt; Voltar ao Dashboard
        </button>
        <h2 className="text-xl font-bold text-slate-800">Novo Orçamento Detalhado</h2>
        <div className="w-24"></div> {/* Spacer for center alignment */}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {TABS.map((tab) => {
          const isActive = step === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setStep(tab.id)}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors
                ${isActive ? 'border-orange-500 text-orange-500 bg-orange-50' : 'border-transparent text-gray-400 hover:text-gray-600'}
              `}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="p-8 flex-1 bg-gray-50 overflow-y-auto">
        
        {/* Step 0: Project Info */}
        {step === 0 && (
          <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-600 mb-1">Nome do Projeto</label>
                 <input 
                   type="text" 
                   value={data.project.projectName}
                   onChange={e => updateProjectField('projectName', e.target.value)}
                   className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none placeholder-gray-400" 
                   placeholder="Ex: Cozinha Completa" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-600 mb-1">Cliente</label>
                 <input 
                   type="text" 
                   value={data.project.clientName}
                   onChange={e => updateProjectField('clientName', e.target.value)}
                   className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none placeholder-gray-400" 
                   placeholder="Nome do Cliente" 
                 />
               </div>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Descrição / Notas</label>
                <textarea 
                  rows={4} 
                  value={data.project.description}
                  onChange={e => updateProjectField('description', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none placeholder-gray-400" 
                  placeholder="Descreva: Cozinha inferior em L, torre quente, armário superior..." 
                />
             </div>
          </div>
        )}

        {/* --- MODULE TABS LOGIC FOR STEPS 1, 2, 3 --- */}
        {step > 0 && (
          <div className="max-w-4xl mx-auto animate-fade-in">
             
             {/* Module Tab Selector */}
             <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Editando Módulo:</h3>
                <div className="flex flex-wrap gap-2">
                  {data.modules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => setActiveModuleId(module.id)}
                      className={`
                        px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 group
                        ${activeModuleId === module.id 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                        }
                      `}
                    >
                      {module.name}
                      {data.modules.length > 1 && (
                        <span 
                          onClick={(e) => handleRemoveModule(module.id, e)}
                          className={`p-0.5 rounded-full hover:bg-white/20 ${activeModuleId === module.id ? 'text-gray-300' : 'text-gray-400 hover:text-red-500'}`}
                        >
                          <Trash2 size={12} />
                        </span>
                      )}
                    </button>
                  ))}
                  <button 
                    onClick={handleAddModule}
                    className="px-4 py-2 rounded-md text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:text-orange-500 hover:border-orange-500 transition-all bg-white"
                  >
                    + ADD
                  </button>
                </div>
             </div>

             {/* STEP 1: DIMENSIONS & MATERIALS CONTENT */}
             {step === 1 && activeModule && (
                <div className="space-y-6">
                   {/* Module Basic Info Box */}
                   <div className="bg-yellow-50 border border-yellow-100 p-6 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-yellow-800 uppercase mb-1">Nome do Módulo</label>
                            <input 
                               type="text" 
                               value={activeModule.name}
                               onChange={(e) => updateModuleField('name', '', e.target.value)}
                               className="w-full p-2.5 border border-yellow-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-yellow-800 uppercase mb-1">Tipo de Módulo</label>
                            <select 
                               value={activeModule.type}
                               onChange={(e) => updateModuleField('type', '', e.target.value)}
                               className="w-full p-2.5 border border-yellow-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            >
                               <option>Armário Padrão</option>
                               <option>Gaveteiro</option>
                               <option>Prateleira/Nicho</option>
                               <option>Mesa/Bancada</option>
                            </select>
                         </div>
                      </div>
                   </div>

                   {/* Dimensions Inputs */}
                   <div className="grid grid-cols-3 gap-6">
                     {['width', 'height', 'depth'].map((dim) => (
                       <div key={dim} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                         <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                           {dim === 'width' ? 'Largura' : dim === 'height' ? 'Altura' : 'Profundidade'} (mm)
                         </label>
                         <div className="flex items-center justify-center gap-2">
                           <span className="text-gray-300 text-xs font-mono">{dim.charAt(0).toUpperCase()}</span>
                           <input 
                             type="number" 
                             value={(activeModule.dimensions as any)[dim]}
                             onChange={e => updateModuleField('dimensions', dim, Number(e.target.value))}
                             className="w-24 text-center font-bold text-2xl bg-transparent outline-none text-slate-800 placeholder-gray-200"
                             placeholder="0"
                           />
                         </div>
                       </div>
                     ))}
                   </div>

                   {/* Materials Configuration */}
                   <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                     <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2 mb-6 border-b pb-2">
                       <Settings size={16} /> Especificações Técnicas (Materiais)
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <label className="block text-xs text-gray-500 mb-1">Cor Interna (Caixaria)</label>
                         <input type="text" value={activeModule.materials.colorInternal} onChange={e => updateModuleField('materials', 'colorInternal', e.target.value)} className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded-md text-sm focus:ring-2 focus:ring-orange-200 outline-none" />
                       </div>
                       <div>
                         <label className="block text-xs text-gray-500 mb-1">Cor Externa (Frentes/Visível)</label>
                         <input type="text" value={activeModule.materials.colorExternal} onChange={e => updateModuleField('materials', 'colorExternal', e.target.value)} className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded-md text-sm focus:ring-2 focus:ring-orange-200 outline-none" />
                       </div>
                       <div>
                         <label className="block text-xs text-gray-500 mb-1">Fundo do Móvel</label>
                         <select value={activeModule.materials.backingType} onChange={e => updateModuleField('materials', 'backingType', e.target.value)} className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded-md text-sm focus:ring-2 focus:ring-orange-200 outline-none">
                           <option>Fundo de 6mm (Padrão)</option>
                           <option>Sem fundo</option>
                           <option>MDF 15mm</option>
                         </select>
                       </div>
                       <div>
                         <label className="block text-xs text-gray-500 mb-1">Base / Instalação</label>
                         <select value={activeModule.materials.installationType} onChange={e => updateModuleField('materials', 'installationType', e.target.value)} className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded-md text-sm focus:ring-2 focus:ring-orange-200 outline-none">
                           <option>Suspenso (Parede)</option>
                           <option>Com Rodapé</option>
                           <option>Com Pés</option>
                         </select>
                       </div>
                     </div>

                     {/* Visible Sides */}
                     <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                       <label className="block text-sm text-yellow-800 font-medium mb-3">Lados Acabados Externos (Visíveis)</label>
                       <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {[0, 1, 2, 3, 4].map(num => (
                            <label key={num} className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name={`visibleSides-${activeModuleId}`} 
                                checked={activeModule.materials.visibleSides === num}
                                onChange={() => updateModuleField('materials', 'visibleSides', num)}
                                className="text-orange-500 focus:ring-orange-500"
                              /> 
                              <span>{num} {num === 1 ? 'Lado' : 'Lados'}</span>
                            </label>
                          ))}
                       </div>
                     </div>
                   </div>

                   {/* Module Specific Photo Upload */}
                   <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-white">
                      <h4 className="font-semibold text-slate-700 mb-2">Foto de Referência do Módulo</h4>
                      <p className="text-xs text-gray-400 mb-4 text-center max-w-xs">Adicione uma foto de inspiração específica para este módulo. Ela aparecerá junto aos detalhes no PDF do Cliente.</p>
                      
                      {activeModule.imageBase64 ? (
                         <div className="relative group">
                           <img src={activeModule.imageBase64} alt="Ref Módulo" className="h-32 rounded shadow-sm object-cover" />
                           <button onClick={() => updateModuleField('imageBase64', '', undefined)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"><Settings size={12}/></button>
                         </div>
                      ) : (
                        <label className="cursor-pointer bg-white border border-gray-200 hover:border-orange-500 hover:text-orange-500 transition-all shadow-sm rounded-lg w-40 h-24 flex flex-col items-center justify-center gap-2 text-gray-400">
                           <Camera size={20} />
                           <span className="text-xs">Enviar Foto</span>
                           <input type="file" className="hidden" accept="image/*" onChange={handleModuleImageUpload} />
                        </label>
                      )}
                   </div>
                </div>
             )}

             {/* STEP 2: INTERNALS CONTENT */}
             {step === 2 && activeModule && (
               <div>
                 <h3 className="font-bold text-gray-800 mb-6">Configuração Interna - {activeModule.name}</h3>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {[
                     { key: 'shelves', label: 'Prateleiras' },
                     { key: 'drawers', label: 'Gavetas', sub: 'Altura Lateral (mm)', subKey: 'drawerSideHeight', typeSelector: true },
                     { key: 'shoeShelves', label: 'Sapateiras', sub: 'Fixa 60mm' },
                     { key: 'clothesRails', label: 'Cabideiros' }
                   ].map((item) => (
                     <div key={item.key} className="bg-white p-4 rounded-xl border border-blue-50 shadow-sm flex flex-col items-center justify-center hover:border-blue-200 transition-colors">
                        <h4 className="font-bold text-blue-900 mb-3">{item.label}</h4>
                        <div className="flex items-center gap-3">
                          <button 
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700"
                            onClick={() => updateModuleField('internals', item.key, Math.max(0, (activeModule.internals as any)[item.key] - 1))}
                          >
                            -
                          </button>
                          <span className="text-2xl font-bold text-slate-800">{(activeModule.internals as any)[item.key]}</span>
                          <button 
                             className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center font-bold text-gray-700"
                             onClick={() => updateModuleField('internals', item.key, (activeModule.internals as any)[item.key] + 1)}
                          >
                            +
                          </button>
                        </div>
                        {item.typeSelector && (activeModule.internals as any)[item.key] > 0 && (
                           <div className="mt-3 w-full">
                              <label className="text-[10px] text-blue-400 block text-center mb-1">Tipo de Corrediça</label>
                              <select 
                                 value={activeModule.internals.drawerSlideType || 'Telescópica'}
                                 onChange={(e) => updateModuleField('internals', 'drawerSlideType', e.target.value)}
                                 className="w-full text-xs p-1 border border-gray-300 rounded bg-white text-gray-900 focus:ring-1 focus:ring-blue-300 outline-none"
                              >
                                <option value="Telescópica">Telescópica</option>
                                <option value="Oculta">Oculta (Invisible)</option>
                              </select>
                           </div>
                        )}
                        {item.sub && (
                           <div className="mt-2 w-full flex flex-col items-center">
                             <label className="text-[10px] text-blue-400 block text-center mb-1">{item.sub}</label>
                             {item.subKey ? (
                               <input 
                                 type="number"
                                 value={(activeModule.internals as any)[item.subKey]}
                                 onChange={(e) => updateModuleField('internals', item.subKey!, Number(e.target.value))}
                                 className="w-20 text-center text-xs py-1 border border-gray-300 rounded bg-white text-gray-900 focus:ring-1 focus:ring-blue-300 outline-none"
                               />
                             ) : (
                               <div className="w-full border rounded text-center text-xs py-1 bg-gray-50 text-gray-600">Fixa</div>
                             )}
                           </div>
                        )}
                     </div>
                   ))}
                 </div>

                 {/* Checkbox: Drawer Fronts External */}
                 {(activeModule.internals.drawers || 0) > 0 && (
                   <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                     <label className="flex items-center gap-3 cursor-pointer">
                       <input 
                         type="checkbox" 
                         checked={activeModule.internals.drawerFrontsExternal || false}
                         onChange={(e) => updateModuleField('internals', 'drawerFrontsExternal', e.target.checked)}
                         className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm font-semibold text-blue-900">
                         Frentes de gaveta externas (cor do MDF externo)
                       </span>
                     </label>
                     <p className="text-xs text-blue-700 mt-2 ml-8">
                       Se desmarcado: gavetas com acabamento interno (cor do MDF interno)
                     </p>
                   </div>
                 )}
               </div>
             )}

             {/* STEP 3: HARDWARE CONTENT */}
             {step === 3 && activeModule && (
               <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-8">
                 <div>
                   <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Portas & Abertura - {activeModule.name}</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-sm text-gray-500 font-medium">Tipo de Porta</label>
                        <div className="space-y-2">
                          {['Giro (Dobradiças)', 'Correr (Trilhos)', 'Sem Portas (Nicho)'].map(type => (
                             <label key={type} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                               <input 
                                 type="radio" 
                                 name={`doorType-${activeModuleId}`}
                                 checked={activeModule.hardware.doorType === type}
                                 onChange={() => updateModuleField('hardware', 'doorType', type)}
                                 className="text-orange-500 focus:ring-orange-500"
                               />
                               <span className="text-gray-700 text-sm">{type}</span>
                             </label>
                          ))}
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">Quantidade de Portas</label>
                          <input 
                            type="number" 
                            value={activeModule.hardware.doorCount}
                            onChange={e => updateModuleField('hardware', 'doorCount', Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none"
                          />
                        </div>
                        
                        {activeModule.hardware.doorType !== 'Sem Portas (Nicho)' && (
                           <div>
                              <label className="block text-sm text-gray-500 mb-1">Modelo de Puxador</label>
                              <select 
                                 value={activeModule.hardware.handleModel}
                                 onChange={e => updateModuleField('hardware', 'handleModel', e.target.value)}
                                 className="w-full p-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none"
                              >
                                <option>Puxador Perfil / Alça (Padrão)</option>
                                <option>Puxador Cava (Usinado)</option>
                                <option>Fecho de Toque (Click)</option>
                              </select>
                           </div>
                        )}
                     </div>
                   </div>
                 </div>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-white border-t border-gray-200 flex justify-between items-center">
        <button 
           onClick={handlePrev}
           className="px-6 py-2.5 rounded-lg text-gray-500 font-medium hover:bg-gray-100 transition-colors"
        >
          {step === 0 ? 'Cancelar' : 'Anterior'}
        </button>
        
        <button 
          onClick={handleNext}
          disabled={isLoading}
          className={`px-8 py-2.5 rounded-lg text-white font-bold shadow-lg flex items-center gap-2 transition-all ${
            isLoading ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 hover:scale-105'
          }`}
        >
          {isLoading ? (
            'Calculando...'
          ) : step === 3 ? (
            <>
              <Calculator size={18} /> Calcular Tudo ({data.modules.length} Módulos)
            </>
          ) : (
            <>Próximo <ChevronRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuoteWizard;