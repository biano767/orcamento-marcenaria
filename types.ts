export interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface QuoteResult {
  totalCost: number;
  suggestedPrice: number;
  productionTimeDays: number;
  materialList: MaterialItem[];
  laborCost: number;
  description: string;
  observations: string[];
}

// User configurable prices
export interface AppSettings {
  priceMdfWhite15: number;
  priceMdfWhite6: number;
  priceMdfColor15: number;
  sheetArea: number; // m2
  priceHinge: number;
  priceSlide: number;
  priceSlideHidden: number; // Corrediça oculta
  priceRail: number; // Sistema porta de correr
  priceRailTop: number; // Trilho superior (R$/un)
  priceRailBottom: number; // Trilho inferior (R$/un)
  priceHandle: number; // Puxador
  laborRate: number;
  priceEdgeBandPerMeter: number; // R$/metro da fita de borda
  edgeBandWastePercent: number; // percentual de desperdício aplicado à fita de borda
  profitMargin: number;
  doorHeightDeductionMm: number; // mm to subtract from module height for sliding doors (base + kit trilho)
  slidingDoorOverlapMm: number; // mm added for overlap between sliding doors
  sheetWidthMm: number; // mm - width of MDF sheet for cutting optimization (e.g., 1850mm)
  shippingCost: number; // R$ - valor fixo de frete
  priceScrew: number; // R$/un - parafuso comum
  priceVB: number; // R$/un - dispositivo VB
  priceMinifix: number; // R$/un - dispositivo Minifix
  priceRafix: number; // R$/un - dispositivo Rafix
  priceAssemblyScrew: number; // R$/un - parafusos de montagem geral do móvel
}

export interface ProjectDetails {
  id: string;
  projectName: string;
  clientName: string;
  description: string;
  dateCreated: string;
  status: 'Draft' | 'Done';
  // imageBase64 removed from here
}

export interface ModuleDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ModuleMaterials {
  colorInternal: string;
  colorExternal: string;
  backingType: string;
  installationType: string;
  visibleSides: number; // 0, 1, 2, 3, 4
}

export interface ModuleInternals {
  shelves: number;
  shelfMountDevice?: 'Parafuso' | 'VB' | 'Minifix' | 'Rafix'; // dispositivo de montagem das prateleiras
  drawers: number;
  drawerSideHeight: number; 
  drawerSlideType: 'Telescópica' | 'Oculta';
  drawerFrontsExternal?: boolean; // se true, frentes de gaveta usam acabamento externo (color)
  shoeShelves: number;
  clothesRails: number;
}

export interface ModuleHardware {
  doorType: 'Giro (Dobradiças)' | 'Correr (Trilhos)' | 'Sem Portas (Nicho)';
  doorCount: number;
  handleModel: string;
}

export type ModuleType = 'Armário Padrão' | 'Gaveteiro' | 'Prateleira/Nicho' | 'Mesa/Bancada';

export interface ModuleDefinition {
  id: string;
  name: string;
  type: ModuleType;
  dimensions: ModuleDimensions;
  materials: ModuleMaterials;
  internals: ModuleInternals;
  hardware: ModuleHardware;
  imageBase64?: string; // Moved here
}

// Unified Data Structure for a Quote
export interface QuoteData {
  project: ProjectDetails;
  modules: ModuleDefinition[];
  result?: QuoteResult;
}

export interface QuoteFormData {
  width: number;
  height: number;
  depth: number;
  doors: number;
  drawers: number;
  description: string;
  project?: ProjectDetails;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  WIZARD = 'WIZARD',
  SETTINGS = 'SETTINGS',
  RESULT = 'RESULT'
}