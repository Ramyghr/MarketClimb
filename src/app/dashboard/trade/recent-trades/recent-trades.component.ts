import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { TradingService, Trade } from '../../../core/services/trading.service';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-recent-trades',
  templateUrl: './recent-trades.component.html',
  styleUrls: ['./recent-trades.component.css']
})
export class RecentTradesComponent implements OnInit, OnDestroy {
  @Input() symbol: string = 'NASDAQ:TSLA';
  trades: Trade[] = [];
  newTradeIndices: Set<number> = new Set();

  private destroy$ = new Subject<void>();

  constructor(private tradingService: TradingService) {}

  ngOnInit(): void {
    this.loadTrades();
    
    // Update trades every 2 seconds
    interval(2000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.addNewTrade();
      });

    // Listen for symbol changes
    this.tradingService.selectedSymbol$
      .pipe(takeUntil(this.destroy$))
      .subscribe(symbol => {
        this.symbol = symbol;
        this.loadTrades();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTrades(): void {
    this.tradingService.marketData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.trades = this.tradingService.generateRecentTrades(data.price);
      });
  }

  addNewTrade(): void {
    this.tradingService.marketData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        const now = new Date();
        const newTrade: Trade = {
          time: now.toLocaleTimeString('en-US', { hour12: false }),
          price: data.price + (Math.random() - 0.5) * 0.5,
          quantity: Math.random() * 5 + 0.1,
          side: Math.random() > 0.5 ? 'buy' : 'sell'
        };

        // Add to beginning and keep only last 20 trades
        this.trades.unshift(newTrade);
        if (this.trades.length > 20) {
          this.trades.pop();
        }

        // Highlight new trade
        this.newTradeIndices.add(0);
        setTimeout(() => {
          this.newTradeIndices.delete(0);
        }, 1000);

        // Update indices
        const updatedIndices = new Set<number>();
        this.newTradeIndices.forEach(index => {
          if (index + 1 < this.trades.length) {
            updatedIndices.add(index + 1);
          }
        });
        this.newTradeIndices = updatedIndices;
      });
  }

  isNewTrade(index: number): boolean {
    return this.newTradeIndices.has(index);
  }

  getTotalVolume(): number {
    return this.trades.reduce((sum, trade) => sum + trade.quantity, 0);
  }

  getBuyVolume(): number {
    return this.trades
      .filter(t => t.side === 'buy')
      .reduce((sum, trade) => sum + trade.quantity, 0);
  }

  getSellVolume(): number {
    return this.trades
      .filter(t => t.side === 'sell')
      .reduce((sum, trade) => sum + trade.quantity, 0);
  }
}