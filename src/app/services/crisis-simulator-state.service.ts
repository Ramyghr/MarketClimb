import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CrisisSimulatorServiceService } from './crisis-simulator.service.service';
import * as CrisisTypes from '../dashboard/crisis-simulator/crisis-simulator.interfaces';

@Injectable({
  providedIn: 'root'
})
export class CrisisSimulatorStateService {
  // State subjects
  private activeSimulationSubject = new BehaviorSubject<CrisisTypes.Simulation | null>(null);
  private participantStatsSubject = new BehaviorSubject<CrisisTypes.ParticipantStats | null>(null);
  private ordersSubject = new BehaviorSubject<CrisisTypes.Order[]>([]);
  private leaderboardSubject = new BehaviorSubject<CrisisTypes.Leaderboard | null>(null);
  private crisisSymbolsSubject = new BehaviorSubject<CrisisTypes.CrisisSymbolsResponse | null>(null);
  private selectedSymbolSubject = new BehaviorSubject<CrisisTypes.SymbolInfo | null>(null);
  private marketDataSubject = new BehaviorSubject<CrisisTypes.MarketData | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string>('');

  // Public observables
  activeSimulation$ = this.activeSimulationSubject.asObservable();
  participantStats$ = this.participantStatsSubject.asObservable();
  orders$ = this.ordersSubject.asObservable();
  leaderboard$ = this.leaderboardSubject.asObservable();
  crisisSymbols$ = this.crisisSymbolsSubject.asObservable();
  selectedSymbol$ = this.selectedSymbolSubject.asObservable();
  marketData$ = this.marketDataSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(private crisisService: CrisisSimulatorServiceService) {}

  // ============================================================================
  // GETTERS
  // ============================================================================

  get canTrade(): boolean {
    const simulation = this.activeSimulationSubject.value;
    const stats = this.participantStatsSubject.value;
    return !!(simulation && stats && 
              (simulation.status === 'active' || simulation.status === 'ACTIVE'));
  }

  get activeSimulation(): CrisisTypes.Simulation | null {
    return this.activeSimulationSubject.value;
  }

  get participantStats(): CrisisTypes.ParticipantStats | null {
    return this.participantStatsSubject.value;
  }

  // ============================================================================
  // SIMULATION MANAGEMENT
  // ============================================================================

  loadActiveSimulation(): Observable<CrisisTypes.Simulation | null> {
    this.isLoadingSubject.next(true);
    
    return this.crisisService.getActiveSimulation().pipe(
      tap({
        next: (simulation) => {
          this.activeSimulationSubject.next(simulation);
          
          if (simulation) {
            this.loadCrisisSymbols(simulation.crisis_type);
            this.loadParticipantStats();
          }
          
          this.isLoadingSubject.next(false);
        },
        error: (error) => {
          this.handleError('Failed to load simulation', error);
          this.isLoadingSubject.next(false);
        }
      })
    );
  }

  joinSimulation(simulationId: number, initialCash: number = 100000): Observable<any> {
    this.isLoadingSubject.next(true);
    
    return this.crisisService.joinSimulation(simulationId, initialCash).pipe(
      tap({
        next: () => {
          this.loadActiveSimulation().subscribe();
          this.isLoadingSubject.next(false);
        },
        error: (error) => {
          this.handleError('Failed to join simulation', error);
          this.isLoadingSubject.next(false);
        }
      })
    );
  }

  leaveSimulation(simulationId: number): Observable<any> {
    this.isLoadingSubject.next(true);
    
    return this.crisisService.leaveSimulation(simulationId).pipe(
      tap({
        next: () => {
          this.clearState();
          this.isLoadingSubject.next(false);
        },
        error: (error) => {
          this.handleError('Failed to leave simulation', error);
          this.isLoadingSubject.next(false);
        }
      })
    );
  }

  // ============================================================================
  // PARTICIPANT STATS
  // ============================================================================

  loadParticipantStats(): Observable<CrisisTypes.ParticipantStats> {
    return this.crisisService.getMyStats().pipe(
      tap({
        next: (stats) => {
          this.participantStatsSubject.next(stats);
        },
        error: (error) => {
          this.handleError('Failed to load stats', error);
        }
      })
    );
  }

  updateParticipantStats(stats: CrisisTypes.ParticipantStats): void {
    this.participantStatsSubject.next(stats);
  }

  // ============================================================================
  // TRADING - ORDERS
  // ============================================================================

  placeOrder(order: CrisisTypes.PlaceOrderRequest): Observable<any> {
    this.isLoadingSubject.next(true);
    
    return this.crisisService.placeOrder(order).pipe(
      tap({
        next: () => {
          // Refresh orders and stats after placing order
          this.loadOrders();
          this.loadParticipantStats().subscribe();
          this.isLoadingSubject.next(false);
        },
        error: (error) => {
          this.handleError('Failed to place order', error);
          this.isLoadingSubject.next(false);
        }
      })
    );
  }

  loadOrders(statusFilter?: string): Observable<CrisisTypes.Order[]> {
    return this.crisisService.getOrders(statusFilter).pipe(
      tap({
        next: (orders) => {
          this.ordersSubject.next(orders);
        },
        error: (error) => {
          this.handleError('Failed to load orders', error);
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
          this.handleError('Failed to cancel order', error);
        }
      })
    );
  }

  // ============================================================================
  // POSITIONS - COMPLETELY REWRITTEN
  // ============================================================================

