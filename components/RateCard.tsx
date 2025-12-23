import React from 'react';
import { CurrencyRate } from '../types';

interface RateCardProps {
  rate: CurrencyRate;
  isLoading: boolean;
}

const RateCard: React.FC<RateCardProps> = ({ rate, isLoading }) => {
  const isUnavailable = rate.price <= 0;

  const colorStyles: Record<string, { bg: string, text: string, icon: string, border: string, dot: string }> = {
    blue: { bg: "bg-indigo-50/50", text: "text-indigo-900", icon: "bg-indigo-600", border: "border-indigo-100", dot: "bg-indigo-400" },
    indigo: { bg: "bg-violet-50/50", text: "text-violet-900", icon: "bg-violet-600", border: "border-violet-100", dot: "bg-violet-400" },
    emerald: { bg: "bg-emerald-50/50", text: "text-emerald-900", icon: "bg-emerald-600", border: "border-emerald-100", dot: "bg-emerald-400" }
  };

  const style = isUnavailable 
    ? { bg: "bg-rose-50", text: "text-rose-900", icon: "bg-rose-600", border: "border-rose-200", dot: "bg-rose-500" }
    : (colorStyles[rate.color] || colorStyles.blue);

  return (
    <div className={`relative overflow-hidden p-6 rounded-[2rem] border transition-all duration-500 hover:shadow-xl ${isLoading ? 'animate-pulse bg-slate-50' : `${style.bg} ${style.border}`}`}>
      <div className="flex justify-between items-center mb-5">
        <div className={`p-3 rounded-2xl text-white shadow-lg ${style.icon}`}>
          <i className={`fas ${isUnavailable ? 'fa-triangle-exclamation' : rate.icon} text-base`}></i>
        </div>
        <div className="flex items-center gap-2">
           <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${!isUnavailable ? 'animate-pulse' : ''}`}></span>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{rate.label}</span>
        </div>
      </div>
      
      <div className="flex flex-col min-h-[80px] justify-center">
        {isUnavailable && !isLoading ? (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-xl font-black text-rose-600 uppercase tracking-tighter">No disponible</span>
            <p className="text-[9px] font-bold text-rose-400 mt-1 uppercase tracking-widest leading-none">La tasa oficial no pudo ser obtenida</p>
          </div>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-black opacity-30 tracking-tighter">Bs.</span>
            <span className={`text-3xl md:text-4xl font-black tracking-tighter ${style.text}`}>
              {isLoading ? '---' : rate.price.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <span className="text-[9px] font-black bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm text-slate-400 uppercase tracking-widest">
          1 {rate.symbol}
        </span>
        {!isLoading && !isUnavailable && (
          <span className="text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter bg-emerald-100 text-emerald-700">
            Conectado
          </span>
        )}
      </div>
    </div>
  );
};

export default RateCard;