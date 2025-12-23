import { GoogleGenAI, Type } from "@google/genai";
import { MarketData } from "../types";

/**
 * Fuente 1: DolarVzla (API)
 */
const fetchDolarVzla = async () => {
  try {
    const response = await fetch("https://api.dolarvzla.com/public/exchange-rate", {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    const usd = data.usd || data.bcv?.usd || data.dolar;
    const eur = data.eur || data.bcv?.eur || data.euro;

    if (usd && eur) {
      return { 
        usd: parseFloat(usd), 
        eur: parseFloat(eur), 
        source: "DolarVzla API"
      };
    }
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Fuente 2: DolarApi (Respaldo)
 */
const fetchDolarApiBackup = async () => {
  try {
    const [u, e] = await Promise.all([
      fetch("https://ve.dolarapi.com/v1/dolares/oficial"),
      fetch("https://ve.dolarapi.com/v1/euros/oficial")
    ]);
    if (!u.ok || !e.ok) return null;
    const du = await u.json();
    const de = await e.json();
    return { 
      usd: du.promedio, 
      eur: de.promedio, 
      source: "DolarApi"
    };
  } catch (e) {
    return null;
  }
};

/**
 * Fuente 3: Google Search via Gemini (Búsqueda de emergencia si las APIs fallan)
 */
const fetchRatesViaAI = async () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Busca la tasa oficial actual del BCV para el dólar y el euro en Venezuela hoy. Responde solo con el JSON solicitado.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            usd: { type: Type.NUMBER },
            eur: { type: Type.NUMBER }
          },
          required: ["usd", "eur"]
        }
      }
    });
    
    const data = JSON.parse(response.text || "{}");
    if (data.usd && data.eur) {
      return { ...data, source: "BCV (vía Google Search)" };
    }
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Obtiene la tasa USDT (Bolívares por cada 1 USDT)
 */
const fetchUsdtFromYadio = async (): Promise<number | null> => {
  try {
    const response = await fetch("https://api.yadio.io/rate/USD/VES");
    if (!response.ok) return null;
    const json = await response.json();
    
    if (json.rate) {
      let rate = parseFloat(json.rate);
      // Si la tasa es < 1 (ej. 0.018), la API devolvió "USD por 1 VES". 
      // Invertimos para obtener "VES por 1 USD" (ej. 55.40).
      if (rate > 0 && rate < 1.0) {
        rate = 1 / rate;
      }
      return rate;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const fetchLatestRates = async (): Promise<MarketData> => {
  const fallback: MarketData = {
    usd_bcv: { price: 0, label: "Dólar BCV", symbol: "$", icon: "fa-building-columns", color: "blue" },
    eur_bcv: { price: 0, label: "Euro BCV", symbol: "€", icon: "fa-euro-sign", color: "indigo" },
    usdt: { price: 0, label: "USDT Binance", symbol: "₮", icon: "fa-circle-dollar-to-slot", color: "emerald" },
    lastUpdate: "Consultando...",
    sources: []
  };

  try {
    // 1. Intentar APIs tradicionales
    let bcvData = await fetchDolarVzla();
    if (!bcvData) bcvData = await fetchDolarApiBackup();

    // 2. Si fallan, intentar con búsqueda IA
    if (!bcvData) {
      bcvData = await fetchRatesViaAI();
    }

    const usdtPrice = await fetchUsdtFromYadio();

    return {
      usd_bcv: { ...fallback.usd_bcv, price: bcvData?.usd || 0 },
      eur_bcv: { ...fallback.eur_bcv, price: bcvData?.eur || 0 },
      usdt: { ...fallback.usdt, price: usdtPrice || 0 },
      lastUpdate: bcvData ? `Fuente: ${bcvData.source}` : "Error de conexión con el BCV",
      sources: [
        { title: bcvData?.source || "BCV", uri: "https://www.bcv.org.ve" },
        { title: "Yadio (USDT)", uri: "https://yadio.io" }
      ]
    };
  } catch (error) {
    return fallback;
  }
};

export const askAssistant = async (query: string, data: MarketData): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "⚠️ Error: La variable API_KEY no está definida. Verifica la configuración de tu proyecto.";
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `Eres un experto financiero en Venezuela. Datos actuales en Bs: Dólar BCV: ${data.usd_bcv.price}, Euro BCV: ${data.eur_bcv.price}, USDT: ${data.usdt.price}. Usa Google Search si el usuario pregunta por noticias recientes.`
      }
    });
    return response.text || "No tengo una respuesta clara en este momento.";
  } catch (e: any) {
    console.error("Gemini Error:", e);
    return "Lo siento, hubo un problema al conectar con mi inteligencia artificial.";
  }
};