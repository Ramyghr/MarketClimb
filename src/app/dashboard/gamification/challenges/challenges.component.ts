import { Component, OnInit, OnDestroy } from '@angular/core';
import { GamificationService, Challenge } from '../../../core/services/gamification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-challenges',
  templateUrl: './challenges.component.html',
  styleUrls: ['./challenges.component.css']
})
export class ChallengesComponent implements OnInit, OnDestroy {
  challenges: Challenge[] = [];
  selectedType = 'all';
  selectedCategory = 'all';
  selectedStatus = 'all';
  successMessage = '';

  private destroy$ = new Subject<void>();

  constructor(private gamificationService: GamificationService) {}

  ngOnInit(): void {
    this.gamificationService.userGamification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.challenges = data.activeChallenges;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredChallenges(): Challenge[] {
    return this.challenges.filter(c => {
      const typeMatch = this.selectedType === 'all' || c.type === this.selectedType;
      const catMatch = this.selectedCategory === 'all' || c.category === this.selectedCategory;
      const statusMatch =
        this.selectedStatus === 'all' ||
        (this.selectedStatus === 'active' && !c.completed && !c.claimed) ||
        (this.selectedStatus === 'completed' && c.completed && !c.claimed) ||
        (this.selectedStatus === 'claimed' && c.claimed);
      return typeMatch && catMatch && statusMatch;
    });
  }

  get stats() {
    const active = this.challenges.filter(c => !c.completed && !c.claimed).length;
    const completed = this.challenges.filter(c => c.completed && !c.claimed).length;
    const totalReward = this.challenges.reduce((sum, c) => sum + c.reward, 0);
    return { active, completed, totalReward };
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      daily: '#00c896',
      weekly: '#5c7cfa',
      monthly: '#a78bfa'
    };
    return colors[type] || '#9ca3af';
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      daily: 'Sun',
      weekly: 'Calendar',
      monthly: 'Moon'
    };
    return icons[type] || 'Target';
  }

  isExpired(date: Date): boolean {
    return new Date(date) < new Date();
  }

  timeLeft(date: Date): string {
    const diff = new Date(date).getTime() - Date.now();
    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  }

  claimChallenge(id: string): void {
    this.gamificationService.claimChallenge(id).subscribe(reward => {
      if (reward > 0) {
        this.showSuccess(`Challenge completed! +${reward} points`);
      }
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 3000);
  }
}