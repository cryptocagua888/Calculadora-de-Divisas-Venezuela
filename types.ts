
export interface CurrencyRate {
  price: number;
  label: string;
  symbol: string;
  icon: string;
  color: string;
}

export interface MarketData {
  usd_bcv: CurrencyRate;
  eur_bcv: CurrencyRate;
  usdt: CurrencyRate;
  lastUpdate: string;
  sources: { title: string; uri: string }[];
}

export type CurrencyKey = 'VES' | 'USD_BCV' | 'EUR_BCV' | 'USDT';
