import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrisisSimulatorComponent } from './crisis-simulator.component';

describe('CrisisSimulatorComponent', () => {
  let component: CrisisSimulatorComponent;
  let fixture: ComponentFixture<CrisisSimulatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CrisisSimulatorComponent]
    });
    fixture = TestBed.createComponent(CrisisSimulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
