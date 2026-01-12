import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TrendsService } from 'src/app/services/trends.service';
import { TrendAnalysis } from 'src/app/services/sentiment.model';
@Component({
  selector: 'app-trends',
  // standalone: true,
  // imports: [
  //   CommonModule,
  //   MatCardModule,
  //   MatProgressSpinnerModule,
  //   MatIconModule,
  //   MatButtonModule,
  //   MatProgressBarModule
  // ],
  templateUrl: './trends.component.html',
  styleUrls: ['./trends.component.scss']
})
export class TrendsComponent implements OnInit {
  trends: TrendAnalysis[] = [];
  loading = false;
  error: string | null = null;

  constructor(private trendsService: TrendsService) {}

  ngOnInit(): void {
    this.loadTrends();
  }

  loadTrends(): void {
    this.loading = true;
    this.error = null;

    this.trendsService.getEmergingTrends('24h', 10).subscribe({
      next: (data) => {
        this.trends = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des tendances';
        this.loading = false;
        console.error(err);
      }
    });
  }

  getMomentumClass(momentum: number): string {
    if (momentum > 0.3) return 'strong-positive';
    if (momentum > 0) return 'positive';
    if (momentum < -0.3) return 'strong-negative';
    if (momentum < 0) return 'negative';
    return 'neutral';
  }

  getMomentumIcon(momentum: number): string {
    if (momentum > 0.3) return 'north';
    if (momentum > 0) return 'trending_up';
    if (momentum < -0.3) return 'south';
    if (momentum < 0) return 'trending_down';
    return 'trending_flat';
  }

  getMomentumPercentage(momentum: number): number {
    return Math.abs(Math.round(momentum * 100));
  }

  getSentimentLabel(label: string): string {
    const labels: { [key: string]: string } = {
      'positive': '📈 Positif',
      'negative': '📉 Négatif',
      'neutral': '➡️ Neutre'
    };
    return labels[label] || label;
  }

  getSentimentText(label: string): string {
    const labels: { [key: string]: string } = {
      'positive': 'Positif',
      'negative': 'Négatif',
      'neutral': 'Neutre'
    };
    return labels[label] || label;
  }
}
