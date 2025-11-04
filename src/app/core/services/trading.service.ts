import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Order {
  price: number;
  quantity: number;
}

export interface Trade {
  time: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
}

@Injectable({
  providedIn: 'root'
})
export class TradingService {
  private selectedSymbolSubject = new BehaviorSubject<string>('NASDAQ:TSLA');
  public selectedSymbol$ = this.selectedSymbolSubject.asObservable();

  private marketDataSubject = new BehaviorSubject<MarketData>({
    symbol: 'NASDAQ:TSLA',
    price: 245.50,
    change: 5.20,
    changePercent: 2.16,
    volume: 125000000,
    high: 248.30,
    low: 242.10,
    open: 243.00
  });
  public marketData$ = this.marketDataSubject.asObservable();

  constructor() {
    // Simulate real-time price updates
    this.startPriceSimulation();
  }

  changeSymbol(symbol: string): void {
    this.selectedSymbolSubject.next(symbol);
    this.updateMarketData(symbol);
  }

  getSelectedSymbol(): string {
    return this.selectedSymbolSubject.value;
  }

  // Generate realistic order book data
  generateOrderBook(basePrice: number): { buyOrders: Order[], sellOrders: Order[] } {
    const buyOrders: Order[] = [];
    const sellOrders: Order[] = [];

    // Generate 10 buy orders below current price
    for (let i = 0; i < 10; i++) {
      buyOrders.push({
        price: basePrice - (i + 1) * 0.25 - Math.random() * 0.1,
        quantity: Math.random() * 10 + 1
      });
    }

    // Generate 10 sell orders above current price
    for (let i = 0; i < 10; i++) {
      sellOrders.push({
        price: basePrice + (i + 1) * 0.25 + Math.random() * 0.1,
        quantity: Math.random() * 10 + 1
      });
    }

    return { buyOrders, sellOrders };
  }

  // Generate realistic recent trades
  generateRecentTrades(basePrice: number): Trade[] {
    const trades: Trade[] = [];
    const now = new Date();

    for (let i = 0; i < 15; i++) {
      const tradeTime = new Date(now.getTime() - i * 3000); // 3 seconds apart
      trades.push({
        time: tradeTime.toLocaleTimeString('en-US', { hour12: false }),
        price: basePrice + (Math.random() - 0.5) * 2,
        quantity: Math.random() * 5 + 0.1,
        side: Math.random() > 0.5 ? 'buy' : 'sell'
      });
    }

    return trades;
  }

  // Simulate real-time price updates
  private startPriceSimulation(): void {
    interval(2000).subscribe(() => {
      const currentData = this.marketDataSubject.value;
      const priceChange = (Math.random() - 0.5) * 0.5;
      const newPrice = currentData.price + priceChange;

      this.marketDataSubject.next({
        ...currentData,
        price: newPrice,
        change: newPrice - currentData.open,
        changePercent: ((newPrice - currentData.open) / currentData.open) * 100,
        high: Math.max(currentData.high, newPrice),
        low: Math.min(currentData.low, newPrice)
      });
    });
  }

  private updateMarketData(symbol: string): void {
    // Reset market data when symbol changes
    const basePrice = this.getBasePriceForSymbol(symbol);
    this.marketDataSubject.next({
      symbol: symbol,
      price: basePrice,
      change: 0,
      changePercent: 0,
      volume: Math.floor(Math.random() * 200000000),
      high: basePrice + Math.random() * 5,
      low: basePrice - Math.random() * 5,
      open: basePrice
    });
  }

  private getBasePriceForSymbol(symbol: string): number {
    const prices: { [key: string]: number } = {
      'NASDAQ:TSLA': 245.50,
      'NASDAQ:AAPL': 178.30,
      'NYSE:SPX': 4500.00,
      'FX:EURUSD': 1.0850,
      'FX:GBPUSD': 1.2650,
      'BINANCE:BTCUSDT': 43500.00,
      'BINANCE:ETHUSDT': 2280.00
    };
    return prices[symbol] || 100.00;
  }

  // Execute trade (for future backend integration)
  executeTrade(side: 'buy' | 'sell', quantity: number, price?: number): Observable<any> {
    // TODO: Implement actual trade execution with backend
    console.log(`Executing ${side} order: ${quantity} @ ${price || 'market'}`);
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({ success: true, orderId: Math.random().toString(36).substr(2, 9) });
        observer.complete();
      }, 500);
    });
  }
}