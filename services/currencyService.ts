import { GoogleGenAI, Type } from "@google/genai";
import { MarketData } from "../types";

/**
 * Fuente 1: DolarVzla (API tradicional)
 */
const fetchDolarVzla = async () => {
  try {
    console.log("Intentando DolarVzla...");
    const response = await fetch("https://api.dolarvzla.com/public/exchange-rate", {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    const usd = data.usd || data.bcv?.usd || data.dolar;
    const eur = data.eur || data.bcv?.eur || data.euro;
    const fecha = data.updated_at || data.last_update || data.fecha;

    if (usd && eur) {
      return { 
        usd: parseFloat(usd), 
        eur: parseFloat(eur), 
        fecha: fecha || new Date().toISOString(),
        source: "DolarVzla (API)"
      };
    }
    return null;
  } catch (e) {
    console.warn("DolarVzla falló:", e);
    return null;
  }
};

/**
 * Fuente 2: DolarApi (Respaldo)
 */
const fetchDolarApiBackup = async () => {
  try {
    console.log("Intentando DolarApi...");
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
      source: "DolarApi (Backup)"
    };
  } catch (e) {
    console.warn("DolarApi falló:", e);
    return null;
  }
};

/**
 * Fuente 3: Google Search via Gemini (Definitiva si hay CORS o fallos de API)
 */
const fetchRatesViaAI = async () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY no detectada en process.env. Asegúrate de configurarla en tu panel de control.");
    return null;
  }

  try {
    console.log("Buscando tasas oficiales en Google Search...");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Busca en la web la tasa oficial vigente del Banco Central de Venezuela (BCV) para el dólar y el euro de hoy. Responde estrictamente con el JSON solicitado.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            usd: { type: Type.NUMBER, description: "Tasa del dólar en Bs" },
            eur: { type: Type.NUMBER, description: "Tasa del euro en Bs" },
            fecha: { type: Type.STRING, description: "Fecha de la tasa" }
          },
          required: ["usd", "eur"]
        }
      }
    });
    
    const data = JSON.parse(response.text || "{}");
    if (data.usd && data.eur) {
      return { ...data, source: "Google Search (Dato Directo BCV)" };
    }
    return null;
  } catch (e) {
    console.error("Fallo búsqueda IA:", e);
    return null;
  }
};

/**
 * Obtiene la tasa USDT asegurando el formato "Bolívares por USDT"
 */
const fetchUsdtFromYadio = async (): Promise<number | null> => {
  try {
    // Intentamos obtener la tasa USD/VES de Yadio
    const response = await fetch("https://api.yadio.io/rate/USD/VES");
    if (!response.ok) return null;
    const json = await response.json();
    
    if (json.rate) {
      let rate = parseFloat(json.rate);
      // Si el rate es muy bajo (ej. 0.018), es "USD por 1 VES". Invertimos para obtener "VES por 1 USD".
      if (rate > 0 && rate < 1) {
        rate = 1 / rate;
      }
      return rate;
    }
    return null;
  } catch (error) {
    console.warn("Error obteniendo USDT de Yadio:", error);
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
    // 1. Intentar APIs tradicionales primero (Rápidas)
    let bcvData = await fetchDolarVzla();
    if (!bcvData) bcvData = await fetchDolarApiBackup();

    // 2. Si las APIs fallan (CORS o Caídas), usar IA con Google Search (Más robusto)
    if (!bcvData) {
      bcvData = await fetchRatesViaAI();
    }

    const usdtPrice = await fetchUsdtFromYadio();

    return {
      usd_bcv: { ...fallback.usd_bcv, price: bcvData?.usd || 0 },
      eur_bcv: { ...fallback.eur_bcv, price: bcvData?.eur || 0 },
      usdt: { ...fallback.usdt, price: usdtPrice || 0 },
      lastUpdate: bcvData ? `Fuente: ${bcvData.source}` : "Error de sincronización (BCV Inaccesible)",
      sources: [
        { title: bcvData?.source || "BCV Oficial", uri: "https://www.bcv.org.ve" },
        { title: "Yadio API", uri: "https://yadio.io" }
      ]
    };
  } catch (error) {
    console.error("Error en servicio de divisas:", error);
    return fallback;
  }
};

export const askAssistant = async (query: string, data: MarketData): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "⚠️ Error: La API Key no está configurada en el entorno. Asegúrate de que el nombre sea 'API_KEY'.";
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        systemInstruction: `Eres un experto financiero en el mercado venezolano. Datos actuales: Dólar BCV: ${data.usd_bcv.price}, Euro BCV: ${data.eur_bcv.price}, USDT Binance: ${data.usdt.price}. Responde de forma clara y útil para el usuario.`
      }
    });
    return response.text || "No pude generar una respuesta en este momento.";
  } catch (e: any) {
    console.error("Error IA:", e);
    if (e.message?.includes("API_KEY_INVALID")) return "⚠️ La API Key configurada no es válida.";
    return "Ocurrió un error al procesar tu consulta con la IA.";
  }
};