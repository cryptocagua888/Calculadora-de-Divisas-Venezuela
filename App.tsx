
import React, { useState, useEffect } from 'react';
import { MarketData } from './types';
import { fetchLatestRates } from './services/currencyService';
import RateCard from './components/RateCard';
import Calculator from './components/Calculator';
import MarketAnalysis from './components/MarketAnalysis';
import AIAssistant from './components/AIAssistant';

const App: React.FC = () => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingKey, setMissingKey] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    const apiKey = (window as any).process?.env?.API_KEY;
    if (!apiKey) {
      setMissingKey(true);
      console.warn("API_KEY no detectada. Funcionando en modo limitado.");
    }
    
    try {
      const result = await fetchLatestRates();
      if (result) {
        setData(result);
      } else {
        throw new Error("No se recibieron datos del servicio");
      }
    } catch (err) {
      console.error("App load error:", err);
      setError("No se pudo conectar con los servidores de cotización.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cálculo Oficial y USDT</span>
            </div>
          </div>
          
          <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Actualización</p>
              <p className="text-[10px] font-black text-slate-700">{data ? data.lastUpdate : 'Cargando...'}</p>
            </div>
            <button 
              onClick={loadData} 
              disabled={loading}
              className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
            >
              <i className={`fas fa-sync-alt text-xs ${loading ? 'animate-spin' : ''}`}></i>
            </button>
          </div>
        </header>

        {missingKey && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-3xl flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <p className="text-amber-800 text-xs font-bold leading-snug">
              Modo Invitado: La IA y las tasas en tiempo real requieren una API_KEY configurada.
            </p>
          </div>
        )}

        {error && !data && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-plug-circle-xmark text-3xl"></i>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Error de Conexión</h2>
            <p className="text-slate-500 text-sm font-medium mb-8">{error}</p>
            <button onClick={loadData} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200">
              Reintentar Conexión
            </button>
          </div>
        )}

        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-40">
             <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando con BCV y Yadio...</p>
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
        ) : null}

        <footer className="mt-20 pt-10 border-t border-slate-100 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Hecho para Venezuela • Datos de BCV y Yadio</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
