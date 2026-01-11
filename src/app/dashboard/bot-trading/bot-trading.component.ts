// ============================================
// FILE 1: bot-trading.component.ts
// ============================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { 
  BotTradingService, 
  Bot, 
  BotStatus, 
  BotStrategyType,
  StrategyTemplate,
  SystemStatus 
} from '../../services/bot-trading.service';

@Component({
  selector: 'app-bot-trading',
  templateUrl: './bot-trading.component.html',
  styleUrls: ['./bot-trading.component.scss']
})
export class BotTradingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State
  bots: Bot[] = [];
  filteredBots: Bot[] = [];
  selectedBot: Bot | null = null;
  systemStatus: SystemStatus | null = null;
  strategyTemplates: StrategyTemplate[] = [];
  selectedTabIndex = 0;
  
  // UI State
  loading = false;
  error: string | null = null;
  showCreateModal = false;
  showStrategyPicker = false;
  selectedView: 'overview' | 'performance' | 'trades' | 'logs' | 'backtest' = 'overview';
  
  // Filters
  statusFilter: BotStatus | 'ALL' = 'ALL';
  searchQuery = '';
  sortBy: 'name' | 'created_at' | 'pnl' | 'trades' = 'created_at';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Stats
  stats = {
    total: 0,
    active: 0,
    paused: 0,
    stopped: 0,
    totalPnL: 0,
    totalTrades: 0,
    winRate: 0
  };

  // Enums for template
  BotStatus = BotStatus;
  BotStrategyType = BotStrategyType;

  constructor(
    private botService: BotTradingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBots();
    this.loadSystemStatus();
    this.loadStrategyTemplates();
    
    // Start auto-refresh every 10 seconds
    this.botService.startAutoRefresh(10000);

    // Subscribe to real-time updates
    this.botService.bots$
      .pipe(takeUntil(this.destroy$))
      .subscribe(bots => {
        this.bots = bots;
        this.applyFilters();
        this.calculateStats();
      });

    this.botService.systemStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.systemStatus = status;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.botService.stopAutoRefresh();
  }

  // ==================== Data Loading ====================

  loadBots(): void {
    this.loading = true;
    this.error = null;

    this.botService.getBots()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.bots = response.bots;
          this.applyFilters();
          this.calculateStats();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load bots: ' + err.message;
          this.loading = false;
        }
      });
  }

  loadSystemStatus(): void {
    this.botService.getSystemStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          this.systemStatus = status;
        },
        error: (err) => {
          console.error('Failed to load system status:', err);
        }
      });
  }

  loadStrategyTemplates(): void {
    this.botService.getStrategyTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (templates) => {
          this.strategyTemplates = templates;
        },
        error: (err) => {
          console.error('Failed to load strategy templates:', err);
        }
      });
  }

  // ==================== Filtering & Sorting ====================

  applyFilters(): void {
    let filtered = [...this.bots];

    // Status filter
    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(bot => bot.status === this.statusFilter);
    }

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(bot =>
        bot.name.toLowerCase().includes(query) ||
        bot.symbol.toLowerCase().includes(query) ||
        bot.strategy_type.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (this.sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'pnl':
          aVal = a.total_pnl;
          bVal = b.total_pnl;
          break;
        case 'trades':
          aVal = a.total_trades;
          bVal = b.total_trades;
          break;
        default:
          return 0;
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.filteredBots = filtered;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  onSortChange(sortBy: 'name' | 'created_at' | 'pnl' | 'trades'): void {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'desc';
    }
    this.applyFilters();
  }

  // ==================== Stats Calculation ====================

  calculateStats(): void {
    this.stats = {
      total: this.bots.length,
      active: this.bots.filter(b => b.status === BotStatus.ACTIVE).length,
      paused: this.bots.filter(b => b.status === BotStatus.PAUSED).length,
      stopped: this.bots.filter(b => b.status === BotStatus.STOPPED).length,
      totalPnL: this.bots.reduce((sum, b) => sum + b.total_pnl, 0),
      totalTrades: this.bots.reduce((sum, b) => sum + b.total_trades, 0),
      winRate: this.calculateOverallWinRate()
    };
  }

  calculateOverallWinRate(): number {
    const totalTrades = this.bots.reduce((sum, b) => sum + b.total_trades, 0);
    const winningTrades = this.bots.reduce((sum, b) => sum + b.winning_trades, 0);
    return totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  }

  // ==================== Bot Actions ====================

  selectBot(bot: Bot): void {
    this.selectedBot = bot;
    this.selectedView = 'overview';
  }

  startBot(bot: Bot): void {
    if (bot.strategy_type === BotStrategyType.RAPID_TEST) {
      this.botService.startRapidTestBot(bot.id)
        .subscribe({
          next: () => {
            this.showSuccess(`Bot "${bot.name}" started successfully`);
            this.loadBots();
          },
          error: (err) => {
            this.showError(`Failed to start bot: ${err.message}`);
          }
        });
    } else {
      this.botService.startBot(bot.id)
        .subscribe({
          next: () => {
            this.showSuccess(`Bot "${bot.name}" started successfully`);
            this.loadBots();
          },
          error: (err) => {
            this.showError(`Failed to start bot: ${err.message}`);
          }
        });
    }
  }

  pauseBot(bot: Bot): void {
    this.botService.pauseBot(bot.id)
      .subscribe({
        next: () => {
          this.showSuccess(`Bot "${bot.name}" paused`);
          this.loadBots();
        },
        error: (err) => {
          this.showError(`Failed to pause bot: ${err.message}`);
        }
      });
  }

  stopBot(bot: Bot): void {
    if (confirm(`Are you sure you want to stop "${bot.name}"? This will close all open positions.`)) {
      this.botService.stopBot(bot.id)
        .subscribe({
          next: () => {
            this.showSuccess(`Bot "${bot.name}" stopped`);
            this.loadBots();
          },
          error: (err) => {
            this.showError(`Failed to stop bot: ${err.message}`);
          }
        });
    }
  }

  emergencyStop(bot: Bot): void {
    if (confirm(`⚠️ EMERGENCY STOP: This will immediately halt "${bot.name}" and close all positions. Continue?`)) {
      this.botService.emergencyStopBot(bot.id, true)
        .subscribe({
          next: () => {
            this.showSuccess(`Emergency stop executed for "${bot.name}"`);
            this.loadBots();
          },
          error: (err) => {
            this.showError(`Emergency stop failed: ${err.message}`);
          }
        });
    }
  }

  manualExecute(bot: Bot): void {
    this.botService.manuallyExecuteBot(bot.id)
      .subscribe({
        next: () => {
          this.showSuccess(`Bot "${bot.name}" executed manually`);
        },
        error: (err) => {
          this.showError(`Manual execution failed: ${err.message}`);
        }
      });
  }

  deleteBot(bot: Bot): void {
    if (confirm(`Are you sure you want to delete "${bot.name}"? This action cannot be undone.`)) {
      this.botService.deleteBot(bot.id)
        .subscribe({
          next: () => {
            this.showSuccess(`Bot "${bot.name}" deleted`);
            if (this.selectedBot?.id === bot.id) {
              this.selectedBot = null;
            }
            this.loadBots();
          },
          error: (err) => {
            this.showError(`Failed to delete bot: ${err.message}`);
          }
        });
    }
  }

  // ==================== UI Helpers ====================
  onBotUpdated(updatedBot: Bot): void {
  // Update the bot in the local array
  const index = this.bots.findIndex(b => b.id === updatedBot.id);
  if (index !== -1) {
    this.bots[index] = updatedBot;
  }
  
  // Update selected bot
  if (this.selectedBot?.id === updatedBot.id) {
    this.selectedBot = updatedBot;
  }
  
  // Reapply filters and recalculate stats
  this.applyFilters();
  this.calculateStats();
  
  this.showSuccess('Bot updated successfully');
}
  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onBotCreated(): void {
    this.closeCreateModal();
    this.loadBots();
    this.showSuccess('Bot created successfully');
  }

  changeView(view: 'overview' | 'performance' | 'trades' | 'logs' | 'backtest'): void {
    this.selectedView = view;
  }

  getStatusClass(status: BotStatus): string {
    const classes: Record<BotStatus, string> = {
      [BotStatus.ACTIVE]: 'status-active',
      [BotStatus.PAUSED]: 'status-paused',
      [BotStatus.STOPPED]: 'status-stopped',
      [BotStatus.ERROR]: 'status-error'
    };
    return classes[status] || '';
  }

  getStatusIcon(status: BotStatus): string {
    const icons: Record<BotStatus, string> = {
      [BotStatus.ACTIVE]: 'play_circle',
      [BotStatus.PAUSED]: 'pause_circle',
      [BotStatus.STOPPED]: 'stop_circle',
      [BotStatus.ERROR]: 'error'
    };
    return icons[status] || 'help';
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

  showSuccess(message: string): void {
    console.log('Success:', message);
    // TODO: Add MatSnackBar here later
  }

  showError(message: string): void {
    console.error('Error:', message);
    this.error = message;
    setTimeout(() => {
      if (this.error === message) {
        this.error = null;
      }
    }, 5000);
  }

  clearError(): void {
    this.error = null;
  }

  refresh(): void {
    this.loadBots();
    this.loadSystemStatus();
  }
}