
import React from 'react';
import { CurrencyRate } from '../types';

interface RateCardProps {
  rate: CurrencyRate;
  isLoading: boolean;
}

const RateCard: React.FC<RateCardProps> = ({ rate, isLoading }) => {
  const colorStyles: Record<string, { bg: string, text: string, icon: string, border: string, dot: string }> = {
    blue: { bg: "bg-indigo-50/50", text: "text-indigo-900", icon: "bg-indigo-600", border: "border-indigo-100", dot: "bg-indigo-400" },
    indigo: { bg: "bg-violet-50/50", text: "text-violet-900", icon: "bg-violet-600", border: "border-violet-100", dot: "bg-violet-400" },
    emerald: { bg: "bg-emerald-50/50", text: "text-emerald-900", icon: "bg-emerald-600", border: "border-emerald-100", dot: "bg-emerald-400" }
  };

  const style = colorStyles[rate.color] || colorStyles.blue;

  return (
    <div className={`relative overflow-hidden p-6 rounded-[2rem] border transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1.5 ${isLoading ? 'animate-pulse bg-slate-50' : `${style.bg} ${style.border}`}`}>
      <div className="flex justify-between items-center mb-5">
        <div className={`p-3 rounded-2xl text-white shadow-lg shadow-current/20 ${style.icon}`}>
          <i className={`fas ${rate.icon} text-base`}></i>
        </div>
        <div className="flex items-center gap-2">
           <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{rate.label}</span>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-black opacity-30 tracking-tighter">Bs.</span>
          <span className={`text-3xl md:text-4xl font-black tracking-tighter ${style.text}`}>
            {isLoading ? '---' : rate.price.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-[10px] font-black bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm text-slate-500 uppercase tracking-widest">
            1 {rate.symbol}
          </span>
        </div>
      </div>
      {/* Abstract background shape */}
      <div className={`absolute -right-6 -bottom-6 text-8xl opacity-[0.03] ${style.text} rotate-12`}>
        <i className={`fas ${rate.icon}`}></i>
      </div>
    </div>
  );
};

export default RateCard;
