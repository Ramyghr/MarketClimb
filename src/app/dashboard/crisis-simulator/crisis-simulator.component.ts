import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { CrisisSimulatorServiceService } from '../../services/crisis-simulator.service.service';
import { CrisisSimulatorStateService } from '../../services/crisis-simulator-state.service';
import * as CrisisTypes from './crisis-simulator.interfaces';

@Component({
  selector: 'app-crisis-simulator',
  templateUrl: './crisis-simulator.component.html',
  styleUrls: ['./crisis-simulator.component.css']
})
export class CrisisSimulatorComponent implements OnInit, OnDestroy {
  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Simulation State
  activeSimulation: CrisisTypes.Simulation | null = null;
  participantStats: CrisisTypes.ParticipantStats | null = null;
  leaderboard: CrisisTypes.Leaderboard | null = null;
  orders: CrisisTypes.Order[] = [];
  
  // Crisis Data
  crisisTypes: CrisisTypes.CrisisTypeInfo[] = [];
  crisisSymbols: CrisisTypes.CrisisSymbolsResponse | null = null;
  availableAssets: any[] = [];
  selectedSymbol: CrisisTypes.SymbolInfo | null = null;
  marketData: CrisisTypes.MarketData | null = null;
  participants: CrisisTypes.Participant[] = [];
  simulationTimeline: any[] = [];

  // UI State
  activeTab: 'trading' | 'orders' | 'leaderboard' | 'info' | 'participants' = 'trading';
  showJoinModal = false;
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

  // Join Form
  joinForm = {
    initialCash: 100000
  };

  // Filters
  orderStatusFilter: string = '';

  // UPDATED CONSTRUCTOR
  constructor(
    public crisisService: CrisisSimulatorServiceService,
    private router: Router,
    private stateService: CrisisSimulatorStateService
  ) {}

  ngOnInit() {
    // Initialize state service with current simulation
    this.stateService.loadActiveSimulation().subscribe();
    
    // Subscribe to state changes
    this.subscriptions.push(
      this.stateService.activeSimulation$.subscribe((sim: any) => {
        this.activeSimulation = sim;
      }),
      this.stateService.participantStats$.subscribe((stats: any) => {
        this.participantStats = stats;
      })
    );
    
    this.loadCrisisTypes();
    this.startAutoRefresh();
    
    // Also load the simulation data directly for backwards compatibility
    this.loadActiveSimulation();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stateService.stopAutoRefresh();
  }

  // ============================================================================
  // DATA LOADING - MATCHING BACKEND ENDPOINTS
  // ============================================================================

  loadActiveSimulation() {
    this.isLoading = true;
    this.crisisService.getActiveSimulation().subscribe({
      next: (simulation) => {
        this.activeSimulation = simulation;
        this.isLoading = false;

        if (simulation) {
          // Load crisis symbols and assets
          this.loadCrisisSymbols(simulation.crisis_type);
          this.loadAssets(simulation.crisis_type);
          
          if (simulation.status === 'active' || simulation.status === 'ACTIVE') {
            this.loadParticipantData();
            this.loadParticipants();
            this.loadSimulationTimeline(simulation.id);
          } else if (simulation.status === 'pending' || simulation.status === 'PENDING') {
            // Check if user already joined
            this.crisisService.getMyStats().subscribe({
              next: (stats) => {
                this.participantStats = stats;
              },
              error: () => {
                // User hasn't joined yet - that's OK
                this.participantStats = null;
              }
            });
          }
        }
      },
      error: (error) => {
        console.error('Error loading simulation:', error);
        this.errorMessage = 'Failed to load simulation';
        this.isLoading = false;
      }
    });
  }

  loadParticipantData() {
    // Load stats
    this.crisisService.getMyStats().subscribe({
      next: (stats) => {
        this.participantStats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        // If stats fail, user might not be a participant
        this.participantStats = null;
      }
    });

    // Load orders
    this.loadOrders();

    // Load leaderboard
    this.loadLeaderboard();
  }

  loadOrders(statusFilter?: string) {
    this.crisisService.getOrders(statusFilter, 50).subscribe({
      next: (orders) => {
        this.orders = orders;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.orders = [];
      }
    });
  }

  loadLeaderboard() {
    this.crisisService.getLeaderboard(50).subscribe({
      next: (leaderboard) => {
        this.leaderboard = leaderboard;
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
      }
    });
  }

  loadCrisisTypes() {
    this.crisisService.getCrisisTypes().subscribe({
      next: (types) => {
        this.crisisTypes = types;
      },
      error: (error) => {
        console.error('Error loading crisis types:', error);
      }
    });
  }

  loadCrisisSymbols(crisisType: string) {
    this.crisisService.getCrisisSymbols(crisisType).subscribe({
      next: (response) => {
        this.crisisSymbols = response;
        this.availableAssets = response.symbols;
        if (this.availableAssets.length > 0 && !this.selectedSymbol) {
          this.selectSymbol(this.availableAssets[0]);
        }
      },
      error: (error) => {
        console.error('Error loading crisis symbols:', error);
      }
    });
  }

