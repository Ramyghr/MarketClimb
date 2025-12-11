import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import * as CrisisTypes from '../dashboard/crisis-simulator/crisis-simulator.interfaces';
// ADD THESE IMPORTS IF NOT ALREADY PRESENT
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class CrisisSimulatorServiceService {
  private apiUrl = 'http://127.0.0.1:8000/api/crisis-simulator';
  private adminApiUrl = 'http://127.0.0.1:8000/admin';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // ============================================================================
  // USER ENDPOINTS
  // ============================================================================

  getActiveSimulation(): Observable<CrisisTypes.Simulation | null> {
    return this.http.get<CrisisTypes.Simulation | null>(
      `${this.apiUrl}/simulations/active`,
      { headers: this.getHeaders() }
    );
  }

  getOrderStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDING': '#f59e0b',
      'FILLED': '#10b981',
      'PARTIAL': '#3b82f6',
      'REJECTED': '#ef4444',
      'CANCELLED': '#6b7280'
    };
    return colors[status] || '#6b7280';
  }

  joinSimulation(simulationId: number, initialCash: number = 100000): Observable<any> {
    const joinRequest = {
      initial_cash: initialCash
    };

    return this.http.post<any>(
      `${this.apiUrl}/simulations/${simulationId}/join`,
      joinRequest,
      { 
        headers: this.getHeaders().set('Content-Type', 'application/json')
      }
    );
  }

  leaveSimulation(simulationId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/simulations/${simulationId}/leave`,
      { headers: this.getHeaders() }
    );
  }

  getCrisisTypes(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/crisis-types`,
      { headers: this.getHeaders() }
    );
  }

  placeOrder(order: CrisisTypes.PlaceOrderRequest): Observable<any> {
    const jsonOrder = {
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      order_type: order.order_type,
      limit_price: order.limit_price,
      stop_price: order.stop_price
    };

    console.log('📤 Sending JSON order:', JSON.stringify(jsonOrder, null, 2));

    return this.http.post<any>(
      `${this.apiUrl}/orders`,
      jsonOrder,
      { 
        headers: this.getHeaders().set('Content-Type', 'application/json')
      }
    );
  }

  getOrders(statusFilter?: string, limit: number = 50): Observable<any[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (statusFilter) {
      params = params.set('status_filter', statusFilter);
    }

    return this.http.get<any[]>(
      `${this.apiUrl}/orders`,
      { headers: this.getHeaders(), params }
    );
  }

  // /**
  //  * POST /api/crisis-simulator/positions/{order_id}/close
  //  * Close an open position using ORDER ID
  //  */
  // closePosition(orderId: number, quantity?: number): Observable<any> {
  //   console.log('🔄 Service: Closing position for order ID:', orderId);
    
  //   let params = new HttpParams();
  //   if (quantity) {
  //     params = params.set('quantity', quantity.toString());
  //   }
    
  //   return this.http.post<any>(
  //     `${this.apiUrl}/positions/${orderId}/close`,
  //     {},
  //     { headers: this.getHeaders(), params }
  //   );
  // }

  /**
   * POST /api/crisis-simulator/positions/close-all
   * Close all open positions at once
   */
  closeAllPositions(): Observable<any> {
    console.log('🔄 Service: Closing all positions');
    
    return this.http.post(
      `${this.apiUrl}/positions/close-all`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getMarketData(symbol: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/market-data/${symbol}`,
      { headers: this.getHeaders() }
    );
  }

  getLeaderboard(limit: number = 50): Observable<any> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<any>(
      `${this.apiUrl}/leaderboard`,
      { headers: this.getHeaders(), params }
    );
  }

  getMyStats(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/my-stats`,
      { headers: this.getHeaders() }
    );
  }

  cancelOrder(orderId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/orders/${orderId}`,
      { headers: this.getHeaders() }
    );
  }

  getCrisisSymbols(crisisType: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/crisis/${crisisType}/symbols`,
      { headers: this.getHeaders() }
    );
  }

  getAssets(crisisType: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/assets/${crisisType}`,
      { headers: this.getHeaders() }
    );
  }

  getParticipants(simulationId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (simulationId) {
      params = params.set('simulation_id', simulationId.toString());
    }

    return this.http.get<any[]>(
      `${this.apiUrl}/participants`,
      { headers: this.getHeaders(), params }
    );
  }
// ADD TO CrisisSimulatorServiceService:

/**
 * GET /api/crisis-simulator/positions
 * Get all open positions from backend
 */
getMyPositions(): Observable<any[]> {
  console.log('🔄 Service: Fetching positions from backend');
  
  return this.http.get<any[]>(
    `${this.apiUrl}/positions`,
    { headers: this.getHeaders() }
  ).pipe(
    tap(positions => console.log('✅ Positions received:', positions?.length || 0))
  );
}

/**
 * Enhanced closePosition - Use position_id
 */
closePosition(positionId: number, quantity?: number): Observable<any> {
  console.log('🔄 Service: Closing position ID:', positionId);
  
  let params = new HttpParams();
  if (quantity) {
    params = params.set('quantity', quantity.toString());
  }
  
  return this.http.post<any>(
    `${this.apiUrl}/positions/${positionId}/close`,
    {},
    { headers: this.getHeaders(), params }
  );
}
  getSimulationTimeline(simulationId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/simulation/${simulationId}/timeline`,
      { headers: this.getHeaders() }
    );
  }

  getHealth(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/health`,
      { headers: this.getHeaders() }
    );
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  createSimulation(crisisType: string, maxParticipants: number, isCompetitive: boolean = false): Observable<any> {
    const formData = new FormData();
    formData.append('crisis_type', crisisType);
    formData.append('max_participants', maxParticipants.toString());
    formData.append('is_competitive', isCompetitive.toString());

    return this.http.post<any>(
      `${this.adminApiUrl}/simulations`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  startSimulation(simulationId: number): Observable<any> {
    return this.http.post(
      `${this.adminApiUrl}/simulations/${simulationId}/start`,
      {},
      { headers: this.getHeaders() }
    );
  }

  stopSimulation(simulationId: number, force: boolean = false): Observable<any> {
    const params = new HttpParams().set('force', force.toString());
    
    return this.http.post(
      `${this.adminApiUrl}/simulations/${simulationId}/stop`,
      {},
      { headers: this.getHeaders(), params }
    );
  }

  pauseSimulation(simulationId: number): Observable<any> {
    return this.http.post(
      `${this.adminApiUrl}/simulations/${simulationId}/pause`,
      {},
      { headers: this.getHeaders() }
    );
  }

  resumeSimulation(simulationId: number): Observable<any> {
    return this.http.post(
      `${this.adminApiUrl}/simulations/${simulationId}/resume`,
      {},
      { headers: this.getHeaders() }
    );
  }

  deleteSimulation(simulationId: number): Observable<any> {
    return this.http.delete(
      `${this.adminApiUrl}/simulations/${simulationId}`,
      { headers: this.getHeaders() }
    );
  }

  getSimulationHistory(limit: number = 10, offset: number = 0, status?: string, crisisType?: string): Observable<any[]> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    
    if (status) {
      params = params.set('status', status);
    }
    if (crisisType) {
      params = params.set('crisis_type', crisisType);
    }

    return this.http.get<any[]>(
      `${this.adminApiUrl}/simulations/history`,
      { headers: this.getHeaders(), params }
    );
  }

  getSimulationStats(simulationId: number): Observable<any> {
    return this.http.get<any>(
      `${this.adminApiUrl}/simulations/${simulationId}/stats`,
      { headers: this.getHeaders() }
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  formatCrisisType(crisisType: string): string {
    return crisisType.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getCrisisTypeColor(crisisType: string): string {
    const colors: { [key: string]: string } = {
      'great_depression': '#8b4513',
      'black_monday': '#000000',
      'dotcom_bubble': '#00ff00',
      'financial_crisis_2008': '#ff0000',
      'covid_crash': '#9370db',
      'asian_financial_crisis': '#ff6b6b',
      'european_debt_crisis': '#4ecdc4'
    };
    return colors[crisisType] || '#666666';
  }

  getPnlColor(value: number): string {
    if (value > 0) return '#10b981';
    if (value < 0) return '#ef4444';
    return '#6b7280';
  }

  formatCurrency(value: number): string {
    if (value === null || value === undefined) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatLargeCurrency(value: number): string {
    if (value === null || value === undefined) return '$0';
    
    const absValue = Math.abs(value);
    if (absValue >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (absValue >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (absValue >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    
    return this.formatCurrency(value);
  }

  formatPercentage(value: number): string {
    if (value === null || value === undefined) return '0.00%';
    
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatRelativeTime(dateString: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  validateOrder(order: CrisisTypes.PlaceOrderRequest): { valid: boolean; message?: string } {
    if (!order.symbol || order.symbol.trim() === '') {
      return { valid: false, message: 'Symbol is required' };
    }
    
    if (!order.side || !['BUY', 'SELL'].includes(order.side)) {
      return { valid: false, message: 'Invalid order side' };
    }
    
    if (!order.quantity || order.quantity <= 0) {
      return { valid: false, message: 'Quantity must be greater than 0' };
    }
    
    if (!order.order_type || !['MARKET', 'LIMIT', 'STOP'].includes(order.order_type)) {
      return { valid: false, message: 'Invalid order type' };
    }
    
    if (order.order_type === 'LIMIT' && (!order.limit_price || order.limit_price <= 0)) {
      return { valid: false, message: 'Limit price is required for limit orders' };
    }
    
    if (order.order_type === 'STOP' && (!order.stop_price || order.stop_price <= 0)) {
      return { valid: false, message: 'Stop price is required for stop orders' };
    }
    
    return { valid: true };
  }
}