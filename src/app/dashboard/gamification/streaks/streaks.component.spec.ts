import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StreaksComponent } from './streaks.component';

describe('StreaksComponent', () => {
  let component: StreaksComponent;
  let fixture: ComponentFixture<StreaksComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StreaksComponent]
    });
    fixture = TestBed.createComponent(StreaksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
