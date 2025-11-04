import { Component, OnInit, OnDestroy } from '@angular/core';
import { TradingService } from '../../core/services/trading.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.css']
})
export class TradeComponent implements OnInit, OnDestroy {
  selectedSymbol: string = 'NASDAQ:TSLA';
  currentPrice: number = 0;
  priceChange: number = 0;
  priceChangePercent: number = 0;
  high: number = 0;
  low: number = 0;
  volume: number = 0;

  private destroy$ = new Subject<void>();

  constructor(private tradingService: TradingService) {}

  ngOnInit(): void {
    // Subscribe to selected symbol changes
    this.tradingService.selectedSymbol$
      .pipe(takeUntil(this.destroy$))
      .subscribe(symbol => {
        this.selectedSymbol = symbol;
      });

    // Subscribe to real-time market data
    this.tradingService.marketData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.currentPrice = data.price;
        this.priceChange = data.change;
        this.priceChangePercent = data.changePercent;
        this.high = data.high;
        this.low = data.low;
        this.volume = data.volume;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}