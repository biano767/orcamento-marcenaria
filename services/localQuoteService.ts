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
    // For sliding doors: calculate actual door dimensions (width and height with deductions)
    let doorsArea = 0;
    if (mod.hardware.doorCount > 0 && mod.hardware.doorType === 'Correr (Trilhos)') {
      // Sliding door: width = (module width / door count) + overlap
      const doorWidth = (w / mod.hardware.doorCount) + (mmToM(settings.slidingDoorOverlapMm || 20));
      // Sliding door height = module height - deduction (base + kit trilho)
      const doorHeight = h - mmToM(settings.doorHeightDeductionMm || 65);
      doorsArea = mod.hardware.doorCount * (doorWidth * Math.max(0, doorHeight));
    } else {
      // Hinged doors: use full module height and width
      doorsArea = (mod.hardware.doorCount || 0) * (w * h);
    }

    // Drawer fronts area estimate: use drawerSideHeight as height of front
    const drawerFrontHeight = mmToM(mod.internals.drawerSideHeight || 0);
    const drawerFrontsArea = (mod.internals.drawers || 0) * (w * drawerFrontHeight);
    // Only count drawer edges/area as external if module explicitly marks drawer fronts as external
    const drawerFrontsAreExternal = !!mod.internals.drawerFrontsExternal;

    // Assign most panels to 15mm, backs to 6mm
    // By default drawer fronts are INTERNAL (not counted here); only add if explicitly marked as external
    const area15 = sidesArea + topBottomArea + shelvesArea + doorsArea + (drawerFrontsAreExternal ? drawerFrontsArea : 0);
    const area6 = backArea;

    // Determine how many lateral sides are finished (visible) and should use external color
    // Business rule:
    // - visibleSides = 0 -> both laterals considered internal
    // - visibleSides = 1 -> one lateral internal, one external
    // - visibleSides = 2 -> both laterals external
    const visibleSidesCount = Math.max(0, Math.min(mod.materials.visibleSides || 0, 2));
    const externalSidesArea = visibleSidesCount * (h * d); // area of lateral faces that are external
    const internalSidesArea = sidesArea - externalSidesArea;

    // Consider doors, drawer fronts and external lateral faces as "external" (colorExternal)
    // (externalArea computed below with drawerFronts conditional)
    const externalArea = doorsArea + (drawerFrontsAreExternal ? drawerFrontsArea : 0) + externalSidesArea;
    // Internal area is the remainder of area15 not counted as external, PLUS internal drawer fronts
    const internalArea = Math.max(0, area15 - externalArea) + (drawerFrontsAreExternal ? 0 : drawerFrontsArea);

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

  // Correct double-counting of shared vertical panels between adjacent modules.
  // When two modules are placed side-by-side (wall-to-wall), the internal separating panel
  // should be counted once, but earlier we counted each module's lateral panel separately (twice).
  // We'll subtract the shared panel area from internal or external totals when both adjacent
  // modules agree on the panel being internal or external (i.e., visibleSides === 0 or === 2).
  for (let i = 0; i < data.modules.length - 1; i++) {
    const left = data.modules[i];
    const right = data.modules[i + 1];
    const leftH = mmToM(left.dimensions.height);
    const rightH = mmToM(right.dimensions.height);
    const leftD = mmToM(left.dimensions.depth);
    const rightD = mmToM(right.dimensions.depth);

    // Use max of heights and depths for the shared panel estimate
    const sharedHeight = Math.max(leftH, rightH);
    const sharedDepth = Math.max(leftD, rightD);
    const sharedArea = sharedHeight * sharedDepth;

    const leftVisible = (left.materials.visibleSides || 0);
    const rightVisible = (right.materials.visibleSides || 0);

    if (leftVisible === 0 && rightVisible === 0) {
      // both consider the interface internal -> subtract from internal area
      totalArea15Internal = Math.max(0, totalArea15Internal - sharedArea);
      totalArea15 = Math.max(0, totalArea15 - sharedArea);
    } else if (leftVisible === 2 && rightVisible === 2) {
      // both consider the interface external (rare) -> subtract from external area
      totalArea15External = Math.max(0, totalArea15External - sharedArea);
      totalArea15 = Math.max(0, totalArea15 - sharedArea);
    }
    // if mixed visibility (1 vs 0/2 or 1 vs 1) we avoid changing because we can't reliably
    // decide which side should be external without side-specific flags.
  }

  // Calculate sheets needed
  const sheetArea = settings.sheetArea || 2.8; // default to 2.8m2 if not provided
  const sheetWidthMm = settings.sheetWidthMm || 1850; // mm - physical sheet width for cutting optimization
  const sheetWidthM = sheetWidthMm / 1000;

  // For sliding doors, consider cutting constraint: doors are cut from sheets widthwise
  // Count how many doors fit in one sheet based on width, not just area
  let sheets15ExternalDoors = 0;
  if (totalRails > 0) {
    // Calculate actual door width in mm
    const w_mm = data.modules[0]?.dimensions.width || 2750;
    const doorWidthMm = (w_mm / totalRails) + (settings.slidingDoorOverlapMm || 20);
    // How many doors fit in one sheet width?
    const doorsPerSheet = Math.floor(sheetWidthMm / doorWidthMm);
    // Sheets needed for all doors (considering cutting constraint)
    sheets15ExternalDoors = Math.ceil(totalRails / Math.max(1, doorsPerSheet));
  }

  // Remaining external area (non-doors) use area-based calculation
  const externalAreaNonDoors = totalArea15External - (totalRails > 0 ? 
    (data.modules.reduce((sum, mod) => {
      if (mod.hardware.doorType === 'Correr (Trilhos)') {
        const doorHeight = mmToM(mod.dimensions.height) - mmToM(settings.doorHeightDeductionMm || 65);
        const doorWidth = (mmToM(mod.dimensions.width) / mod.hardware.doorCount) + mmToM(settings.slidingDoorOverlapMm || 20);
        return sum + (mod.hardware.doorCount * doorWidth * Math.max(0, doorHeight));
      }
      return sum + (mod.hardware.doorCount * mmToM(mod.dimensions.width) * mmToM(mod.dimensions.height));
    }, 0)) : 0);

  const sheets15ExternalNonDoors = Math.max(0, Math.ceil(externalAreaNonDoors / sheetArea));
  const sheets15External = sheets15ExternalDoors + sheets15ExternalNonDoors;
  
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
  const costRailsKit = totalRails * (settings.priceRail || 0);
  const costRailsTop = totalRails * (settings.priceRailTop || 0);
  const costRailsBottom = totalRails * (settings.priceRailBottom || 0);
  const costRails = costRailsKit + costRailsTop + costRailsBottom;
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
  if ((settings.priceRail || 0) > 0 && totalRails > 0) {
    materialList.push({
      name: 'Sistema Porta de Correr (kit)',
      quantity: totalRails,
      unit: 'un',
      unitPrice: settings.priceRail,
      totalPrice: costRailsKit,
    });
  }
  if ((settings.priceRailTop || 0) > 0 && totalRails > 0) {
    materialList.push({
      name: 'Trilho Superior',
      quantity: totalRails,
      unit: 'un',
      unitPrice: settings.priceRailTop,
      totalPrice: costRailsTop,
    });
  }
  if ((settings.priceRailBottom || 0) > 0 && totalRails > 0) {
    materialList.push({
      name: 'Trilho Inferior',
      quantity: totalRails,
      unit: 'un',
      unitPrice: settings.priceRailBottom,
      totalPrice: costRailsBottom,
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
