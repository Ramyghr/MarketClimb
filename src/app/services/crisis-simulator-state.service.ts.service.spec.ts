import { TestBed } from '@angular/core/testing';

import { CrisisSimulatorStateService } from './crisis-simulator-state.service';

describe('CrisisSimulatorStateServiceTsService', () => {
  let service: CrisisSimulatorStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CrisisSimulatorStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
