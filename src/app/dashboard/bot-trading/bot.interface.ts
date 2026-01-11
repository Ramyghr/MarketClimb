// import { BotStrategyType, BotStatus, TradeAction } from "src/app/services/bot-trading.service";


// export interface Bot {
//   id: number;
//   user_id: number;
//   portfolio_id: number;
//   name: string;
//   description?: string;
//   strategy_type: BotStrategyType;
//   strategy_params: Record<string, any>;
//   symbol: string;
//   asset_type: string;
//   max_position_size: number;
//   stop_loss_pct?: number;
//   take_profit_pct?: number;
//   max_daily_trades: number;
  
//   max_daily_loss: number;
//   max_open_trades: number;
//   use_leverage: boolean;
//   leverage: number;
//   interval: string;
//   status: BotStatus;
//   total_trades: number;
//   winning_trades: number;
//   losing_trades: number;
//   win_rate?: number; // Calculated field
//   total_pnl: number;
//   total_fees: number;
//   last_execution?: string;
//   next_execution?: string;
//   last_signal?: TradeAction;
//   created_at: string;
//   updated_at: string;
//   activated_at?: string;
//   stopped_at?: string;
// }

// export interface BotListResponse {
//   bots: Bot[];
//   total: number;
//   active_count: number;
//   paused_count: number;
// }

// export interface BotLiveStatus {
//   bot_id: number;
//   bot_name: string;
//   status: string;
//   strategy: string;
//   symbol: string;
//   max_open_trades: number;
//   open_trades_count: number;
//   open_trades_limit: string;
//   open_trades_percentage: number;
//   open_trades_limit_status: 'OK' | 'WARNING' | 'LIMIT_REACHED';
//   last_execution?: string;
//   next_execution?: string;
//   last_signal?: string;
//   open_positions: {
//     count: number;
//     positions: Position[];
//     total_unrealized_pnl: number;
//     total_margin_used?: number;
//   };
//   recent_activity: RecentActivity[];
//   today_stats: {
//     trades: number;
//     pnl: number;
//     pnl_pct?: number;
//     remaining_trades: number;
//     daily_loss_limit: number;
//     daily_loss_used: number;
//     execution_count?: number;
//   };
//   overall_stats: {
//     total_trades: number;
//     winning_trades: number;
//     losing_trades: number;
//     win_rate: number;
//     total_pnl: number;
//     total_fees: number;
//     max_open_trades: number;
//     average_position_duration_minutes: number;
//   };
// }

// export interface Position {
//   trade_id?: number;
//   symbol: string;
//   quantity: number;
//   entry_price: number;
//   current_price?: number;
//   unrealized_pnl: number;
//   unrealized_pnl_pct: number;
//   opened_at: string;
//   duration_minutes?: number;
//   side?: string;
//   leverage?: number;
//   entry_time?: string;
//   stop_loss?: number;
//   take_profit?: number;
// }

// export interface RecentActivity {
//   trade_id: number;
//   symbol: string;
//   pnl: number;
//   pnl_pct: number;
//   closed_at: string;
//   exit_reason: string;
// }

// export interface BotPerformance {
//   bot_id: number;
//   bot_name: string;
//   symbol: string;
//   total_trades: number;
//   winning_trades: number;
//   losing_trades: number;
//   win_rate: number;
//   total_pnl: number;
//   total_pnl_pct: number;
//   avg_pnl_per_trade: number;
//   best_trade: number;
//   worst_trade: number;
//   total_fees: number;
//   status: BotStatus;
//   uptime_hours: number;
//   last_execution?: string;
//   profit_factor?: number;
//   sharpe_ratio?: number;
//   avg_trades_per_day?: number;
// }