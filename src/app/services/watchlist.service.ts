import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface WatchlistItem {
  id: number;
  symbol: string;
  asset_type: string;
  added_at: string;
  quotes: QuoteData[];
}

export interface QuoteData {
  symbol: string;
  asset_type: string;
  price: number | null;
  change: number | null;
  change_percent: number | null;
  volume: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  previous_close?: number | null;
  timestamp?: string | null;
  provider?: string | null;
  market_status?: string | null;
}

export interface Watchlist {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  items: WatchlistItem[];
}

export interface PopularSymbol {
  symbol: string;
  name: string;
  sector?: string;
  popularity: number;
}

export interface MarketSummary {
  sp500: { value: number; change: number; changePercent: number };
  nasdaq: { value: number; change: number; changePercent: number };
  dowJones: { value: number; change: number; changePercent: number };
  vix: { value: number; change: number; changePercent: number };
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency?: string;
  matchScore?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WatchlistService {
  private apiUrl = `${environment.apiUrl}/api/v1/watchlist`;

  // Reactive state management
  private watchlistsSubject = new BehaviorSubject<Watchlist[]>([]);
  public watchlists$ = this.watchlistsSubject.asObservable();
  
  private selectedWatchlistSubject = new BehaviorSubject<Watchlist | null>(null);
  public selectedWatchlist$ = this.selectedWatchlistSubject.asObservable();
  
  private marketSummarySubject = new BehaviorSubject<MarketSummary | null>(null);
  public marketSummary$ = this.marketSummarySubject.asObservable();

  constructor(private http: HttpClient) {}

  // ============ WATCHLIST MANAGEMENT ============

  /**
   * Get all user watchlists (tries authenticated, falls back to demo)
   */
  getWatchlists(): Observable<Watchlist[]> {
    return this.http.get<Watchlist[]>(this.apiUrl).pipe(
      catchError(error => {
        // If 401/403, try demo endpoint
        if (error.status === 401 || error.status === 403) {
          console.warn('Not authenticated, loading demo watchlist');
          return this.http.get<Watchlist[]>(`${this.apiUrl}/public/demo`);
        }
        throw error;
      }),
      tap(watchlists => {
        this.watchlistsSubject.next(watchlists);
        // Auto-select first watchlist if none selected
        if (!this.selectedWatchlistSubject.value && watchlists.length > 0) {
          this.selectedWatchlistSubject.next(watchlists[0]);
        }
      })
    );
  }

  /**
   * Get specific watchlist by ID
   */
  getWatchlist(watchlistId: number): Observable<Watchlist> {
    return this.http.get<Watchlist>(`${this.apiUrl}/${watchlistId}`).pipe(
      tap(watchlist => this.selectedWatchlistSubject.next(watchlist))
    );
  }

  /**
   * Create new watchlist
   */
  createWatchlist(name: string, description?: string): Observable<Watchlist> {
    return this.http.post<Watchlist>(this.apiUrl, { name, description }).pipe(
      tap(newWatchlist => {
        const current = this.watchlistsSubject.value;
        this.watchlistsSubject.next([...current, newWatchlist]);
        this.selectedWatchlistSubject.next(newWatchlist);
      })
    );
  }

  /**
   * Delete watchlist
   */
  deleteWatchlist(watchlistId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${watchlistId}`).pipe(
      tap(() => {
        const current = this.watchlistsSubject.value.filter(w => w.id !== watchlistId);
        this.watchlistsSubject.next(current);
        
        // Select first remaining watchlist
        if (this.selectedWatchlistSubject.value?.id === watchlistId) {
          this.selectedWatchlistSubject.next(current.length > 0 ? current[0] : null);
        }
      })
    );
  }

  /**
   * Select a watchlist
   */
  selectWatchlist(watchlist: Watchlist): void {
    this.selectedWatchlistSubject.next(watchlist);
  }

  // ============ WATCHLIST ITEMS ============

  /**
   * Add symbol to watchlist
   */
  addToWatchlist(watchlistId: number, symbol: string, assetType: string = 'stock'): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${watchlistId}/items`,
      { symbol, asset_type: assetType }
    ).pipe(
      tap(() => this.refreshWatchlist(watchlistId))
    );
  }

