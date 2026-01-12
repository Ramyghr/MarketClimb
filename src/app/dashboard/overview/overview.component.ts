import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PortfolioService } from '../../core/services/portfolio/portfolio.service';
import { MarketDataService, QuoteResponse } from '../../services/market-data.service';
import { NewsService } from '../../services/news.service';
import { WatchlistService } from '../../services/watchlist.service';

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface Trade {
  id?: number;
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
  id: number;
  title: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  published_at?: string;
}

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Portfolio Summary
  totalBalance = 0;
  totalProfit = 0;
  totalProfitPercent = 0;
  dayChange = 0;
  dayChangePercent = 0;
  marginUsed = 0;
  marginAvailable = 0;

  // Market Indices
  marketIndices: MarketIndex[] = [];

  // Recent Trades
  recentTrades: Trade[] = [];

  // Active Positions
  activePositions: Position[] = [];

  // Top Gainers & Losers
  topGainers: TopMover[] = [];
  topLosers: TopMover[] = [];

  // Watchlist
  watchlist: WatchlistItem[] = [];

  // Market News
  marketNews: NewsItem[] = [];

  // Chart data for portfolio performance
  performanceChartData = {
    labels: [] as string[],
    values: [] as number[]
  };

  // Loading states
  isLoadingPortfolio = true;
  isLoadingMarket = true;
  isLoadingNews = true;
  isLoadingWatchlist = true;

  constructor(
    private router: Router,
    private portfolioService: PortfolioService,
    private marketDataService: MarketDataService,
    private newsService: NewsService,
    private watchlistService: WatchlistService
  ) {}

  ngOnInit(): void {
    this.loadPortfolioData();
    this.loadMarketIndices();
    this.loadNews();
    this.loadWatchlist();
    
    // Auto-refresh every 30 seconds
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============= DATA LOADING =============

  loadPortfolioData(): void {
    this.isLoadingPortfolio = true;

    // Subscribe to portfolio overview
    this.portfolioService.overview$
      .pipe(takeUntil(this.destroy$))
      .subscribe(overview => {
        if (overview) {
          this.totalBalance = overview.total_value || 0;
          this.totalProfit = overview.total_pnl || 0;
          this.totalProfitPercent = overview.total_value > 0 
            ? (overview.total_pnl / overview.total_value) * 100 
            : 0;
          this.dayChange = overview.today_pnl || 0;
          this.dayChangePercent = overview.today_pnl_pct || 0;
          this.marginUsed = overview.margin_used || 0;
          this.marginAvailable = overview.margin_available || 0;
          this.isLoadingPortfolio = false;
        }
      });

    // Subscribe to holdings for active positions
    this.portfolioService.holdings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(holdings => {
        this.activePositions = holdings.slice(0, 4).map(h => ({
          symbol: h.symbol,
          name: this.getCompanyName(h.symbol),
          shares: h.quantity,
          avgPrice: h.avg_cost,
          currentPrice: h.current_price,
          totalValue: h.market_value,
          profit: h.unrealized_pnl,
          profitPercent: h.unrealized_pnl_pct
        }));
      });

    // Subscribe to transactions for recent trades
    this.portfolioService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(transactions => {
        this.recentTrades = transactions.slice(0, 5).map(t => ({
          id: t.id,
          symbol: t.symbol,
          type: t.side,
          shares: t.quantity,
          price: t.price,
          total: t.total_amount || (t.quantity * t.price),
          date: new Date(t.date),
          profit: this.calculateTradeProfit(t)
        }));
      });

    // Subscribe to performance for chart
    this.portfolioService.performance$
      .pipe(takeUntil(this.destroy$))
      .subscribe(performance => {
        if (performance.length > 0) {
          this.performanceChartData = {
            labels: performance.map(p => {
              const date = new Date(p.date);
              return date.toLocaleDateString('en-US', { month: 'short' });
            }),
            values: performance.map(p => p.value)
          };
        }
      });

    // Load initial data
    this.portfolioService.loadAll();
  }

  loadMarketIndices(): void {
    this.isLoadingMarket = true;
    
    const indices = [
      { symbol: 'SPY', name: 'S&P 500', assetClass: 'STOCK' },
      { symbol: 'QQQ', name: 'NASDAQ', assetClass: 'STOCK' },
      { symbol: 'DIA', name: 'DOW', assetClass: 'STOCK' },
      { symbol: 'IWM', name: 'Russell 2000', assetClass: 'STOCK' }
    ];

    const symbolsData = indices.map(idx => ({
      symbol: idx.symbol,
      asset_class: idx.assetClass
    }));

    this.marketDataService.getMixedQuotes(symbolsData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.marketIndices = response.quotes.map((quote, index) => {
            // Calculate change and change_percent from the quote data
            const change = this.calculateChange(quote);
            const changePercent = this.calculateChangePercent(quote);

            return {
              symbol: quote.symbol,
              name: indices[index].name,
              price: quote.close,
              change: change,
              changePercent: changePercent
            };
          });
          this.isLoadingMarket = false;
        },
        error: (error) => {
          console.error('Error loading market indices:', error);
          this.isLoadingMarket = false;
          // Set default values on error
          this.marketIndices = indices.map(idx => ({
            symbol: idx.symbol,
            name: idx.name,
            price: 0,
            change: 0,
            changePercent: 0
          }));
        }
      });
  }

  loadNews(): void {
    this.isLoadingNews = true;
    this.newsService.getFinancialNews('stock market', 'en', 4)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (articles) => {
          this.marketNews = articles.map(article => ({
            id: article.id,
            title: article.title,
            source: article.source || 'Unknown',
            time: this.getTimeAgo(new Date(article.published_at || article.created_at)),
            sentiment: (article.sentiment?.toLowerCase() as 'positive' | 'negative' | 'neutral') || 'neutral',
            published_at: article.published_at
          }));
          this.isLoadingNews = false;
        },
        error: (error) => {
          console.error('Error loading news:', error);
          this.isLoadingNews = false;
          this.marketNews = [];
        }
      });
  }

  loadWatchlist(): void {
    this.isLoadingWatchlist = true;
    this.watchlistService.getWatchlists()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (watchlists) => {
          if (watchlists.length > 0) {
            const firstWatchlist = watchlists[0];
            
            // Extract symbols and get quotes
            const items = firstWatchlist.items.slice(0, 4);
            
            this.watchlist = items.map(item => {
              const quote = item.quotes && item.quotes.length > 0 ? item.quotes[0] : null;
              return {
                symbol: item.symbol,
                price: quote?.price || 0,
                change: quote?.change || 0,
                changePercent: quote?.change_percent || 0
              };
            });
          }
          this.isLoadingWatchlist = false;
        },
        error: (error) => {
          console.error('Error loading watchlist:', error);
          this.isLoadingWatchlist = false;
          this.watchlist = [];
        }
      });
  }

  // ============= AUTO REFRESH =============

  setupAutoRefresh(): void {
    setInterval(() => {
      this.portfolioService.refresh();
      this.loadMarketIndices();
    }, 30000); // Refresh every 30 seconds
  }

  // ============= HELPER METHODS =============

  /**
   * Calculate change from quote data (close - open)
   */
  private calculateChange(quote: QuoteResponse): number {
    if (quote.open && quote.close) {
      return quote.close - quote.open;
    }
    return 0;
  }

  /**
   * Calculate change percent from quote data
   */
  private calculateChangePercent(quote: QuoteResponse): number {
    if (quote.open && quote.close && quote.open > 0) {
      return ((quote.close - quote.open) / quote.open) * 100;
    }
    return 0;
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  getCompanyName(symbol: string): string {
    const companies: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corp.',
      'GOOGL': 'Alphabet Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corp.',
      'AMZN': 'Amazon.com Inc.',
      'META': 'Meta Platforms Inc.',
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum'
    };
    return companies[symbol] || symbol;
  }

  calculateTradeProfit(transaction: any): number {
    // This would need more sophisticated logic to calculate actual profit
    // For now, return a placeholder or 0
    return 0;
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
    if (!this.performanceChartData.values.length) return '';
    
    const values = this.performanceChartData.values;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    return values.map((val, i) => {
      const x = (i / (values.length - 1)) * 400;
      const y = 80 - ((val - min) / range) * 60;
      return `${x},${y}`;
    }).join(' ');
  }

  // ============= NAVIGATION =============

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
    this.router.navigate(['/dashboard/news']);
  }
}