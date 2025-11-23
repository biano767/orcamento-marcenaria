import { GoogleGenAI, Type } from "@google/genai";
import { QuoteData, QuoteResult, AppSettings } from "../types";

const getAiClient = () => {
  // Look up API key from multiple sources to support local `.env.local`, Vite env vars
  const apiKey = (process && (process.env.API_KEY || process.env.GEMINI_API_KEY)) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    undefined;

  if (!apiKey) {
    throw new Error("API Key not found. Set API_KEY (server) or VITE_GEMINI_API_KEY (local) in your environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateQuote = async (data: QuoteData, settings: AppSettings): Promise<QuoteResult> => {
  const ai = getAiClient();
  
  // Construct module descriptions
  let modulesPrompt = "";
  data.modules.forEach((mod, index) => {
    // Determine slide type text
    const slideInfo = mod.internals.drawerSlideType || 'Telescópica';

    modulesPrompt += `
    MÓDULO ${index + 1} (${mod.name} - ${mod.type}):
    - Dimensões: ${mod.dimensions.width}mm (L) x ${mod.dimensions.height}mm (A) x ${mod.dimensions.depth}mm (P)
    - Materiais: Caixa ${mod.materials.colorInternal}, Frente ${mod.materials.colorExternal}
    - Fundo: ${mod.materials.backingType}
    - Instalação: ${mod.materials.installationType}, Lados visíveis: ${mod.materials.visibleSides}
    - Interno: ${mod.internals.shelves} prateleiras, ${mod.internals.drawers} gavetas (Tipo Corrediça: ${slideInfo}, Altura Lateral: ${mod.internals.drawerSideHeight}mm), ${mod.internals.shoeShelves} sapateiras, ${mod.internals.clothesRails} cabideiros.
    - Ferragens: Porta ${mod.hardware.doorType} (Qtd: ${mod.hardware.doorCount}), Puxador ${mod.hardware.handleModel}
    --------------------------------------------------
    `;
  });

  // Calculate raw material costs based on settings to give context to AI
  const prompt = `
    Você é um especialista orçamentista de marcenaria. Gere um orçamento detalhado somando TODOS os módulos abaixo.
    
    DADOS DO PROJETO:
    - Cliente: ${data.project.clientName}
    - Descrição Geral: ${data.project.description}
    
    LISTA DE MÓDULOS:
    ${modulesPrompt}

    BASE DE PREÇOS (Configurado pelo usuário):
    - Chapa MDF 15mm Branco: R$ ${settings.priceMdfWhite15}
    - Chapa MDF 15mm Cor: R$ ${settings.priceMdfColor15}
    - Chapa MDF 6mm: R$ ${settings.priceMdfWhite6}
    - Área da Chapa: ${settings.sheetArea} m²
    - Dobradiça (un): R$ ${settings.priceHinge}
    - Corrediça Telescópica (par): R$ ${settings.priceSlide}
    - Corrediça Oculta (par): R$ ${settings.priceSlideHidden}
    - Sistema de Correr (porta): R$ ${settings.priceRail}
    - Puxador (un): R$ ${settings.priceHandle}
    - Mão de obra (hora): R$ ${settings.laborRate}
    - Margem de Lucro Desejada: ${settings.profitMargin}%

    INSTRUÇÕES:
    1. Calcule a quantidade de chapas (ou fração) necessária para TODOS os módulos somados.
    2. Calcule ferragens exatas somando as necessidades de cada módulo. ATENÇÃO: Se o módulo especifica 'Corrediça Oculta', use o preço da Corrediça Oculta, senão use Telescópica.
    3. Estime horas de trabalho considerando a complexidade de múltiplos módulos.
    4. O "suggestedPrice" deve ser o (Custo Material + Custo Mão de Obra) + Margem de Lucro.
    5. IMPORTANTE: Na lista de materiais (materialList), no campo 'unit', use SEMPRE termos em PORTUGUÊS: use 'chapa' (para MDF), 'un' (para ferragens), 'm' (para fitas). Não use termos em inglês como 'sheet'.
    
    Retorne JSON.
  `;

  const parts: any[] = [{ text: prompt }];

  // Removed project-level image sending logic as per request change

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalCost: { type: Type.NUMBER, description: "Custo total (Materiais + MO)" },
            suggestedPrice: { type: Type.NUMBER, description: "Preço final de venda" },
            productionTimeDays: { type: Type.NUMBER },
            laborCost: { type: Type.NUMBER },
            description: { type: Type.STRING },
            observations: { type: Type.ARRAY, items: { type: Type.STRING } },
            materialList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  unitPrice: { type: Type.NUMBER },
                  totalPrice: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");
    
    return JSON.parse(resultText) as QuoteResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};