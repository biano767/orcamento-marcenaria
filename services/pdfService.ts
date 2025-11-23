import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuoteResult, QuoteFormData, ModuleDefinition } from '../types';

const formatUnit = (unit: string) => {
  if (!unit) return '';
  const u = unit.toLowerCase().trim();
  if (u === 'sheet') return 'chapa';
  if (u === 'sheets') return 'chapas';
  return unit;
};

export const generatePDF = (
  formData: QuoteFormData, 
  result: QuoteResult, 
  modules: ModuleDefinition[],
  type: 'client' | 'internal' = 'internal'
) => {
  const doc = new jsPDF();
  const isClient = type === 'client';
  const PAGE_HEIGHT = doc.internal.pageSize.height; // Usually 297mm for A4
  const MARGIN_BOTTOM = 20;

  const checkPageBreak = (currentY: number, neededSpace: number) => {
    if (currentY + neededSpace > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage();
      return 20; // Reset Y to top margin
    }
    return currentY;
  };

  // Header
  doc.setFontSize(20);
  doc.setTextColor(41, 128, 185); // Blue
  doc.text(isClient ? "Proposta Comercial - Mobiliário" : "Orçamento de Produção", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(`Projeto: ${formData.description.split('-')[0] || 'Mobiliário Sob Medida'}`, 14, 35);

  // Client/Project Info
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Detalhes do Projeto:", 14, 45);
  
  doc.setFontSize(10);
  const splitDesc = doc.splitTextToSize(`Descrição: ${formData.description}`, 180);
  doc.text(splitDesc, 14, 53);

  // Modules List
  let yPos = 53 + (splitDesc.length * 5) + 10;
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Detalhamento dos Módulos:", 14, yPos);
  yPos += 10;
  
  modules.forEach((mod, idx) => {
    // Estimate block height base
    const baseHeight = isClient ? 50 : 25;
    // Check if we need to add space for image in client view
    const hasImage = isClient && mod.imageBase64;
    const estimatedImageHeight = hasImage ? 60 : 0;

    yPos = checkPageBreak(yPos, baseHeight + estimatedImageHeight);

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`${idx + 1}. ${mod.name} (${mod.type})`, 14, yPos);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60);
    const modDims = `${mod.dimensions.width}L x ${mod.dimensions.height}A x ${mod.dimensions.depth}P mm`;
    doc.text(modDims, 14, yPos + 5);

    if (isClient) {
      // --- CLIENT VIEW: DETAILED SPECS ---
      
      const leftColX = 14;
      const rightColX = 110;
      let currentY = yPos + 12;

      // Column 1
      doc.text(`• MDF Externo: ${mod.materials.colorExternal}`, leftColX, currentY);
      doc.text(`• MDF Interno: ${mod.materials.colorInternal}`, leftColX, currentY + 5);
      doc.text(`• Instalação: ${mod.materials.installationType}`, leftColX, currentY + 10);
      
      // Column 2
      doc.text(`• Portas: ${mod.hardware.doorCount}x (${mod.hardware.doorType})`, rightColX, currentY);
      
      // Handle Logic
      if (mod.hardware.doorCount > 0) {
        doc.text(`• Puxadores: ${mod.hardware.handleModel}`, rightColX, currentY + 5);
      } else {
        doc.text(`• Puxadores: N/A`, rightColX, currentY + 5);
      }

      // Internals & Slides Logic
      doc.text(`• Interno: ${mod.internals.shelves} Prateleiras | ${mod.internals.drawers} Gavetas`, rightColX, currentY + 10);
      
      let slidesText = "-";
      if (mod.internals.drawers > 0) {
        const type = mod.internals.drawerSlideType || "Telescópica";
        slidesText = type === "Oculta" ? "Corrediças Ocultas (Amortecimento)" : "Corrediças Telescópicas Reforçadas";
      }
      doc.text(`• Corrediças: ${slidesText}`, rightColX, currentY + 15);

      yPos += 35; // Text space

      // --- RENDER MODULE SPECIFIC IMAGE IF AVAILABLE ---
      if (mod.imageBase64) {
         yPos = checkPageBreak(yPos, 60); // Check space specifically for image again just in case
         try {
             // Keep image aspect ratio but limit height
             const imgProps = doc.getImageProperties(mod.imageBase64);
             const maxWidth = 80; 
             const maxHeight = 60;
             let imgW = imgProps.width;
             let imgH = imgProps.height;
             
             // Resize logic
             const ratio = imgW / imgH;
             if (imgH > maxHeight) {
                 imgH = maxHeight;
                 imgW = imgH * ratio;
             }
             if (imgW > maxWidth) {
                 imgW = maxWidth;
                 imgH = imgW / ratio;
             }

             doc.addImage(mod.imageBase64, 'JPEG', 14, yPos, imgW, imgH);
             doc.setFontSize(8);
             doc.setTextColor(150);
             doc.text("Referência visual", 14, yPos + imgH + 3);
             yPos += imgH + 10;
         } catch(e) {
             console.error("Error rendering module image", e);
             yPos += 5;
         }
      } else {
         yPos += 5; // Extra padding if no image
      }

    } else {
      // --- INTERNAL VIEW: COMPACT SPECS ---
      const modSpecs = `Cor Ext: ${mod.materials.colorExternal} | Cor Int: ${mod.materials.colorInternal} | Portas: ${mod.hardware.doorCount}`;
      doc.text(modSpecs, 14, yPos + 10);
      
      let slidesInternal = "";
      if (mod.internals.drawers > 0) {
         slidesInternal = ` | Corrediça: ${mod.internals.drawerSlideType || 'Telescópica'}`;
      }
      doc.text(`Interno: ${mod.internals.shelves} Prat. / ${mod.internals.drawers} Gav.${slidesInternal}`, 14, yPos + 15);

      yPos += 22;
    }
  });

  yPos += 5;

  if (isClient) {
    // --- CLIENT VIEW: ONLY FINAL PRICE ---
    
    yPos = checkPageBreak(yPos, 50);

    // Visual separator
    doc.setDrawColor(200);
    doc.line(14, yPos, 196, yPos);
    yPos += 15;

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Valor Total do Investimento:", 14, yPos);
    
    doc.setFontSize(24);
    doc.setTextColor(41, 128, 185);
    doc.setFont("helvetica", "bold");
    doc.text(`R$ ${result.suggestedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, yPos + 12);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("* O valor inclui materiais, fabricação e instalação.", 14, yPos + 20);
    doc.text("* Validade da proposta: 15 dias.", 14, yPos + 25);
    
    // NOTE: Technical Observations removed for Client PDF.

  } else {
    // --- INTERNAL VIEW: DETAILED COSTS ---
    
    yPos = checkPageBreak(yPos, 60);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Resumo Financeiro (Interno):", 14, yPos);
    
    const summaryData = [
      ["Custo Materiais & Ferragens", `R$ ${(result.totalCost - result.laborCost).toFixed(2)}`],
      ["Custo Mão de Obra", `R$ ${result.laborCost.toFixed(2)}`],
      ["Custo Total Produção", `R$ ${result.totalCost.toFixed(2)}`],
      ["Lucro Estimado", `R$ ${(result.suggestedPrice - result.totalCost).toFixed(2)}`],
      ["Prazo Estimado", `${result.productionTimeDays} dias`],
      ["Valor Final Venda", `R$ ${result.suggestedPrice.toFixed(2)}`]
    ];

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Item', 'Valor']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20, bottom: 20 }
    });

    // Material List
    let finalY = (doc as any).lastAutoTable.finalY || 120;
    
    if (finalY + 15 > PAGE_HEIGHT - MARGIN_BOTTOM) {
        doc.addPage();
        finalY = 20;
    }

    doc.text("Lista de Materiais de Produção:", 14, finalY + 10);

    const materialRows = result.materialList.map(item => [
      item.name,
      `${item.quantity} ${formatUnit(item.unit)}`,
      `R$ ${item.unitPrice.toFixed(2)}`,
      `R$ ${item.totalPrice.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: finalY + 15,
      head: [['Material', 'Qtd', 'Unit.', 'Total']],
      body: materialRows,
      theme: 'striped',
      margin: { top: 20, bottom: 20 }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Observations (Common)
    const obsY = checkPageBreak(yPos, 30);
    if (result.observations.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text("Observações Técnicas / Notas:", 14, obsY);
        doc.setFontSize(9);
        doc.setTextColor(60);
        let currentObsY = obsY + 8;
        result.observations.forEach((obs) => {
            const splitObs = doc.splitTextToSize(`• ${obs}`, 180);
            if (currentObsY + (splitObs.length * 5) > PAGE_HEIGHT - MARGIN_BOTTOM) {
                doc.addPage();
                currentObsY = 20;
            }
            doc.text(splitObs, 14, currentObsY);
            currentObsY += splitObs.length * 5;
        });
    }
  }

  // Save file with distinct name
  const suffix = isClient ? "CLIENTE" : "PRODUCAO";
  doc.save(`Orcamento_${formData.project?.projectName || 'Projeto'}_${suffix}.pdf`);
};