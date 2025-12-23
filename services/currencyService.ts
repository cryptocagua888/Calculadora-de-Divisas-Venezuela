import { GoogleGenAI, Type } from "@google/genai";
import { MarketData } from "../types";

const getApiKey = () => {
  const key = process.env.vita_apy_key || (window as any).process?.env?.vita_apy_key;
  return (key && key !== 'undefined' && key !== '') ? key : null;
};

/**
 * Fuente 1: DolarVzla (La solicitada)
 * Manejamos múltiples estructuras posibles de respuesta.
 */
const fetchDolarVzla = async () => {
  try {
    console.log("Intentando conectar con DolarVzla...");
    const response = await fetch("https://api.dolarvzla.com/public/exchange-rate", {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    console.log("Datos recibidos de DolarVzla:", data);

    // Intentar extraer de varias estructuras comunes
    const usd = data.usd || data.bcv?.usd || data.dolar || data.price_usd;
    const eur = data.eur || data.bcv?.eur || data.euro || data.price_eur;
    const fecha = data.updated_at || data.last_update || data.fecha;

    if (usd && eur) {
      return { 
        usd: parseFloat(usd), 
        eur: parseFloat(eur), 
        fecha: fecha || new Date().toISOString(),
        source: "DolarVzla"
      };
    }
    return null;
  } catch (e) {
    console.warn("DolarVzla no disponible (posible CORS o error de servidor)");
    return null;
  }
};

/**
 * Fuente 2: DolarApi (Respaldo oficial)
 */
const fetchDolarApiBackup = async () => {
  try {
    console.log("Intentando conectar con DolarApi...");
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
      fecha: du.fechaActualizacion,
      source: "DolarApi (BCV Oficial)"
    };
  } catch (e) {
    console.warn("DolarApi no disponible");
    return null;
  }
};

/**
 * Fuente 3: IA con Google Search (La más confiable si hay bloqueos de red)
 */
const fetchRatesViaAI = async (apiKey: string) => {
  try {
    console.log("Consultando tasa oficial vía Google Search IA...");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Busca en la web la tasa oficial de cambio actual del Banco Central de Venezuela (BCV) para el Dólar y el Euro. Solo dame los números exactos que publica el bcv.org.ve para hoy.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            usd: { type: Type.NUMBER, description: "Precio del dólar en Bs" },
            eur: { type: Type.NUMBER, description: "Precio del euro en Bs" },
            fecha: { type: Type.STRING, description: "Fecha de la tasa" }
          },
          required: ["usd", "eur"]
        }
      }
    });
    const data = JSON.parse(response.text || "{}");
    if (data.usd && data.eur) {
      return { ...data, source: "Google Search (BCV Directo)" };
    }
    return null;
  } catch (e) {
    console.error("Error en búsqueda IA:", e);
    return null;
  }
};

const fetchUsdtFromYadio = async (): Promise<number | null> => {
  try {
    const response = await fetch("https://api.yadio.io/rate/USD/VES");
    if (!response.ok) return null;
    const json = await response.json();
    return json.rate ? parseFloat(json.rate) : null;
  } catch (error) {
    return null;
  }
};

export const fetchLatestRates = async (): Promise<MarketData> => {
  const fallback: MarketData = {
    usd_bcv: { price: 0, label: "Dólar BCV", symbol: "$", icon: "fa-building-columns", color: "blue" },
    eur_bcv: { price: 0, label: "Euro BCV", symbol: "€", icon: "fa-euro-sign", color: "indigo" },
    usdt: { price: 0, label: "USDT Binance", symbol: "₮", icon: "fa-circle-dollar-to-slot", color: "emerald" },
    lastUpdate: "Sin datos",
    sources: []
  };

  try {
    // Intentar APIs primero
    let bcvData = await fetchDolarVzla();
    if (!bcvData) bcvData = await fetchDolarApiBackup();

    // Si las APIs fallan (común por CORS), usar la IA inmediatamente
    const apiKey = getApiKey();
    if (!bcvData && apiKey) {
      bcvData = await fetchRatesViaAI(apiKey);
    }

    const yadioPrice = await fetchUsdtFromYadio();

    return {
      usd_bcv: { ...fallback.usd_bcv, price: bcvData?.usd || 0 },
      eur_bcv: { ...fallback.eur_bcv, price: bcvData?.eur || 0 },
      usdt: { ...fallback.usdt, price: yadioPrice || 0 },
      lastUpdate: bcvData ? `Fuente: ${bcvData.source}` : "Error de conexión (BCV Offline)",
      sources: [
        { title: bcvData?.source || "BCV Oficial", uri: "https://www.bcv.org.ve" },
        { title: "Yadio API", uri: "https://yadio.io" }
      ]
    };
  } catch (error) {
    console.error("Error crítico en servicio:", error);
    return fallback;
  }
};

export const askAssistant = async (query: string, data: MarketData): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "⚠️ API Key no configurada.";
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        systemInstruction: `Eres un experto financiero. Datos actuales: USD BCV: ${data.usd_bcv.price}, EUR BCV: ${data.eur_bcv.price}, USDT: ${data.usdt.price}. Si las tasas son 0, informa que las APIs externas están bloqueadas o caídas.`
      }
    });
    return response.text || "Sin respuesta.";
  } catch (e) {
    return "Error de IA.";
  }
};