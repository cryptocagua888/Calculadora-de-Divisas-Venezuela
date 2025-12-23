
import React from 'react';
import { MarketData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MarketAnalysisProps {
  data: MarketData;
}

const MarketAnalysis: React.FC<MarketAnalysisProps> = ({ data }) => {
  const usdVsUsdtDiff = ((data.usdt.price - data.usd_bcv.price) / data.usd_bcv.price) * 100;
  
  const chartData = [
    { name: 'USD BCV', value: data.usd_bcv.price, color: '#4f46e5' },
    { name: 'Euro BCV', value: data.eur_bcv.price, color: '#7c3aed' },
    { name: 'USDT Yadio', value: data.usdt.price, color: '#10b981' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.03)]">
        <h3 className="text-base font-black text-slate-800 mb-6 flex items-center">
          <i className="fas fa-layer-group mr-3 text-indigo-500"></i>
          Diferencial de Mercado
        </h3>
        <div className="flex items-center justify-between p-6 bg-slate-900 rounded-3xl mb-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-2">Spread BCV vs Paralelo</p>
            <p className="text-4xl font-black text-white">+{usdVsUsdtDiff.toFixed(2)}%</p>
          </div>
          <div className="text-indigo-400/20 text-5xl relative z-10">
            <i className="fas fa-chart-line"></i>
          </div>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed font-medium">
          Muestra la brecha entre la tasa oficial del BCV y el mercado digital de USDT. Una brecha mayor a 5% suele indicar inestabilidad o alta demanda de divisas.
        </p>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.03)]">
        <h3 className="text-base font-black text-slate-800 mb-6 flex items-center">
          <i className="fas fa-signal mr-3 text-indigo-500"></i>
          Comparativa Visual (Bs.)
        </h3>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                fontSize={10} 
                fontWeight={700}
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MarketAnalysis;
