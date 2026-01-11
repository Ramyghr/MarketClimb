import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BotBacktestsComponent } from './bot-backtests.component';

describe('BotBacktestsComponent', () => {
  let component: BotBacktestsComponent;
  let fixture: ComponentFixture<BotBacktestsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BotBacktestsComponent]
    });
    fixture = TestBed.createComponent(BotBacktestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
