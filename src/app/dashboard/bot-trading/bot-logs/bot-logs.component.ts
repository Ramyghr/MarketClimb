// src/app/dashboard/bot-trading/bot-logs/bot-logs.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { BotTradingService, BotLog } from '../../../services/bot-trading.service';

@Component({
  selector: 'app-bot-logs',
  templateUrl: './bot-logs.component.html',
  styleUrls: ['./bot-logs.component.scss']
})
export class BotLogsComponent implements OnInit, OnDestroy {
  @Input() botId!: number;
  
  logs: BotLog[] = [];
  filteredLogs: BotLog[] = [];
  loading = false;
  error: string | null = null;
  
  // Filters
  levelFilter: 'ALL' | 'INFO' | 'WARNING' | 'ERROR' = 'ALL';
  searchQuery = '';
  autoScroll = true;
  
  // Pagination
  pageSize = 50;
  currentPage = 0;
  
  // Stats
  stats = {
    total: 0,
    info: 0,
    warning: 0,
    error: 0
  };
  
  private destroy$ = new Subject<void>();
  private refreshInterval = 5000; // 5 seconds

  constructor(private botService: BotTradingService) {}

  ngOnInit(): void {
    this.loadLogs();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLogs(): void {
    if (!this.botId) return;

    this.loading = true;
    this.error = null;

    this.botService.getBotLogs(this.botId, 500)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.logs = response.logs;
          this.applyFilters();
          this.calculateStats();
          this.loading = false;
          
          if (this.autoScroll) {
            this.scrollToBottom();
          }
        },
        error: (err) => {
          this.error = err.message || 'Failed to load logs';
          this.loading = false;
        }
      });
  }

  startAutoRefresh(): void {
    interval(this.refreshInterval)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.botService.getBotLogs(this.botId, 500))
      )
      .subscribe({
        next: (response) => {
          const hadNewLogs = response.logs.length > this.logs.length;
          this.logs = response.logs;
          this.applyFilters();
          this.calculateStats();
          
          if (this.autoScroll && hadNewLogs) {
            setTimeout(() => this.scrollToBottom(), 100);
          }
        },
        error: (err) => {
          console.error('Auto-refresh error:', err);
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.logs];

    // Level filter
    if (this.levelFilter !== 'ALL') {
      filtered = filtered.filter(log => log.level === this.levelFilter);
    }

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(query) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(query))
      );
    }

    this.filteredLogs = filtered;
  }

  calculateStats(): void {
    this.stats = {
      total: this.logs.length,
      info: this.logs.filter(l => l.level === 'INFO').length,
      warning: this.logs.filter(l => l.level === 'WARNING').length,
      error: this.logs.filter(l => l.level === 'ERROR').length
    };
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  clearLogs(): void {
    if (confirm('Clear all logs from view? (This does not delete logs from the server)')) {
      this.logs = [];
      this.filteredLogs = [];
      this.calculateStats();
    }
  }

  toggleAutoScroll(): void {
    this.autoScroll = !this.autoScroll;
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }

  scrollToBottom(): void {
    try {
      const logsContainer = document.querySelector('.logs-container');
      if (logsContainer) {
        logsContainer.scrollTop = logsContainer.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  scrollToTop(): void {
    try {
      const logsContainer = document.querySelector('.logs-container');
      if (logsContainer) {
        logsContainer.scrollTop = 0;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  getLevelClass(level: string): string {
    switch (level) {
      case 'INFO': return 'level-info';
      case 'WARNING': return 'level-warning';
      case 'ERROR': return 'level-error';
      default: return 'level-default';
    }
  }

  getLevelIcon(level: string): string {
    switch (level) {
      case 'INFO': return 'info';
      case 'WARNING': return 'warning';
      case 'ERROR': return 'error';
      default: return 'help';
    }
  }

  formatDetails(details: any): string {
    if (!details) return '';
    return JSON.stringify(details, null, 2);
  }

  hasDetails(log: BotLog): boolean {
    return log.details !== null && log.details !== undefined;
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Show a brief success message (you can implement a snackbar)
      console.log('Copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  exportLogs(): void {
    if (this.filteredLogs.length === 0) {
      alert('No logs to export');
      return;
    }

    const logsText = this.filteredLogs.map(log => {
      const timestamp = new Date(log.timestamp).toISOString();
      const details = log.details ? `\n  Details: ${JSON.stringify(log.details)}` : '';
      return `[${timestamp}] [${log.level}] ${log.message}${details}`;
    }).join('\n\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bot_${this.botId}_logs_${new Date().toISOString()}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  refresh(): void {
    this.loadLogs();
  }

  getRelativeTime(timestamp: string): string {
    const now = new Date().getTime();
    const logTime = new Date(timestamp).getTime();
    const diffMs = now - logTime;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  trackByLogId(index: number, log: BotLog): number {
    return log.id;
  }
}