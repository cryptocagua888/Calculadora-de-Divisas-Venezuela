
import { GoogleGenAI, Type } from "@google/genai";
import { MarketData } from "../types";

const getApiKey = () => {
  try {
    return (window as any).process?.env?.API_KEY || null;
  } catch (e) {
    return null;
  }
};

/**
 * Obtiene el precio de USDT/USD desde la API de Yadio.
 * Maneja la inversión de la tasa para asegurar que siempre devuelva Bs por 1 USD.
 */
const fetchUsdtFromYadio = async (): Promise<number | null> => {
  try {
    // Usamos el endpoint USD/VES solicitado por el usuario
    const response = await fetch("https://api.yadio.io/rate/USD/VES");
    if (!response.ok) throw new Error("Yadio API error");
    const json = await response.json();
    
    // Yadio puede devolver el valor en 'rate' o 'result'
    const rawRate = json.rate || json.result || (json.request && json.request.amount);
    if (rawRate) {
      const num = parseFloat(rawRate);
      // Si el usuario dice que está invertida (1 VES a USD = ~0.02), 
      // la invertimos para obtener USD a VES (~45.0)
      if (num > 0 && num < 1) {
        return 1 / num;
      }
      return num;
    }
    return null;
  } catch (error) {
    console.error("Error fetching USDT from Yadio:", error);
    return null;
  }
};

export const fetchLatestRates = async (): Promise<MarketData> => {
  const fallback: MarketData = {
    usd_bcv: { price: 45.45, label: "Dólar BCV", symbol: "$", icon: "fa-building-columns", color: "blue" },
    eur_bcv: { price: 49.12, label: "Euro BCV", symbol: "€", icon: "fa-euro-sign", color: "indigo" },
    usdt: { price: 46.80, label: "USDT Binance", symbol: "₮", icon: "fa-circle-dollar-to-slot", color: "emerald" },
    lastUpdate: "Datos Estimados (BCV)",
    sources: [
      { title: "BCV Oficial", uri: "https://www.bcv.org.ve" },
      { title: "Yadio API", uri: "https://yadio.io" }
    ]
  };

  try {
    // 1. Obtener USDT primero (Fuente directa)
    const yadioPrice = await fetchUsdtFromYadio();
    
    const apiKey = getApiKey();
    if (!apiKey) {
      if (yadioPrice) fallback.usdt.price = yadioPrice;
      return fallback;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // 2. Obtener tasas BCV con Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Consulta hoy las tasas oficiales del Banco Central de Venezuela para el Dólar (USD) y el Euro (EUR).",
      config: { 
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            usd_bcv: { type: Type.NUMBER },
            eur_bcv: { type: Type.NUMBER },
            last_update: { type: Type.STRING }
          },
          required: ["usd_bcv", "eur_bcv"]
        }
      },
    });

    // Extracción ultra-segura del JSON para evitar errores de parseo
    const rawText = response.text || "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
       throw new Error("No JSON found in response");
    }
    
    const json = JSON.parse(jsonMatch[0]);
    
    const usd_bcv_price = Number(json.usd_bcv) || fallback.usd_bcv.price;
    const eur_bcv_price = Number(json.eur_bcv) || fallback.eur_bcv.price;
    const usdt_price = yadioPrice || fallback.usdt.price;

    return {
      usd_bcv: { price: usd_bcv_price, label: "Dólar BCV", symbol: "$", icon: "fa-building-columns", color: "blue" },
      eur_bcv: { price: eur_bcv_price, label: "Euro BCV", symbol: "€", icon: "fa-euro-sign", color: "indigo" },
      usdt: { price: usdt_price, label: "USDT Binance", symbol: "₮", icon: "fa-circle-dollar-to-slot", color: "emerald" },
      lastUpdate: json.last_update || new Date().toLocaleTimeString(),
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Fuente BCV",
        uri: chunk.web?.uri || "https://www.bcv.org.ve"
      })) || fallback.sources
    };
  } catch (error) {
    console.warn("Usando fallback por error en API:", error);
    // Intentamos al menos actualizar USDT si la API de Yadio funcionó antes de fallar Gemini
    const yadioPrice = await fetchUsdtFromYadio();
    if (yadioPrice) fallback.usdt.price = yadioPrice;
    return fallback;
  }
};

export const askAssistant = async (question: string, data: MarketData): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return "⚠️ Error: API_KEY no configurada en el entorno.";

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: question,
      config: {
        systemInstruction: `Eres un asistente financiero experto en Venezuela. 
        DATOS ACTUALES:
        - Dólar BCV: ${data.usd_bcv.price} Bs.
        - Euro BCV: ${data.eur_bcv.price} Bs.
        - USDT Binance: ${data.usdt.price} Bs.
        
        No menciones nunca "dólar paralelo". Usa "mercado digital" o "tasa USDT".
        Responde de forma concisa, educada y profesional.`
      }
    });

    return response.text || "No tengo una respuesta en este momento.";
  } catch (error) {
    console.error("Error en asistente:", error);
    return "Lo siento, hubo un error al procesar tu consulta.";
  }
};
