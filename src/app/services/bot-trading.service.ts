// src/app/services/bot-trading.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Interfaces
export interface Bot {
  id: number;
  user_id: number;
  portfolio_id: number;
  name: string;
  description?: string;
  strategy_type: BotStrategyType;
  strategy_params: any;
  symbol: string;
  asset_type: string;
  max_position_size: number;
  stop_loss_pct?: number;
  take_profit_pct?: number;
  max_daily_trades: number;
  max_daily_loss: number;
  max_open_trades: number;
  use_leverage: boolean;
  leverage: number;
  interval: string;
  status: BotStatus;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  total_pnl: number;
  total_fees: number;
  last_execution?: string;
  next_execution?: string;
  last_signal?: string;
  created_at: string;
  updated_at: string;
  activated_at?: string;
  stopped_at?: string;
}

export enum BotStrategyType {
  MA_CROSSOVER = 'MA_CROSSOVER',
  RSI_OVERSOLD_OVERBOUGHT = 'RSI_OVERSOLD_OVERBOUGHT',
  BOLLINGER_BANDS = 'BOLLINGER_BANDS',
  MACD_CROSSOVER = 'MACD_CROSSOVER',
  VOLUME_BREAKOUT = 'VOLUME_BREAKOUT',
  MEAN_REVERSION = 'MEAN_REVERSION',
  MOMENTUM = 'MOMENTUM',
  SUPPORT_RESISTANCE = 'SUPPORT_RESISTANCE',
  GRID_TRADING = 'GRID_TRADING',
  DCA = 'DCA',
  RAPID_TEST = 'RAPID_TEST'
}

export enum BotStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR'
}

export interface BotListResponse {
  bots: Bot[];
  total: number;
  active_count: number;
  paused_count: number;
}

export interface BotTrade {
  id: number;
  bot_id: number;
  symbol: string;
  action: string;
  position_id?: number;
  quantity: number;
  entry_price: number;
  exit_price?: number;
  trade_value: number;
  fee: number;
  pnl: number;
  pnl_pct: number;
  leverage_used: number;
  margin_used: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  exit_reason?: string;
  is_open: boolean;
  opened_at: string;
  closed_at?: string;
}

export interface BotPerformance {
  bot_id: number;
  bot_name: string;
  symbol: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_pnl: number;
  total_pnl_pct: number;
  avg_pnl_per_trade: number;
  best_trade: number;
  worst_trade: number;
  total_fees: number;
  status: BotStatus;
  uptime_hours: number;
  last_execution?: string;
}

export interface BacktestRequest {
  start_date: string;
  end_date: string;
  initial_capital: number;
}

export interface BacktestResponse {
  id: number;
  bot_id: number;
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_capital: number;
  total_return: number;
  total_return_pct: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  largest_win: number;
  largest_loss: number;
  profit_factor: number;
  sharpe_ratio: number;
  max_drawdown: number;
  max_drawdown_pct: number;
  performance_metrics?: any;
  trade_history?: any[];
  status: string;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface StrategyTemplate {
  strategy_type: BotStrategyType;
  name: string;
  description: string;
  default_params: any;
  param_descriptions: any;
  recommended_intervals: string[];
  risk_level: string;
}

export interface BotLog {
  id: number;
  level: string;
  message: string;
  details?: any;
  timestamp: string;
  expanded?: boolean; 
}

export interface BotLiveStatus {
  bot_id: number;
  bot_name: string;
  status: string;
  strategy: string;
  symbol: string;
  max_open_trades: number;
  open_trades_count: number;
  open_trades_limit: string;
  open_trades_percentage: number;
  open_trades_limit_status: string;
  last_execution?: string;
  next_execution?: string;
  last_signal?: string;
  open_positions: {
    count: number;
    positions: any[];
    total_unrealized_pnl: number;
  };
  recent_activity: any[];
  today_stats: {
    trades: number;
    pnl: number;
    remaining_trades: number;
    daily_loss_limit: number;
    daily_loss_used: number;
  };
  overall_stats: {
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    win_rate: number;
    total_pnl: number;
    total_fees: number;
    max_open_trades: number;
    average_position_duration_minutes: number;
  };
}

export interface SystemStatus {
  system_status: string;
  executor_running: boolean;
  total_bots: number;
  active_bots: number;
  your_bots: number;
  supported_strategies: number;
  timestamp: string;
}

export interface BotStatusUpdate {
  status: BotStatus;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BotTradingService {
  private apiUrl = `${environment.apiUrl}/bots`;
  
  // Real-time state management
  private botsSubject = new BehaviorSubject<Bot[]>([]);
  public bots$ = this.botsSubject.asObservable();
  
  private systemStatusSubject = new BehaviorSubject<SystemStatus | null>(null);
  public systemStatus$ = this.systemStatusSubject.asObservable();

  private autoRefreshInterval?: any;

  constructor(private http: HttpClient) {}

  // ==================== Bot CRUD Operations ====================
  
  createBot(botData: any): Observable<Bot> {
    return this.http.post<Bot>(this.apiUrl, botData).pipe(
      tap(() => this.refreshBots()),
      catchError(this.handleError)
    );
  }

  getBots(statusFilter?: BotStatus, limit: number = 50, offset: number = 0): Observable<BotListResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    
    if (statusFilter) {
      params = params.set('status_filter', statusFilter);
    }

    return this.http.get<BotListResponse>(this.apiUrl, { params }).pipe(
      tap(response => this.botsSubject.next(response.bots)),
      catchError(this.handleError)
    );
  }

