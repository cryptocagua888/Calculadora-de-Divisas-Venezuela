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
  const [isError, setIsError] = useState(false);
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
    
    if (fromRate === 0 || toRate === 0) {
      setIsError(true);
      setResult(0);
      setComparison(null);
      return;
    }

    setIsError(false);
    const calculated = (amount * fromRate) / toRate;
    setResult(calculated);

    let diff = 0;
    let label = "";
    let trend: 'up' | 'down' | 'neutral' = 'neutral';

    if (fromCurrency !== 'VES' && toCurrency !== 'VES' && fromCurrency !== toCurrency) {
      diff = ((fromRate - toRate) / toRate) * 100;
      label = `vs ${toCurrency.split('_')[0]}`;
    } 
    else if (fromCurrency === 'VES' || toCurrency === 'VES') {
      const activeDivisa = fromCurrency === 'VES' ? toCurrency : fromCurrency;
      if (activeDivisa === 'USD_BCV' && data.usdt.price > 0) {
        diff = ((data.usd_bcv.price - data.usdt.price) / data.usdt.price) * 100;
        label = "Brecha vs USDT";
      } else if (activeDivisa === 'USDT' && data.usd_bcv.price > 0) {
        diff = ((data.usdt.price - data.usd_bcv.price) / data.usd_bcv.price) * 100;
        label = "Brecha vs BCV";
      }
    }

    if (diff > 0.01) trend = 'up';
    else if (diff < -0.01) trend = 'down';
    setComparison({ label, diff, trend });
  }, [amount, fromCurrency, toCurrency, data]);

  const formatResult = (val: number) => {
    if (val === 0) return "---";
    const decimals = val < 0.1 ? 4 : 2;
    return val.toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] p-6 md:p-10 border border-slate-100 max-w-2xl mx-auto">
      <h2 className="text-xl font-extrabold text-slate-800 flex items-center mb-8">
        <span className="w-1.5 h-7 bg-indigo-600 rounded-full mr-3"></span>
        Calculadora Inteligente
      </h2>

      <div className="space-y-7">
        <div className="relative group">
          <input
            type="number"
            value={amount === 0 ? "" : amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 rounded-2xl py-6 px-7 text-4xl font-black text-slate-900 transition-all outline-none"
            placeholder="0.00"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
          <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value as CurrencyKey)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-5 font-bold outline-none">
            <option value="VES">🇻🇪 VES (Bolívares)</option>
            <option value="USD_BCV">🇺🇸 USD (Dólar BCV)</option>
            <option value="EUR_BCV">🇪🇺 EUR (Euro BCV)</option>
            <option value="USDT">🪙 USDT (Binance)</option>
          </select>
          <button onClick={() => {const t = fromCurrency; setFromCurrency(toCurrency); setToCurrency(t);}} className="w-14 h-14 mx-auto flex items-center justify-center rounded-2xl bg-slate-900 text-white"><i className="fas fa-exchange-alt"></i></button>
          <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value as CurrencyKey)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4.5 px-5 font-bold outline-none">
            <option value="VES">🇻🇪 VES (Bolívares)</option>
            <option value="USD_BCV">🇺🇸 USD (Dólar BCV)</option>
            <option value="EUR_BCV">🇪🇺 EUR (Euro BCV)</option>
            <option value="USDT">🪙 USDT (Binance)</option>
          </select>
        </div>

        <div className="pt-6">
          <div className={`relative rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl transition-colors duration-500 ${isError ? 'bg-rose-600' : 'bg-slate-900'}`}>
            {isError ? (
              <div className="text-center py-4">
                <i className="fas fa-circle-exclamation text-4xl mb-3"></i>
                <h3 className="text-xl font-black">Cálculo no disponible</h3>
                <p className="text-rose-100 text-sm opacity-80 mt-2 font-medium">No se pudo obtener la tasa oficial del BCV para esta moneda.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Total Estimado</p>
                  {comparison && (
                    <div className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-white/10 border border-white/10">
                      {Math.abs(comparison.diff).toFixed(2)}% {comparison.label}
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">{formatResult(result)}</h3>
                  <span className="text-2xl font-bold text-slate-600 uppercase">{toCurrency === 'VES' ? 'Bs' : toCurrency.split('_')[0]}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;