import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FurtherInfoComponent } from './further-info.component';

describe('FurtherInfoComponent', () => {
  let component: FurtherInfoComponent;
  let fixture: ComponentFixture<FurtherInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FurtherInfoComponent]
    });
    fixture = TestBed.createComponent(FurtherInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
