import { Component, OnInit, OnDestroy } from '@angular/core';
import { TradingService } from '../../core/services/trading.service';
import { MarketDataService, QuoteResponse } from '../../services/market-data.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.css']
})
export class TradeComponent implements OnInit, OnDestroy {
  // === DONNÉES AFFICHÉES ===
  selectedSymbol: string = 'NASDAQ:TSLA';
  currentPrice: number = 0;
  priceChange: number = 0;
  priceChangePercent: number = 0;
  high: number = 0;
  low: number = 0;
  volume: number = 0;
  open: number = 0;
  lastUpdated: Date | null = null;

  // === POPULAR SYMBOLS ===
  popularTabs = [
    { id: 'crypto', name: 'Crypto' },
    { id: 'stock', name: 'Stocks' },
    { id: 'forex', name: 'Forex' },
    { id: 'index', name: 'Indices' }
  ];
  selectedTab = 'crypto';
  popularSymbols: any[] = [];

  // === UI ===
  loading = false;
  error = '';

  private destroy$ = new Subject<void>();

  constructor(
    private tradingService: TradingService,
    private marketDataService: MarketDataService
  ) {}

  ngOnInit(): void {
    // Chargement du symbole sélectionné
    this.tradingService.selectedSymbol$
      .pipe(takeUntil(this.destroy$))
      .subscribe(symbol => {
        this.selectedSymbol = symbol;
        this.loadMarketData(symbol);
      });

    // Démarrage des mises à jour live
    this.startLiveUpdates();

    // Chargement des popular symbols au démarrage
    this.loadPopular('crypto');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== CHARGEMENT DES PRIX ====================
  private loadMarketData(fullSymbol: string): void {
  this.loading = true;
  this.error = '';

  const { symbol, assetClass } = this.marketDataService.parseSymbol(fullSymbol);
  const apiSymbol = this.getApiSymbol(symbol, assetClass);

  // CHANGEMENT ICI : on utilise mixed quotes → toujours les vrais prix
  const payload = [{ symbol: apiSymbol, asset_class: assetClass.toUpperCase() }];

  this.marketDataService.getMixedQuotes(payload).subscribe({
    next: (response: any) => {
      const quote = response.quotes[0];
      if (quote && quote.close > 0) {
        this.updatePriceDataFromMixed(quote);
      } else {
        this.loadMockData();
      }
      this.loading = false;
    },
    error: () => {
      this.loading = false;
      this.loadMockData();
    }
  });
}

  private updatePriceData(quote: QuoteResponse): void {
    this.currentPrice = quote.close;
    this.open = quote.open;
    this.high = quote.high;
    this.low = quote.low;
    this.volume = quote.volume || 0;

    this.priceChange = quote.close - quote.open;
    this.priceChangePercent = quote.open > 0 ? (this.priceChange / quote.open) * 100 : 0;
    this.lastUpdated = new Date();
    this.loading = false;
  }

  // ==================== LIVE UPDATES ====================
  private startLiveUpdates(): void {
  interval(3000) // toutes les 3 secondes (ou 2000 si tu veux plus rapide)
    .pipe(
      takeUntil(this.destroy$), // ← CORRIGÉ : takeUntil (pas "take Until")
      switchMap(() => {
        const { symbol, assetClass } = this.marketDataService.parseSymbol(this.selectedSymbol);
        const apiSymbol = this.getApiSymbol(symbol, assetClass);
        return this.marketDataService.getMixedQuotes([
          { symbol: apiSymbol, asset_class: assetClass.toUpperCase() }
        ]);
      })
    )
    .subscribe({
      next: (response: any) => {
        const quote = response.quotes[0];
        if (quote && quote.close > 0) {
          this.updatePriceDataFromMixed(quote);
        }
      },
      error: (err) => {
        console.log('Live update failed (normal if rate-limited)', err);
      }
    });
}

  // ==================== POPULAR SYMBOLS ====================
  loadPopular(assetType: string): void {
  this.selectedTab = assetType;
  this.popularSymbols = []; // reset

  (this.marketDataService as any).getPopularSymbols(assetType).subscribe({
    next: (response: any) => {
      // Ton backend renvoie : { data: { symbols: ["BTC", "ETH", ...] } }
      const symbolsList: string[] = response?.data?.symbols || [];

      // On construit la liste avec fullSymbol correct
      const temp = symbolsList.map((sym: string) => ({
        symbol: sym,
        fullSymbol: assetType === 'crypto'
          ? `BINANCE:${sym}USDT`
          : assetType === 'forex'
            ? `FX:${sym}`
            : `NASDAQ:${sym}`,
        name: sym,
        price: 0,
        change: 0,
        changePercent: 0
      }));

      this.popularSymbols = temp;

      // Si pas de symboles → on arrête ici
      if (temp.length === 0) return;

      // On récupère les prix réels via mixed quotes
      const payload = temp.map(item => {
        const { symbol, assetClass } = this.marketDataService.parseSymbol(item.fullSymbol);
        const apiSymbol = this.getApiSymbol(symbol, assetClass);
        return { symbol: apiSymbol, asset_class: assetClass.toUpperCase() };
      });

      this.marketDataService.getMixedQuotes(payload).subscribe({
        next: (priceRes: any) => {
          const priceMap = new Map<string, any>();
          priceRes.quotes.forEach((q: any) => priceMap.set(q.symbol, q));

          this.popularSymbols = this.popularSymbols.map(item => {
            const { symbol, assetClass } = this.marketDataService.parseSymbol(item.fullSymbol);
            const apiSymbol = this.getApiSymbol(symbol, assetClass);
            const quote = priceMap.get(apiSymbol);

            if (quote && quote.close > 0) {
              const change = quote.close - (quote.open || quote.close);
              const pct = quote.open ? (change / quote.open) * 100 : 0;
              return { ...item, price: quote.close, change, changePercent: pct };
            }
            return item;
          });
        },
       error: (err: any) => console.log('Mixed quotes failed for popular symbols:', err)
      });
    },
   error: (err: any) => {
    console.error('Failed to load popular symbols:', err);
    this.popularSymbols = [];
    }
  });
}

  private buildFullSymbol(symbol: string, assetType: string): string {
    if (assetType === 'crypto') return `BINANCE:${symbol}USDT`;
    if (assetType === 'forex') return `FX:${symbol}`;
    return `NASDAQ:${symbol}`;
  }

  selectSymbol(fullSymbol: string): void {
    this.tradingService.changeSymbol(fullSymbol);
  }

  // ==================== MOCK FALLBACK ====================
  private loadMockData(): void {
    const base = this.getBasePriceForSymbol(this.selectedSymbol);
    const change = (Math.random() - 0.5) * 20;

    this.currentPrice = base + change;
    this.open = base;
    this.high = base * 1.02;
    this.low = base * 0.98;
    this.volume = Math.floor(Math.random() * 50000000);
    this.priceChange = change;
    this.priceChangePercent = (change / base) * 100;
    this.lastUpdated = new Date();
  }

  private getBasePriceForSymbol(fullSymbol: string): number {
    const map: Record<string, number> = {
      'NASDAQ:TSLA': 426, 'NASDAQ:AAPL': 195, 'NASDAQ:GOOGL': 178,
      'BINANCE:BTCUSDT': 89500, 'BINANCE:ETHUSDT': 2980,
      'FX:EURUSD': 1.085
    };
    return map[fullSymbol] || 100;
  }

  // ==================== UTILS ====================
  getChangeClass(): string {
    return this.priceChange >= 0 ? 'positive' : 'negative';
  }

  private getApiSymbol(symbol: string, assetClass: string): string {
    if (assetClass.toLowerCase() === 'crypto' && symbol.endsWith('USDT')) {
      return symbol.replace('USDT', '');
    }
    return symbol;
  }

  refresh(): void {
    this.loadMarketData(this.selectedSymbol);
  }
  private updatePriceDataFromMixed(quote: any): void {
  this.currentPrice = quote.close;
  this.open = quote.open || quote.close;
  this.high = quote.high || quote.close;
  this.low = quote.low || quote.close;
  this.volume = quote.volume || 0;

  this.priceChange = quote.close - (quote.open || quote.close);
  this.priceChangePercent = quote.open ? (this.priceChange / quote.open) * 100 : 0;
  this.lastUpdated = new Date();
}
}