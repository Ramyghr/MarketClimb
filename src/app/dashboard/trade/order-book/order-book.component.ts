import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { TradingService, Order } from '../../../core/services/trading.service';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-order-book',
  templateUrl: './order-book.component.html',
  styleUrls: ['./order-book.component.css']
})
export class OrderBookComponent implements OnInit, OnDestroy {
  @Input() symbol: string = 'NASDAQ:TSLA';

  buyOrders: Order[] = [];
  sellOrders: Order[] = [];
  spreadAmount: number = 0;
  spreadPercent: number = 0;

  private destroy$ = new Subject<void>();

  constructor(private tradingService: TradingService) {}

  ngOnInit(): void {
    this.loadOrderBook();
    
    // Update order book every 3 seconds
    interval(3000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadOrderBook();
      });

    // Listen for symbol changes
    this.tradingService.selectedSymbol$
      .pipe(takeUntil(this.destroy$))
      .subscribe(symbol => {
        this.symbol = symbol;
        this.loadOrderBook();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrderBook(): void {
    this.tradingService.marketData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        const orderBook = this.tradingService.generateOrderBook(data.price);
        this.buyOrders = orderBook.buyOrders;
        this.sellOrders = orderBook.sellOrders;
        
        // Calculate spread
        if (this.sellOrders.length > 0 && this.buyOrders.length > 0) {
          const bestAsk = this.sellOrders[0].price;
          const bestBid = this.buyOrders[0].price;
          this.spreadAmount = bestAsk - bestBid;
          this.spreadPercent = (this.spreadAmount / bestBid) * 100;
        }
      });
  }

  onOrderClick(order: Order, side: 'buy' | 'sell'): void {
    console.log(`Clicked ${side} order:`, order);
    // TODO: Emit event to fill order form with this price
  }

  getTotalQuantity(orders: Order[]): number {
    return orders.reduce((sum, order) => sum + order.quantity, 0);
  }
}