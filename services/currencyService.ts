
import { GoogleGenAI, Type } from "@google/genai";
import { MarketData } from "../types";

const getApiKey = () => {
  // Intenta obtener la clave del entorno global de la manera más directa posible
  const key = process.env.API_KEY || (window as any).process?.env?.API_KEY;
  return (key && key !== '') ? key : null;
};

const cleanNumber = (val: any): number | null => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(',', '.').replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
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
      return num > 0 && num < 1 ? 1 / num : num;
    }
    return null;
  } catch (error) {
    console.error("Error en Yadio (USDT):", error);
    return null;
  }
};

export const fetchLatestRates = async (): Promise<MarketData> => {
  const fallback: MarketData = {
    usd_bcv: { price: 54.45, label: "Dólar BCV", symbol: "$", icon: "fa-building-columns", color: "blue" },
    eur_bcv: { price: 58.12, label: "Euro BCV", symbol: "€", icon: "fa-euro-sign", color: "indigo" },
    usdt: { price: 56.80, label: "USDT Binance", symbol: "₮", icon: "fa-circle-dollar-to-slot", color: "emerald" },
    lastUpdate: "Referencia Estimada (Sin Conexión)",
    sources: [{ title: "BCV", uri: "https://www.bcv.org.ve" }, { title: "Yadio", uri: "https://yadio.io" }]
  };

  try {
    const yadioPrice = await fetchUsdtFromYadio();
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.warn("API_KEY no detectada. Asegúrate de configurar la variable de entorno en Vercel.");
      if (yadioPrice) fallback.usdt.price = yadioPrice;
      return fallback;
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Consulta la página oficial del Banco Central de Venezuela (bcv.org.ve) y extrae los tipos de cambio de referencia vigentes para el Dólar (USD) y el Euro (EUR). Devuelve los valores numéricos exactos.",
      config: { 
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            usd_bcv: { type: Type.STRING, description: "Precio del dólar en bolívares" },
            eur_bcv: { type: Type.STRING, description: "Precio del euro en bolívares" },
            last_update: { type: Type.STRING, description: "Fecha de vigencia reportada" }
          },
          required: ["usd_bcv", "eur_bcv"]
        }
      },
    });

    const rawText = response.text || "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const json = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    
    const parsedUsd = cleanNumber(json.usd_bcv);
    const parsedEur = cleanNumber(json.eur_bcv);

    return {
      usd_bcv: { price: parsedUsd || fallback.usd_bcv.price, label: "Dólar BCV", symbol: "$", icon: "fa-building-columns", color: "blue" },
      eur_bcv: { price: parsedEur || fallback.eur_bcv.price, label: "Euro BCV", symbol: "€", icon: "fa-euro-sign", color: "indigo" },
      usdt: { price: yadioPrice || fallback.usdt.price, label: "USDT Binance", symbol: "₮", icon: "fa-circle-dollar-to-slot", color: "emerald" },
      lastUpdate: json.last_update || `Actualizado: ${new Date().toLocaleTimeString('es-VE')}`,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
        title: c.web?.title || "BCV Oficial",
        uri: c.web?.uri || "https://www.bcv.org.ve"
      })) || fallback.sources
    };
  } catch (error) {
    console.warn("Usando datos de respaldo debido a un error de conexión:", error);
    return fallback;
  }
};

export const askAssistant = async (question: string, data: MarketData): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return "⚠️ Error: No has configurado la API_KEY en Vercel. Por favor, añádela en Settings > Environment Variables.";
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: question,
      config: {
        systemInstruction: `Eres un experto financiero en Venezuela. Tienes estos datos actuales: Dólar BCV: ${data.usd_bcv.price} Bs, Euro: ${data.eur_bcv.price} Bs, USDT: ${data.usdt.price} Bs. Responde de forma útil, breve y profesional. No menciones el mercado negro.`
      }
    });
    return response.text || "Lo siento, no pude procesar tu pregunta.";
  } catch (e) {
    return "No pude conectar con el asistente. Verifica que tu clave de API sea válida.";
  }
};