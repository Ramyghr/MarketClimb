import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartTradingComponent } from './start-trading.component';

describe('StartTradingComponent', () => {
  let component: StartTradingComponent;
  let fixture: ComponentFixture<StartTradingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StartTradingComponent]
    });
    fixture = TestBed.createComponent(StartTradingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
