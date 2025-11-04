import { Component, OnInit, OnDestroy } from '@angular/core';
import { TradingService, MarketData } from '../../../core/services/trading.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css']
})
export class WatchlistComponent implements OnInit, OnDestroy {
  watchlistSymbols: string[] = ['NASDAQ:TSLA', 'NASDAQ:AAPL', 'BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'FX:EURUSD'];
  marketData: MarketData[] = [];

  private subscriptions: Subscription[] = [];

  constructor(private tradingService: TradingService) {}

  ngOnInit(): void {
    this.loadWatchlist();

    // Refresh every 3 seconds
    const sub = interval(3000).subscribe(() => this.loadWatchlist());
    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  loadWatchlist(): void {
    this.marketData = this.watchlistSymbols.map(symbol => {
      const basePrice = this.tradingService['getBasePriceForSymbol'](symbol);
      const change = (Math.random() - 0.5) * 2; // simulate small change
      const price = basePrice + change;
      const changePercent = ((price - basePrice) / basePrice) * 100;
      return { symbol, price, change, changePercent, volume: 0, high: 0, low: 0, open: basePrice };
    });
  }

  selectSymbol(symbol: string): void {
    this.tradingService.changeSymbol(symbol);
  }
}
