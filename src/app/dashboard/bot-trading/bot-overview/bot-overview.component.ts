// src/app/dashboard/bot-trading/bot-overview/bot-overview.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { interval, Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { BotTradingService, Bot, BotLiveStatus } from 'src/app/services/bot-trading.service';
@Component({
  selector: 'app-bot-overview',
  templateUrl: './bot-overview.component.html',
  styleUrls: ['./bot-overview.component.scss']
})
export class BotOverviewComponent implements OnInit, OnDestroy {
  @Input() bot!: Bot;

  liveStatus: BotLiveStatus | null = null;
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();
  private refreshInterval = 5000; // 5 seconds

  constructor(private botService: BotTradingService) {}

  ngOnInit(): void {
    this.loadLiveStatus();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLiveStatus(): void {
    if (!this.bot?.id) return;

    this.loading = true;
    this.botService.getBotLiveStatus(this.bot.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          this.liveStatus = status;
          this.loading = false;
          this.error = null;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load live status';
          this.loading = false;
        }
      });
  }

  startAutoRefresh(): void {
    interval(this.refreshInterval)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.botService.getBotLiveStatus(this.bot.id))
      )
      .subscribe({
        next: (status) => {
          this.liveStatus = status;
        },
        error: (err) => {
          console.error('Auto-refresh error:', err);
        }
      });
  }

  getLimitStatusClass(status: string): string {
    switch (status) {
      case 'OK': return 'status-ok';
      case 'WARNING': return 'status-warning';
      case 'LIMIT_REACHED': return 'status-danger';
      default: return '';
    }
  }

  getLimitStatusIcon(status: string): string {
    switch (status) {
      case 'OK': return 'check_circle';
      case 'WARNING': return 'warning';
      case 'LIMIT_REACHED': return 'error';
      default: return 'help';
    }
  }

  formatPnL(pnl: number): string {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}$${pnl.toFixed(2)}`;
  }

  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  getPnLClass(pnl: number): string {
    return pnl >= 0 ? 'text-success' : 'text-danger';
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  closePosition(trade: any): void {
    if (confirm(`Close position for ${trade.symbol}?`)) {
      this.botService.closeBotTrade(this.bot.id, trade.trade_id)
        .subscribe({
          next: () => {
            this.loadLiveStatus();
          },
          error: (err) => {
            this.error = err.message || 'Failed to close position';
          }
        });
    }
  }

  refresh(): void {
    this.loadLiveStatus();
  }
}