import { QuoteData, QuoteResult, AppSettings, MaterialItem } from "../types";

const mmToM = (mm: number) => mm / 1000;

export const generateLocalQuote = (data: QuoteData, settings: AppSettings): QuoteResult => {
  let totalArea15 = 0; // m2 for all 15mm panels
  let totalArea6 = 0; // m2 for 6mm panels (backs)
  // track area split by external/internal color to pick correct price per sheet
  let totalArea15External = 0; // doors + drawer fronts (external face)
  let totalArea15Internal = 0; // remaining 15mm area

  let totalHinges = 0;
  let totalSlidesTel = 0;
  let totalSlidesHidden = 0;
  let totalRails = 0;
  let totalHandles = 0;
  let totalEdgeMeters = 0; // meters of edge banding

  let laborHours = 0;

  const materialList: MaterialItem[] = [];

  data.modules.forEach((mod) => {
    const w = mmToM(mod.dimensions.width);
    const h = mmToM(mod.dimensions.height);
    const d = mmToM(mod.dimensions.depth);

    // Panels (m2): sides, top/bottom, back, shelves, doors, drawer fronts
    const sidesArea = 2 * (h * d);
    const topBottomArea = 2 * (w * d);
    const backArea = w * h;
    const shelvesArea = (mod.internals.shelves || 0) * (w * d);

    // Doors area (if any)
    const doorsArea = (mod.hardware.doorCount || 0) * (w * h);

    // Drawer fronts area estimate: use drawerSideHeight as height of front
    const drawerFrontHeight = mmToM(mod.internals.drawerSideHeight || 0);
    const drawerFrontsArea = (mod.internals.drawers || 0) * (w * drawerFrontHeight);

    // Assign most panels to 15mm, backs to 6mm
    const area15 = sidesArea + topBottomArea + shelvesArea + doorsArea + drawerFrontsArea;
    const area6 = backArea;

    // Consider doors and drawer fronts as "external" (colorExternal)
    const externalArea = doorsArea + drawerFrontsArea;
    const internalArea = Math.max(0, area15 - externalArea);

    totalArea15 += area15;
    totalArea15External += externalArea;
    totalArea15Internal += internalArea;
    totalArea6 += area6;

    // Edge band estimates (heuristic):
    // - Doors: perimeter of each door (2*(w+h))
    // - Drawer fronts: perimeter of each drawer front (2*(w + drawerFrontHeight))
    // - Shelves (front edge only): shelves * width
    // - Visible sides: assume each visible side contributes a vertical edge equal to height
    const doorEdge = (mod.hardware.doorCount || 0) * (2 * (w + h));
    const drawerEdge = (mod.internals.drawers || 0) * (2 * (w + drawerFrontHeight));
    const shelvesFrontEdge = (mod.internals.shelves || 0) * w;
    const visibleSidesEdge = (mod.materials.visibleSides || 0) * h;

    totalEdgeMeters += doorEdge + drawerEdge + shelvesFrontEdge + visibleSidesEdge;

    // Hardware counts
    if (mod.hardware.doorType === 'Giro (Dobradiças)') {
      // estimate 2 hinges per door
      totalHinges += (mod.hardware.doorCount || 0) * 2;
    } else if (mod.hardware.doorType === 'Correr (Trilhos)') {
      // each door uses one rail/system
      totalRails += (mod.hardware.doorCount || 0);
    }

    // Handles for doors and drawers
    totalHandles += (mod.hardware.doorCount || 0) + (mod.internals.drawers || 0);

    // Slides for drawers
    const drawerSlideType = mod.internals.drawerSlideType || 'Telescópica';
    if (drawerSlideType === 'Oculta') {
      totalSlidesHidden += (mod.internals.drawers || 0);
    } else {
      totalSlidesTel += (mod.internals.drawers || 0);
    }

    // Labor heuristics: base + per-feature
    laborHours += 2.0; // base per module
    laborHours += (mod.internals.shelves || 0) * 0.2;
    laborHours += (mod.internals.drawers || 0) * 0.5;
    laborHours += (mod.hardware.doorCount || 0) * 0.5;
    laborHours += (mod.internals.clothesRails || 0) * 0.25;
    laborHours += (mod.internals.shoeShelves || 0) * 0.25;
  });

  // Calculate sheets needed
  const sheetArea = settings.sheetArea || 2.8; // default to 2.8m2 if not provided
  // Determine sheets separately for external (color/white) and internal (color/white)
  // Decide which price to use based on module-level color values aggregated conservatively:
  // We'll assume external faces use colorExternal price, and internal faces use colorInternal price.

  // Sheets needed per area type
  const sheets15External = Math.max(0, Math.ceil(totalArea15External / sheetArea));
  const sheets15Internal = Math.max(0, Math.ceil(totalArea15Internal / sheetArea));
  const sheets6 = Math.max(0, Math.ceil(totalArea6 / sheetArea));

  // Costs
  // For cost calculation we need to decide whether external/internal use color or white price.
  // We'll compute costs using both priceMdfWhite15 and priceMdfColor15 where appropriate.
  const costSheets15Internal = sheets15Internal * (settings.priceMdfWhite15 || 0);
  // For external we prefer color price when available
  const costSheets15External = sheets15External * (settings.priceMdfColor15 || settings.priceMdfWhite15 || 0);
  const costSheets15 = costSheets15Internal + costSheets15External;
  const costSheets6 = sheets6 * settings.priceMdfWhite6;

  const costHinges = totalHinges * settings.priceHinge;
  const costSlidesTel = totalSlidesTel * settings.priceSlide;
  const costSlidesHidden = totalSlidesHidden * settings.priceSlideHidden;
  const costRails = totalRails * settings.priceRail;
  const costHandles = totalHandles * settings.priceHandle;
  // Apply waste percentage to edge band meters
  const wastePercent = settings.edgeBandWastePercent || 0;
  const totalEdgeMetersWithWaste = totalEdgeMeters * (1 + (wastePercent / 100));
  const costEdgeBand = totalEdgeMetersWithWaste * (settings.priceEdgeBandPerMeter || 0);

  const materialCost = costSheets15 + costSheets6 + costHinges + costSlidesTel + costSlidesHidden + costRails + costHandles;
  // include edge band cost
  const materialCostWithEdge = materialCost + costEdgeBand;

  const laborCost = laborHours * settings.laborRate;

  const totalCost = materialCostWithEdge + laborCost;
  const suggestedPrice = Math.round((totalCost * (1 + (settings.profitMargin / 100))) * 100) / 100;

  // Production time (days) estimate (8h/day)
  const productionTimeDays = Math.max(1, Math.ceil(laborHours / 8));

  // Build material list with Portuguese unit names
  const totalSheets15 = sheets15Internal + sheets15External;

  if (sheets15Internal > 0) {
    materialList.push({
      name: 'Chapa MDF 15mm (Interna - Branco)',
      quantity: sheets15Internal,
      unit: 'chapa',
      unitPrice: settings.priceMdfWhite15,
      totalPrice: costSheets15Internal,
    });
  }

  if (sheets15External > 0) {
    materialList.push({
      name: 'Chapa MDF 15mm (Externa - Cor)',
      quantity: sheets15External,
      unit: 'chapa',
      unitPrice: settings.priceMdfColor15 || settings.priceMdfWhite15,
      totalPrice: costSheets15External,
    });
  }

  materialList.push({
    name: 'Chapa MDF 6mm',
    quantity: sheets6,
    unit: 'chapa',
    unitPrice: settings.priceMdfWhite6,
    totalPrice: costSheets6,
  });

  if (totalHinges > 0) {
    materialList.push({
      name: 'Dobradiça',
      quantity: totalHinges,
      unit: 'un',
      unitPrice: settings.priceHinge,
      totalPrice: costHinges,
    });
  }
  if (totalSlidesTel > 0) {
    materialList.push({
      name: 'Corrediça Telescópica',
      quantity: totalSlidesTel,
      unit: 'par',
      unitPrice: settings.priceSlide,
      totalPrice: costSlidesTel,
    });
  }
  if (totalSlidesHidden > 0) {
    materialList.push({
      name: 'Corrediça Oculta',
      quantity: totalSlidesHidden,
      unit: 'par',
      unitPrice: settings.priceSlideHidden,
      totalPrice: costSlidesHidden,
    });
  }
  if (totalRails > 0) {
    materialList.push({
      name: 'Sistema de Correr',
      quantity: totalRails,
      unit: 'un',
      unitPrice: settings.priceRail,
      totalPrice: costRails,
    });
  }
  if (totalHandles > 0) {
    materialList.push({
      name: 'Puxador',
      quantity: totalHandles,
      unit: 'un',
      unitPrice: settings.priceHandle,
      totalPrice: costHandles,
    });
  }
  if (totalEdgeMeters > 0) {
    materialList.push({
      name: 'Fita de Borda',
      quantity: Math.round(totalEdgeMetersWithWaste * 100) / 100,
      unit: 'm',
      unitPrice: settings.priceEdgeBandPerMeter,
      totalPrice: Math.round(costEdgeBand * 100) / 100,
    });
  }

  const description = `Orçamento gerado localmente para ${data.project.projectName} - ${data.project.clientName}.`;

  const observations: string[] = [];
  observations.push(`Área total 15mm: ${totalArea15.toFixed(2)} m², 6mm: ${totalArea6.toFixed(2)} m².`);
  observations.push(`Horas estimadas de produção: ${laborHours.toFixed(2)}h.`);
  observations.push(`Sheets estimados (15mm): ${totalSheets15}, (6mm): ${sheets6}.`);
  observations.push(`Fita de borda estimada: ${Math.round(totalEdgeMeters * 100) / 100} m (+${wastePercent}% desperdício) = ${Math.round(totalEdgeMetersWithWaste * 100) / 100} m (R$ ${Math.round(costEdgeBand * 100) / 100}).`);

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    suggestedPrice,
    productionTimeDays,
    materialList,
    laborCost: Math.round(laborCost * 100) / 100,
    description,
    observations,
  };
};

export default generateLocalQuote;
