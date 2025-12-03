// src/app/dashboard/portfolio/portfolio.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { PortfolioService, Wallet, Transaction, PortfolioPerformancePoint } from '../../core/services/portfolio/portfolio.service';
import { 
  Chart, 
  ChartConfiguration, 
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Subscription } from 'rxjs';

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('performanceChart') chartRef!: ElementRef<HTMLCanvasElement>;

  wallets: Wallet[] = [];
  transactions: Transaction[] = [];
  performance: PortfolioPerformancePoint[] = [];
  totalValue: number = 0;
  totalChange: number = 0;
  totalChangePercent: number = 0;

  private subscriptions: Subscription[] = [];
  private performanceChart: Chart | undefined;

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit(): void {
    // Subscribe to all portfolio data streams
    this.subscriptions.push(
      // Wallets subscription - updates total value and triggers change calculation
      this.portfolioService.wallets$.subscribe(w => {
        this.wallets = w;
        this.totalValue = this.portfolioService.getTotalValue();
        this.calculateChange();
      }),
      
      // Transactions subscription
      this.portfolioService.transactions$.subscribe(t => {
        this.transactions = t;
      }),
      
      // Performance subscription - updates chart when new data arrives
      this.portfolioService.performance$.subscribe(p => {
        this.performance = p;
        this.calculateChange();
        if (this.performanceChart) {
          this.updateChart();
        }
      })
    );
  }

  ngAfterViewInit(): void {
    // Delay chart initialization to ensure canvas has proper dimensions
    setTimeout(() => this.initChart(), 100);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions and chart
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.performanceChart) {
      this.performanceChart.destroy();
      this.performanceChart = undefined;
    }
  }

  private initChart(): void {
    if (!this.chartRef || !this.chartRef.nativeElement) {
      console.error('Chart canvas not found');
      return;
    }

    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context');
      return;
    }

    // Destroy existing chart if any
    if (this.performanceChart) {
      this.performanceChart.destroy();
    }

    // Prepare chart data
    const labels = this.performance.map(p => {
      const date = new Date(p.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const data = this.performance.map(p => p.value);

    // Create the chart
    this.performanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Portfolio Value ($)',
          data: data,
          borderColor: '#00c896',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(0, 200, 150, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 200, 150, 0.01)');
            return gradient;
          },
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#00c896',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { 
            display: true,
            labels: {
              color: '#f1f1f1',
              font: {
                size: 13,
                weight: 'bold'
              },
              padding: 15
            }
          },
          tooltip: { 
            enabled: true,
            backgroundColor: 'rgba(22, 27, 34, 0.95)',
            titleColor: '#f1f1f1',
            bodyColor: '#00c896',
            borderColor: '#00c896',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function(context) {
                const value = context.parsed.y ?? 0;
                return '$' + value.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
              }
            }
          }
        },
        scales: {
          x: { 
            ticks: { 
              color: '#9ca3af',
              font: {
                size: 11
              }
            }, 
            grid: { 
              color: 'rgba(255,255,255,0.05)'
            },
            border: {
              display: false
            }
          },
          y: { 
            ticks: { 
              color: '#9ca3af',
              font: {
                size: 11
              },
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }, 
            grid: { 
              color: 'rgba(255,255,255,0.05)'
            },
            border: {
              display: false
            }
          }
        }
      }
    });
  }

  private updateChart(): void {
    if (!this.performanceChart) {
      this.initChart();
      return;
    }

    // Update chart data with new performance points
    const labels = this.performance.map(p => {
      const date = new Date(p.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    this.performanceChart.data.labels = labels;
    this.performanceChart.data.datasets[0].data = this.performance.map(p => p.value);
    this.performanceChart.update('none'); // 'none' for no animation on update
  }

  private calculateChange(): void {
    if (this.performance.length >= 2) {
      const firstValue = this.performance[0].value;
      const lastValue = this.performance[this.performance.length - 1].value;
      this.totalChange = lastValue - firstValue;
      this.totalChangePercent = firstValue > 0 ? (this.totalChange / firstValue) * 100 : 0;
    }
  }

  getWalletValue(wallet: Wallet): number {
    const price = this.portfolioService.getAssetPrice(wallet.symbol);
    return wallet.balance * price;
  }

  getWalletPercentage(wallet: Wallet): number {
    if (this.totalValue === 0) return 0;
    return (this.getWalletValue(wallet) / this.totalValue) * 100;
  }
}