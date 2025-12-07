import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CrisisSimulatorServiceService } from './crisis-simulator.service.service';
import * as CrisisTypes from '../dashboard/crisis-simulator/crisis-simulator.interfaces';

/**
 * Centralized state management service for Crisis Simulator
 * Manages shared data between overview and trading components
 */
@Injectable({
  providedIn: 'root'
})
export class CrisisSimulatorStateService {
  // State subjects
  private activeSimulationSubject = new BehaviorSubject<CrisisTypes.Simulation | null>(null);
  private participantStatsSubject = new BehaviorSubject<CrisisTypes.ParticipantStats | null>(null);
  private leaderboardSubject = new BehaviorSubject<CrisisTypes.Leaderboard | null>(null);
  private ordersSubject = new BehaviorSubject<CrisisTypes.Order[]>([]);
  private crisisSymbolsSubject = new BehaviorSubject<CrisisTypes.CrisisSymbolsResponse | null>(null);
  private selectedSymbolSubject = new BehaviorSubject<CrisisTypes.SymbolInfo | null>(null);
  private marketDataSubject = new BehaviorSubject<CrisisTypes.MarketData | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string>('');

  // Public observables
  public activeSimulation$ = this.activeSimulationSubject.asObservable();
  public participantStats$ = this.participantStatsSubject.asObservable();
  public leaderboard$ = this.leaderboardSubject.asObservable();
  public orders$ = this.ordersSubject.asObservable();
  public crisisSymbols$ = this.crisisSymbolsSubject.asObservable();
  public selectedSymbol$ = this.selectedSymbolSubject.asObservable();
  public marketData$ = this.marketDataSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  // Auto-refresh subscriptions
  private refreshSubscriptions: Subscription[] = [];

  constructor(private crisisService: CrisisSimulatorServiceService) {}

  // ============================================================================
  // STATE GETTERS
  // ============================================================================

  get activeSimulation(): CrisisTypes.Simulation | null {
    return this.activeSimulationSubject.value;
  }

  get participantStats(): CrisisTypes.ParticipantStats | null {
    return this.participantStatsSubject.value;
  }

  get hasJoinedSimulation(): boolean {
    return this.participantStatsSubject.value !== null;
  }

  get isSimulationActive(): boolean {
    const sim = this.activeSimulationSubject.value;
    return sim !== null && (sim.status === 'active' || sim.status === 'ACTIVE');
  }

  get canTrade(): boolean {
    return this.isSimulationActive && this.hasJoinedSimulation;
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  loadActiveSimulation(): Observable<CrisisTypes.Simulation | null> {
    this.isLoadingSubject.next(true);
    return this.crisisService.getActiveSimulation().pipe(
      tap({
        next: (simulation) => {
          this.activeSimulationSubject.next(simulation);
          
          if (simulation) {
            // Load related data
            this.loadCrisisSymbols(simulation.crisis_type);
            
            if (this.isSimulationActive) {
              this.loadParticipantStats();
            }
          }
          this.isLoadingSubject.next(false);
        },
        error: (error) => {
          console.error('Error loading simulation:', error);
          this.errorSubject.next('Failed to load simulation');
          this.isLoadingSubject.next(false);
        }
      })
    );
  }

  loadParticipantStats(): void {
    this.crisisService.getMyStats().subscribe({
      next: (stats) => {
        this.participantStatsSubject.next(stats);
      },
      error: (error) => {
        console.error('Error loading participant stats:', error);
        this.participantStatsSubject.next(null);
      }
    });
  }

  loadOrders(statusFilter?: string, limit: number = 50): void {
    this.crisisService.getOrders(statusFilter, limit).subscribe({
      next: (orders) => {
        this.ordersSubject.next(orders);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.ordersSubject.next([]);
      }
    });
  }

  loadLeaderboard(limit: number = 50): void {
    this.crisisService.getLeaderboard(limit).subscribe({
      next: (leaderboard) => {
        this.leaderboardSubject.next(leaderboard);
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
      }
    });
  }

  loadCrisisSymbols(crisisType: string): void {
    this.crisisService.getCrisisSymbols(crisisType).subscribe({
      next: (response) => {
        this.crisisSymbolsSubject.next(response);
        
        // Auto-select first symbol if none selected
        if (response.symbols.length > 0 && !this.selectedSymbolSubject.value) {
          this.selectSymbol(response.symbols[0]);
        }
      },
      error: (error) => {
        console.error('Error loading crisis symbols:', error);
      }
    });
  }

  loadMarketData(symbol: string): void {
    if (!symbol) return;
    
    this.crisisService.getMarketData(symbol).subscribe({
      next: (data) => {
        this.marketDataSubject.next(data);
      },
      error: (error) => {
        console.error('Error loading market data:', error);
        this.marketDataSubject.next(null);
      }
    });
  }

  // ============================================================================
  // STATE UPDATES
  // ============================================================================

  selectSymbol(symbol: CrisisTypes.SymbolInfo): void {
    this.selectedSymbolSubject.next(symbol);
    this.loadMarketData(symbol.symbol);
  }

  clearSelectedSymbol(): void {
    this.selectedSymbolSubject.next(null);
    this.marketDataSubject.next(null);
  }

  setError(message: string): void {
    this.errorSubject.next(message);
  }

  clearError(): void {
    this.errorSubject.next('');
  }

  // ============================================================================
  // SIMULATION ACTIONS
  // ============================================================================

  joinSimulation(initialCash: number = 100000): Observable<any> {
    if (!this.activeSimulation) {
      throw new Error('No active simulation');
    }

    this.isLoadingSubject.next(true);
    return this.crisisService.joinSimulation(this.activeSimulation.id, initialCash).pipe(
      tap({
        next: () => {
          this.loadActiveSimulation().subscribe();
          this.loadParticipantStats();
          this.isLoadingSubject.next(false);
        },
        error: (error) => {
          console.error('Error joining simulation:', error);
          this.errorSubject.next(error.error?.detail || 'Failed to join simulation');
          this.isLoadingSubject.next(false);
        }
      })
    );
  }

  leaveSimulation(): Observable<any> {
    if (!this.activeSimulation) {
      throw new Error('No active simulation');
    }

    return this.crisisService.leaveSimulation(this.activeSimulation.id).pipe(
      tap({
        next: () => {
          this.participantStatsSubject.next(null);
          this.ordersSubject.next([]);
          this.clearSelectedSymbol();
          this.loadActiveSimulation().subscribe();
        },
        error: (error) => {
          console.error('Error leaving simulation:', error);
          this.errorSubject.next(error.error?.detail || 'Failed to leave simulation');
        }
      })
    );
  }

  placeOrder(order: CrisisTypes.PlaceOrderRequest): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.crisisService.placeOrder(order).pipe(
      tap({
        next: () => {
          this.loadOrders();
          this.loadParticipantStats();
          this.isLoadingSubject.next(false);
        },
        error: (error) => {
          console.error('Error placing order:', error);
          this.errorSubject.next(error.error?.detail || 'Failed to place order');
          this.isLoadingSubject.next(false);
        }
      })
    );
  }