  /**
   * Add multiple symbols to watchlist
   */
  addMultipleToWatchlist(watchlistId: number, symbols: string[]): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${watchlistId}/items/batch`,
      { symbols }
    ).pipe(
      tap(() => this.refreshWatchlist(watchlistId))
    );
  }

  /**
   * Remove symbol from watchlist
   */
  removeFromWatchlist(watchlistId: number, symbol: string, assetType: string = 'stock'): Observable<void> {
    const params = new HttpParams().set('asset_type', assetType);
    return this.http.delete<void>(
      `${this.apiUrl}/${watchlistId}/items/${symbol}`,
      { params }
    ).pipe(
      tap(() => this.refreshWatchlist(watchlistId))
    );
  }

  /**
   * Refresh specific watchlist data
   */
  private refreshWatchlist(watchlistId: number): void {
    this.getWatchlist(watchlistId).subscribe(
      updatedWatchlist => {
        // Update in the list
        const current = this.watchlistsSubject.value;
        const index = current.findIndex(w => w.id === watchlistId);
        if (index !== -1) {
          current[index] = updatedWatchlist;
          this.watchlistsSubject.next([...current]);
        }
        
        // Update selected if it's the same one
        if (this.selectedWatchlistSubject.value?.id === watchlistId) {
          this.selectedWatchlistSubject.next(updatedWatchlist);
        }
      }
    );
  }

  // ============ SYMBOL SEARCH & DISCOVERY ============

  /**
   * Search for symbols
   */
  searchSymbols(query: string): Observable<SymbolSearchResult[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<SymbolSearchResult[]>(
      `${this.apiUrl}/symbols/search`,
      { params }
    );
  }

  /**
   * Get popular symbols
   */
  getPopularSymbols(limit: number = 20): Observable<PopularSymbol[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<PopularSymbol[]>(
      `${this.apiUrl}/symbols/popular`,
      { params }
    );
  }

  // ============ MARKET DATA ============

  /**
   * Get market summary (indices)
   */
  getMarketSummary(): Observable<MarketSummary> {
    return this.http.get<MarketSummary>(`${this.apiUrl}/market/summary`).pipe(
      tap(summary => this.marketSummarySubject.next(summary))
    );
  }

  /**
   * Start live price updates (websocket or polling)
   */
  startLivePriceUpdates(symbols: string[]): void {
    // TODO: Implement WebSocket connection for real-time prices
    // For now, use polling every 5 seconds
    if (symbols.length === 0) return;
    
    setInterval(() => {
      const selected = this.selectedWatchlistSubject.value;
      if (selected) {
        this.refreshWatchlist(selected.id);
      }
    }, 5000);
  }

  /**
   * Stop live price updates
   */
  stopLivePriceUpdates(): void {
    // TODO: Close WebSocket connection
  }

  // ============ UTILITY METHODS ============

  /**
   * Check if symbol exists in any watchlist
   */
  isSymbolInWatchlist(symbol: string): boolean {
    const watchlists = this.watchlistsSubject.value;
    return watchlists.some(w => 
      w.items.some(item => item.symbol === symbol)
    );
  }

  /**
   * Get all symbols across all watchlists
   */
  getAllSymbols(): string[] {
    const watchlists = this.watchlistsSubject.value;
    const symbols = new Set<string>();
    watchlists.forEach(w => {
      w.items.forEach(item => symbols.add(item.symbol));
    });
    return Array.from(symbols);
  }
  /**
 * Get real-time quote for a single symbol
 */
getQuote(symbol: string, assetClass: string = 'stock'): Observable<QuoteData> {
  return this.http.get<QuoteData>(
    `${environment.apiUrl}/api/market/quote/${symbol}`,
    { params: { asset_class: assetClass.toUpperCase() } }
  );
}
}