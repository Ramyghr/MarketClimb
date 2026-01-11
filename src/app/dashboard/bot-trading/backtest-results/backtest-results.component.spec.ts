import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BacktestResultsComponent } from './backtest-results.component';

describe('BacktestResultsComponent', () => {
  let component: BacktestResultsComponent;
  let fixture: ComponentFixture<BacktestResultsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BacktestResultsComponent]
    });
    fixture = TestBed.createComponent(BacktestResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
