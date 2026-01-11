import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BotTradingComponent } from './bot-trading.component';

describe('BotTradingComponent', () => {
  let component: BotTradingComponent;
  let fixture: ComponentFixture<BotTradingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BotTradingComponent]
    });
    fixture = TestBed.createComponent(BotTradingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
