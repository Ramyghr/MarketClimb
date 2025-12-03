// src/app/services/portfolio.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, interval, of, forkJoin, Observable } from 'rxjs';
import { catchError, switchMap, tap, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

// ============= INTERFACES =============

export interface Wallet {
  symbol: string;
  balance: number;
}

export interface Transaction {
  id?: number;
  date: Date | string;
  transaction_date?: Date | string;
  executed_at?: Date | string;
  symbol: string;
  side: 'buy' | 'sell';
  transaction_type?: string;
  action?: string;
  quantity: number;
  price: number;
  total_amount?: number;
}

export interface PortfolioPerformancePoint {
  date: Date | string;
  value: number;
}

export interface PortfolioOverview {
  total_value: number;
  cash_balance: number;
  total_pnl: number;
  today_pnl: number;
  today_pnl_pct: number;
  margin_used?: number;
  margin_available?: number;
  margin_level?: number;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
}

export interface HoldingsResponse {
  items: Holding[];
  total: number;
  page: number;
  size: number;
}

export interface TransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  size: number;
}

export interface HistoryPoint {
  date: string;
  total_value: number;
}

// ============= SERVICE =============

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private useMock = !environment.production;
  private apiUrl = `${environment.apiUrl}/portfolio`;
  private marketUrl = `${environment.apiUrl}/market`;

  // Public streams
  wallets$ = new BehaviorSubject<Wallet[]>([]);
  transactions$ = new BehaviorSubject<Transaction[]>([]);
  performance$ = new BehaviorSubject<PortfolioPerformancePoint[]>([]);
  overview$ = new BehaviorSubject<PortfolioOverview | null>(null);
  holdings$ = new BehaviorSubject<Holding[]>([]);

  // Mock prices (development only)
  private assetPrices: { [key: string]: number } = {
    USD: 1, BTC: 67850, ETH: 3380, AAPL: 192.5, TSLA: 378.2, NVDA: 875.3
  };

  constructor(private http: HttpClient) {
    if (this.useMock) {
      this.startMockMode();
    } else {
      this.startRealMode();
    }
  }

  // ============= MOCK MODE (DEVELOPMENT) =============

  private startMockMode(): void {
    console.log('📊 PortfolioService: Mode MOCK activé (offline dev)');

    this.wallets$.next([
      { symbol: 'USD', balance: 12500 },
      { symbol: 'BTC', balance: 0.23 },
      { symbol: 'ETH', balance: 4.2 },
      { symbol: 'AAPL', balance: 25 },
      { symbol: 'TSLA', balance: 18 },
      { symbol: 'NVDA', balance: 5 }
    ]);

    this.generateInitialPerformance();
    this.simulateMarket();
  }

  private generateInitialPerformance(): void {
    const points: PortfolioPerformancePoint[] = [];
    const now = Date.now();
    let value = 40000;

    for (let i = 30; i >= 0; i--) {
      value *= (1 + (Math.random() - 0.5) * 0.03);
      points.push({
        date: new Date(now - i * 24 * 60 * 60 * 1000),
        value: parseFloat(value.toFixed(2))
      });
    }
    this.performance$.next(points);
  }

  private simulateMarket(): void {
    interval(4000).subscribe(() => {
      this.randomPriceUpdate();
      this.randomTransaction();
      this.updatePerformance();
    });
  }

  private randomTransaction(): void {
    const symbols = ['BTC', 'ETH', 'AAPL', 'TSLA', 'NVDA'];
    const side: 'buy' | 'sell' = Math.random() > 0.6 ? 'buy' : 'sell';
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const quantity = parseFloat((Math.random() * 1.5 + 0.05).toFixed(4));
    const price = this.assetPrices[symbol] * (1 + (Math.random() - 0.5) * 0.015);

    const tx: Transaction = {
      date: new Date(),
      symbol,
      side,
      quantity,
      price: parseFloat(price.toFixed(2))
    };

    this.addTransaction(tx);
  }

  private randomPriceUpdate(): void {
    Object.keys(this.assetPrices).forEach(sym => {
      if (sym !== 'USD') {
        this.assetPrices[sym] *= (1 + (Math.random() - 0.5) * 0.02);
      }
    });
  }

  private updatePerformance(): void {
    const value = this.getTotalValue();
    const newPoint = { date: new Date(), value: parseFloat(value.toFixed(2)) };
    const history = [...this.performance$.value.slice(-49), newPoint];
    this.performance$.next(history);
  }

  // ============= REAL MODE (PRODUCTION) =============

  private startRealMode(): void {
    console.log('🔌 PortfolioService: Mode RÉEL activé (connecté au backend FastAPI)');
    this.loadAll();
    
    // Auto-refresh every 15 seconds
    interval(15000).subscribe(() => this.loadAll());
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadAll(): void {
    if (this.useMock) return;

    // 1. Load overview
    this.http.get<PortfolioOverview>(`${this.apiUrl}/overview`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      catchError(err => {
        console.error('❌ Error loading overview:', err);
        return of(null);
      })
    ).subscribe(overview => {
      if (overview) {
        this.overview$.next(overview);
      }
    });

    // 2. Load holdings (detailed)
    this.http.get<HoldingsResponse>(`${this.apiUrl}/holdings?page=0&size=50`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      catchError(err => {
        console.error('❌ Error loading holdings:', err);
        return of({ items: [], total: 0, page: 0, size: 0 });
      })
    ).subscribe(res => {
      const holdings = res.items || [];
      this.holdings$.next(holdings);

      // Convert holdings → wallets for UI compatibility
      const wallets: Wallet[] = holdings.map(h => ({
        symbol: h.symbol,
        balance: h.quantity
      }));

      // Add cash as USD wallet
      const cashBalance = this.overview$.value?.cash_balance || 0;
      this.wallets$.next([
        { symbol: 'USD', balance: cashBalance },
        ...wallets
      ]);
    });

    // 3. Load transactions
    this.http.get<TransactionsResponse>(`${this.apiUrl}/transactions?page=0&size=50`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      catchError(err => {
        console.error('❌ Error loading transactions:', err);
        return of({ items: [], total: 0, page: 0, size: 0 });
      })
    ).subscribe(res => {
      const transactions: Transaction[] = (res.items || []).map(t => ({
        id: t.id,
        date: t.transaction_date || t.executed_at || t.date || new Date(),
        symbol: t.symbol,
        side: (t.action?.toLowerCase() === 'buy' || t.transaction_type?.toLowerCase() === 'buy') ? 'buy' : 'sell',
        quantity: t.quantity,
        price: t.price,
        total_amount: t.total_amount
      }));

      this.transactions$.next(transactions);
    });

    // 4. Load performance history
    this.http.get<HistoryPoint[]>(`${this.apiUrl}/history?days=30`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      catchError(err => {
        console.error('❌ Error loading history:', err);
        return of([]);
      })
    ).subscribe(history => {
      const performance: PortfolioPerformancePoint[] = history.map(h => ({
        date: h.date,
        value: h.total_value
      }));

      this.performance$.next(performance);
    });
  }

  // ============= PUBLIC METHODS =============

  getTotalValue(): number {
    if (this.useMock) {
      return this.wallets$.value.reduce((sum, w) => 
        sum + w.balance * this.getAssetPrice(w.symbol), 0
      );
    }
    return this.overview$.value?.total_value || 0;
  }

  getAssetPrice(symbol: string): number {
    if (this.useMock) {
      return this.assetPrices[symbol] || 1;
    }

    // In real mode, prices come from holdings current_price
    const holding = this.holdings$.value.find(h => h.symbol === symbol);
    return holding?.current_price || 1;
  }

  addTransaction(tx: Transaction): void {
    if (this.useMock) {
      const list = [tx, ...this.transactions$.value].slice(0, 50);
      this.transactions$.next(list);
      this.updateWalletBalance(tx);
    }
  }

  private updateWalletBalance(tx: Transaction): void {
    if (!this.useMock) return;
    
    const wallets = [...this.wallets$.value];
    const idx = wallets.findIndex(w => w.symbol === tx.symbol);
    
    if (idx !== -1) {
      wallets[idx].balance += tx.side === 'buy' ? tx.quantity : -tx.quantity;
      this.wallets$.next(wallets);
    }
  }

  refresh(): void {
    if (!this.useMock) {
      console.log('🔄 Refreshing portfolio data...');
      this.loadAll();
    }
  }

  // Fetch real-time prices from market API
  async fetchMarketPrices(symbols: string[]): Promise<{ [symbol: string]: number }> {
    if (this.useMock) {
      return this.assetPrices;
    }

    try {
      const response = await this.http.post<any>(`${this.marketUrl}/quotes`, {
        symbols: symbols,
        asset_class: 'STOCK'
      }, { 
        headers: this.getAuthHeaders() 
      }).toPromise();

      const prices: { [symbol: string]: number } = {};
      
      if (response?.quotes) {
        response.quotes.forEach((quote: any) => {
          prices[quote.symbol] = quote.close;
        });
      }

      return prices;
    } catch (error) {
      console.error('❌ Error fetching market prices:', error);
      return {};
    }
  }
}