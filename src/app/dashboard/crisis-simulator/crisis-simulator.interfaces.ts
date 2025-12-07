// Enums
export enum CrisisType {
  GREAT_DEPRESSION = 'great_depression',
  BLACK_MONDAY = 'black_monday',
  DOTCOM_BUBBLE = 'dotcom_bubble',
  FINANCIAL_CRISIS_2008 = 'financial_crisis_2008',
  COVID_CRASH = 'covid_crash'
}

export enum SimulationStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP'
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  FILLED = 'FILLED',
  PARTIAL = 'PARTIAL',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

// Simulation Models
export interface Simulation {
  id: number;
  crisis_type: string;
  status: string;
  real_start_time: string | null;
  real_end_time: string | null;
  historical_start_date: string;
  historical_end_date: string;
  current_historical_time: string | null;
  current_phase: string | null;
  duration_minutes: number;
  max_participants: number;
  is_competitive: boolean;
  participant_count: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  progress_percentage: number | null;
}

export interface Participant {
  id: number;
  user_id: number;
  simulation_id: number;
  joined_at: string;
  is_active: boolean;
  initial_cash: number;
  current_cash: number;
  current_portfolio_value: number | null;
  current_total_value: number | null;
  total_return_pct: number;
  max_drawdown_pct: number;
  total_trades: number;
  profitable_trades: number;
  final_rank: number | null;
}

export interface Order {
  id: number;
  symbol: string;
  order_type: string;
  side: string;
  quantity: number;
  limit_price: number | null;
  stop_price: number | null;
  filled_price: number | null;
  filled_quantity: number;
  status: string;
  placed_at_historical: string;
  filled_at_historical: string | null;
  commission: number;
  rejection_reason: string | null;
}

export interface Position {
  id: number;
  symbol: string;
  quantity: number;
  average_cost: number;
  current_price: number | null;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  realized_pnl: number;
  position_type: string;
  market_value: number | null;
  opened_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  total_value: number;
  total_return_pct: number;
  profit_loss: number;
  initial_value: number;
  max_drawdown_pct: number;
  sharpe_ratio: number | null;
  competition_score: number;
}

export interface Leaderboard {
  simulation_id: number;
  entries: LeaderboardEntry[];
  snapshot_at_historical: string;
  total_participants: number;
}

export interface MarketData {
  symbol: string;
  current_price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  historical_time: string;
  simulation_phase: string | null;
}

export interface ParticipantStats {
  participant_id: number;
  user_id: number;
  initial_value: number;
  current_cash: number;
  current_portfolio_value: number;
  current_total_value: number;
  profit_loss: number;
  total_return_pct: number;
  max_drawdown_pct: number;
  sharpe_ratio: number | null;
  total_trades: number;
  profitable_trades: number;
  total_orders: number;
  filled_orders: number;
  active_positions: number;
  current_rank: number | null;
  max_leverage_used: number;
  margin_calls_count: number;
}

export interface CrisisTypeInfo {
  type: string;
  name: string;
  asset_count: number;
  date_range_start: string;
  date_range_end: string;
  duration_days: number;
  available: boolean;
  description?: string;
}

export interface SymbolInfo {
  symbol: string;
  data_points: number;
  price_statistics: {
    start_price: number;
    end_price: number;
    min_price: number;
    max_price: number;
    average_price: number;
  };
  performance: {
    total_return_pct: number;
    annualized_volatility_pct: number;
    max_drawdown_pct: number;
  };
  trading_info: {
    can_short: boolean;
    margin_requirement: number;
    commission_rate: number;
    min_tick_size: number;
  };
}

export interface CrisisSymbolsResponse {
  crisis_type: string;
  crisis_name: string;
  date_range: {
    start: string;
    end: string;
    duration_days: number;
  };
  total_symbols: number;
  symbols: SymbolInfo[];
  trading_constraints: {
    short_selling_allowed: boolean;
    margin_requirement: number;
    commission_rate: number;
    min_tick_size: number;
  };
}

// Request Models
export interface JoinSimulationRequest {
  initial_cash: number;
}

export interface PlaceOrderRequest {
  symbol: string;
  side: string;
  quantity: number;
  order_type: string;
  limit_price?: number | null;
  stop_price?: number | null;
}

// Response Models
export interface ClosePositionResponse {
  success: boolean;
  message: string;
  closing_details: {
    symbol: string;
    quantity_closed: number;
    remaining_quantity: number;
    average_cost: number;
    closing_price: number;
    gross_proceeds: number;
    commission: number;
    net_proceeds: number;
    realized_pnl: number;
    realized_pnl_pct: number;
    position_fully_closed: boolean;
  };
  updated_portfolio: {
    current_cash: number;
    portfolio_value: number;
    total_value: number;
    total_return_pct: number;
  };
}