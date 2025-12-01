import { Component, OnInit, OnDestroy } from '@angular/core';
import { TradingService, MarketData } from '../../../core/services/trading.service';
import { WatchlistService, Watchlist, WatchlistItem } from 'src/app/services/watchlist.service';
import { MarketDataService, QuoteResponse } from 'src/app/services/market-data.service';
import { Subscription, interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css']
})
export class WatchlistComponent implements OnInit, OnDestroy {
  watchlists: Watchlist[] = [];
  selectedWatchlist: Watchlist | null = null;
  marketData: MarketData[] = [];

  showCreateModal = false;
  showAddSymbolModal = false;
  newWatchlistName = '';
  searchQuery = '';
  searchResults: any[] = [];
  loading = false;

  private destroy$ = new Subject<void>();
  private subscriptions: Subscription[] = [];

  constructor(
    private tradingService: TradingService,
    private watchlistService: WatchlistService,
    private marketDataService: MarketDataService
  ) {}


  ngOnInit(): void {
    this.loadWatchlists();

    this.watchlistService.selectedWatchlist$
      .pipe(takeUntil(this.destroy$))
      .subscribe(wl => {
        this.selectedWatchlist = wl;
        if (wl) this.loadWatchlistData(wl);
      });

    this.watchlistService.watchlists$
      .pipe(takeUntil(this.destroy$))
      .subscribe(wls => this.watchlists = wls);

    // Refresh toutes les 5 secondes
    this.subscriptions.push(
      interval(5000).subscribe(() => {
        if (this.selectedWatchlist) this.refreshMarketData();
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  // ==================== CHARGEMENT DES DONNÉES ====================
  private loadWatchlists(): void {
    this.watchlistService.getWatchlists()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  loadWatchlistData(watchlist: Watchlist): void {
  this.marketData = watchlist.items.map(item => {
    // PRIORITÉ 1 : utiliser asset_type du backend (c'est LA source de vérité)
    let assetClass = 'STOCK';
    if (item.asset_type) {
      assetClass = item.asset_type.toUpperCase();
    } else {
      // PRIORITÉ 2 : fallback intelligent via parseSymbol
      const parsed = this.marketDataService.parseSymbol(item.symbol);
      assetClass = parsed.assetClass;
    }

    return {
      symbol: item.symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      high: 0,
      low: 0,
      open: 0,
      assetClass // ← on garde ça pour le debug (optionnel)
    };
  });

  this.fetchLivePrices();
}



  private fetchLivePrices(): void {
  if (!this.marketData.length) return;

  const payload = this.marketData.map(item => {
    let assetClass = 'STOCK';

    // 1. D'abord : depuis l'objet item (backend)
    const backendItem = this.selectedWatchlist?.items.find(i => i.symbol === item.symbol);
    if (backendItem?.asset_type) {
      assetClass = backendItem.asset_type.toUpperCase();
    } else {
      // 2. Sinon : parseSymbol
      assetClass = this.marketDataService.parseSymbol(item.symbol).assetClass;
    }

    const apiSymbol = this.marketDataService.getApiSymbol(
      this.marketDataService.parseSymbol(item.symbol).symbol,
      assetClass
    );

    return {
      symbol: apiSymbol,
      asset_class: assetClass // ← CRYPTO ou STOCK
    };
  });

  console.log('Envoi payload mixed quotes →', payload); // ← TU VERRAS CRYPTO !

  this.marketDataService.getMixedQuotes(payload).subscribe({
    next: (response: any) => {
      // ... ton code existant (inchangé)
      const priceMap = new Map<string, QuoteResponse>();
      response.quotes.forEach((q: QuoteResponse) => priceMap.set(q.symbol, q));

      this.marketData = this.marketData.map(item => {
        const parsed = this.marketDataService.parseSymbol(item.symbol);
        const apiSymbol = this.marketDataService.getApiSymbol(parsed.symbol, parsed.assetClass);
        const quote = priceMap.get(apiSymbol);

        if (!quote || quote.close === 0) {
          const base = this.getBasePriceForSymbol(item.symbol);
          const change = (Math.random() - 0.5) * 10;
          return { ...item, price: base + change, change, changePercent: (change / base) * 100 };
        }

        const change = quote.close - quote.open;
        const changePercent = quote.open ? (change / quote.open) * 100 : 0;

        return {
          ...item,
          price: quote.close,
          open: quote.open,
          high: quote.high,
          low: quote.low,
          volume: quote.volume || 0,
          change,
          changePercent
        };
      });
    },
    error: (err) => {
      console.error('Mixed quotes failed', err);
    }
  });
}

  refreshMarketData(): void {
    if (!this.selectedWatchlist) return;
    this.watchlistService.getWatchlist(this.selectedWatchlist.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(wl => this.loadWatchlistData(wl));
  }

  // ==================== GESTION WATCHLIST & MODALES ====================
  openCreateModal(): void {
    this.showCreateModal = true;
    this.newWatchlistName = '';
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createWatchlist(): void {
    if (!this.newWatchlistName.trim()) return;
    this.watchlistService.createWatchlist(this.newWatchlistName.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeCreateModal());
  }

  openAddSymbolModal(): void {
    if (!this.selectedWatchlist) return;
    this.showAddSymbolModal = true;
    this.searchQuery = '';
    this.searchResults = [];
  }

  closeAddSymbolModal(): void {
    this.showAddSymbolModal = false;
  }

  searchSymbols(): void {
    if (this.searchQuery.length < 2) {
      this.searchResults = [];
      return;
    }
    this.watchlistService.searchSymbols(this.searchQuery)
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => this.searchResults = results);
  }

  addSymbol(symbol: string): void {
    if (!this.selectedWatchlist) return;
    this.watchlistService.addToWatchlist(this.selectedWatchlist.id, symbol)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.closeAddSymbolModal());
  }

  removeSymbol(symbol: string, event: Event): void {
    event.stopPropagation();
    if (!this.selectedWatchlist || !confirm(`Remove ${symbol}?`)) return;
    this.watchlistService.removeFromWatchlist(this.selectedWatchlist.id, symbol)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  selectWatchlist(watchlist: Watchlist): void {
    this.watchlistService.selectWatchlist(watchlist);
  }

  selectSymbol(symbol: string): void {
    this.tradingService.changeSymbol(symbol);
  }

  // ==================== MOCK FALLBACK ====================
  private useMockData(): void {
    const mock = ['NASDAQ:TSLA', 'NASDAQ:AAPL', 'BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'FX:EURUSD'];
    this.marketData = mock.map(s => {
      const base = this.getBasePriceForSymbol(s);
      const change = (Math.random() - 0.5) * 8;
      return {
        symbol: s,
        price: base + change,
        change,
        changePercent: (change / base) * 100,
        volume: Math.floor(Math.random() * 10000000),
        high: base * 1.02,
        low: base * 0.98,
        open: base
      };
    });
  }

  private getBasePriceForSymbol(symbol: string): number {
    const map: Record<string, number> = {
      'NASDAQ:TSLA': 426,
      'NASDAQ:AAPL': 195,
      'BINANCE:BTCUSDT': 89500,
      'BINANCE:ETHUSDT': 2980,
      'FX:EURUSD': 1.085
    };
    return map[symbol] || 100;
  }

  // ==================== UTILS ====================
  getChangeClass(change: number): string {
    return change >= 0 ? 'positive' : 'negative';
  }

  formatPercent(percent: number): string {
    return (percent >= 0 ? '+' : '') + percent.toFixed(2) + '%';
  }
}