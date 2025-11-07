import { Component, OnInit, OnDestroy } from '@angular/core';
import { GamificationService, Streak } from '../../../core/services/gamification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-streaks',
  templateUrl: './streaks.component.html',
  styleUrls: ['./streaks.component.css']
})
export class StreaksComponent implements OnInit, OnDestroy {
  // Initialize streak so it’s never undefined
  streak: Streak = {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: new Date(),
    streakDates: [],
    milestones: []
  };

  successMessage = '';
  private destroy$ = new Subject<void>();

  // Helper: last 30 days for calendar view
  get last30Days(): Date[] {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  }

  constructor(private gamificationService: GamificationService) {}

  ngOnInit(): void {
    this.gamificationService.userGamification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        // Safely assign if data exists
        if (data && data.streak) {
          this.streak = data.streak;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- UI Helpers ----------
  progressPercent(days: number): number {
    return Math.min((this.streak.currentStreak / days) * 100, 100);
  }

  getMilestoneColor(days: number): string {
    const map: Record<number, string> = {
      7: '#00c896',
      14: '#5c7cfa',
      30: '#a78bfa',
      60: '#ffd43b',
      100: '#ff6b6b'
    };
    return map[days] || '#9ca3af';
  }

  isStreakDay(date: Date): boolean {
    return this.streak.streakDates.some(d =>
      d.toDateString() === date.toDateString()
    );
  }

  isToday(date: Date): boolean {
    return date.toDateString() === new Date().toDateString();
  }

  get totalPointsFromMilestones(): number {
    return this.streak.milestones
      .filter(m => m.claimed)
      .reduce((sum, m) => sum + m.reward, 0);
  }

  // ---------- Actions ----------
  claimMilestone(days: number): void {
    this.gamificationService.claimStreakMilestone(days)
      .subscribe(reward => {
        if (reward > 0) {
          this.showSuccess(`Milestone unlocked! +${reward} points`);
        }
      });
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 3000);
  }
}
