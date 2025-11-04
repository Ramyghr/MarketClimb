import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';

export interface Wallet {
  symbol: string;
  balance: number;
}

export interface Transaction {
  date: Date;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
}

export interface PortfolioPerformancePoint {
  date: Date;
  value: number;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  // Asset prices (simulated)
  private assetPrices: { [key: string]: number } = {
    'USD': 1,
    'BTC': 43500,
    'ETH': 2280,
    'AAPL': 178.30,
    'TSLA': 245.50
  };

  private walletsSubject = new BehaviorSubject<Wallet[]>([
    { symbol: 'USD', balance: 10000 },
    { symbol: 'BTC', balance: 0.5 },
    { symbol: 'ETH', balance: 5 },
    { symbol: 'AAPL', balance: 10 },
    { symbol: 'TSLA', balance: 8 }
  ]);
  public wallets$ = this.walletsSubject.asObservable();

  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public transactions$ = this.transactionsSubject.asObservable();

  private performanceSubject = new BehaviorSubject<PortfolioPerformancePoint[]>([
    { date: new Date(Date.now() - 7*24*60*60*1000), value: 35500 },
    { date: new Date(Date.now() - 6*24*60*60*1000), value: 36200 },
    { date: new Date(Date.now() - 5*24*60*60*1000), value: 35800 },
    { date: new Date(Date.now() - 4*24*60*60*1000), value: 37100 },
    { date: new Date(Date.now() - 3*24*60*60*1000), value: 38250 },
    { date: new Date(Date.now() - 2*24*60*60*1000), value: 37900 },
    { date: new Date(Date.now() - 1*24*60*60*1000), value: 39350 },
    { date: new Date(), value: 40500 },
  ]);
  public performance$ = this.performanceSubject.asObservable();

  constructor() {
    this.simulateDynamicChanges();
  }

  /** Get asset price */
  public getAssetPrice(symbol: string): number {
    return this.assetPrices[symbol] || 1;
  }

  /** Simulate dynamic portfolio changes every 3 seconds */
  private simulateDynamicChanges(): void {
    interval(3000).subscribe(() => {
      this.randomTransaction();
      this.randomPriceUpdate();
      this.updatePerformance();
    });
  }

  /** Generate a random transaction */
  private randomTransaction(): void {
    const symbols = ['BTC', 'ETH', 'AAPL', 'TSLA'];
    const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const quantity = parseFloat((Math.random() * 2 + 0.1).toFixed(3));
    const price = this.assetPrices[symbol] * (1 + (Math.random() - 0.5) * 0.02);

    const transaction: Transaction = {
      date: new Date(),
      side,
      symbol,
      quantity,
      price: parseFloat(price.toFixed(2))
    };

    const transactions = [transaction, ...this.transactionsSubject.value];
    this.transactionsSubject.next(transactions.slice(0, 50)); // keep only last 50

    this.updateWalletBalance(transaction);
  }

  /** Randomly update asset prices */
  private randomPriceUpdate(): void {
    Object.keys(this.assetPrices).forEach(symbol => {
      if (symbol !== 'USD') {
        const change = (Math.random() - 0.5) * 0.02; // ±2% change
        this.assetPrices[symbol] *= (1 + change);
      }
    });
  }

  /** Update portfolio performance */
  private updatePerformance(): void {
    const currentValue = this.getTotalValue();
    const newPoint: PortfolioPerformancePoint = {
      date: new Date(),
      value: parseFloat(currentValue.toFixed(2))
    };
    this.performanceSubject.next([...this.performanceSubject.value.slice(-49), newPoint]);
  }

  /** Get total portfolio value */
  public getTotalValue(): number {
    return this.walletsSubject.value.reduce((sum, w) => {
      const price = this.getAssetPrice(w.symbol);
      return sum + w.balance * price;
    }, 0);
  }

  /** Add a new transaction */
  public addTransaction(transaction: Transaction): void {
    const transactions = [transaction, ...this.transactionsSubject.value];
    this.transactionsSubject.next(transactions.slice(0, 50));

    this.updateWalletBalance(transaction);
  }

  /** Update wallet balance after transaction */
  private updateWalletBalance(transaction: Transaction): void {
    const wallets = [...this.walletsSubject.value];
    const walletIndex = wallets.findIndex(w => w.symbol === transaction.symbol);

    if (walletIndex !== -1) {
      if (transaction.side === 'buy') {
        wallets[walletIndex].balance += transaction.quantity;
      } else {
        wallets[walletIndex].balance -= transaction.quantity;
      }
      this.walletsSubject.next(wallets);
    }
  }
}
