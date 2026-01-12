import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BaseChartDirective } from 'ng2-charts'; // Changed from ChartsModule
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { TrendsService } from 'src/app/services/trends.service';

@Component({
  selector: 'app-sentiment-chart',
  // standalone: true,
  // imports: [
  //   CommonModule,
  //   MatCardModule,
  //   MatProgressSpinnerModule,
  //   MatIconModule,
  //   MatButtonModule,
  //   BaseChartDirective // Changed from ChartsModule
  // ],
  templateUrl: './sentiment-chart.component.html',
  styleUrls: ['./sentiment-chart.component.scss']
})
export class SentimentChartComponent implements OnInit {
  loading = false;
  error: string | null = null;

  // Doughnut Chart pour la distribution des sentiments
  public doughnutChartLabels: string[] = ['Positif', 'Neutre', 'Négatif'];
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: this.doughnutChartLabels,
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#4caf50', '#9e9e9e', '#ff9800'],
        hoverBackgroundColor: ['#66bb6a', '#bdbdbd', '#ffa726'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: {
            size: 14
          },
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  constructor(private trendsService: TrendsService) {}

  ngOnInit(): void {
    this.loadSentimentDistribution();
  }

  loadSentimentDistribution(): void {
    this.loading = true;
    this.error = null;

    this.trendsService.getSentimentDistribution('stock market finance', 50).subscribe({
      next: (data) => {
        this.doughnutChartData.datasets[0].data = [
          data.positive,
          data.neutral,
          data.negative
        ];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des données';
        this.loading = false;
        console.error(err);
      }
    });
  }
}