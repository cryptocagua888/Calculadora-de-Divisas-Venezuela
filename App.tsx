
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
      setData(result);
      setError(null);
    } catch (err) {
      setError("No se pudieron cargar las cotizaciones actuales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Actualización automática cada 3 minutos (180,000 ms) para garantizar frescura
    const interval = setInterval(loadData, 180000);
    return () => clearInterval(interval);
  }, []);

  // Pantalla de carga inicial (Ruedita profesional)
  if (loading && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafbfc] px-5 text-center">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-50">
               <i className="fas fa-chart-line text-indigo-600 animate-pulse text-xl"></i>
            </div>
          </div>
        </div>
        <div className="mt-10 space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Conectando con el Mercado</h2>
          <p className="text-slate-400 font-bold text-sm max-w-xs mx-auto">Sincronizando tasas de BCV y Binance P2P en tiempo real...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 selection:bg-indigo-100 selection:text-indigo-900 transition-all duration-700 ${loading && data ? 'grayscale-[0.5] pointer-events-none' : 'opacity-100'}`}>
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 bg-[#fafbfc]"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 -z-10 w-full max-w-7xl h-[600px] bg-gradient-to-b from-indigo-100/30 to-transparent rounded-full blur-[140px] opacity-70"></div>

      <div className="px-5 md:px-10 max-w-6xl mx-auto">
        {/* Modern Header */}
        <header className="py-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2.5 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm mb-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${loading ? 'hidden' : ''}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${loading ? 'bg-indigo-500 animate-spin' : 'bg-emerald-500'}`}></span>
              </span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
                {loading ? 'Actualizando Tasas...' : 'Mercado en Vivo'}
              </span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter flex items-center justify-center md:justify-start">
              Dolar<span className="text-indigo-600">VZLA</span>
            </h1>
            <p className="text-slate-400 font-bold mt-2 text-sm tracking-tight">Monitoreo profesional cada 3 minutos</p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3">
            {data && (
              <div className="bg-white/70 backdrop-blur-2xl px-7 py-5 rounded-[2rem] border border-white shadow-2xl shadow-slate-200/40 text-center md:text-right">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2.5">Sincronización Inteligente</span>
                <div className="flex items-center gap-4 justify-center md:justify-end">
                  <span className="text-sm font-black text-slate-800 tabular-nums">{data.lastUpdate}</span>
                  <button 
                    onClick={loadData}
                    disabled={loading}
                    className="w-12 h-12 flex items-center justify-center bg-slate-900 rounded-2xl hover:bg-indigo-600 text-white transition-all shadow-xl shadow-indigo-200/20 active:scale-90 disabled:opacity-50 group"
                    title="Actualizar ahora"
                  >
                    <i className={`fas fa-sync-alt text-sm transition-transform duration-700 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`}></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Rates Section */}
        <div className="mb-16">
          <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 md:gap-8 pb-8 md:pb-0 custom-scroll snap-x">
            {data && (
              <>
                <div className="min-w-[310px] md:min-w-0 snap-center"><RateCard rate={data.usd_bcv} isLoading={loading} /></div>
                <div className="min-w-[310px] md:min-w-0 snap-center"><RateCard rate={data.eur_bcv} isLoading={loading} /></div>
                <div className="min-w-[310px] md:min-w-0 snap-center"><RateCard rate={data.usdt} isLoading={loading} /></div>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-10 bg-rose-50 text-rose-600 p-6 rounded-[2rem] border border-rose-100 flex items-center justify-center shadow-lg shadow-rose-100/50 animate-in fade-in slide-in-from-top-4 duration-500">
            <i className="fas fa-wifi-slash mr-4 text-xl"></i>
            <span className="font-black text-xs uppercase tracking-[0.2em]">{error}</span>
          </div>
        )}

        {/* Main Interface */}
        <div className="grid grid-cols-1 gap-14">
          <section className="relative">
            {data && <Calculator data={data} />}
          </section>

          <section>
            <div className="flex items-center gap-6 mb-12">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] whitespace-nowrap">Análisis Profundo</span>
              <div className="flex-1 h-[1.5px] bg-slate-100/60 rounded-full"></div>
            </div>
            {data && <MarketAnalysis data={data} />}
          </section>
        </div>
        
        {/* Footnote Sources */}
        {data && data.sources.length > 0 && (
          <div className="mt-28 pt-14 border-t border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10 text-center">Proveedores Estratégicos</p>
            <div className="flex flex-wrap justify-center gap-5">
              {data.sources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-[10px] font-black text-slate-600 hover:text-indigo-600 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1"
                >
                  <i className="fas fa-external-link-alt mr-3 opacity-30 text-[9px]"></i>
                  {source.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Minimalist Footer */}
        <footer className="mt-28 py-16 text-center border-t border-slate-100/50">
          <div className="flex justify-center gap-10 mb-10">
             <a href="#" className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-50"><i className="fab fa-github text-lg"></i></a>
             <a href="#" className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:bg-sky-500 hover:text-white transition-all shadow-sm border border-slate-50"><i className="fab fa-twitter text-lg"></i></a>
          </div>
          <p className="text-xs text-slate-400 max-w-xl mx-auto leading-loose font-medium px-4">
            DolarVZLA es una plataforma de datos financieros de libre acceso. Las tasas se actualizan automáticamente cada 3 minutos para garantizar la mayor precisión posible.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <span className="w-12 h-[2px] bg-slate-100"></span>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">EST. 2024 • VZLA</p>
            <span className="w-12 h-[2px] bg-slate-100"></span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
