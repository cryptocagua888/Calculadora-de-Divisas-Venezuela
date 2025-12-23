
import React, { useState, useEffect } from 'react';
import { MarketData } from './types';
import { fetchLatestRates } from './services/currencyService';
import RateCard from './components/RateCard';
import Calculator from './components/Calculator';
import MarketAnalysis from './components/MarketAnalysis';
import AIAssistant from './components/AIAssistant';

// Define the AIStudio interface to match the environment's global type
interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

// Extend Window interface to include aistudio with the correct AIStudio type
declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [isBcvError, setIsBcvError] = useState(false);

  // Check if an API key has already been selected by the user
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

  // Open the API key selection dialog and assume success to avoid race conditions
  const handleOpenKey = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Guideline: Assume the key selection was successful after triggering openSelectKey()
        setHasApiKey(true);
        loadData();
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
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monitor Profesional</p>
              {!hasApiKey && (
                <button 
                  onClick={handleOpenKey}
                  className="text-[8px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full hover:bg-rose-200 transition-colors animate-pulse"
                >
                  ⚠️ CONFIGURAR IA (CLAVE REQUERIDA)
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!hasApiKey && (
              <button 
                onClick={handleOpenKey}
                className="hidden md:flex items-center gap-2 bg-white border border-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:bg-rose-50 transition-all"
              >
                <i className="fas fa-key"></i> Configurar IA
              </button>
            )}
            <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                <p className="text-[10px] font-black text-slate-700 truncate max-w-[150px]">{data?.lastUpdate || '---'}</p>
              </div>
              <button onClick={loadData} disabled={loading} className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 active:scale-95 disabled:opacity-50 transition-all">
                <i className={`fas fa-sync-alt text-xs ${loading ? 'animate-spin' : ''}`}></i>
              </button>
            </div>
          </div>
        </header>

        {isBcvError && !loading && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-4 text-amber-800">
            <i className="fas fa-triangle-exclamation text-xl"></i>
            <p className="text-xs font-bold uppercase tracking-tight">Las tasas oficiales no pudieron ser obtenidas. Los cálculos son referenciales.</p>
          </div>
        )}

        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-40">
             <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando mercados...</p>
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <RateCard rate={data.usd_bcv} isLoading={loading} />
              <RateCard rate={data.eur_bcv} isLoading={loading} />
              <RateCard rate={data.usdt} isLoading={loading} />
            </div>
            <Calculator data={data} />
            <MarketAnalysis data={data} />
            <AIAssistant data={data} />
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <i className="fas fa-exclamation-circle text-3xl text-slate-300 mb-4"></i>
            <p className="text-slate-500 font-bold">Sin conexión. Revisa tu internet.</p>
            <button onClick={loadData} className="mt-4 text-indigo-600 font-black uppercase text-[10px] tracking-widest underline">Reintentar</button>
          </div>
        )}

        <footer className="mt-20 pt-10 border-t border-slate-100 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Hecho para Venezuela • 2025</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
