
import React, { useState, useEffect } from 'react';
import { MarketData } from './types';
import { fetchLatestRates } from './services/currencyService';
import RateCard from './components/RateCard';
import Calculator from './components/Calculator';
import MarketAnalysis from './components/MarketAnalysis';
import AIAssistant from './components/AIAssistant';

// Extend the Window interface globally to include aistudio methods with correct typing
// This consolidation fixes the modifier and type mismatch errors (line 17)
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
  }
}

const App: React.FC = () => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false); // Por defecto falso para mostrar el botón
  const [isBcvError, setIsBcvError] = useState(false);

  const checkApiKey = async () => {
    try {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    } catch (e) {
      console.warn("Error verificando API Key", e);
    }
  };

  const handleOpenKey = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
        loadData();
      } else {
        alert("El selector de llaves no está disponible en este entorno.");
      }
    } catch (e) {
      console.error("No se pudo abrir el selector de claves");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchLatestRates();
      setData(result);
      setIsBcvError(result.usd_bcv.price === 0);
    } catch (err) {
      setIsBcvError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApiKey();
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 px-5 md:px-10">
      <div className="max-w-6xl mx-auto pt-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              Dolar<span className="text-indigo-600 italic">VZLA</span>
            </h1>
            <div className="flex items-center gap-2 mt-1 justify-center md:justify-start">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monitor Profesional</p>
              {!hasApiKey && (
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Botón de API Key - Ahora siempre visible si no hay key o como acceso directo */}
            <button 
              onClick={handleOpenKey}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black shadow-sm transition-all border ${
                !hasApiKey 
                ? "bg-amber-500 text-white border-amber-600 animate-bounce" 
                : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
              }`}
            >
              <i className={`fas ${!hasApiKey ? 'fa-key' : 'fa-cog'}`}></i>
              {!hasApiKey ? "ACTIVAR IA (CLAVE)" : "AJUSTES IA"}
            </button>

            <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                <p className="text-[10px] font-black text-slate-700 truncate max-w-[150px]">{data?.lastUpdate || 'Actualizando...'}</p>
              </div>
              <button 
                onClick={loadData} 
                disabled={loading} 
                className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 active:scale-95 disabled:opacity-50 transition-all"
                title="Actualizar tasas"
              >
                <i className={`fas fa-sync-alt text-xs ${loading ? 'animate-spin' : ''}`}></i>
              </button>
            </div>
          </div>
        </header>

        {isBcvError && !loading && (
          <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4 text-rose-800 animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shrink-0">
              <i className="fas fa-triangle-exclamation text-xl"></i>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tight">Error de Conexión BCV</p>
              <p className="text-[11px] font-medium opacity-80">No pudimos obtener las tasas oficiales. Por favor, usa el botón de "ACTIVAR IA" para intentar una búsqueda web automática.</p>
            </div>
          </div>
        )}

        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-40">
             <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Sincronizando Mercado...</p>
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <RateCard rate={data.usd_bcv} isLoading={loading} />
              <RateCard rate={data.eur_bcv} isLoading={loading} />
              <RateCard rate={data.usdt} isLoading={loading} />
            </div>

            {/* Displaying grounding source URLs as required for Search Grounding transparency */}
            {data.sources && data.sources.length > 0 && (
              <div className="mb-12 flex flex-wrap gap-3 justify-center">
                {data.sources.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-bold text-slate-400 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm flex items-center gap-1.5"
                  >
                    <i className="fas fa-external-link-alt text-[8px]"></i>
                    {source.title}
                  </a>
                ))}
              </div>
            )}

            <Calculator data={data} />
            <MarketAnalysis data={data} />
            <AIAssistant data={data} />
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <i className="fas fa-wifi-slash text-4xl text-slate-200 mb-4"></i>
            <p className="text-slate-500 font-bold">Sin conexión a los servicios financieros.</p>
            <button onClick={loadData} className="mt-4 text-indigo-600 font-black uppercase text-[10px] tracking-widest underline">Reintentar conexión</button>
          </div>
        )}

        <footer className="mt-20 pt-10 border-t border-slate-100 text-center flex flex-col items-center gap-4">
          <div className="flex gap-6 text-slate-300">
            <i className="fab fa-cc-visa text-xl"></i>
            <i className="fab fa-cc-mastercard text-xl"></i>
            <i className="fab fa-bitcoin text-xl"></i>
          </div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Monitor de Divisas Venezuela • 2025</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
