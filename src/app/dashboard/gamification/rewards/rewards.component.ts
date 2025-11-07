import { Component, OnInit, OnDestroy } from '@angular/core';
import { GamificationService, Reward } from '../../../core/services/gamification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-rewards',
  templateUrl: './rewards.component.html',
  styleUrls: ['./rewards.component.css']
})
export class RewardsComponent implements OnInit, OnDestroy {
  rewards: Reward[] = [];
  totalPoints = 0;
  searchTerm = '';
  selectedCategory = 'all';
  selectedStatus = 'all';
  successMessage = '';

  private destroy$ = new Subject<void>();

  constructor(private gamificationService: GamificationService) {}

  ngOnInit(): void {
    this.gamificationService.userGamification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.rewards = data.rewards;
        this.totalPoints = data.totalPoints;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredRewards(): Reward[] {
    return this.rewards
      .filter(r => {
        const searchMatch = !this.searchTerm ||
          r.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          r.description.toLowerCase().includes(this.searchTerm.toLowerCase());

        const catMatch = this.selectedCategory === 'all' || r.category === this.selectedCategory;

        const statusMatch =
          this.selectedStatus === 'all' ||
          (this.selectedStatus === 'available' && !r.owned && r.available) ||
          (this.selectedStatus === 'owned' && r.owned);

        return searchMatch && catMatch && statusMatch;
      })
      .sort((a, b) => a.cost - b.cost); // default sort by cost
  }

  get ownedCount(): number {
    return this.rewards.filter(r => r.owned).length;
  }

  get availableCount(): number {
    return this.rewards.filter(r => r.available && !r.owned).length;
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      cosmetic: '#a78bfa',
      boost: '#5c7cfa',
      feature: '#00c896',
      premium: '#ffd43b'
    };
    return colors[category] || '#9ca3af';
  }

  purchase(id: string): void {
    this.gamificationService.purchaseReward(id).subscribe(success => {
      if (success) {
        this.showSuccess('Reward purchased successfully!');
      }
    });
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 3000);
  }
}