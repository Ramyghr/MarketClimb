// src/app/dashboard/bot-trading/backtest-results/backtest-results.component.ts
import { Component, Input } from '@angular/core';
import { BacktestResponse } from '../../../services/bot-trading.service';

@Component({
  selector: 'app-backtest-results',
  templateUrl: './backtest-results.component.html',  // ← CHANGED: Use external template
  styleUrls: ['./backtest-results.component.css']    // ← CHANGED: Use external stylesheet
})
export class BacktestResultsComponent {
  @Input() results!: BacktestResponse;

  calculateDuration(): string {
    if (!this.results.started_at || !this.results.completed_at) {
      return 'N/A';
    }
    
    const start = new Date(this.results.started_at);
    const end = new Date(this.results.completed_at);
    const diffMs = end.getTime() - start.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}m`;
    } else {
      return `${Math.floor(diffSeconds / 3600)}h ${Math.floor((diffSeconds % 3600) / 60)}m`;
    }
  }
}