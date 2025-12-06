import { QuoteData, AppSettings } from '../types';

const PROJECTS_KEY = 'orcaMdf_projects';
const SETTINGS_KEY = 'orcaMdf_settings';

export const defaultSettings: AppSettings = {
  priceMdfWhite15: 280,
  priceMdfWhite6: 150,
  priceMdfColor15: 380,
  sheetArea: 5.08,
  priceHinge: 15,
  priceSlide: 40,
  priceSlideHidden: 120,
  priceRail: 180,
  priceRailTop: 60,
  priceRailBottom: 50,
  priceHandle: 25,
  priceEdgeBandPerMeter: 4.5,
  edgeBandWastePercent: 5,
  laborRate: 80,
  profitMargin: 50,
  doorHeightDeductionMm: 65, // 30mm base/teto + 35mm kit trilho
  slidingDoorOverlapMm: 20, // transpasse entre portas
  sheetWidthMm: 1850, // largura padrão da chapa MDF
  shippingCost: 0, // frete - padrão zero, usuário configura
  priceScrew: 0.50, // parafuso
  priceVB: 1.50, // dispositivo VB
  priceMinifix: 2.00, // dispositivo Minifix
  priceRafix: 1.80, // dispositivo Rafix
  priceAssemblyScrew: 0.30, // parafusos de montagem geral (estimado por móvel)
};

export const saveProject = (project: QuoteData) => {
  const projects = loadProjects();
  const existingIndex = projects.findIndex(p => p.project.id === project.project.id);
  
  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }
  
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error("Storage full", e);
  }
};

export const deleteProject = (id: string) => {
  const projects = loadProjects();
  const newProjects = projects.filter(p => p.project.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects));
};

export const loadProjects = (): QuoteData[] => {
  try {
    const stored = localStorage.getItem(PROJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : defaultSettings;
  } catch (e) {
    return defaultSettings;
  }
};

export const clearStorage = () => {
  localStorage.removeItem(PROJECTS_KEY);
  // Settings usually persist, but per instructions "Reset automatico", we clear everything.
  // However, keeping settings makes sense UX wise, but strictly following rules:
  localStorage.removeItem(SETTINGS_KEY);
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
