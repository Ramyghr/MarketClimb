import { Component, OnInit, OnDestroy } from '@angular/core';
import { GamificationService, Achievement } from '../../../core/services/gamification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.css']
})
export class AchievementsComponent implements OnInit, OnDestroy {
  achievements: Achievement[] = [];
  selectedCategory: string = 'all';
  selectedRarity: string = 'all';
  showUnlockedOnly: boolean = false;

  successMessage: string = '';

  private destroy$ = new Subject<void>();

  constructor(private gamificationService: GamificationService) {}

  ngOnInit(): void {
    this.gamificationService.userGamification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.achievements = data.achievements;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredAchievements(): Achievement[] {
    return this.achievements.filter(achievement => {
      const categoryMatch = this.selectedCategory === 'all' || achievement.category === this.selectedCategory;
      const rarityMatch = this.selectedRarity === 'all' || achievement.rarity === this.selectedRarity;
      const unlockedMatch = !this.showUnlockedOnly || achievement.unlocked;
      return categoryMatch && rarityMatch && unlockedMatch;
    });
  }

  get stats() {
    const unlocked = this.achievements.filter(a => a.unlocked).length;
    const total = this.achievements.length;
    const percentage = Math.round((unlocked / total) * 100);
    const totalPoints = this.achievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0);

    return { unlocked, total, percentage, totalPoints };
  }

  unlockAchievement(achievementId: string): void {
    this.gamificationService.unlockAchievement(achievementId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result.points > 0) {
          this.showSuccess(`🎉 Achievement unlocked! +${result.points} points`);
        }
      });
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 3000);
  }

  getRarityColor(rarity: string): string {
    const colors: { [key: string]: string } = {
      'common': '#9ca3af',
      'rare': '#5c7cfa',
      'epic': '#a78bfa',
      'legendary': '#ffd43b'
    };
    return colors[rarity] || '#9ca3af';
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'trading': '💹',
      'learning': '📚',
      'social': '👥',
      'milestone': '🎯'
    };
    return icons[category] || '🏆';
  }
}