  getBot(botId: number): Observable<Bot> {
    return this.http.get<Bot>(`${this.apiUrl}/${botId}`).pipe(
      catchError(this.handleError)
    );
  }

  updateBot(botId: number, botData: any): Observable<Bot> {
    return this.http.put<Bot>(`${this.apiUrl}/${botId}`, botData).pipe(
      tap(() => this.refreshBots()),
      catchError(this.handleError)
    );
  }

  deleteBot(botId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${botId}`).pipe(
      tap(() => this.refreshBots()),
      catchError(this.handleError)
    );
  }

  // ==================== Bot Control Operations ====================
  
  startBot(botId: number): Observable<BotStatusUpdate> {
    return this.http.post<BotStatusUpdate>(`${this.apiUrl}/${botId}/start`, {}).pipe(
      tap(() => this.refreshBots()),
      catchError(this.handleError)
    );
  }

  startRapidTestBot(botId: number): Observable<BotStatusUpdate> {
    return this.http.post<BotStatusUpdate>(`${this.apiUrl}/${botId}/start_rapid_test`, {}).pipe(
      tap(() => this.refreshBots()),
      catchError(this.handleError)
    );
  }

  pauseBot(botId: number): Observable<BotStatusUpdate> {
    return this.http.post<BotStatusUpdate>(`${this.apiUrl}/${botId}/pause`, {}).pipe(
      tap(() => this.refreshBots()),
      catchError(this.handleError)
    );
  }

  stopBot(botId: number): Observable<BotStatusUpdate> {
    return this.http.post<BotStatusUpdate>(`${this.apiUrl}/${botId}/stop`, {}).pipe(
      tap(() => this.refreshBots()),
      catchError(this.handleError)
    );
  }

  manuallyExecuteBot(botId: number): Observable<BotStatusUpdate> {
    return this.http.post<BotStatusUpdate>(`${this.apiUrl}/${botId}/execute`, {}).pipe(
      catchError(this.handleError)
    );
  }

  emergencyStopBot(botId: number, closePositions: boolean = true): Observable<BotStatusUpdate> {
    return this.http.post<BotStatusUpdate>(
      `${this.apiUrl}/${botId}/emergency-stop`, 
      { close_positions: closePositions }
    ).pipe(
      tap(() => this.refreshBots()),
      catchError(this.handleError)
    );
  }

  // ==================== Bot Performance & Data ====================
  
  getBotPerformance(botId: number): Observable<BotPerformance> {
    return this.http.get<BotPerformance>(`${this.apiUrl}/${botId}/performance`).pipe(
      catchError(this.handleError)
    );
  }

  getBotTrades(botId: number, isOpen?: boolean, limit: number = 100): Observable<BotTrade[]> {
    let params = new HttpParams().set('limit', limit.toString());
    
    if (isOpen !== undefined) {
      params = params.set('is_open', isOpen.toString());
    }

    return this.http.get<BotTrade[]>(`${this.apiUrl}/${botId}/trades`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getBotLogs(botId: number, limit: number = 100): Observable<{ bot_id: number; logs: BotLog[] }> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<{ bot_id: number; logs: BotLog[] }>(`${this.apiUrl}/${botId}/logs`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getBotLiveStatus(botId: number): Observable<BotLiveStatus> {
    return this.http.get<BotLiveStatus>(`${this.apiUrl}/${botId}/live-status`).pipe(
      catchError(this.handleError)
    );
  }

  closeBotTrade(botId: number, tradeId: number): Observable<BotTrade> {
    return this.http.post<BotTrade>(`${this.apiUrl}/${botId}/trades/${tradeId}/close`, {}).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== Backtesting Operations ====================
  
  runBacktest(botId: number, backtestData: BacktestRequest): Observable<BacktestResponse> {
    return this.http.post<BacktestResponse>(`${this.apiUrl}/${botId}/backtest`, backtestData).pipe(
      catchError(this.handleError)
    );
  }

  getBotBacktests(botId: number, limit: number = 10): Observable<BacktestResponse[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<BacktestResponse[]>(`${this.apiUrl}/${botId}/backtests`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getBacktest(botId: number, backtestId: number): Observable<BacktestResponse> {
    return this.http.get<BacktestResponse>(`${this.apiUrl}/${botId}/backtests/${backtestId}`).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== Strategy Templates ====================
  
  getStrategyTemplates(): Observable<StrategyTemplate[]> {
    return this.http.get<StrategyTemplate[]>(`${this.apiUrl}/templates/strategies`).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== System Status ====================
  
  getSystemStatus(): Observable<SystemStatus> {
    return this.http.get<SystemStatus>(`${this.apiUrl}/system/status`).pipe(
      tap(status => this.systemStatusSubject.next(status)),
      catchError(this.handleError)
    );
  }

  // ==================== Helper Methods ====================
  
  private refreshBots(): void {
    this.getBots().subscribe();
  }

  // Auto-refresh for live updates
  startAutoRefresh(intervalMs: number = 10000): void {
    // Clear existing interval if any
    this.stopAutoRefresh();
    
    this.autoRefreshInterval = setInterval(() => {
      this.getBots().subscribe();
      this.getSystemStatus().subscribe();
    }, intervalMs);
  }

  stopAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = undefined;
    }
  }

  // Error handler
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.detail || error.message || `Error Code: ${error.status}`;
    }
    
    console.error('Bot Trading Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // Cleanup on service destroy
  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }
}