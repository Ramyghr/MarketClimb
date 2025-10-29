import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradingviewWidgetComponent } from './tradingview-widget.component';

describe('TradingviewWidgetComponent', () => {
  let component: TradingviewWidgetComponent;
  let fixture: ComponentFixture<TradingviewWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TradingviewWidgetComponent]
    });
    fixture = TestBed.createComponent(TradingviewWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
