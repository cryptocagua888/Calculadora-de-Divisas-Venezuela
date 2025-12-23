
import React, { useState, useEffect } from 'react';
import { MarketData } from './types';
import { fetchLatestRates } from './services/currencyService';
import RateCard from './components/RateCard';
import Calculator from './components/Calculator';
import MarketAnalysis from './components/MarketAnalysis';

const App: React.FC = () => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchLatestRates();
      if (!result || !result.usd_bcv) throw new Error("Datos inválidos");
      setData(result);
      setError(null);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("No se pudo conectar con el mercado. Verifica tu API KEY en Vercel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-5 text-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="mt-8 text-xl font-black text-slate-800 tracking-tight">Cargando mercado...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 px-5 md:px-10">
      <div className="max-w-6xl mx-auto pt-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              Dolar<span className="text-indigo-600">VZLA</span>
            </h1>
            <p className="text-slate-400 font-bold text-sm">Monitor de Divisas Profesional</p>
          </div>
          
          {data && (
            <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sincronizado</p>
                <p className="text-xs font-bold text-slate-700">{data.lastUpdate}</p>
              </div>
              <button onClick={loadData} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all">
                <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
              </button>
            </div>
          )}
        </header>

        {error && (
          <div className="mb-8 p-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl flex items-center gap-4 animate-bounce">
            <i className="fas fa-exclamation-triangle text-xl"></i>
            <p className="text-xs font-black uppercase tracking-widest">{error}</p>
          </div>
        )}

        {data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <RateCard rate={data.usd_bcv} isLoading={loading} />
              <RateCard rate={data.eur_bcv} isLoading={loading} />
              <RateCard rate={data.usdt} isLoading={loading} />
            </div>

            <Calculator data={data} />
            <MarketAnalysis data={data} />
          </>
        ) : (
          <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center">
            <i className="fas fa-cloud-download-alt text-4xl text-slate-200 mb-6"></i>
            <p className="text-slate-400 font-bold italic">Esperando datos del mercado...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
