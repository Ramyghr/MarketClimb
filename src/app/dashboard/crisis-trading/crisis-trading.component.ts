import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CrisisSimulatorStateService } from '../../services/crisis-simulator-state.service';
import { CrisisSimulatorServiceService } from '../../services/crisis-simulator.service.service';
import * as CrisisTypes from '../crisis-simulator/crisis-simulator.interfaces';

@Component({
  selector: 'app-crisis-trading',
  templateUrl: './crisis-trading.component.html',
  styleUrls: ['./crisis-trading.component.css']
})
export class CrisisTradingComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private marketDataRefreshSubscription?: Subscription;
  private statsRefreshSubscription?: Subscription;
  private leaderboardRefreshSubscription?: Subscription;

  // State from service
  activeSimulation: CrisisTypes.Simulation | null = null;
  participantStats: CrisisTypes.ParticipantStats | null = null;
  leaderboard: CrisisTypes.Leaderboard | null = null;
  orders: CrisisTypes.Order[] = [];
  crisisSymbols: CrisisTypes.CrisisSymbolsResponse | null = null;
  selectedSymbol: CrisisTypes.SymbolInfo | null = null;
  marketData: CrisisTypes.MarketData | null = null;
  availableAssets: CrisisTypes.SymbolInfo[] = [];
  
  // UI State
  activeTab: 'trading' | 'orders' | 'leaderboard' | 'portfolio' = 'trading';
  showOrderModal = false;
  showSymbolSelector = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Order Form
  orderForm: CrisisTypes.PlaceOrderRequest = {
    symbol: '',
    side: 'BUY',
    quantity: 1,
    order_type: 'MARKET',
    limit_price: null,
    stop_price: null
  };

  // Filters
  orderStatusFilter: string = '';

  constructor(
    public stateService: CrisisSimulatorStateService,
    public crisisService: CrisisSimulatorServiceService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if can trade, otherwise redirect
    if (!this.stateService.canTrade) {
      this.router.navigate(['/dashboard/crisis-simulator']);
      return;
    }

    // Subscribe to state
    this.subscriptions.push(
      this.stateService.activeSimulation$.subscribe((sim: any) => {
        this.activeSimulation = sim;
        
        // If simulation ended, redirect to overview
        if (sim && sim.status !== 'active' && sim.status !== 'ACTIVE') {
          this.router.navigate(['/dashboard/crisis-simulator']);
        }
      }),
      
      this.stateService.participantStats$.subscribe((stats: any) => {
        this.participantStats = stats;
        
        // If user left simulation, redirect
        if (!stats) {
          this.router.navigate(['/dashboard/crisis-simulator']);
        }
      }),
      
      this.stateService.orders$.subscribe((orders: any) => {
        this.orders = orders;
      }),
      
      this.stateService.leaderboard$.subscribe((leaderboard: any) => {
        this.leaderboard = leaderboard;
      }),
      
      this.stateService.crisisSymbols$.subscribe((symbols: any) => {
        this.crisisSymbols = symbols;
        this.availableAssets = symbols?.symbols || [];
      }),
      
      this.stateService.selectedSymbol$.subscribe((symbol: any) => {
        this.selectedSymbol = symbol;
        if (symbol) {
          this.orderForm.symbol = symbol.symbol;
          this.startMarketDataRefresh(symbol.symbol);
        } else {
          this.stopMarketDataRefresh();
        }
      }),
      
      this.stateService.marketData$.subscribe((data: any) => {
        this.marketData = data;
      }),
      
      this.stateService.isLoading$.subscribe((loading: any) => {
        this.isLoading = loading;
      }),
      
      this.stateService.error$.subscribe((error: any) => {
        this.errorMessage = error;
      })
    );

    // Load initial data
    this.stateService.loadOrders();
    this.stateService.loadLeaderboard();

    // Start auto-refresh for stats and leaderboard
    this.startStatsRefresh();
    this.startLeaderboardRefresh();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stopMarketDataRefresh();
    this.stopStatsRefresh();
    this.stopLeaderboardRefresh();
  }

  // ============================================================================
  // AUTO-REFRESH MECHANISMS - NEW
  // ============================================================================

  private startMarketDataRefresh(symbol: string) {
    this.stopMarketDataRefresh();
    
    // Refresh market data every 2 seconds
    this.marketDataRefreshSubscription = interval(2000).pipe(
      switchMap(() => this.crisisService.getMarketData(symbol))
    ).subscribe({
      next: (data) => {
        this.stateService.updateMarketData(data);
      },
      error: (error) => {
        console.error('Error refreshing market data:', error);
      }
    });

    // Initial load
    this.crisisService.getMarketData(symbol).subscribe({
      next: (data) => {
        this.stateService.updateMarketData(data);
      },
      error: (error) => {
        console.error('Error loading market data:', error);
      }
    });
  }

  private stopMarketDataRefresh() {
    if (this.marketDataRefreshSubscription) {
      this.marketDataRefreshSubscription.unsubscribe();
      this.marketDataRefreshSubscription = undefined;
    }
  }

  private startStatsRefresh() {
    this.stopStatsRefresh();
    
    // Refresh participant stats every 3 seconds
    this.statsRefreshSubscription = interval(3000).pipe(
      switchMap(() => this.crisisService.getMyStats())
    ).subscribe({
      next: (stats) => {
        this.stateService.updateParticipantStats(stats);
      },
      error: (error) => {
        console.error('Error refreshing stats:', error);
      }
    });
  }

  private stopStatsRefresh() {
    if (this.statsRefreshSubscription) {
      this.statsRefreshSubscription.unsubscribe();
      this.statsRefreshSubscription = undefined;
    }
  }

  private startLeaderboardRefresh() {
    this.stopLeaderboardRefresh();
    
    // Refresh leaderboard every 5 seconds
    this.leaderboardRefreshSubscription = interval(5000).pipe(
      switchMap(() => this.crisisService.getLeaderboard())
    ).subscribe({
      next: (leaderboard) => {
        this.stateService.updateLeaderboard(leaderboard);
      },
      error: (error) => {
        console.error('Error refreshing leaderboard:', error);
      }
    });
  }

  private stopLeaderboardRefresh() {
    if (this.leaderboardRefreshSubscription) {
      this.leaderboardRefreshSubscription.unsubscribe();
      this.leaderboardRefreshSubscription = undefined;
    }
  }

  // ============================================================================
  // TRADING ACTIONS - ENHANCED
  // ============================================================================

  openOrderModal() {
    if (!this.selectedSymbol) {
      this.errorMessage = 'Please select a symbol first';
      return;
    }
    if (!this.canTrade) {
      this.errorMessage = 'Trading is not available';
      return;
    }
    this.orderForm.symbol = this.selectedSymbol.symbol;
    this.showOrderModal = true;
  }

  placeOrder() {
    if (!this.validateOrder()) return;

    const orderData: CrisisTypes.PlaceOrderRequest = {
      symbol: this.orderForm.symbol,
      side: this.orderForm.side,
      quantity: this.orderForm.quantity,
      order_type: this.orderForm.order_type,
      limit_price: this.orderForm.order_type === 'LIMIT' ? this.orderForm.limit_price : null,
      stop_price: this.orderForm.order_type === 'STOP' ? this.orderForm.stop_price : null
    };

    this.stateService.placeOrder(orderData).subscribe({
      next: () => {
        this.showOrderModal = false;
        this.resetOrderForm();
        this.successMessage = 'Order placed successfully!';
        setTimeout(() => this.successMessage = '', 3000);
        
        // Refresh orders and stats immediately after placing order
        this.stateService.loadOrders(this.orderStatusFilter);
        this.crisisService.getMyStats().subscribe({
          next: (stats) => {
            this.stateService.updateParticipantStats(stats);
          }
        });
      },
      error: () => {
        // Error handled by state service
      }
    });
  }

  validateOrder(): boolean {
    if (!this.orderForm.symbol) {
      this.errorMessage = 'Symbol is required';
      return false;
    }
    if (this.orderForm.quantity <= 0) {
      this.errorMessage = 'Quantity must be greater than 0';
      return false;
    }
    if (!Number.isInteger(this.orderForm.quantity)) {
      this.errorMessage = 'Quantity must be a whole number';
      return false;
    }
    if (this.orderForm.order_type === 'LIMIT') {
      if (!this.orderForm.limit_price || this.orderForm.limit_price <= 0) {
        this.errorMessage = 'Valid limit price is required for limit orders';
        return false;
      }
    }
    if (this.orderForm.order_type === 'STOP') {
      if (!this.orderForm.stop_price || this.orderForm.stop_price <= 0) {
        this.errorMessage = 'Valid stop price is required for stop orders';
        return false;
      }
    }
    
    // Validate sufficient cash for buy orders
    if (this.orderForm.side === 'BUY' && this.participantStats) {
      const estimatedCost = this.calculateEstimatedCost();
      if (estimatedCost > this.participantStats.current_cash) {
        this.errorMessage = `Insufficient cash. Available: ${this.formatCurrency(this.participantStats.current_cash)}, Required: ${this.formatCurrency(estimatedCost)}`;
        return false;
      }
    }
    
    return true;
  }

  resetOrderForm() {
    this.orderForm = {
      symbol: this.selectedSymbol?.symbol || '',
      side: 'BUY',
      quantity: 1,
      order_type: 'MARKET',
      limit_price: null,
      stop_price: null
    };
  }

  cancelOrder(orderId: number) {
    if (!confirm('Cancel this order?')) return;

    this.stateService.cancelOrder(orderId).subscribe({
      next: () => {
        this.successMessage = 'Order cancelled successfully';
        setTimeout(() => this.successMessage = '', 3000);
        
        // Refresh orders immediately
        this.stateService.loadOrders(this.orderStatusFilter);
      },
      error: () => {
        // Error handled by state service
      }
    });
  }

  // ============================================================================
  // SYMBOL SELECTION - ENHANCED
  // ============================================================================

  selectSymbol(symbol: CrisisTypes.SymbolInfo) {
    this.stateService.selectSymbol(symbol);
    this.showSymbolSelector = false;
    
    // Market data refresh will start automatically via the selectedSymbol$ subscription
  }

  toggleSymbolSelector() {
    this.showSymbolSelector = !this.showSymbolSelector;
  }

  // ============================================================================
  // TAB NAVIGATION - ENHANCED
  // ============================================================================

  setActiveTab(tab: 'trading' | 'orders' | 'leaderboard' | 'portfolio') {
    this.activeTab = tab;
    
    if (tab === 'orders') {
      this.stateService.loadOrders(this.orderStatusFilter);
    } else if (tab === 'leaderboard') {
      this.stateService.loadLeaderboard();
    } else if (tab === 'portfolio') {
      // Refresh stats when viewing portfolio
      this.crisisService.getMyStats().subscribe({
        next: (stats) => {
          this.stateService.updateParticipantStats(stats);
        }
      });
    }
  }

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  get canTrade(): boolean {
    return this.stateService.canTrade;
  }

  get simulationProgress(): number {
    if (!this.activeSimulation?.progress_percentage) return 0;
    return Math.round(this.activeSimulation.progress_percentage);
  }

  calculateEstimatedCost(): number {
    if (!this.marketData || !this.orderForm.quantity) return 0;
    
    let price = this.marketData.current_price;
    
    if (this.orderForm.order_type === 'LIMIT' && this.orderForm.limit_price) {
      price = this.orderForm.limit_price;
    } else if (this.orderForm.order_type === 'STOP' && this.orderForm.stop_price) {
      price = this.orderForm.stop_price;
    }
    
    const cost = price * this.orderForm.quantity;
    const commissionRate = this.crisisSymbols?.trading_constraints?.commission_rate || 0.001;
    const commission = cost * commissionRate;
    
    return this.orderForm.side === 'BUY' ? cost + commission : cost - commission;
  }

  incrementQuantity(amount: number) {
    this.orderForm.quantity += amount;
  }

  decrementQuantity(amount: number) {
    this.orderForm.quantity = Math.max(1, this.orderForm.quantity - amount);
  }

  getStatusColor(status: string): string {
    return this.crisisService.getOrderStatusColor(status) || '#6b7280';
  }

  getOrderTypeDisplay(orderType: string): string {
    const types: { [key: string]: string } = {
      'MARKET': 'Market',
      'LIMIT': 'Limit',
      'STOP': 'Stop'
    };
    return types[orderType] || orderType;
  }

  getRankDisplay(rank: number | null): string {
    if (rank === null) return '-';
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  formatCurrency(value: number): string {
    return this.crisisService.formatCurrency(value);
  }

  formatLargeCurrency(value: number): string {
    return this.crisisService.formatLargeCurrency(value);
  }

  formatPercentage(value: number): string {
    return this.crisisService.formatPercentage(value);
  }

  formatRelativeTime(dateString: string): string {
    return this.crisisService.formatRelativeTime(dateString);
  }

  formatDateTime(dateString: string): string {
    return this.crisisService.formatDateTime(dateString);
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
    this.stateService.clearError();
  }

  backToOverview() {
    this.router.navigate(['/dashboard/crisis-simulator']);
  }
}