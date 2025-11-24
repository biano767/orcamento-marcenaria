import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { Save } from 'lucide-react';
import { loadSettings, saveSettings } from '../services/storageService';

interface SettingsProps {
  onSave: () => void;
}

const SettingsView: React.FC<SettingsProps> = ({ onSave }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: Number(value) });
  };

  const handleSave = () => {
    if (settings) {
      saveSettings(settings);
      onSave(); // Usually redirects back to Dashboard or shows success
    }
  };

  if (!settings) return <div>Carregando...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-4 mb-8 border-b pb-4">
          <div className="bg-slate-100 p-3 rounded-full">
            <Save className="text-slate-600 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Configurações de Preço</h2>
            <p className="text-gray-500">Ajuste os valores base para seus cálculos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* MDF Section */}
          <div className="col-span-full">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Chapas MDF</h3>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Branco 15mm (R$/Chapa)</label>
            <input type="number" name="priceMdfWhite15" value={settings.priceMdfWhite15} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Branco 6mm (R$/Chapa)</label>
            <input type="number" name="priceMdfWhite6" value={settings.priceMdfWhite6} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Cor/Amadeirado 15mm (R$/Chapa)</label>
            <input type="number" name="priceMdfColor15" value={settings.priceMdfColor15} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Área Útil Chapa (m²)</label>
            <input type="number" name="sheetArea" value={settings.sheetArea} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>

          {/* Hardware Section */}
          <div className="col-span-full mt-4">
             <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Ferragens & Acabamento</h3>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Dobradiça (Unidade)</label>
            <input type="number" name="priceHinge" value={settings.priceHinge} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Corrediça Telescópica (Par)</label>
            <input type="number" name="priceSlide" value={settings.priceSlide} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Corrediça Oculta (Par)</label>
            <input type="number" name="priceSlideHidden" value={settings.priceSlideHidden} onChange={handleChange} className="w-full p-3 border rounded-lg bg-blue-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
           <div>
            <label className="block text-sm text-gray-600 mb-1">Sistema Porta de Correr (p/ Porta)</label>
            <input type="number" name="priceRail" value={settings.priceRail} onChange={handleChange} className="w-full p-3 border rounded-lg bg-blue-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Cabideiro (Metro Linear) - Est.</label>
            <input type="number" defaultValue={45} className="w-full p-3 border rounded-lg bg-blue-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
           <div>
            <label className="block text-sm text-gray-600 mb-1">Puxador (Unidade)</label>
            <input type="number" name="priceHandle" value={settings.priceHandle} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Fita de Borda (R$/m)</label>
            <input type="number" name="priceEdgeBandPerMeter" value={settings.priceEdgeBandPerMeter} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Desperdício fita (%)</label>
            <input type="number" name="edgeBandWastePercent" value={settings.edgeBandWastePercent} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>

          {/* Service Section */}
          <div className="col-span-full mt-4">
             <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Serviço</h3>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Valor Hora (R$)</label>
            <input type="number" name="laborRate" value={settings.laborRate} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Margem de Lucro (%)</label>
            <input type="number" name="profitMargin" value={settings.profitMargin} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>

        </div>

        <div className="mt-8 flex justify-end gap-4">
           <button 
             onClick={onSave}
             className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
           >
             Cancelar
           </button>
           <button 
             onClick={handleSave}
             className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-lg font-medium"
           >
             Salvar Configurações
           </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
