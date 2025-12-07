import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrisisAdminComponent } from './crisis-admin.component';

describe('CrisisAdminComponent', () => {
  let component: CrisisAdminComponent;
  let fixture: ComponentFixture<CrisisAdminComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CrisisAdminComponent]
    });
    fixture = TestBed.createComponent(CrisisAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
