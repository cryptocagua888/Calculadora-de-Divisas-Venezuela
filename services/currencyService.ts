
import { GoogleGenAI, Type } from "@google/genai";
import { MarketData } from "../types";

const getApiKey = () => {
  try {
    return (window as any).process?.env?.API_KEY || null;
  } catch (e) {
    return null;
  }
};

const cleanNumber = (val: any): number | null => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(',', '.').replace(/[^\d.]/g, '');
    return parseFloat(cleaned);
  }
  return null;
};

const fetchUsdtFromYadio = async (): Promise<number | null> => {
  try {
    const response = await fetch("https://api.yadio.io/rate/USD/VES");
    if (!response.ok) throw new Error("Yadio API error");
    const json = await response.json();
    const rawRate = json.rate;
    if (rawRate) {
      const num = parseFloat(rawRate);
      // Inversión: si es < 1, es 1 VES en USDT. Invertimos para obtener 1 USDT en VES.
      return num > 0 && num < 1 ? 1 / num : num;
    }
    return null;
  } catch (error) {
    console.error("Error en Yadio:", error);
    return null;
  }
};

export const fetchLatestRates = async (): Promise<MarketData> => {
  const fallback: MarketData = {
    usd_bcv: { price: 45.45, label: "Dólar BCV", symbol: "$", icon: "fa-building-columns", color: "blue" },
    eur_bcv: { price: 49.12, label: "Euro BCV", symbol: "€", icon: "fa-euro-sign", color: "indigo" },
    usdt: { price: 46.80, label: "USDT Binance", symbol: "₮", icon: "fa-circle-dollar-to-slot", color: "emerald" },
    lastUpdate: "Referencia Estimada",
    sources: [{ title: "BCV", uri: "https://www.bcv.org.ve" }, { title: "Yadio", uri: "https://yadio.io" }]
  };

  try {
    const yadioPrice = await fetchUsdtFromYadio();
    const apiKey = getApiKey();
    
    if (!apiKey) {
      if (yadioPrice) fallback.usdt.price = yadioPrice;
      return fallback;
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Busca los tipos de cambio actuales del Banco Central de Venezuela (BCV) para Dólar y Euro.",
      config: { 
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            usd_bcv: { type: Type.STRING },
            eur_bcv: { type: Type.STRING },
            last_update: { type: Type.STRING }
          },
          required: ["usd_bcv", "eur_bcv"]
        }
      },
    });

    // Limpieza robusta de la respuesta para evitar el error de caracteres extraños
    const rawText = response.text || "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const json = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    
    const parsedUsd = cleanNumber(json.usd_bcv);
    const parsedEur = cleanNumber(json.eur_bcv);

    return {
      usd_bcv: { price: parsedUsd || fallback.usd_bcv.price, label: "Dólar BCV", symbol: "$", icon: "fa-building-columns", color: "blue" },
      eur_bcv: { price: parsedEur || fallback.eur_bcv.price, label: "Euro BCV", symbol: "€", icon: "fa-euro-sign", color: "indigo" },
      usdt: { price: yadioPrice || fallback.usdt.price, label: "USDT Binance", symbol: "₮", icon: "fa-circle-dollar-to-slot", color: "emerald" },
      lastUpdate: json.last_update || new Date().toLocaleTimeString(),
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
        title: c.web?.title || "BCV Oficial",
        uri: c.web?.uri || "https://www.bcv.org.ve"
      })) || fallback.sources
    };
  } catch (error) {
    console.warn("Falla en servicio, usando respaldo:", error);
    return fallback;
  }
};

export const askAssistant = async (question: string, data: MarketData): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return "API_KEY no configurada.";
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: question,
      config: {
        systemInstruction: `Asistente financiero venezolano. Dólar BCV: ${data.usd_bcv.price}, Euro: ${data.eur_bcv.price}, USDT: ${data.usdt.price}. Responde breve sin mencionar 'paralelo'.`
      }
    });
    return response.text || "Sin respuesta.";
  } catch {
    return "Error de conexión con la IA.";
  }
};