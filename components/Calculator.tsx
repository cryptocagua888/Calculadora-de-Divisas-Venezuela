
import React, { useState, useEffect } from 'react';
import { MarketData, CurrencyKey } from '../types';

interface CalculatorProps {
  data: MarketData;
}

const Calculator: React.FC<CalculatorProps> = ({ data }) => {
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<CurrencyKey>('USD_BCV');
  const [toCurrency, setToCurrency] = useState<CurrencyKey>('VES');
  const [result, setResult] = useState<number>(0);
  const [comparison, setComparison] = useState<{ label: string, diff: number, trend: 'up' | 'down' | 'neutral' } | null>(null);

  const getRate = (key: CurrencyKey): number => {
    switch (key) {
      case 'USD_BCV': return data.usd_bcv.price;
      case 'EUR_BCV': return data.eur_bcv.price;
      case 'USDT': return data.usdt.price;
      case 'VES': return 1;
      default: return 1;
    }
  };

  useEffect(() => {
    const fromRate = getRate(fromCurrency);
    const toRate = getRate(toCurrency);
    const calculated = (amount * fromRate) / toRate;
    setResult(calculated);

    // LÓGICA DE DIFERENCIA SEGÚN ORIGEN Y DESTINO
    let diff = 0;
    let label = "";
    let trend: 'up' | 'down' | 'neutral' = 'neutral';

    // Caso 1: Conversión entre dos divisas (ej. USD -> USDT)
    if (fromCurrency !== 'VES' && toCurrency !== 'VES' && fromCurrency !== toCurrency) {
      diff = ((fromRate - toRate) / toRate) * 100;
      label = `vs ${toCurrency.split('_')[0]}`;
    } 
    // Caso 2: De Divisa a Bolívares (Cálculo de Brecha de Mercado)
    else if (fromCurrency !== 'VES' && toCurrency === 'VES') {
      if (fromCurrency === 'USD_BCV') {
        diff = ((data.usd_bcv.price - data.usdt.price) / data.usdt.price) * 100;
        label = "vs Paralelo (USDT)";
      } else if (fromCurrency === 'USDT') {
        diff = ((data.usdt.price - data.usd_bcv.price) / data.usd_bcv.price) * 100;
        label = "vs Oficial (BCV)";
      } else if (fromCurrency === 'EUR_BCV') {
        diff = ((data.eur_bcv.price - data.usd_bcv.price) / data.usd_bcv.price) * 100;
        label = "vs USD BCV";
      }
    }
    // Caso 3: De Bolívares a Divisa (Cálculo de costo de adquisición)
    else if (fromCurrency === 'VES' && toCurrency !== 'VES') {
      if (toCurrency === 'USD_BCV') {
        diff = ((data.usd_bcv.price - data.usdt.price) / data.usdt.price) * 100;
        label = "vs Brecha Paralela";
      } else if (toCurrency === 'USDT') {
        diff = ((data.usdt.price - data.usd_bcv.price) / data.usd_bcv.price) * 100;
        label = "vs Tasa Oficial";
      } else {
        diff = ((getRate(toCurrency) - data.usd_bcv.price) / data.usd_bcv.price) * 100;
        label = "vs USD Base";
      }
    }

    if (diff > 0) trend = 'up';
    else if (diff < 0) trend = 'down';

    setComparison({ label, diff, trend });
  }, [amount, fromCurrency, toCurrency, data]);

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const formatResult = (val: number) => {
    if (val === 0) return "0,00";
    const decimals = val < 0.1 ? 4 : 2;
    return val.toLocaleString('es-VE', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] p-6 md:p-10 border border-slate-100 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center">
          <span className="w-1.5 h-7 bg-indigo-600 rounded-full mr-3"></span>
          Calculadora de Brecha
        </h2>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-100"></span>
          <span className="w-2 h-2 rounded-full bg-indigo-200"></span>
          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
        </div>
      </div>

      <div className="space-y-7">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Monto a convertir</label>
          <div className="relative group">
            <input
              type="number"
              inputMode="decimal"
              value={amount === 0 ? "" : amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border-2 border-transparent group-hover:bg-slate-100 focus:bg-white focus:border-indigo-500 rounded-2xl py-6 px-7 text-4xl font-black text-slate-900 transition-all outline-none shadow-inner"
              placeholder="0.00"
            />
            <div className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl pointer-events-none uppercase">
              {fromCurrency === 'VES' ? 'Bs' : fromCurrency.split('_')[0]}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Desde</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value as CurrencyKey)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-5 font-bold text-slate-700 appearance-none focus:ring-4 focus:ring-indigo-500/10 outline-none cursor-pointer transition-all"
            >
              <option value="VES">🇻🇪 VES (Bolívares)</option>
              <option value="USD_BCV">🇺🇸 USD (Dólar)</option>
              <option value="EUR_BCV">🇪🇺 EUR (Euro)</option>
              <option value="USDT">🪙 USDT (Binance)</option>
            </select>
            <i className="fas fa-chevron-down absolute right-5 bottom-6 text-slate-300 pointer-events-none text-[10px]"></i>
          </div>

          <button
            onClick={swapCurrencies}
            className="md:mt-6 w-14 h-14 self-center mx-auto flex items-center justify-center rounded-2xl bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-90"
          >
            <i className="fas fa-exchange-alt rotate-90 md:rotate-0 text-lg"></i>
          </button>

          <div className="relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Hacia</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value as CurrencyKey)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-5 font-bold text-slate-700 appearance-none focus:ring-4 focus:ring-indigo-500/10 outline-none cursor-pointer transition-all"
            >
              <option value="VES">🇻🇪 VES (Bolívares)</option>
              <option value="USD_BCV">🇺🇸 USD (Dólar)</option>
              <option value="EUR_BCV">🇪🇺 EUR (Euro)</option>
              <option value="USDT">🪙 USDT (Binance)</option>
            </select>
            <i className="fas fa-chevron-down absolute right-5 bottom-6 text-slate-300 pointer-events-none text-[10px]"></i>
          </div>
        </div>

        <div className="pt-6">
          <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 md:p-10 text-white shadow-3xl shadow-slate-200 overflow-hidden group">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <p className="text-indigo-200/50 text-[10px] font-black uppercase tracking-[0.3em]">Monto Calculado</p>
                {comparison && comparison.label && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border backdrop-blur-xl transition-all duration-500 ${comparison.trend === 'up' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : comparison.trend === 'down' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
                    <i className={`fas fa-caret-${comparison.trend === 'up' ? 'up' : 'down'} ${comparison.trend === 'neutral' ? 'hidden' : ''}`}></i>
                    {Math.abs(comparison.diff).toFixed(2)}% {comparison.label}
                  </div>
                )}
              </div>
              
              <div className="flex items-baseline gap-3">
                <h3 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                  {formatResult(result)}
                </h3>
                <span className="text-2xl font-bold text-indigo-300/40 uppercase tracking-tighter">
                  {toCurrency === 'VES' ? 'Bs' : toCurrency.split('_')[0]}
                </span>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-bold flex items-center">
                    <i className="fas fa-calculator mr-2 text-indigo-500"></i>
                    Conversión Directa
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    1 {fromCurrency.split('_')[0]} = {formatResult(getRate(fromCurrency) / getRate(toCurrency))} {toCurrency.split('_')[0]}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    const text = `DolarVZLA: ${amount} ${fromCurrency.split('_')[0]} = ${formatResult(result)} ${toCurrency.split('_')[0]}. Diferencia: ${comparison?.diff.toFixed(2)}% ${comparison?.label}`;
                    navigator.clipboard.writeText(text);
                    const btn = document.getElementById('copy-btn');
                    if(btn) btn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
                    setTimeout(() => { if(btn) btn.innerHTML = '<i class="fas fa-share-alt"></i> Compartir'; }, 2000);
                  }}
                  id="copy-btn"
                  className="w-full md:w-auto bg-white/5 hover:bg-white/10 active:scale-95 transition-all px-6 py-3 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 border border-white/5"
                >
                  <i className="fas fa-share-alt text-indigo-400"></i> Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