  loadAssets(crisisType: string) {
    this.crisisService.getAssets(crisisType).subscribe({
      next: (assets) => {
        // Store assets if needed
        console.log('Available assets:', assets);
      },
      error: (error) => {
        console.error('Error loading assets:', error);
      }
    });
  }

  loadParticipants() {
    if (!this.activeSimulation) return;
    
    this.crisisService.getParticipants(this.activeSimulation.id).subscribe({
      next: (participants) => {
        this.participants = participants;
      },
      error: (error) => {
        console.error('Error loading participants:', error);
      }
    });
  }

  loadSimulationTimeline(simulationId: number) {
    this.crisisService.getSimulationTimeline(simulationId).subscribe({
      next: (timeline) => {
        this.simulationTimeline = timeline;
      },
      error: (error) => {
        console.error('Error loading timeline:', error);
      }
    });
  }

  selectSymbol(symbol: CrisisTypes.SymbolInfo) {
    this.selectedSymbol = symbol;
    this.orderForm.symbol = symbol.symbol;
    this.loadMarketData(symbol.symbol);
    this.showSymbolSelector = false;
  }

  loadMarketData(symbol: string) {
    if (!symbol) return;
    
    this.crisisService.getMarketData(symbol).subscribe({
      next: (data) => {
        this.marketData = data;
      },
      error: (error) => {
        console.error('Error loading market data:', error);
        this.marketData = null;
      }
    });
  }

  // ============================================================================
  // AUTO-REFRESH
  // ============================================================================

  startAutoRefresh() {
    // Start state service auto-refresh
    this.stateService.startAutoRefresh();
    
    // Also keep existing auto-refresh for backwards compatibility
    const statsSub = interval(2000).subscribe(() => {
      if (this.activeSimulation?.status === 'active' && this.participantStats) {
        this.crisisService.getMyStats().subscribe({
          next: (stats) => {
            this.participantStats = stats;
          },
          error: () => {}
        });
      }
    });

    const leaderboardSub = interval(5000).subscribe(() => {
      if (this.activeSimulation?.status === 'active' && this.activeTab === 'leaderboard') {
        this.loadLeaderboard();
      }
    });

    const marketSub = interval(1000).subscribe(() => {
      if (this.selectedSymbol && this.activeSimulation?.status === 'active' && this.activeTab === 'trading') {
        this.loadMarketData(this.selectedSymbol.symbol);
      }
    });

    const simSub = interval(3000).subscribe(() => {
      this.crisisService.getActiveSimulation().subscribe({
        next: (simulation) => {
          const previousStatus = this.activeSimulation?.status;
          this.activeSimulation = simulation;
          
          // If simulation just started or changed status, reload data
          if (simulation && previousStatus !== simulation.status) {
            this.loadParticipantData();
            if (simulation.status === 'active') {
              this.loadCrisisSymbols(simulation.crisis_type);
              this.loadParticipants();
            }
          }
        },
        error: () => {}
      });
    });

    const participantsSub = interval(10000).subscribe(() => {
      if (this.activeSimulation?.status === 'active' && this.activeTab === 'participants') {
        this.loadParticipants();
      }
    });

    this.subscriptions.push(statsSub, leaderboardSub, marketSub, simSub, participantsSub);
  }

  // ============================================================================
  // SIMULATION ACTIONS - MATCHING BACKEND ENDPOINTS
  // ============================================================================

  joinSimulation() {
    if (!this.activeSimulation) return;

    this.isLoading = true;
    this.errorMessage = '';
    
    this.crisisService.joinSimulation(this.activeSimulation.id, this.joinForm.initialCash).subscribe({
      next: (response) => {
        this.showJoinModal = false;
        this.successMessage = 'Successfully joined simulation!';
        this.isLoading = false;
        
        // NAVIGATE TO TRADING COMPONENT
        this.router.navigate(['/dashboard/crisis-simulator/trading']);
        
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error joining simulation:', error);
        this.errorMessage = error.error?.detail || 'Failed to join simulation';
        this.isLoading = false;
      }
    });
  }

  leaveSimulation() {
    if (!this.activeSimulation) return;

    if (!confirm('Are you sure you want to leave this simulation? You will no longer be able to trade.')) return;

    this.crisisService.leaveSimulation(this.activeSimulation.id).subscribe({
      next: (response) => {
        this.participantStats = null;
        this.orders = [];
        this.successMessage = 'Successfully left simulation';
        this.loadActiveSimulation();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error leaving simulation:', error);
        this.errorMessage = error.error?.detail || 'Failed to leave simulation';
      }
    });
  }

  // ============================================================================
  // TRADING ACTIONS - MATCHING BACKEND ENDPOINTS
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

    this.isLoading = true;
    
    // Prepare order data matching PlaceOrderRequest interface
    const orderData: CrisisTypes.PlaceOrderRequest = {
      symbol: this.orderForm.symbol,
      side: this.orderForm.side,
      quantity: this.orderForm.quantity,
      order_type: this.orderForm.order_type,
      limit_price: this.orderForm.order_type === 'LIMIT' ? this.orderForm.limit_price : null,
      stop_price: this.orderForm.order_type === 'STOP' ? this.orderForm.stop_price : null
    };

