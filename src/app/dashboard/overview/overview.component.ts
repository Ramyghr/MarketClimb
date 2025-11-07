import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface Trade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  total: number;
  date: Date;
  profit?: number;
}

interface Position {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  profit: number;
  profitPercent: number;
}

interface TopMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit {
  
  // Portfolio Summary
  totalBalance = 125430.50;
  totalProfit = 12543.30;
  totalProfitPercent = 11.1;
  dayChange = 2341.20;
  dayChangePercent = 1.9;

  // Market Indices
  marketIndices: MarketIndex[] = [
    { symbol: 'SPY', name: 'S&P 500', price: 452.31, change: 5.21, changePercent: 1.17 },
    { symbol: 'QQQ', name: 'NASDAQ', price: 378.92, change: -2.14, changePercent: -0.56 },
    { symbol: 'DIA', name: 'DOW', price: 351.24, change: 3.45, changePercent: 0.99 },
    { symbol: 'IWM', name: 'Russell 2000', price: 189.67, change: 1.23, changePercent: 0.65 }
  ];

  // Recent Trades
  recentTrades: Trade[] = [
    { id: '1', symbol: 'AAPL', type: 'buy', shares: 50, price: 178.50, total: 8925.00, date: new Date(Date.now() - 3600000), profit: 125.50 },
    { id: '2', symbol: 'TSLA', type: 'sell', shares: 20, price: 242.80, total: 4856.00, date: new Date(Date.now() - 7200000), profit: 342.80 },
    { id: '3', symbol: 'MSFT', type: 'buy', shares: 30, price: 378.20, total: 11346.00, date: new Date(Date.now() - 10800000), profit: -45.30 },
    { id: '4', symbol: 'GOOGL', type: 'buy', shares: 15, price: 140.50, total: 2107.50, date: new Date(Date.now() - 14400000), profit: 78.90 },
    { id: '5', symbol: 'NVDA', type: 'sell', shares: 25, price: 485.30, total: 12132.50, date: new Date(Date.now() - 18000000), profit: 1245.75 }
  ];

  // Active Positions
  activePositions: Position[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', shares: 150, avgPrice: 175.30, currentPrice: 178.50, totalValue: 26775.00, profit: 480.00, profitPercent: 1.83 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', shares: 80, avgPrice: 372.50, currentPrice: 378.20, totalValue: 30256.00, profit: 456.00, profitPercent: 1.53 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 50, avgPrice: 138.20, currentPrice: 140.50, totalValue: 7025.00, profit: 115.00, profitPercent: 1.66 },
    { symbol: 'TSLA', name: 'Tesla Inc.', shares: 40, avgPrice: 238.90, currentPrice: 242.80, totalValue: 9712.00, profit: 156.00, profitPercent: 1.63 }
  ];

  // Top Gainers & Losers
  topGainers: TopMover[] = [
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 485.30, change: 28.45, changePercent: 6.23 },
    { symbol: 'AMD', name: 'Advanced Micro', price: 142.80, change: 7.90, changePercent: 5.86 },
    { symbol: 'COIN', name: 'Coinbase', price: 168.50, change: 8.23, changePercent: 5.14 }
  ];

  topLosers: TopMover[] = [
    { symbol: 'PYPL', name: 'PayPal', price: 58.40, change: -3.21, changePercent: -5.21 },
    { symbol: 'SNAP', name: 'Snap Inc.', price: 9.87, change: -0.48, changePercent: -4.63 },
    { symbol: 'RIVN', name: 'Rivian', price: 18.23, change: -0.76, changePercent: -4.00 }
  ];

  // Watchlist
  watchlist: WatchlistItem[] = [
    { symbol: 'BTC', price: 64235.50, change: 1234.20, changePercent: 1.96 },
    { symbol: 'ETH', price: 3456.80, change: -45.30, changePercent: -1.29 },
    { symbol: 'SPY', price: 452.31, change: 5.21, changePercent: 1.17 },
    { symbol: 'QQQ', price: 378.92, change: -2.14, changePercent: -0.56 }
  ];

  // Market News
  marketNews: NewsItem[] = [
    { id: '1', title: 'Federal Reserve Signals Rate Cut in Q4', source: 'Reuters', time: '15m ago', sentiment: 'positive' },
    { id: '2', title: 'Tech Stocks Rally on AI Investment News', source: 'Bloomberg', time: '1h ago', sentiment: 'positive' },
    { id: '3', title: 'Oil Prices Surge on Supply Concerns', source: 'CNBC', time: '2h ago', sentiment: 'negative' },
    { id: '4', title: 'Bitcoin Breaks $65K Resistance Level', source: 'CoinDesk', time: '3h ago', sentiment: 'positive' }
  ];

  // Chart data for portfolio performance
  performanceChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    values: [100000, 105000, 108000, 112000, 118000, 125430]
  };

  constructor(private router: Router) { }

  ngOnInit(): void {
    // TODO: Load real data from services
    // this.loadPortfolioData();
    // this.loadMarketData();
    // this.loadRecentTrades();
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  navigateToTrade(symbol?: string): void {
    if (symbol) {
      this.router.navigate(['/dashboard/trade'], { queryParams: { symbol } });
    } else {
      this.router.navigate(['/dashboard/trade']);
    }
  }

  navigateToPortfolio(): void {
    this.router.navigate(['/dashboard/portfolio']);
  }

  navigateToFunding(): void {
    this.router.navigate(['/dashboard/account']);
  }

  viewAllNews(): void {
    // Open news overlay
    console.log('Opening news overlay...');
  }

  getSentimentIcon(sentiment: string): string {
    switch(sentiment) {
      case 'positive': return '📈';
      case 'negative': return '📉';
      default: return '➖';
    }
  }

  getSentimentClass(sentiment: string): string {
    return `sentiment-${sentiment}`;
  }
  
  get chartPoints(): string {
  return this.performanceChartData.labels
    .map((_, i) => `${i * 80},${80 - (this.performanceChartData.values[i] - 95000) / 500}`)
    .join(' ');
}

}