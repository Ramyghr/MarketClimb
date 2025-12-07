import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrisisTradingComponent } from './crisis-trading.component';

describe('CrisisTradingComponent', () => {
  let component: CrisisTradingComponent;
  let fixture: ComponentFixture<CrisisTradingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CrisisTradingComponent]
    });
    fixture = TestBed.createComponent(CrisisTradingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
