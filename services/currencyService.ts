
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
      return { usd: parseFloat(usd), eur: parseFloat(eur), source: "DolarVzla" };
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
    return { usd: du.promedio, eur: de.promedio, source: "DolarApi" };
  } catch (e) {
    return null;
  }
};

/**
 * Fuente 3: Google Search via Gemini (Emergencia)
 * Extracts current rates from the web using Search Grounding.
 */
const fetchRatesViaAI = async () => {
  try {
    // Initializing Gemini client with direct process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Busca la tasa oficial actual del BCV para el dólar y el euro en Venezuela hoy. Proporciona solo los valores numéricos.",
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType is omitted as Search Grounding does not guarantee JSON format.
      }
    });

    const text = response.text || "";
    // Robust extraction using regex as response.text should not be parsed as JSON when using googleSearch
    const usdMatch = text.match(/usd[:\s]+(\d+[,.]\d+)/i) || text.match(/d[óo]lar[:\s]+(\d+[,.]\d+)/i);
    const eurMatch = text.match(/eur[:\s]+(\d+[,.]\d+)/i) || text.match(/euro[:\s]+(\d+[,.]\d+)/i);
    
    const usd = usdMatch ? parseFloat(usdMatch[1].replace(',', '.')) : 0;
    const eur = eurMatch ? parseFloat(eurMatch[1].replace(',', '.')) : 0;

    // Extracting grounding URLs as required for Search Grounding transparency
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Fuente BCV",
      uri: chunk.web?.uri || "https://www.bcv.org.ve"
    })) || [];

    if (usd > 0 && eur > 0) {
      return { usd, eur, source: "BCV (Google Search)", sources };
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
      // Si la tasa es < 1 (ej. 0.018), invertimos para obtener Bs/USD
      if (rate > 0 && rate < 5) {
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
    let bcvData = await fetchDolarVzla() || await fetchDolarApiBackup();
    if (!bcvData && process.env.API_KEY) bcvData = await fetchRatesViaAI();
    const usdtPrice = await fetchUsdtFromYadio();

    return {
      usd_bcv: { ...fallback.usd_bcv, price: bcvData?.usd || 0 },
      eur_bcv: { ...fallback.eur_bcv, price: bcvData?.eur || 0 },
      usdt: { ...fallback.usdt, price: usdtPrice || 0 },
      lastUpdate: bcvData ? `Fuente: ${bcvData.source}` : "Error de sincronización",
      sources: (bcvData as any)?.sources || [{ title: bcvData?.source || "BCV", uri: "https://www.bcv.org.ve" }]
    };
  } catch (error) {
    return fallback;
  }
};

/**
 * Financial Assistant powered by Gemini.
 */
export const askAssistant = async (query: string, data: MarketData): Promise<string> => {
  try {
    // Creating fresh client instance right before making the API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        systemInstruction: `Eres un asistente financiero venezolano. Datos actuales: Dólar BCV: ${data.usd_bcv.price}, Euro BCV: ${data.eur_bcv.price}, USDT: ${data.usdt.price}. Responde con amabilidad y precisión.`
      }
    });
    return response.text || "No hay respuesta.";
  } catch (e: any) {
    console.error(e);
    return "⚠️ La IA no está lista. Asegúrate de configurar tu API Key haciendo clic en el botón de arriba.";
  }
};