  cancelOrder(orderId: number): Observable<any> {
    return this.crisisService.cancelOrder(orderId).pipe(
      tap({
        next: () => {
          this.loadOrders();
        },
        error: (error) => {
          console.error('Error cancelling order:', error);
          this.errorSubject.next(error.error?.detail || 'Failed to cancel order');
        }
      })
    );
  }

  // ============================================================================
  // AUTO-REFRESH
  // ============================================================================

  startAutoRefresh(): void {
    this.stopAutoRefresh(); // Clean up existing subscriptions

    // Refresh simulation status every 3 seconds
    const simSub = interval(3000).pipe(
      switchMap(() => this.crisisService.getActiveSimulation())
    ).subscribe({
      next: (simulation) => {
        const previousStatus = this.activeSimulation?.status;
        this.activeSimulationSubject.next(simulation);
        
        // Reload data if status changed
        if (simulation && previousStatus !== simulation.status) {
          if (simulation.status === 'active' || simulation.status === 'ACTIVE') {
            this.loadParticipantStats();
            this.loadCrisisSymbols(simulation.crisis_type);
          }
        }
      },
      error: () => {}
    });

    // Refresh participant stats every 2 seconds when active
    const statsSub = interval(2000).subscribe(() => {
      if (this.canTrade) {
        this.loadParticipantStats();
      }
    });

    // Refresh leaderboard every 5 seconds when active
    const leaderboardSub = interval(5000).subscribe(() => {
      if (this.isSimulationActive) {
        this.loadLeaderboard();
      }
    });

    // Refresh market data every 1 second when symbol selected
    const marketSub = interval(1000).subscribe(() => {
      const symbol = this.selectedSymbolSubject.value;
      if (symbol && this.isSimulationActive) {
        this.loadMarketData(symbol.symbol);
      }
    });

    this.refreshSubscriptions.push(simSub, statsSub, leaderboardSub, marketSub);
  }

  stopAutoRefresh(): void {
    this.refreshSubscriptions.forEach(sub => sub.unsubscribe());
    this.refreshSubscriptions = [];
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  reset(): void {
    this.stopAutoRefresh();
    this.activeSimulationSubject.next(null);
    this.participantStatsSubject.next(null);
    this.leaderboardSubject.next(null);
    this.ordersSubject.next([]);
    this.crisisSymbolsSubject.next(null);
    this.selectedSymbolSubject.next(null);
    this.marketDataSubject.next(null);
    this.isLoadingSubject.next(false);
    this.errorSubject.next('');
  }
}