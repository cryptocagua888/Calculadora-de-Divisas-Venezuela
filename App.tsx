
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
  const [missingKey, setMissingKey] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const apiKey = (window as any).process?.env?.API_KEY;
    if (!apiKey) setMissingKey(true);
    
    try {
      const result = await fetchLatestRates();
      setData(result);
    } catch (err) {
      console.error("App render error:", err);
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
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fuentes: BCV & Yadio</span>
            </div>
          </div>
          
          {data && (
            <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                <p className="text-[10px] font-black text-slate-700">{data.lastUpdate}</p>
              </div>
              <button onClick={loadData} className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-colors">
                <i className={`fas fa-sync-alt text-[10px] ${loading ? 'animate-spin' : ''}`}></i>
              </button>
            </div>
          )}
        </header>

        {missingKey && (
          <div className="mb-10 p-6 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col md:flex-row items-center gap-6 animate-in fade-in slide-in-from-top-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
              <i className="fas fa-key text-xl"></i>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-amber-900 font-black text-sm uppercase tracking-tight">Configuración Necesaria</h3>
              <p className="text-amber-700 text-xs font-bold leading-relaxed mt-1">
                Para activar la IA con fuentes BCV/Yadio en tiempo real, agrega la API_KEY en Vercel.
              </p>
            </div>
            <a href="https://vercel.com" target="_blank" className="bg-amber-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-colors">
              Ir a Vercel
            </a>
          </div>
        )}

        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-40">
             <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Consultando BCV y Yadio...</p>
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

        <footer className="mt-20 pt-10 border-t border-slate-100 text-center opacity-30">
          <p className="text-[9px] font-black uppercase tracking-[0.4em]">Datos Oficiales y de Criptoactivos</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