    this.crisisService.placeOrder(orderData).subscribe({
      next: (order) => {
        this.showOrderModal = false;
        this.resetOrderForm();
        this.successMessage = `Order placed successfully!`;
        this.loadOrders();
        this.loadParticipantData();
        this.isLoading = false;
        this.errorMessage = '';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error placing order:', error);
        this.errorMessage = error.error?.detail || 'Failed to place order';
        this.isLoading = false;
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
        this.errorMessage = `Insufficient cash. Available: $${this.crisisService.formatCurrency(this.participantStats.current_cash)}, Required: $${this.crisisService.formatCurrency(estimatedCost)}`;
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

    this.crisisService.cancelOrder(orderId).subscribe({
      next: (response) => {
        this.successMessage = 'Order cancelled successfully';
        this.loadOrders();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error cancelling order:', error);
        this.errorMessage = error.error?.detail || 'Failed to cancel order';
      }
    });
  }

  // ============================================================================
  // NAVIGATION & STATE HELPERS
  // ============================================================================

  goToTrading() {
    this.router.navigate(['/dashboard/crisis-simulator/trading']);
  }

  setActiveTab(tab: 'trading' | 'orders' | 'leaderboard' | 'info' | 'participants') {
    this.activeTab = tab;
    
    // Load data when switching to certain tabs
    if (tab === 'orders') {
      this.loadOrders(this.orderStatusFilter);
    } else if (tab === 'leaderboard') {
      this.loadLeaderboard();
    } else if (tab === 'participants') {
      this.loadParticipants();
    }
  }

  toggleSymbolSelector() {
    this.showSymbolSelector = !this.showSymbolSelector;
  }

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  getStatusColor(status: string): string {
    return this.crisisService.getOrderStatusColor(status) || '#6b7280';
  }
  

  decrementQuantity(amount: number) {
    this.orderForm.quantity = Math.max(1, this.orderForm.quantity - amount);
  }

  incrementQuantity(amount: number) {
    this.orderForm.quantity += amount;
  }

  getUserInitial(userId: number): string {
    return userId.toString().charAt(0);
  }
  
  getSimulationStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': '#f59e0b',
      'PENDING': '#f59e0b',
      'active': '#10b981',
      'ACTIVE': '#10b981',
      'paused': '#f59e0b',
      'PAUSED': '#f59e0b',
      'completed': '#3b82f6',
      'COMPLETED': '#3b82f6',
      'cancelled': '#6b7280',
      'CANCELLED': '#6b7280'
    };
    return colors[status] || '#6b7280';
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

  get canTrade(): boolean {
    return !!(this.activeSimulation?.status === 'active' && this.participantStats);
  }

  get canJoin(): boolean {
    return !!(this.activeSimulation?.status === 'pending' && !this.participantStats);
  }

  get canGoToTrading(): boolean {
    return !!(this.activeSimulation?.status === 'active' && this.participantStats);
  }

  get simulationProgress(): number {
    if (!this.activeSimulation?.progress_percentage) return 0;
    return Math.round(this.activeSimulation.progress_percentage);
  }

  selectSymbolAndTrade(symbol: string) {
    const foundSymbol = this.availableAssets.find(s => s.symbol === symbol);
    if (foundSymbol) {
      this.selectSymbol(foundSymbol);
      this.setActiveTab('trading');
    }
  }

  getCrisisIcon(crisisType: string): string {
    const icons: { [key: string]: string } = {
      'great_depression': '📉',
      'black_monday': '⚫',
      'dotcom_bubble': '💻',
      'financial_crisis_2008': '🏦',
      'covid_crash': '🦠',
      'asian_financial_crisis': '🌏',
      'european_debt_crisis': '🇪🇺'
    };
    return icons[crisisType] || '📊';
  }

  getOrderTypeDisplay(orderType: string): string {
    const types: { [key: string]: string } = {
      'MARKET': 'Market',
      'LIMIT': 'Limit',
      'STOP': 'Stop'
    };
    return types[orderType] || orderType;
  }

  // Format helper methods using service
  formatCurrency(value: number): string {
    return this.crisisService.formatCurrency(value);
  }

  formatLargeCurrency(value: number): string {
    return this.crisisService.formatLargeCurrency(value);
  }

  formatPercentage(value: number): string {
    return this.crisisService.formatPercentage(value);
  }

  formatDateTime(dateString: string): string {
    return this.crisisService.formatDateTime(dateString);
  }

  formatRelativeTime(dateString: string): string {
    return this.crisisService.formatRelativeTime(dateString);
  }

  getRankDisplay(rank: number | null): string {
    if (rank === null) return '-';
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
    this.stateService.clearError();
  }

  refreshAllData() {
    this.loadActiveSimulation();
    this.stateService.loadActiveSimulation().subscribe();
    this.successMessage = 'Data refreshed!';
    setTimeout(() => this.successMessage = '', 2000);
  }
}