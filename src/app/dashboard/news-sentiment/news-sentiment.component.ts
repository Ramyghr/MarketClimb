import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { SentimentService } from 'src/app/services/sentiment.service';
import { SentimentAnalysis, SentimentLabel } from 'src/app/services/sentiment.model';
@Component({
  selector: 'app-news-sentiment',
  // standalone: true,
  // imports: [
  //   CommonModule,
  //   MatCardModule,
  //   MatProgressSpinnerModule,
  //   MatIconModule,
  //   MatButtonModule,
  //   MatChipsModule
  // ],
  templateUrl: './news-sentiment.component.html',
  styleUrls: ['./news-sentiment.component.scss']
})
export class NewsSentimentComponent implements OnInit {
  analyses: SentimentAnalysis[] = [];
  loading = false;
  error: string | null = null;
  SentimentLabel = SentimentLabel;

  constructor(private sentimentService: SentimentService) {}

  ngOnInit(): void {
    this.loadAnalyses();
  }

  loadAnalyses(): void {
    this.loading = true;
    this.error = null;

    this.sentimentService.analyzeNews('stock market finance', 15).subscribe({
      next: (data) => {
        this.analyses = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des analyses';
        this.loading = false;
        console.error(err);
      }
    });
  }

  getSentimentIcon(sentiment: SentimentLabel): string {
    switch (sentiment) {
      case SentimentLabel.POSITIVE:
        return 'sentiment_satisfied';
      case SentimentLabel.NEGATIVE:
        return 'sentiment_dissatisfied';
      default:
        return 'sentiment_neutral';
    }
  }

  getSentimentClass(sentiment: SentimentLabel): string {
    return sentiment.toLowerCase();
  }

  getScorePercentage(score: number): number {
    return Math.round(score * 100);
  }

  openArticle(url: string): void {
    window.open(url, '_blank');
  }
}
