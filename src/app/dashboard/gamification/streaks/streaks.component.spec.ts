import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StreaksComponent } from './streaks.component';
import { GamificationService } from '../../../core/services/gamification.service';
import { of } from 'rxjs';

describe('StreaksComponent', () => {
  let component: StreaksComponent;
  let fixture: ComponentFixture<StreaksComponent>;
  const mockService = { userGamification$: of({ streak: { currentStreak: 5, longestStreak: 10, milestones: [] } }) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StreaksComponent],
      providers: [{ provide: GamificationService, useValue: mockService }]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StreaksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});