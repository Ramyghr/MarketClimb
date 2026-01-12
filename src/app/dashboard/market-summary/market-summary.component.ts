import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SentimentService } from 'src/app/services/sentiment.service';
import { MarketSentimentSummary, SentimentLabel, TradingSignal, RiskLevel } from 'src/app/services/sentiment.model';

@Component({
  selector: 'app-market-summary',
  // standalone: true,
  // imports: [
  //   CommonModule,
  //   MatCardModule,
  //   MatProgressSpinnerModule,
  //   MatChipsModule,
  //   MatIconModule,
  //   MatButtonModule
  // ],
  templateUrl: './market-summary.component.html',
  styleUrls: ['./market-summary.component.scss']
})
export class MarketSummaryComponent implements OnInit {
  summary: MarketSentimentSummary | null = null;
  loading = false;
  error: string | null = null;
  SentimentLabel = SentimentLabel;

  constructor(private sentimentService: SentimentService) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading = true;
    this.error = null;

    this.sentimentService.getMarketSummary().subscribe({
      next: (data) => {
        this.summary = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du résumé du marché';
        this.loading = false;
        console.error(err);
      }
    });
  }

  getSentimentIcon(sentiment: SentimentLabel): string {
    switch (sentiment) {
      case SentimentLabel.POSITIVE:
        return 'trending_up';
      case SentimentLabel.NEGATIVE:
        return 'trending_down';
      default:
        return 'trending_flat';
    }
  }

  getSentimentColor(sentiment: SentimentLabel): string {
    switch (sentiment) {
      case SentimentLabel.POSITIVE:
        return 'primary';
      case SentimentLabel.NEGATIVE:
        return 'warn';
      default:
        return 'accent';
    }
  }

  getSentimentClass(sentiment: SentimentLabel): string {
    switch (sentiment) {
      case SentimentLabel.POSITIVE:
        return 'positive';
      case SentimentLabel.NEGATIVE:
        return 'negative';
      default:
        return 'neutral';
    }
  }

  getConfidencePercentage(): number {
    return this.summary ? Math.round(this.summary.confidence * 100) : 0;
  }
  
  getFearGreedClass(value: number | undefined): string {
    if (!value) return '';
    if (value < 25) return 'extreme-fear';
    if (value < 45) return 'fear';
    if (value < 55) return 'neutral';
    if (value < 75) return 'greed';
    return 'extreme-greed';
  }
  
  getFearGreedLabel(value: number | undefined): string {
    if (!value) return '';
    if (value < 25) return 'Peur Extrême';
    if (value < 45) return 'Peur';
    if (value < 55) return 'Neutre';
    if (value < 75) return 'Avidité';
    return 'Avidité Extrême';
  }
  
  getMomentumClass(value: number | undefined): string {
    if (!value) return '';
    if (value > 0.3) return 'strong-positive';
    if (value > 0) return 'positive';
    if (value < -0.3) return 'strong-negative';
    if (value < 0) return 'negative';
    return 'neutral';
  }
  
  getMomentumLabel(value: number | undefined): string {
    if (!value) return '';
    if (value > 0.3) return 'Très Haussier';
    if (value > 0) return 'Haussier';
    if (value < -0.3) return 'Très Baissier';
    if (value < 0) return 'Baissier';
    return 'Neutre';
  }
  
  getMomentumWidth(value: number | undefined): number {
    if (!value) return 50;
    return ((value + 1) / 2) * 100; // Convertir -1..1 en 0..100
  }
  
  getVolatilityLabel(value: number | undefined): string {
    if (!value) return '';
    if (value < 30) return 'Faible';
    if (value < 60) return 'Modérée';
    return 'Élevée';
  }
  
  getSignalClass(signal: TradingSignal | undefined): string {
    if (!signal) return '';
    switch (signal) {
      case TradingSignal.STRONG_BUY:
        return 'signal-strong-buy';
      case TradingSignal.BUY:
        return 'signal-buy';
      case TradingSignal.HOLD:
        return 'signal-hold';
      case TradingSignal.SELL:
        return 'signal-sell';
      case TradingSignal.STRONG_SELL:
        return 'signal-strong-sell';
      default:
        return '';
    }
  }
  
  getSignalIcon(signal: TradingSignal | undefined): string {
    if (!signal) return 'help';
    switch (signal) {
      case TradingSignal.STRONG_BUY:
        return 'north';
      case TradingSignal.BUY:
        return 'trending_up';
      case TradingSignal.HOLD:
        return 'pause_circle';
      case TradingSignal.SELL:
        return 'trending_down';
      case TradingSignal.STRONG_SELL:
        return 'south';
      default:
        return 'help';
    }
  }
  
  getSignalLabel(signal: TradingSignal | undefined): string {
    if (!signal) return '';
    switch (signal) {
      case TradingSignal.STRONG_BUY:
        return 'ACHAT FORT';
      case TradingSignal.BUY:
        return 'ACHAT';
      case TradingSignal.HOLD:
        return 'CONSERVER';
      case TradingSignal.SELL:
        return 'VENTE';
      case TradingSignal.STRONG_SELL:
        return 'VENTE FORTE';
      default:
        return '';
    }
  }
  
  getRiskClass(risk: RiskLevel | undefined): string {
    if (!risk) return '';
    switch (risk) {
      case RiskLevel.LOW:
        return 'risk-low';
      case RiskLevel.MEDIUM:
        return 'risk-medium';
      case RiskLevel.HIGH:
        return 'risk-high';
      case RiskLevel.EXTREME:
        return 'risk-extreme';
      default:
        return '';
    }
  }
  
  getRiskIcon(risk: RiskLevel | undefined): string {
    if (!risk) return 'info';
    switch (risk) {
      case RiskLevel.LOW:
        return 'check_circle';
      case RiskLevel.MEDIUM:
        return 'warning';
      case RiskLevel.HIGH:
        return 'error';
      case RiskLevel.EXTREME:
        return 'dangerous';
      default:
        return 'info';
    }
  }
  
  getRiskLabel(risk: RiskLevel | undefined): string {
    if (!risk) return '';
    switch (risk) {
      case RiskLevel.LOW:
        return 'Risque Faible';
      case RiskLevel.MEDIUM:
        return 'Risque Modéré';
      case RiskLevel.HIGH:
        return 'Risque Élevé';
      case RiskLevel.EXTREME:
        return 'Risque Extrême';
      default:
        return '';
    }
  }
}
