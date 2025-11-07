import { Component, OnInit, OnDestroy } from '@angular/core';
import { GamificationService, LeaderboardEntry } from '../../../core/services/gamification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  entries: LeaderboardEntry[] = [];
  searchTerm = '';
  rankFilter = 'all';
  sortBy = 'points';
successMessage: string = '';

  yourRank = 0;
  yourPoints = 0;
  totalUsers = 0;

  private destroy$ = new Subject<void>();

  constructor(private gamificationService: GamificationService) {}

  ngOnInit(): void {
    this.gamificationService.leaderboard$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.entries = data;
        this.updateStats();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredLeaderboard(): LeaderboardEntry[] {
    let filtered = this.entries;

    // Search
    if (this.searchTerm) {
      filtered = filtered.filter(e =>
        e.username.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Rank filter
    if (this.rankFilter !== 'all') {
      const limit = this.rankFilter === 'top10' ? 10 : this.rankFilter === 'top50' ? 50 : 100;
      filtered = filtered.filter(e => e.rank <= limit);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (this.sortBy) {
        case 'points': return b.points - a.points;
        case 'level': return b.level - a.level;
        case 'rank': return a.rank - b.rank;
        default: return 0;
      }
    });

    return filtered;
  }

  private updateStats(): void {
    const you = this.entries.find(e => e.username === 'You');
    if (you) {
      this.yourRank = you.rank;
      this.yourPoints = you.points;
    }
    this.totalUsers = this.entries.length;
  }

  trackByUserId(index: number, entry: LeaderboardEntry): string {
    return entry.userId;
  }
}