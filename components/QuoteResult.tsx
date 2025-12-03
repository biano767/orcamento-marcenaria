import React from 'react';
import { QuoteResult, QuoteData } from '../types';
import { FileText, Hammer, RefreshCcw } from 'lucide-react';
import AdBanner from './AdBanner';

interface QuoteResultProps {
  result: QuoteResult;
  projectData: QuoteData;
  onGeneratePDF: (type: 'client' | 'internal') => void;
  onClear: () => void;
}

const formatUnit = (unit: string) => {
  if (!unit) return '';
  const u = unit.toLowerCase().trim();
  if (u === 'sheet') return 'chapa';
  if (u === 'sheets') return 'chapas';
  return unit;
};

const QuoteResultView: React.FC<QuoteResultProps> = ({ result, projectData, onGeneratePDF, onClear }) => {
  const materialsCost = result.totalCost - result.laborCost;
  const estimatedProfit = result.suggestedPrice - result.totalCost;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <AdBanner position="top" />
      
      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Orçamento de Mobiliário</h1>
           <p className="text-gray-500">Proposta Comercial</p>
        </div>
        <div className="text-right">
           <p className="text-sm text-gray-500">Cliente:</p>
           <p className="font-semibold text-gray-800">{projectData.project.clientName}</p>
           <p className="text-xs text-gray-400">{projectData.project.dateCreated}</p>
        </div>
      </div>

      {/* Modules Details List */}
      <div>
        <div className="flex items-center gap-2 mb-4">
           <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
           <h3 className="font-bold text-gray-800">Detalhamento dos Módulos</h3>
        </div>

        <div className="space-y-4">
           {projectData.modules.map((mod, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                 {/* Module Header */}
                 <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
                    <div>
                       <h4 className="font-bold text-slate-800">{mod.name}</h4>
                       <span className="text-xs text-gray-400 uppercase tracking-wide">{mod.type}</span>
                    </div>
                    <div className="text-sm font-mono text-gray-500">
                       {mod.dimensions.width}L x {mod.dimensions.height}A x {mod.dimensions.depth}P mm
                    </div>
                 </div>

                 {/* Specs Grid */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 text-sm">
                    <div>
                       <p className="text-xs font-semibold text-gray-400 mb-1">Material Externo</p>
                       <p className="text-gray-700">{mod.materials.colorExternal}</p>
                    </div>
                    <div>
                       <p className="text-xs font-semibold text-gray-400 mb-1">Material Interno</p>
                       <p className="text-gray-700">{mod.materials.colorInternal}</p>
                    </div>
                    <div>
                       <p className="text-xs font-semibold text-gray-400 mb-1">Instalação/Base</p>
                       <p className="text-gray-700">{mod.materials.installationType}</p>
                    </div>
                    <div>
                       <p className="text-xs font-semibold text-gray-400 mb-1">Fundo</p>
                       <p className="text-gray-700">{mod.materials.backingType}</p>
                    </div>

                    <div>
                       <p className="text-xs font-semibold text-gray-400 mb-1">Portas ({mod.hardware.doorCount})</p>
                       <p className="text-gray-700">{mod.hardware.doorType.split(' ')[0]}</p>
                    </div>
                    <div>
                       <p className="text-xs font-semibold text-gray-400 mb-1">Gavetas</p>
                       <p className="text-gray-700">{mod.internals.drawers} Padrão + {mod.internals.shoeShelves} Sapateira</p>
                    </div>
                    <div>
                       <p className="text-xs font-semibold text-gray-400 mb-1">Corrediças</p>
                       <p className="text-gray-700">{mod.internals.drawers > 0 ? 'Telescópicas Reforçadas' : '-'}</p>
                    </div>
                    <div>
                       <p className="text-xs font-semibold text-gray-400 mb-1">Interno</p>
                       <p className="text-gray-700">{mod.internals.shelves} Prateleiras</p>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="mt-8">
         <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex justify-between items-center mb-8">
            <div>
               <h3 className="text-lg font-bold text-slate-900">Valor Total do Investimento</h3>
               <p className="text-xs text-gray-500">Inclui materiais e mão de obra.</p>
            </div>
            <div className="text-3xl font-bold text-slate-900">
               R$ {result.suggestedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
         </div>
         
         <div className="border-t border-gray-100 pt-2 flex justify-center mb-4">
             <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Área Interna (Não sai no PDF Cliente)</span>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Shopping List */}
            <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden flex flex-col h-full border-l-4 border-l-blue-500">
               <div className="p-5 border-b border-gray-50">
                  <h4 className="font-bold text-gray-800">Lista de Compras (Interno)</h4>
               </div>
               <div className="p-5 flex-1 overflow-y-auto max-h-[400px]">
                  <ul className="space-y-3 text-sm">
                     {result.materialList.map((item, i) => (
                        <li key={i} className="flex justify-between items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                           <span className="text-gray-600">{item.name}</span>
                           <span className="font-medium text-gray-900">{item.quantity} {formatUnit(item.unit)}</span>
                        </li>
                     ))}
                  </ul>
               </div>
            </div>

            {/* Right: Cost Breakdown */}
            <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden border-l-4 border-l-green-500">
                <div className="p-5 border-b border-gray-50">
                  <h4 className="font-bold text-gray-800">Custos de Produção (Interno)</h4>
               </div>
               <div className="p-6 space-y-4">
                  <div className="flex justify-between text-gray-600 text-sm">
                     <span>Materiais & Ferragens</span>
                     <span>R$ {materialsCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm">
                     <span>Mão de Obra ({result.productionTimeDays} dias est.)</span>
                     <span>R$ {result.laborCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-3 mt-2 flex justify-between items-center font-bold text-gray-800">
                     <span>Custo Total</span>
                     <span className="text-lg">R$ {result.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="mt-4 bg-green-50 rounded-lg p-3 flex justify-between items-center text-green-800 font-bold text-sm">
                     <span>Lucro Estimado (aprox)</span>
                     <span>R$ {estimatedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <button 
           onClick={() => onGeneratePDF('client')}
           className="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
           <FileText size={18} /> PDF Cliente (Proposta)
        </button>
        
        <button 
           onClick={() => onGeneratePDF('internal')}
           className="bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
           <Hammer size={18} /> PDF Produção (Interno)
        </button>

        <button 
           onClick={onClear}
           className="border border-gray-300 bg-white text-gray-600 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
           <RefreshCcw size={18} /> Novo Orçamento
        </button>
      </div>
      
      <div className="text-center text-xs text-gray-400 mt-8">
         Orçamento válido por 15 dias. Medidas devem ser conferidas no local antes da produção.
         <br/>OrçaMDF © 2025
      </div>

      <AdBanner position="bottom" />
    </div>
  );
};

export default QuoteResultView;