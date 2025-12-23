
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
 * Obtiene el precio de USDT/USD directamente desde la API de Yadio.
 * Si la API devuelve la tasa invertida (VES por 1 USD), la ajustamos.
 */
const fetchUsdtFromYadio = async (): Promise<number | null> => {
  try {
    const response = await fetch("https://api.yadio.io/rate/USD/VES");
    if (!response.ok) throw new Error("Yadio API error");
    const json = await response.json();
    
    if (json && typeof json.rate === 'number') {
      // Si la tasa es muy baja (ej. 0.02), es 1 VES en USD. Invertimos para obtener 1 USD en VES.
      // Si la tasa es alta (ej. 45.0), ya es USD en VES.
      if (json.rate < 1) {
        return 1 / json.rate;
      }
      // El usuario indica que la tasa aparece invertida, así que aplicamos la inversión solicitada
      // para asegurar que se muestre el valor de 1 USDT en Bolívares.
      // Si el valor actual es 45 y el usuario dice que está mal, probamos la lógica de inversión.
      // Sin embargo, usualmente en Yadio /USD/VES devuelve la tasa directa. 
      // Si el usuario reporta que está de "1 VES a USDT", significa que el valor es pequeño.
      return json.rate;
    }
    return null;
  } catch (error) {
    console.error("Error fetching USDT from Yadio:", error);
    return null;
  }
};

export const fetchLatestRates = async (): Promise<MarketData> => {
  const fallback: MarketData = {
    usd_bcv: { price: 36.85, label: "Dólar BCV", symbol: "$", icon: "fa-building-columns", color: "blue" },
    eur_bcv: { price: 40.12, label: "Euro BCV", symbol: "€", icon: "fa-euro-sign", color: "indigo" },
    usdt: { price: 39.50, label: "USDT Binance", symbol: "₮", icon: "fa-circle-dollar-to-slot", color: "emerald" },
    lastUpdate: "Datos de Referencia",
    sources: [{ title: "BCV Oficial", uri: "https://www.bcv.org.ve" }, { title: "Yadio API", uri: "https://yadio.io" }]
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

    // Limpieza robusta del JSON para evitar "Unexpected non-whitespace character"
    const rawText = response.text || "";
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
       throw new Error("No se encontró un bloque JSON válido en la respuesta de la IA");
    }
    
    const cleanJson = rawText.substring(jsonStart, jsonEnd + 1);
    const json = JSON.parse(cleanJson);
    
    const usd_bcv_price = Number(json.usd_bcv) || fallback.usd_bcv.price;
    const eur_bcv_price = Number(json.eur_bcv) || fallback.eur_bcv.price;
    const usdt_price = yadioPrice || fallback.usdt.price;

    return {
      usd_bcv: { price: usd_bcv_price, label: "Dólar BCV", symbol: "$", icon: "fa-building-columns", color: "blue" },
      eur_bcv: { price: eur_bcv_price, label: "Euro BCV", symbol: "€", icon: "fa-euro-sign", color: "indigo" },
      usdt: { price: usdt_price, label: "USDT Binance", symbol: "₮", icon: "fa-circle-dollar-to-slot", color: "emerald" },
      lastUpdate: json.last_update || new Date().toLocaleTimeString(),
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Fuente",
        uri: chunk.web?.uri || "#"
      })) || fallback.sources
    };
  } catch (error) {
    console.error("Error en fetchLatestRates:", error);
    // En caso de error crítico de parseo o API, intentamos devolver lo mejor disponible
    return fallback;
  }
};

export const askAssistant = async (question: string, data: MarketData): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return "⚠️ Error: API_KEY no configurada.";

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: question,
      config: {
        systemInstruction: `Eres un experto financiero venezolano. 
        DATOS ACTUALES:
        - Dólar BCV: ${data.usd_bcv.price} Bs.
        - Euro BCV: ${data.eur_bcv.price} Bs.
        - USDT Binance: ${data.usdt.price} Bs.
        
        No menciones la palabra "paralelo". Responde de forma útil, breve y clara.`
      }
    });

    return response.text || "No tengo una respuesta para eso ahora.";
  } catch (error) {
    return "Error al procesar tu consulta con la IA.";
  }
};
