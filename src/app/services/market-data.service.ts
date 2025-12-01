import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface QuoteResponse {
  symbol: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
  asset_class: string;
  provider: string;
}

export interface MarketDataResponse {
  quotes: QuoteResponse[];
  total: number;
  cached: boolean;
}

export interface MarketStatus {
  market: string;
  status: 'open' | 'closed';
  open_time_tunis: string;
  close_time_tunis: string;
  current_time_tunis: string;
}

@Injectable({
  providedIn: 'root'
})
export class MarketDataService {
  private apiUrl = `${environment.apiUrl}/api/market`;
  
  // Observable for real-time quote updates
  private currentQuoteSubject = new BehaviorSubject<QuoteResponse | null>(null);
  public currentQuote$ = this.currentQuoteSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get single quote for a symbol
   */
  getQuote(symbol: string, assetClass: string = 'STOCK'): Observable<QuoteResponse> {
    const params = new HttpParams().set('asset_class', assetClass.toUpperCase());
    
    return this.http.get<QuoteResponse>(`${this.apiUrl}/quote/${symbol}`, { params }).pipe(
      tap(quote => {
        console.log(`Quote received for ${symbol}:`, quote);
        this.currentQuoteSubject.next(quote);
      }),
      catchError(error => {
        console.error(`Failed to get quote for ${symbol}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get multiple quotes at once (batch request)
   */
  getBatchQuotes(symbols: string[], assetClass: string = 'STOCK'): Observable<MarketDataResponse> {
    const body = {
      symbols: symbols,
      asset_class: assetClass.toUpperCase()
    };

    return this.http.post<MarketDataResponse>(`${this.apiUrl}/quotes`, body).pipe(
      tap(response => {
        console.log(`Batch quotes received:`, response);
      }),
      catchError(error => {
        console.error('Failed to get batch quotes:', error);
        throw error;
      })
    );
  }

  /**
   * Get mixed asset type quotes
   */
  getMixedQuotes(symbolsData: Array<{symbol: string, asset_class: string}>): Observable<MarketDataResponse> {
    return this.http.post<MarketDataResponse>(`${this.apiUrl}/quotes/mixed`, symbolsData).pipe(
      tap(response => {
        console.log('Mixed quotes received:', response);
      })
    );
  }

  /**
   * Get crypto price (convenience method)
   */
  getCryptoPrice(symbol: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/crypto/${symbol}`);
  }

  /**
   * Get stock price (convenience method)
   */
  getStockPrice(symbol: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/stock/${symbol}`);
  }

  /**
   * Get market status (open/closed)
   */
  getMarketStatus(market: string = 'US'): Observable<MarketStatus> {
    return this.http.get<MarketStatus>(`${this.apiUrl}/status/${market}`);
  }

  /**
   * Get provider health status
   */
  getHealthStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }

  /**
   * Get provider status details
   */
  getProviderStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/providers/status`);
  }

  /**
   * Start live price updates for a symbol
   * Updates every 5 seconds
   */
  startLiveUpdates(symbol: string, assetClass: string = 'STOCK'): Observable<QuoteResponse> {
    return interval(5000).pipe(
      switchMap(() => this.getQuote(symbol, assetClass))
    );
  }

  /**
   * Parse symbol to determine asset class
   * Examples:
   * - "NASDAQ:AAPL" -> { symbol: "AAPL", assetClass: "STOCK" }
   * - "BINANCE:BTCUSDT" -> { symbol: "BTCUSDT", assetClass: "CRYPTO" }
   * - "FX:EURUSD" -> { symbol: "EURUSD", assetClass: "FOREX" }
   */
  parseSymbol(fullSymbol: string): { symbol: string; assetClass: string } {
  if (!fullSymbol) return { symbol: '', assetClass: 'STOCK' };

  const parts = fullSymbol.split(':');
  if (parts.length === 2) {
    const [exchange, symbol] = parts;

    if (exchange.toUpperCase().includes('BINANCE') || exchange.toUpperCase().includes('COINBASE')) {
      return { symbol, assetClass: 'CRYPTO' };
    }
    if (exchange === 'FX' || exchange === 'OANDA') {
      return { symbol, assetClass: 'FOREX' };
    }
  }

  // Par défaut : stock
  return { symbol: fullSymbol, assetClass: 'STOCK' };
}
  /**
 * Normalize symbol for API calls
 * BTCUSDT → BTC  (for crypto)
 * Others → unchanged
 */
private normalizeSymbol(symbol: string, assetClass: string): string {
  if (assetClass.toLowerCase() === 'crypto' && symbol.endsWith('USDT')) {
    return symbol.replace('USDT', '');
  }
  return symbol;
}
/**
 * Convertit BTCUSDT → BTC pour l'API
 */
public getApiSymbol(symbol: string, assetClass: string): string {
  if (assetClass.toLowerCase() === 'crypto' && symbol.endsWith('USDT')) {
    return symbol.replace('USDT', '');
  }
  return symbol;
}
}