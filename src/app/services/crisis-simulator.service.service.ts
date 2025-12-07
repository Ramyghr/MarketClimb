import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import * as CrisisTypes from '../dashboard/crisis-simulator/crisis-simulator.interfaces';

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
  // USER ENDPOINTS - EXACTLY MATCHING BACKEND
  // ============================================================================

  /**
   * GET /api/crisis-simulator/simulations/active
   * Get currently active simulation
   */
  getActiveSimulation(): Observable<CrisisTypes.Simulation | null> {
    return this.http.get<CrisisTypes.Simulation | null>(
      `${this.apiUrl}/simulations/active`,
      { headers: this.getHeaders() }
    );
  }
  /**
   * Get order status badge color
   */
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
  /**
   * POST /api/crisis-simulator/simulations/{simulation_id}/join
   * Join a pending simulation
   */
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

  /**
   * DELETE /api/crisis-simulator/simulations/{simulation_id}/leave
   * Leave a pending simulation
   */
  leaveSimulation(simulationId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/simulations/${simulationId}/leave`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /api/crisis-simulator/crisis-types
   * Get list of all available crisis types
   */
  getCrisisTypes(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/crisis-types`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * POST /api/crisis-simulator/orders
   * Place an order during active simulation
   */
  placeOrder(order: CrisisTypes.PlaceOrderRequest): Observable<any> {
    const formData = new FormData();
    formData.append('symbol', order.symbol);
    formData.append('side', order.side);
    formData.append('quantity', order.quantity.toString());
    formData.append('order_type', order.order_type);
    
    if (order.limit_price !== null && order.limit_price !== undefined) {
      formData.append('limit_price', order.limit_price.toString());
    }
    if (order.stop_price !== null && order.stop_price !== undefined) {
      formData.append('stop_price', order.stop_price.toString());
    }

    return this.http.post<any>(
      `${this.apiUrl}/orders`,
      formData,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /api/crisis-simulator/orders
   * Get order history
   */
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

  /**
   * POST /api/crisis-simulator/positions/{position_id}/close
   * Close an open position (full or partial)
   */
  closePosition(positionId: number, quantity?: number): Observable<any> {
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

  /**
   * POST /api/crisis-simulator/positions/close-all
   * Close all open positions at once
   */
  closeAllPositions(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/positions/close-all`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /api/crisis-simulator/market-data/{symbol}
   * Get current market data for a symbol
   */
  getMarketData(symbol: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/market-data/${symbol}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /api/crisis-simulator/leaderboard
   * Get current leaderboard
   */
  getLeaderboard(limit: number = 50): Observable<any> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<any>(
      `${this.apiUrl}/leaderboard`,
      { headers: this.getHeaders(), params }
    );
  }

  /**
   * GET /api/crisis-simulator/my-stats
   * Get detailed participant statistics
   */
  getMyStats(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/my-stats`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * DELETE /api/crisis-simulator/orders/{order_id}
   * Cancel a pending order
   */
  cancelOrder(orderId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/orders/${orderId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /api/crisis-simulator/crisis/{crisis_type}/symbols
   * Get detailed symbol information for a crisis
   */
  getCrisisSymbols(crisisType: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/crisis/${crisisType}/symbols`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /api/crisis-simulator/assets/{crisis_type}
   * Get available assets for a specific crisis type
   */
  getAssets(crisisType: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/assets/${crisisType}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /api/crisis-simulator/participants
   * Get list of all participants in a simulation
   */
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

  /**
   * GET /api/crisis-simulator/simulation/{simulation_id}/timeline
   * Get timeline of major events during a simulation
   */
  getSimulationTimeline(simulationId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/simulation/${simulationId}/timeline`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /api/crisis-simulator/health
   * Get crisis simulator health status
   */
  getHealth(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/health`,
      { headers: this.getHeaders() }
    );
  }

  // ============================================================================
  // ADMIN ENDPOINTS - EXACTLY MATCHING BACKEND
  // ============================================================================

  /**
   * POST /admin/simulations
   * Create a new crisis simulation (Admin only)
   */
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

  /**
   * POST /admin/simulations/{simulation_id}/start
   * Start a pending simulation (Admin only)
   */
  startSimulation(simulationId: number): Observable<any> {
    return this.http.post(
      `${this.adminApiUrl}/simulations/${simulationId}/start`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * POST /admin/simulations/{simulation_id}/stop
   * Stop a running simulation immediately (Admin only)
   */
  stopSimulation(simulationId: number, force: boolean = false): Observable<any> {
    const params = new HttpParams().set('force', force.toString());
    
    return this.http.post(
      `${this.adminApiUrl}/simulations/${simulationId}/stop`,
      {},
      { headers: this.getHeaders(), params }
    );
  }

  /**
   * POST /admin/simulations/{simulation_id}/pause
   * Pause an active simulation (Admin only)
   */
  pauseSimulation(simulationId: number): Observable<any> {
    return this.http.post(
      `${this.adminApiUrl}/simulations/${simulationId}/pause`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * POST /admin/simulations/{simulation_id}/resume
   * Resume a paused simulation (Admin only)
   */
  resumeSimulation(simulationId: number): Observable<any> {
    return this.http.post(
      `${this.adminApiUrl}/simulations/${simulationId}/resume`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * DELETE /admin/simulations/{simulation_id}
   * Delete a simulation and all its data (Admin only)
   */
  deleteSimulation(simulationId: number): Observable<any> {
    return this.http.delete(
      `${this.adminApiUrl}/simulations/${simulationId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * GET /admin/simulations/history
   * Get history of all simulations (Admin only)
   */
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

  /**
   * GET /admin/simulations/{simulation_id}/stats
   * Get detailed statistics for a simulation (Admin only)
   */
  getSimulationStats(simulationId: number): Observable<any> {
    return this.http.get<any>(
      `${this.adminApiUrl}/simulations/${simulationId}/stats`,
      { headers: this.getHeaders() }
    );
  }

  // ============================================================================
  // POLLING / AUTO-REFRESH METHODS
  // ============================================================================

  /**
   * Auto-refresh stats every N seconds
   */
  autoRefreshStats(intervalSeconds: number = 2): Observable<any> {
    return interval(intervalSeconds * 1000).pipe(
      switchMap(() => this.getMyStats())
    );
  }

  /**
   * Auto-refresh leaderboard
   */
  autoRefreshLeaderboard(intervalSeconds: number = 5): Observable<any> {
    return interval(intervalSeconds * 1000).pipe(
      switchMap(() => this.getLeaderboard())
    );
  }

  /**
   * Auto-refresh market data for symbol
   */
  autoRefreshMarketData(symbol: string, intervalSeconds: number = 1): Observable<any> {
    return interval(intervalSeconds * 1000).pipe(
      switchMap(() => this.getMarketData(symbol))
    );
  }

  // ============================================================================
  // UTILITY METHODS (keep as they are)
  // ============================================================================

  /**
   * Format crisis type for display
   */
  formatCrisisType(crisisType: string): string {
    return crisisType.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get crisis type color
   */
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

  /**
   * Calculate profit/loss color
   */
  getPnlColor(value: number): string {
    if (value > 0) return '#10b981'; // green
    if (value < 0) return '#ef4444'; // red
    return '#6b7280'; // gray
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    if (value === null || value === undefined) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Format large currency (with K, M, B suffixes)
   */
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

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    if (value === null || value === undefined) return '0.00%';
    
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  /**
   * Format date/time
   */
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

  /**
   * Format date only
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Format relative time
   */
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

  /**
   * Validate order parameters
   */
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