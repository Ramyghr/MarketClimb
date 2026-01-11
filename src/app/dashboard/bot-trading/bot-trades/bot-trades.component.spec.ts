import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BotTradesComponent } from './bot-trades.component';

describe('BotTradesComponent', () => {
  let component: BotTradesComponent;
  let fixture: ComponentFixture<BotTradesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BotTradesComponent]
    });
    fixture = TestBed.createComponent(BotTradesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
