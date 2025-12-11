import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CrisisSimulatorStateService } from '../../services/crisis-simulator-state.service';
import { CrisisSimulatorServiceService } from '../../services/crisis-simulator.service.service';

/**
 * Trading Guard - Protects the trading route
 * 
 * Requirements to access trading:
 * 1. Active simulation exists
 * 2. User has joined the simulation
 * 3. Simulation status is 'active'
 */
export const tradingGuard: CanActivateFn = (route, state) => {
  const stateService = inject(CrisisSimulatorStateService);
  const crisisService = inject(CrisisSimulatorServiceService);
  const router = inject(Router);

  console.log('🔒 Trading Guard: Checking access...');

  // First check: Do we have state in memory?
  const currentSimulation = stateService.activeSimulation;
  const currentStats = stateService.participantStats;

  console.log('🔒 Current Simulation:', currentSimulation);
  console.log('🔒 Current Stats:', currentStats);

  // If we have everything in memory and can trade, allow access
  if (currentSimulation && 
      currentStats && 
      (currentSimulation.status === 'active' || currentSimulation.status === 'ACTIVE')) {
    console.log('✅ Guard: Access granted (from memory)');
    return true;
  }

  // If no state in memory, try to load from server
  console.log('⏳ Guard: No state in memory, fetching from server...');

  return crisisService.getActiveSimulation().pipe(
    take(1),
    map(simulation => {
      console.log('📡 Guard: Server response:', simulation);

      if (!simulation) {
        console.log('❌ Guard: No active simulation found');
        router.navigate(['/dashboard/crisis-simulator']);
        return false;
      }

      // Update state service with fresh data
      stateService['activeSimulationSubject'].next(simulation);

      // Check simulation status
      if (simulation.status !== 'active' && simulation.status !== 'ACTIVE') {
        console.log('❌ Guard: Simulation is not active (status:', simulation.status + ')');
        router.navigate(['/dashboard/crisis-simulator']);
        return false;
      }

      // Now check if user has joined by trying to load stats
      crisisService.getMyStats().subscribe({
        next: (stats) => {
          console.log('📡 Guard: User stats loaded:', stats);
          stateService.updateParticipantStats(stats);
        },
        error: (error) => {
          console.log('❌ Guard: User has not joined simulation');
          router.navigate(['/dashboard/crisis-simulator']);
        }
      });

      // Check if we have stats now
      const stats = stateService.participantStats;
      
      if (!stats) {
        console.log('❌ Guard: User has not joined the simulation');
        router.navigate(['/dashboard/crisis-simulator']);
        return false;
      }

      console.log('✅ Guard: Access granted (from server)');
      return true;
    }),
    catchError(error => {
      console.error('❌ Guard: Error checking access:', error);
      router.navigate(['/dashboard/crisis-simulator']);
      return of(false);
    })
  );
};