import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class OverviewService {

  private baseUrl = '/api/portfolio';  // Your FastAPI portfolio prefix
  private wsUrl = 'ws://localhost:8000/ws/market'; // WebSocket endpoint

  private ws: WebSocketSubject<any> | null = null;

  // Real-time market data
  private marketDataSubject = new BehaviorSubject<any[]>([]);
  public marketData$ = this.marketDataSubject.asObservable();

  constructor(private http: HttpClient, private ngZone: NgZone) { }

  // ============= PORTFOLIO ENDPOINTS =============

  getOverview(): Observable<any> {
    return this.http.get(`${this.baseUrl}/overview`);
  }

  getDashboard(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard`);
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/stats`);
  }

  getPerformanceSummary(): Observable<any> {
    return this.http.get(`${this.baseUrl}/performance/summary`);
  }

  getHoldings(page = 0, size = 10, sortBy = 'value'): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort_by', sortBy);
    return this.http.get(`${this.baseUrl}/holdings`, { params });
  }

  getDetailedPositions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/positions/detailed`);
  }

  getLeveragedPositionSummary(symbol: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/positions/leveraged/${symbol}`);
  }

  getHoldingQuantity(symbol: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/holdings/${symbol}/quantity`);
  }

  checkMarginHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/margin/health`);
  }

  getLiquidationHistory(limit = 10): Observable<any> {
    let params = new HttpParams().set('limit', limit.toString());
    return this.http.get(`${this.baseUrl}/liquidations/history`, { params });
  }

  getPortfolioHistory(days = 30): Observable<any> {
    let params = new HttpParams().set('days', days.toString());
    return this.http.get(`${this.baseUrl}/history`, { params });
  }

  getDailySnapshots(days = 30): Observable<any> {
    let params = new HttpParams().set('days', days.toString());
    return this.http.get(`${this.baseUrl}/snapshots/daily`, { params });
  }

  getPortfolioRank(): Observable<any> {
    return this.http.get(`${this.baseUrl}/rank`);
  }

  getBestWorstHoldings(limit = 3): Observable<any> {
    let params = new HttpParams().set('limit', limit.toString());
    return this.http.get(`${this.baseUrl}/analysis/best-worst`, { params });
  }

  getAssetAllocation(): Observable<any> {
    return this.http.get(`${this.baseUrl}/allocation`);
  }

  getCashBalance(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cash`);
  }

  refreshPortfolio(force = false): Observable<any> {
    let params = new HttpParams().set('force', force.toString());
    return this.http.post(`${this.baseUrl}/refresh`, {}, { params });
  }

  getTransactionHistory(page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get(`${this.baseUrl}/transactions`, { params });
  }

  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // ============= WEBSOCKET FOR REAL-TIME MARKET DATA =============

  connectMarketWebSocket(symbols: string[] = []): void {
    if (this.ws) {
      this.ws.complete();
    }

    this.ws = webSocket(this.wsUrl);

    this.ws.subscribe(
      (message: any) => {
        // Update market data in Angular zone
        this.ngZone.run(() => {
          const currentData = this.marketDataSubject.value;
          this.marketDataSubject.next([...currentData, message]);
        });
      },
      (err) => console.error('WebSocket error', err),
      () => console.log('WebSocket closed')
    );

    // Subscribe to symbols after connecting
    this.ws.next({ action: 'subscribe', symbols });
  }

  unsubscribeMarketWebSocket(symbols: string[] = []): void {
    if (this.ws) {
      this.ws.next({ action: 'unsubscribe', symbols });
    }
  }

  disconnectMarketWebSocket(): void {
    if (this.ws) {
      this.ws.complete();
      this.ws = null;
    }
  }
}