  /**
   * Close a position - Returns full response from backend
   */
  closePosition(orderId: number, quantity?: number): Observable<any> {
    console.log('🔄 State Service: Closing position', { orderId, quantity });
    
    return this.crisisService.closePosition(orderId, quantity).pipe(
      tap({
        next: (response) => {
          console.log('✅ State Service: Position closed successfully', response);
          
          // Trigger refresh of orders and stats
          this.loadOrders().subscribe();
          this.loadParticipantStats().subscribe();
          this.loadLeaderboard().subscribe();
        },
        error: (error) => {
          console.error('❌ State Service: Error closing position', error);
          this.handleError('Failed to close position', error);
        }
      }),
      catchError((error) => {
        // Re-throw the error so component can handle it
        throw error;
      })
    );
  }

  /**
   * Close all positions - Returns full response from backend
   */
  closeAllPositions(): Observable<any> {
    console.log('🔄 State Service: Closing all positions');
    
    return this.crisisService.closeAllPositions().pipe(
      tap({
        next: (response) => {
          console.log('✅ State Service: All positions closed successfully', response);
          
          // Trigger refresh of orders and stats
          this.loadOrders().subscribe();
          this.loadParticipantStats().subscribe();
          this.loadLeaderboard().subscribe();
        },
        error: (error) => {
          console.error('❌ State Service: Error closing all positions', error);
          this.handleError('Failed to close all positions', error);
        }
      }),
      catchError((error) => {
        // Re-throw the error so component can handle it
        throw error;
      })
    );
  }

  // ============================================================================
  // MARKET DATA
  // ============================================================================

  loadMarketData(symbol: string): Observable<CrisisTypes.MarketData> {
    return this.crisisService.getMarketData(symbol).pipe(
      tap({
        next: (data) => {
          this.marketDataSubject.next(data);
        },
        error: (error) => {
          this.handleError(`Failed to load market data for ${symbol}`, error);
        }
      })
    );
  }

  updateMarketData(data: CrisisTypes.MarketData): void {
    this.marketDataSubject.next(data);
  }

  // ============================================================================
  // LEADERBOARD
  // ============================================================================

  loadLeaderboard(limit: number = 50): Observable<CrisisTypes.Leaderboard> {
    return this.crisisService.getLeaderboard(limit).pipe(
      tap({
        next: (leaderboard) => {
          this.leaderboardSubject.next(leaderboard);
        },
        error: (error) => {
          this.handleError('Failed to load leaderboard', error);
        }
      })
    );
  }

  updateLeaderboard(leaderboard: CrisisTypes.Leaderboard): void {
    this.leaderboardSubject.next(leaderboard);
  }

  // ============================================================================
  // CRISIS SYMBOLS & ASSETS
  // ============================================================================

  loadCrisisSymbols(crisisType: string): Observable<CrisisTypes.CrisisSymbolsResponse> {
    return this.crisisService.getCrisisSymbols(crisisType).pipe(
      tap({
        next: (symbols) => {
          this.crisisSymbolsSubject.next(symbols);
          
          if (symbols.symbols && symbols.symbols.length > 0 && !this.selectedSymbolSubject.value) {
            this.selectSymbol(symbols.symbols[0]);
          }
        },
        error: (error) => {
          this.handleError('Failed to load crisis symbols', error);
        }
      })
    );
  }

  selectSymbol(symbol: CrisisTypes.SymbolInfo): void {
    this.selectedSymbolSubject.next(symbol);
    
    if (symbol) {
      this.loadMarketData(symbol.symbol).subscribe();
    }
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private handleError(message: string, error: any): void {
    console.error(message, error);
    
    let errorMessage = message;
    
    if (error?.error?.detail) {
      errorMessage = `${message}: ${error.error.detail}`;
    } else if (error?.message) {
      errorMessage = `${message}: ${error.message}`;
    }
    
    this.errorSubject.next(errorMessage);
    
    // Auto-clear error after 5 seconds
    setTimeout(() => {
      if (this.errorSubject.value === errorMessage) {
        this.errorSubject.next('');
      }
    }, 5000);
  }

  clearError(): void {
    this.errorSubject.next('');
  }

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private setError(error: string) {
    this.errorSubject.next(error);
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  clearState(): void {
    this.activeSimulationSubject.next(null);
    this.participantStatsSubject.next(null);
    this.ordersSubject.next([]);
    this.leaderboardSubject.next(null);
    this.crisisSymbolsSubject.next(null);
    this.selectedSymbolSubject.next(null);
    this.marketDataSubject.next(null);
    this.errorSubject.next('');
  }

  // ============================================================================
  // ADMIN ACTIONS
  // ============================================================================

  createSimulation(crisisType: string, maxParticipants: number, isCompetitive: boolean = false): Observable<any> {
    this.isLoadingSubject.next(true);
    
    return this.crisisService.createSimulation(crisisType, maxParticipants, isCompetitive).pipe(
      tap({
        next: () => {
          this.loadActiveSimulation().subscribe();
          this.isLoadingSubject.next(false);
        },
        error: (error) => {
          this.handleError('Failed to create simulation', error);
          this.isLoadingSubject.next(false);
        }
      })
    );
  }

  startSimulation(simulationId: number): Observable<any> {
    this.isLoadingSubject.next(true);
    
    return this.crisisService.startSimulation(simulationId).pipe(
      tap({
        next: () => {
          this.loadActiveSimulation().subscribe();
          this.isLoadingSubject.next(false);
        },
        error: (error) => {
          this.handleError('Failed to start simulation', error);
          this.isLoadingSubject.next(false);
        }
      })
    );
  }

  stopSimulation(simulationId: number, force: boolean = false): Observable<any> {
    this.isLoadingSubject.next(true);
    
    return this.crisisService.stopSimulation(simulationId, force).pipe(
      tap({
        next: () => {
          this.loadActiveSimulation().subscribe();
          this.isLoadingSubject.next(false);
        },
        error: (error) => {
          this.handleError('Failed to stop simulation', error);
          this.isLoadingSubject.next(false);
        }
      })
    );
  }
}