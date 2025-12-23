
import React, { useState } from 'react';
import { MarketData } from '../types';
import { askAssistant } from '../services/currencyService';

interface AIAssistantProps {
  data: MarketData;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    const answer = await askAssistant(query, data);
    setResponse(answer);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl shadow-indigo-200 flex items-center justify-center hover:bg-indigo-600 hover:scale-110 transition-all z-40 group"
      >
        <i className="fas fa-magic text-xl group-hover:rotate-12 transition-transform"></i>
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
      </button>

      {/* Assistant Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.2)] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-robot text-lg"></i>
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">Asistente DolarVZLA</h3>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">IA Inteligente</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-8 space-y-6">
              {!response && !loading && (
                <div className="text-center space-y-2">
                  <p className="text-slate-400 text-sm font-medium italic">"Pregúntame cuánto necesitas para comprar USDT Binance o convierte tus bolívares a tasa oficial"</p>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center py-10 space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Calculando con IA...</p>
                </div>
              )}

              {response && (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 animate-in fade-in duration-300">
                  <p className="text-slate-700 text-sm leading-relaxed font-medium">
                    {response}
                  </p>
                </div>
              )}

              <form onSubmit={handleAsk} className="relative">
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ej: Tengo 2000 Bs, ¿cuántos USD son?"
                  className="w-full bg-slate-100 border-2 border-transparent focus:bg-white focus:border-indigo-500 rounded-2xl py-4 px-6 pr-14 text-sm font-bold text-slate-800 outline-none transition-all"
                />
                <button
                  disabled={loading}
                  className="absolute right-2 top-2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>

            <div className="px-8 pb-8 flex flex-wrap gap-2">
              <button onClick={() => setQuery("¿Qué tasa es más barata hoy?")} className="text-[10px] font-black uppercase tracking-wider bg-slate-50 border border-slate-100 px-4 py-2 rounded-full text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                📊 ¿Tasa más barata?
              </button>
              <button onClick={() => setQuery("Calcula 100$ a tasa BCV")} className="text-[10px] font-black uppercase tracking-wider bg-slate-50 border border-slate-100 px-4 py-2 rounded-full text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                🇻🇪 100$ a BCV
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
