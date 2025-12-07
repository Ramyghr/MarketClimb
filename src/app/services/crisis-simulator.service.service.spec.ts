import { TestBed } from '@angular/core/testing';

import { CrisisSimulatorServiceService } from './crisis-simulator.service.service';

describe('CrisisSimulatorServiceService', () => {
  let service: CrisisSimulatorServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CrisisSimulatorServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
