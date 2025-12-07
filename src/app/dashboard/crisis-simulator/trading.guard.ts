import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { CrisisSimulatorStateService } from '../../services/crisis-simulator-state.service';

export const tradingGuard: CanActivateFn = (route, state) => {
  const stateService = inject(CrisisSimulatorStateService);
  const router = inject(Router);
  
  console.log('🔒 Trading Guard: Checking access...');
  console.log('🔒 Simulation:', stateService.activeSimulation);
  console.log('🔒 Participant Stats:', stateService.participantStats);
  console.log('🔒 Can Trade:', stateService.canTrade);
  console.log('🔒 Is Simulation Active:', stateService.isSimulationActive);
  console.log('🔒 Has Joined:', stateService.hasJoinedSimulation);
  
  // Simple check - can the user trade?
  if (stateService.canTrade) {
    console.log('✅ Guard: User can trade - ACCESS GRANTED');
    return true;
  }
  
  console.log('❌ Guard: User cannot trade - ACCESS DENIED');
  console.log('❌ Redirecting to /dashboard/crisis-simulator');
  router.navigate(['/dashboard/crisis-simulator']);
  return false;
};