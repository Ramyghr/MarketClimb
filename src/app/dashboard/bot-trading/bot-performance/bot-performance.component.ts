// src/app/dashboard/bot-trading/bot-performance/bot-performance.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BotTradingService, BotPerformance } from '../../../services/bot-trading.service';

@Component({
  selector: 'app-bot-performance',
  templateUrl: './bot-performance.component.html',
  styleUrls: ['./bot-performance.component.scss']
})
export class BotPerformanceComponent implements OnInit, OnDestroy {
  @Input() botId!: number;

  Math = Math;
  
  performance: BotPerformance | null = null;
  loading = false;
  error: string | null = null;
  
  // Chart data
  pnlChartData: any[] = [];
  tradeDistributionData: any[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(private botService: BotTradingService) {}

  ngOnInit(): void {
    this.loadPerformance();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPerformance(): void {
    if (!this.botId) return;

    this.loading = true;
    this.botService.getBotPerformance(this.botId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (performance) => {
          this.performance = performance;
          this.prepareChartData();
          this.loading = false;
          this.error = null;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load performance data';
          this.loading = false;
        }
      });
  }

  prepareChartData(): void {
    if (!this.performance) return;

    // Prepare trade distribution data
    this.tradeDistributionData = [
      { name: 'Winning', value: this.performance.winning_trades },
      { name: 'Losing', value: this.performance.losing_trades }
    ];
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

  getRiskLevel(): string {
    if (!this.performance) return 'unknown';
    
    if (this.performance.win_rate >= 60) return 'low';
    if (this.performance.win_rate >= 45) return 'medium';
    return 'high';
  }

  getRiskLevelColor(): string {
    const level = this.getRiskLevel();
    switch (level) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      default: return '#999';
    }
  }

  getPerformanceRating(): string {
    if (!this.performance) return 'N/A';
    
    if (this.performance.win_rate >= 65 && this.performance.total_pnl_pct > 10) return 'Excellent';
    if (this.performance.win_rate >= 55 && this.performance.total_pnl_pct > 5) return 'Good';
    if (this.performance.win_rate >= 45) return 'Fair';
    return 'Poor';
  }

  formatUptime(hours: number): string {
    if (hours < 24) {
      return `${Math.round(hours)}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  refresh(): void {
    this.loadPerformance();
  }
}