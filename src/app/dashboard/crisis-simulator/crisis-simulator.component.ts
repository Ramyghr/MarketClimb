import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap, finalize } from 'rxjs/operators';
import { CrisisSimulatorServiceService } from '../../services/crisis-simulator.service.service';
import { CrisisSimulatorStateService } from '../../services/crisis-simulator-state.service';
import * as CrisisTypes from './crisis-simulator.interfaces';

@Component({
  selector: 'app-crisis-simulator',
  templateUrl: './crisis-simulator.component.html',
  styleUrls: ['./crisis-simulator.component.css']
})
export class CrisisSimulatorComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private statsRefreshSubscription?: Subscription;
  private simulationRefreshSubscription?: Subscription;
  private leaderboardRefreshSubscription?: Subscription;
  private marketDataRefreshSubscription?: Subscription;

  // State from service
  activeSimulation: CrisisTypes.Simulation | null = null;
  participantStats: CrisisTypes.ParticipantStats | null = null;
  leaderboard: CrisisTypes.Leaderboard | null = null;
  orders: CrisisTypes.Order[] = [];
  crisisSymbols: CrisisTypes.CrisisSymbolsResponse | null = null;
  selectedSymbol: CrisisTypes.SymbolInfo | null = null;
  marketData: CrisisTypes.MarketData | null = null;
  
  // Additional data
  crisisTypes: CrisisTypes.CrisisTypeInfo[] = [];
  availableAssets: CrisisTypes.SymbolInfo[] = [];
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

  // Position Management - COMPLETELY REWRITTEN
  openPositions: any[] = []; // Changed to any[] to allow custom properties
  private processingClosures = new Set<number>(); // Track orders being closed

  constructor(
    public crisisService: CrisisSimulatorServiceService,
    public stateService: CrisisSimulatorStateService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('🚀 Crisis Simulator Component Initialized');
    
    // Subscribe to all state changes
    this.subscriptions.push(
      this.stateService.activeSimulation$.subscribe((sim: any) => {
        const previousId = this.activeSimulation?.id;
        this.activeSimulation = sim;
        
        // Clear processing closures if simulation changed
        if (sim && previousId && previousId !== sim.id) {
          console.log('🔄 Simulation changed, clearing closure tracking');
          this.processingClosures.clear();
        }
        
        console.log('📊 Simulation Updated:', sim);
        
        if (sim && sim.crisis_type) {
          console.log('🔍 Loading symbols for crisis:', sim.crisis_type);
          this.stateService.loadCrisisSymbols(sim.crisis_type).subscribe({
            next: (symbols) => console.log('✅ Symbols loaded:', symbols),
            error: (error) => console.error('❌ Error loading symbols:', error)
          });
        }
      }),
      
      this.stateService.participantStats$.subscribe((stats: any) => {
        this.participantStats = stats;
        console.log('💰 Participant stats updated:', stats);
      }),
      
      // CRITICAL: Update open positions whenever orders change
      this.stateService.orders$.subscribe((orders: any) => {
        console.log('📋 Orders updated from backend:', orders?.length || 0);
        this.orders = orders;
        this.updateOpenPositions();
      }),
      
      this.stateService.leaderboard$.subscribe((leaderboard: any) => {
        this.leaderboard = leaderboard;
      }),
      
      this.stateService.crisisSymbols$.subscribe((symbols: any) => {
        console.log('🔍 Crisis Symbols Updated:', symbols);
        this.crisisSymbols = symbols;
        this.availableAssets = symbols?.symbols || [];
      }),
      
      this.stateService.selectedSymbol$.subscribe((symbol: any) => {
        this.selectedSymbol = symbol;
        if (symbol) {
          this.orderForm.symbol = symbol.symbol;
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

    // Load fresh data on init
    this.loadAllFreshData();
    
    // Start auto-refresh
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stopAllRefresh();
    this.processingClosures.clear();
  }

  // ============================================================================
  // FRESH DATA LOADING
  // ============================================================================

  private loadAllFreshData() {
    console.log('🔄 Loading all fresh data from backend...');
    
    this.stateService.loadActiveSimulation().subscribe({
      next: (simulation) => {
        console.log('✅ Active simulation loaded:', simulation);
        
        if (simulation && (simulation.status === 'active' || simulation.status === 'ACTIVE')) {
          // Load all participant data
          this.stateService.loadParticipantStats().subscribe({
            next: (stats) => console.log('✅ Participant stats loaded:', stats),
            error: (err) => console.error('❌ Error loading stats:', err)
          });
          
          // Load orders - THIS IS CRITICAL
          this.stateService.loadOrders().subscribe({
            next: (orders) => console.log('✅ Orders loaded from backend:', orders?.length || 0),
            error: (err) => console.error('❌ Error loading orders:', err)
          });
          
          // Load leaderboard
          this.stateService.loadLeaderboard().subscribe({
            next: () => console.log('✅ Leaderboard loaded'),
            error: (err) => console.error('❌ Error loading leaderboard:', err)
          });
          
          this.loadParticipants();
          this.loadSimulationTimeline(simulation.id);
        }
      },
      error: (error) => console.error('❌ Error loading simulation:', error)
    });
    
    this.loadCrisisTypes();
  }

  // ============================================================================
  // AUTO-REFRESH
  // ============================================================================

  startAutoRefresh() {
    // Refresh simulation every 3 seconds
    this.simulationRefreshSubscription = interval(3000).pipe(
      switchMap(() => this.crisisService.getActiveSimulation())
    ).subscribe({
      next: (simulation) => {
        const previousStatus = this.activeSimulation?.status;
        this.activeSimulation = simulation;
        
        if (simulation && previousStatus !== simulation.status) {
          if (simulation.status === 'active' || simulation.status === 'ACTIVE') {
            this.stateService.loadParticipantStats().subscribe();
            this.stateService.loadOrders().subscribe();
            this.stateService.loadLeaderboard().subscribe();
            this.loadParticipants();
          }
        }
      },
      error: (error) => console.error('Error refreshing simulation:', error)
    });

    // Refresh stats every 2 seconds
    this.statsRefreshSubscription = interval(2000).pipe(
      switchMap(() => {
        if (this.activeSimulation?.status === 'active' && this.participantStats) {
          return this.crisisService.getMyStats();
        }
        return [];
      })
    ).subscribe({
      next: (stats: any) => {
        if (stats) {
          this.stateService.updateParticipantStats(stats);
        }
      },
      error: () => {}
    });

    // Refresh leaderboard every 5 seconds
    this.leaderboardRefreshSubscription = interval(5000).pipe(
      switchMap(() => {
        if (this.activeSimulation?.status === 'active' && this.activeTab === 'leaderboard') {
          return this.crisisService.getLeaderboard();
        }
        return [];
      })
    ).subscribe({
      next: (leaderboard: any) => {
        if (leaderboard) {
          this.stateService.updateLeaderboard(leaderboard);
        }
      },
      error: () => {}
    });

    // Refresh market data every 1 second
    this.marketDataRefreshSubscription = interval(1000).pipe(
      switchMap(() => {
        if (this.selectedSymbol && 
            this.activeSimulation?.status === 'active' && 
            this.activeTab === 'trading') {
          return this.crisisService.getMarketData(this.selectedSymbol.symbol);
        }
        return [];
      })
    ).subscribe({
      next: (data: any) => {
        if (data) {
          this.stateService.updateMarketData(data);
        }
      },
      error: () => {}
    });
  }

  stopAllRefresh() {
    if (this.statsRefreshSubscription) this.statsRefreshSubscription.unsubscribe();
    if (this.simulationRefreshSubscription) this.simulationRefreshSubscription.unsubscribe();
    if (this.leaderboardRefreshSubscription) this.leaderboardRefreshSubscription.unsubscribe();
    if (this.marketDataRefreshSubscription) this.marketDataRefreshSubscription.unsubscribe();
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  loadActiveSimulation() {
    this.stateService.loadActiveSimulation().subscribe({
      next: (simulation) => {
        if (simulation && (simulation.status === 'active' || simulation.status === 'ACTIVE')) {
          this.loadParticipants();
          this.loadSimulationTimeline(simulation.id);
        }
      },
      error: (error) => console.error('Error loading simulation:', error)
    });
  }

  loadOrders(statusFilter?: string) {
    this.stateService.loadOrders(statusFilter).subscribe({
      next: () => {},
      error: (error) => console.error('Error loading orders:', error)
    });
  }

  loadCrisisTypes() {
    this.crisisService.getCrisisTypes().subscribe({
      next: (types) => {
        this.crisisTypes = types;
      },
      error: (error) => console.error('Error loading crisis types:', error)
    });
  }

  loadParticipants() {
    if (!this.activeSimulation) return;
    
    this.crisisService.getParticipants(this.activeSimulation.id).subscribe({
      next: (participants) => {
        this.participants = participants;
      },
      error: (error) => console.error('Error loading participants:', error)
    });
  }

  loadSimulationTimeline(simulationId: number) {
    this.crisisService.getSimulationTimeline(simulationId).subscribe({
      next: (timeline) => {
        this.simulationTimeline = timeline;
      },
      error: (error) => console.error('Error loading timeline:', error)
    });
  }

  // ============================================================================
  // POSITION MANAGEMENT - FIXED LOGIC
  // ============================================================================

  /**
   * Update open positions list - IMPROVED LOGIC
   * Calculates net positions by matching BUY and SELL orders
   */
  /**
 * Update open positions - ADD BACKEND INTEGRATION
 */
updateOpenPositions() {
  if (!this.orders || this.orders.length === 0) {
    this.openPositions = [];
    return;
  }

  // OPTION A: Keep your current order-based calculation for UI
  // [Your existing order calculation logic here...]
  
  // OPTION B: Replace with actual backend positions (RECOMMENDED)
  // Fetch real positions from backend
  this.crisisService.getMyPositions().subscribe({
    next: (backendPositions: any[]) => {
      console.log('📊 Backend positions received:', backendPositions);
      
      // Transform backend positions to match frontend format
      this.openPositions = backendPositions.map(p => ({
        ...p,
        id: p.id, // Position ID, not Order ID
        quantity: Math.abs(p.quantity), // Use absolute quantity
        netQuantity: Math.abs(p.quantity),
        positionType: p.position_type || (p.quantity > 0 ? 'LONG' : 'SHORT'),
        side: p.quantity > 0 ? 'BUY' : 'SELL', // For UI display
        filled_price: p.average_cost, // Use average cost as entry price
        symbol: p.symbol
      }));
      
      console.log('📊 Open positions from backend:', this.openPositions);
    },
    error: (error) => {
      console.error('❌ Error fetching backend positions:', error);
      // Fall back to order-based calculation
      this.calculateOpenPositionsFromOrders();
    }
  });
}

// Add this method AFTER updateOpenPositions() but BEFORE getPositionQuantity()

/**
 * Fallback method: Calculate positions from orders when backend fails
 */
calculateOpenPositionsFromOrders() {
  console.log('🔄 Falling back to order-based position calculation');
  
  if (!this.orders || this.orders.length === 0) {
    this.openPositions = [];
    return;
  }
  
  // Your existing order calculation logic
  const positionsBySymbol = new Map<string, number>();
  const filledOrders = this.orders.filter(order => order.status === 'FILLED');
  
  // Calculate net position for each symbol
  filledOrders.forEach(order => {
    const symbol = order.symbol;
    const current = positionsBySymbol.get(symbol) || 0;
    const newValue = order.side === 'BUY' ? current + order.quantity : current - order.quantity;
    positionsBySymbol.set(symbol, newValue);
  });
  
  // Convert to openPositions array
  this.openPositions = [];
  positionsBySymbol.forEach((netQuantity, symbol) => {
    if (netQuantity !== 0) {
      // Find the most recent order for this symbol
      const recentOrder = this.orders
        .filter(o => o.symbol === symbol && o.status === 'FILLED')
        .sort((a, b) => new Date(b.placed_at_historical).getTime() - new Date(a.placed_at_historical).getTime())[0];
      
      if (recentOrder) {
        const position = {
          ...recentOrder,
          quantity: Math.abs(netQuantity),
          netQuantity: Math.abs(netQuantity),
          positionType: netQuantity > 0 ? 'LONG' : 'SHORT',
          originalSide: recentOrder.side,
          direction: netQuantity > 0 ? 'BUY' : 'SELL'
        };
        this.openPositions.push(position);
      }
    }
  });
  
  console.log('📊 Fallback positions calculated:', this.openPositions.length);
}
getPositionFromBackend(symbol: string): any {
  return this.openPositions?.find(p => p.symbol === symbol);
}
  /**
   * Get net position quantity for a symbol
   */
  getPositionQuantity(symbol: string): number {
    if (!this.orders || this.orders.length === 0) return 0;
    
    const filledOrders = this.orders.filter(o => 
      o.symbol === symbol && 
      o.status === 'FILLED' && 
      !this.processingClosures.has(o.id)
    );
    
    let netQuantity = 0;
    filledOrders.forEach(order => {
      if (order.side === 'BUY') netQuantity += order.quantity;
      if (order.side === 'SELL') netQuantity -= order.quantity;
    });
    
    return Math.abs(netQuantity);
  }

  /**
   * Check if a specific order is part of an open position
   */
  isOrderPartOfOpenPosition(orderId: number): boolean {
    if (!this.orders || this.orders.length === 0) return false;
    
    const order = this.orders.find(o => o.id === orderId);
    if (!order || order.status !== 'FILLED') return false;
    
    // Check if this order's symbol has a net position
    const symbol = order.symbol;
    const filledOrders = this.orders.filter(o => 
      o.symbol === symbol && 
      o.status === 'FILLED' && 
      !this.processingClosures.has(o.id)
    );
    
    let netPosition = 0;
    filledOrders.forEach(o => {
      if (o.side === 'BUY') netPosition += o.quantity;
      if (o.side === 'SELL') netPosition -= o.quantity;
    });
    
    return netPosition !== 0;
  }

  /**
   * Check if order represents an open position
   */
  isPositionOpen(order: CrisisTypes.Order): boolean {
    if (order.status !== 'FILLED') return false;
    if (this.processingClosures.has(order.id)) return false;
    
    const netQuantity = this.getPositionQuantity(order.symbol);
    return netQuantity !== 0;
  }

  /**
   * Check if position is being closed
   */
  isPositionClosing(order: CrisisTypes.Order): boolean {
    return this.processingClosures.has(order.id);
  }

  /**
   * Get all open positions
   */
  getOpenPositions(): any[] {
    return this.openPositions;
  }

  /**
   * Close a single position - FIXED
   */
  /**
 * CLOSE SINGLE POSITION - REWRITTEN FOR BACKEND
 */
closeSinglePosition(order: any) {
  if (!order || !order.symbol) {
    this.showError('Invalid position');
    return;
  }

  // Confirm with user
  const confirmMsg = `Close position for ${order.symbol}?\n\n` +
    `Symbol: ${order.symbol}\n` +
    `Position Type: ${order.positionType || order.side}\n` +
    `Quantity: ${order.quantity}`;
  
  if (!confirm(confirmMsg)) return;

  console.log('🔄 Closing position for symbol:', order.symbol);

  // 1. FIRST get positions from backend
  this.isLoading = true;
  
  this.crisisService.getMyPositions().subscribe({
    next: (positions: any[]) => {
      // 2. Find the position matching this symbol and side
      const matchingPosition = positions.find(p => 
        p.symbol === order.symbol && 
        p.position_type === (order.positionType || order.side)
      );
      
      if (!matchingPosition) {
        this.showError(`No open position found for ${order.symbol}`);
        this.isLoading = false;
        return;
      }
      
      console.log('✅ Found position:', matchingPosition);
      
      // 3. Close using the POSITION ID (not order ID)
      this.processingClosures.add(matchingPosition.id);
      this.updateOpenPositions();
      
      this.stateService.closePosition(matchingPosition.id).pipe(
        finalize(() => {
          this.processingClosures.delete(matchingPosition.id);
          this.isLoading = false;
        })
      ).subscribe({
        next: (response) => {
          console.log('✅ Position closed successfully:', response);
          
          let message = `Position for ${order.symbol} closed successfully`;
          if (response.closing_details?.realized_pnl !== undefined) {
            const pnl = response.closing_details.realized_pnl;
            const pnlColor = pnl >= 0 ? '🟢' : '🔴';
            message += ` ${pnlColor} P&L: ${this.crisisService.formatCurrency(pnl)}`;
          }
          
          this.showSuccess(message);
          this.refreshAllData();
        },
        error: (error) => {
          console.error('❌ Error closing position:', error);
          this.showError(`Failed to close ${order.symbol}: ${error.error?.detail || error.message}`);
          this.refreshAllData();
        }
      });
    },
    error: (error) => {
      console.error('❌ Error fetching positions:', error);
      this.showError('Cannot fetch positions to close');
      this.isLoading = false;
    }
  });
}

  /**
   * Close all open positions - FIXED
   */
  closeAllPositions() {
    if (!this.openPositions || this.openPositions.length === 0) {
      this.showError('No open positions to close');
      return;
    }

    const positionCount = this.openPositions.length;
    const symbols = [...new Set(this.openPositions.map(p => p.symbol))].join(', ');
    const totalValue = this.openPositions.reduce((sum, p) => {
      return sum + (p.filled_price || 0) * (p.quantity || 0);
    }, 0);
    
    const confirmMsg = `⚠️ CLOSE ALL POSITIONS ⚠️\n\n` +
      `Total Positions: ${positionCount}\n` +
      `Symbols: ${symbols}\n` +
      `Estimated Value: ${this.crisisService.formatCurrency(totalValue)}\n\n` +
      `This action cannot be undone.\n\n` +
      `Are you sure?`;
    
    if (!confirm(confirmMsg)) {
      return;
    }

    console.log('🔄 Closing all positions:', {
      count: positionCount,
      orderIds: this.openPositions.map(p => p.id),
      symbols: symbols
    });

    // Mark all as processing
    this.openPositions.forEach(p => this.processingClosures.add(p.id));
    this.updateOpenPositions();
    this.isLoading = true;

    // Call backend to close all positions
    this.stateService.closeAllPositions().pipe(
      finalize(() => {
        // Clear processing set and stop loading
        this.processingClosures.clear();
        this.isLoading = false;
      })
    ).subscribe({
      next: (response) => {
        console.log('✅ All positions closed successfully:', response);
        
        const closedCount = response.positions_closed || positionCount;
        let message = `Successfully closed ${closedCount} position${closedCount !== 1 ? 's' : ''}`;
        
        if (response.total_realized_pnl !== undefined) {
          const pnl = response.total_realized_pnl;
          const pnlColor = pnl >= 0 ? '🟢' : '🔴';
          message += ` ${pnlColor} Total P&L: ${this.crisisService.formatCurrency(pnl)}`;
        }
        
        this.showSuccess(message, 7000);
        
        // Refresh all data from backend
        this.refreshAllData();
      },
      error: (error) => {
        console.error('❌ Error closing all positions:', error);
        
        const errorMsg = error.error?.detail || error.message || 'Failed to close all positions';
        this.showError(`Failed to close positions: ${errorMsg}`);
        
        // Refresh to sync with backend state
        this.refreshAllData();
      }
    });
  }

  /**
   * Refresh all data from backend - IMPROVED
   */
  refreshAllData() {
    console.log('🔄 Refreshing all data from backend...');
    
    let completedCount = 0;
    const totalRefreshes = 3;
    
    const checkComplete = () => {
      completedCount++;
      if (completedCount >= totalRefreshes) {
        console.log('✅ All data refreshed from backend');
      }
    };
    
    // Refresh stats
    this.stateService.loadParticipantStats().subscribe({
      next: () => {
        console.log('✅ Stats refreshed');
        checkComplete();
      },
      error: (err) => {
        console.error('❌ Error refreshing stats:', err);
        checkComplete();
      }
    });
    
    // Refresh orders - CRITICAL
    this.stateService.loadOrders().subscribe({
      next: (orders) => {
        console.log('✅ Orders refreshed:', orders?.length || 0);
        checkComplete();
      },
      error: (err) => {
        console.error('❌ Error refreshing orders:', err);
        checkComplete();
      }
    });
    
    // Refresh leaderboard
    this.stateService.loadLeaderboard().subscribe({
      next: () => {
        console.log('✅ Leaderboard refreshed');
        checkComplete();
      },
      error: (err) => {
        console.error('❌ Error refreshing leaderboard:', err);
        checkComplete();
      }
    });
  }

  /**
   * Calculate total unrealized P&L from backend stats
   */
  getTotalUnrealizedPnl(): number {
    if (!this.participantStats) {
      return 0;
    }

    // Backend should calculate this
    if (this.participantStats.hasOwnProperty('unrealized_pnl')) {
      return (this.participantStats as any).unrealized_pnl || 0;
    }
    
    // Fallback calculation
    const portfolioValue = this.participantStats.current_portfolio_value || 0;
    const cash = this.participantStats.current_cash || 0;
    const totalValue = cash + portfolioValue;
    const initialValue = this.participantStats.initial_value || 0;
    
    return totalValue - initialValue - cash;
  }

  /**
   * Get count of open positions
   */
  getOpenPositionCount(): number {
    return this.openPositions.length;
  }

  /**
   * Check if user has any open positions
   */
  hasOpenPositions(): boolean {
    return this.openPositions.length > 0;
  }

  // ============================================================================
  // SIMULATION ACTIONS
  // ============================================================================

  joinSimulation() {
    if (!this.activeSimulation) return;

    this.stateService.joinSimulation(this.activeSimulation.id, this.joinForm.initialCash).subscribe({
      next: () => {
        this.showJoinModal = false;
        this.showSuccess('Successfully joined simulation!');
        this.router.navigate(['/dashboard/crisis-simulator/trading']);
      },
      error: (error) => {
        console.error('Error joining simulation:', error);
        this.showError(error.error?.detail || 'Failed to join simulation');
      }
    });
  }

  leaveSimulation() {
    if (!this.activeSimulation) return;

    if (!confirm('Are you sure you want to leave this simulation? You will no longer be able to trade.')) return;

    this.stateService.leaveSimulation(this.activeSimulation.id).subscribe({
      next: () => {
        this.showSuccess('Successfully left simulation');
      },
      error: (error) => {
        console.error('Error leaving simulation:', error);
        this.showError(error.error?.detail || 'Failed to leave simulation');
      }
    });
  }

  // ============================================================================
  // TRADING ACTIONS
  // ============================================================================

  openOrderModal() {
    if (!this.selectedSymbol) {
      this.showError('Please select a symbol first');
      return;
    }
    if (!this.canTrade) {
      this.showError('Trading is not available');
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

    console.log('📤 Placing order:', orderData);
    
    this.stateService.placeOrder(orderData).subscribe({
      next: (response) => {
        console.log('✅ Order placed successfully:', response);
        this.showOrderModal = false;
        this.resetOrderForm();
        this.showSuccess('Order placed successfully!');
      },
      error: (error) => {
        console.error('❌ Error placing order:', error);
        this.showError(error.error?.detail || 'Failed to place order');
      }
    });
  }

  validateOrder(): boolean {
    if (!this.orderForm.symbol) {
      this.showError('Symbol is required');
      return false;
    }
    if (this.orderForm.quantity <= 0) {
      this.showError('Quantity must be greater than 0');
      return false;
    }
    if (!Number.isInteger(this.orderForm.quantity)) {
      this.showError('Quantity must be a whole number');
      return false;
    }
    if (this.orderForm.order_type === 'LIMIT') {
      if (!this.orderForm.limit_price || this.orderForm.limit_price <= 0) {
        this.showError('Valid limit price is required for limit orders');
        return false;
      }
    }
    if (this.orderForm.order_type === 'STOP') {
      if (!this.orderForm.stop_price || this.orderForm.stop_price <= 0) {
        this.showError('Valid stop price is required for stop orders');
        return false;
      }
    }
    
    if (this.orderForm.side === 'BUY' && this.participantStats) {
      const estimatedCost = this.calculateEstimatedCost();
      if (estimatedCost > this.participantStats.current_cash) {
        this.showError(`Insufficient cash. Available: ${this.formatCurrency(this.participantStats.current_cash)}, Required: ${this.formatCurrency(estimatedCost)}`);
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
        this.showSuccess('Order cancelled successfully');
      },
      error: (error) => {
        console.error('Error cancelling order:', error);
        this.showError(error.error?.detail || 'Failed to cancel order');
      }
    });
  }

  // ============================================================================
  // SYMBOL SELECTION
  // ============================================================================

  selectSymbol(symbol: CrisisTypes.SymbolInfo) {
    this.stateService.selectSymbol(symbol);
    this.showSymbolSelector = false;
  }

  toggleSymbolSelector() {
    this.showSymbolSelector = !this.showSymbolSelector;
  }

  selectSymbolAndTrade(symbol: string) {
    const foundSymbol = this.availableAssets.find(s => s.symbol === symbol);
    if (foundSymbol) {
      this.selectSymbol(foundSymbol);
      this.setActiveTab('trading');
    }
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  goToTrading() {
    this.router.navigate(['/dashboard/crisis-simulator/trading']);
  }

  setActiveTab(tab: 'trading' | 'orders' | 'leaderboard' | 'info' | 'participants') {
    this.activeTab = tab;
    
    if (tab === 'orders') {
      this.stateService.loadOrders(this.orderStatusFilter).subscribe();
    } else if (tab === 'leaderboard') {
      this.stateService.loadLeaderboard().subscribe();
    } else if (tab === 'participants') {
      this.loadParticipants();
    }
  }

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  get canTrade(): boolean {
    return this.stateService.canTrade;
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

  getUserInitial(userId: number): string {
    return userId.toString().charAt(0);
  }
  
  getStatusColor(status: string): string {
    return this.crisisService.getOrderStatusColor(status) || '#6b7280';
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

  formatDateTime(dateString: string): string {
    return this.crisisService.formatDateTime(dateString);
  }

  formatDate(dateString: string): string {
    return this.crisisService.formatDate(dateString);
  }

  formatRelativeTime(dateString: string): string {
    return this.crisisService.formatRelativeTime(dateString);
  }

  /**
   * Show error message
   */
  showError(message: string, duration: number = 5000) {
    this.errorMessage = message;
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = '';
      }
    }, duration);
  }

  /**
   * Show success message
   */
  showSuccess(message: string, duration: number = 3000) {
    this.successMessage = message;
    setTimeout(() => {
      if (this.successMessage === message) {
        this.successMessage = '';
      }
    }, duration);
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
    this.stateService.clearError();
  }

  /**
   * Manual refresh all data
   */
  refreshAllDataManual() {
    console.log('🔄 User requested manual refresh...');
    
    // Clear processing closures on manual refresh
    this.processingClosures.clear();
    
    // Load all fresh data
    this.loadAllFreshData();
    
    this.showSuccess('Data refreshed from backend!', 2000);
  }
}