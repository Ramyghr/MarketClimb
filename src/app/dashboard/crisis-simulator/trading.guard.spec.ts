// import { CanActivateFn, Router } from '@angular/router';
// import { inject } from '@angular/core';
// import { CrisisSimulatorStateService } from 'src/app/services/crisis-simulator-state.service'; 
// export const tradingGuard: CanActivateFn = (route, state) => {
//   const stateService = inject(CrisisSimulatorStateService);
//   const router = inject(Router);
  
//   console.log('Trading guard checking...'); // ADD THIS FOR DEBUGGING
  
//   // Check if user has joined simulation
//   if (stateService.canTrade) {
//     console.log('Guard: User can trade, allowing access');
//     return true;
//   }
  
//   console.log('Guard: User cannot trade, redirecting to overview');
//   // Redirect to overview
//   router.navigate(['/dashboard/crisis-simulator']);
//   return false;
// };