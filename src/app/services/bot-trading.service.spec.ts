import { TestBed } from '@angular/core/testing';

import { BotTradingService } from './bot-trading.service';

describe('BotTradingService', () => {
  let service: BotTradingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BotTradingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
