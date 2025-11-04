import { Component, OnInit, OnDestroy } from '@angular/core';
import { GamificationService, UserGamification } from '../../core/services/gamification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-gamification',
  templateUrl: './gamification.component.html',
  styleUrls: ['./gamification.component.css']
})
export class GamificationComponent implements OnInit, OnDestroy {
  activeTab: 'achievements' | 'streaks' | 'challenges' | 'leaderboard' | 'rewards' = 'achievements';
  
  userGamification!: UserGamification;

  private destroy$ = new Subject<void>();

  constructor(private gamificationService: GamificationService) {}

  ngOnInit(): void {
    this.gamificationService.userGamification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.userGamification = data;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  switchTab(tab: 'achievements' | 'streaks' | 'challenges' | 'leaderboard' | 'rewards'): void {
    this.activeTab = tab;
  }

  get levelProgress(): number {
    return (this.userGamification.currentXP / this.userGamification.nextLevelXP) * 100;
  }
}