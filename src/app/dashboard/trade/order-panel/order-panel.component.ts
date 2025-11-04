import { Component, OnInit, OnDestroy } from '@angular/core';
import { TradingService } from '../../../core/services/trading.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-order-panel',
  templateUrl: './order-panel.component.html',
  styleUrls: ['./order-panel.component.css']
})
export class OrderPanelComponent implements OnInit, OnDestroy {
  symbol: string = 'NASDAQ:TSLA';
  currentPrice: number = 0;
  
  orderSide: 'buy' | 'sell' = 'buy';
  orderType: 'market' | 'limit' | 'stop' = 'market';

  price: number = 0;
  quantity: number = 0;
  stopLoss: number = 0;
  takeProfit: number = 0;

  balance: number = 100000; // Demo balance
  estimatedFees: number = 0;
  isProcessing: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  private destroy$ = new Subject<void>();

  constructor(private tradingService: TradingService) {}

  ngOnInit(): void {
    // Subscribe to selected symbol
    this.tradingService.selectedSymbol$
      .pipe(takeUntil(this.destroy$))
      .subscribe(symbol => {
        this.symbol = symbol;
      });

    // Subscribe to market data for current price
    this.tradingService.marketData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.currentPrice = data.price;
        if (this.orderType === 'limit' && this.price === 0) {
          this.price = data.price;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSymbolChange(event: any): void {
    this.symbol = event.target.value;
    this.tradingService.changeSymbol(this.symbol);
  }

  selectOrderSide(side: 'buy' | 'sell'): void {
    this.orderSide = side;
    this.clearMessages();
  }

  onOrderTypeChange(): void {
    if (this.orderType === 'market') {
      this.price = 0;
    } else if (this.orderType === 'limit') {
      this.price = this.currentPrice;
    }
    this.clearMessages();
  }

  calculateTotal(): number {
    if (this.orderType === 'market') {
      return this.currentPrice * this.quantity;
    }
    return this.price * this.quantity;
  }

  calculateFees(): number {
    const total = this.calculateTotal();
    this.estimatedFees = total * 0.001; // 0.1% fee
    return this.estimatedFees;
  }

  canPlaceOrder(): boolean {
    if (this.quantity <= 0) return false;
    if (this.orderType === 'limit' && this.price <= 0) return false;
    if (this.orderSide === 'buy' && this.calculateTotal() + this.calculateFees() > this.balance) {
      return false;
    }
    return true;
  }

  placeOrder(): void {
    if (!this.canPlaceOrder()) {
      this.errorMessage = 'Invalid order parameters or insufficient balance';
      setTimeout(() => this.clearMessages(), 3000);
      return;
    }

    this.isProcessing = true;
    this.clearMessages();

    const orderPrice = this.orderType === 'market' ? this.currentPrice : this.price;

    this.tradingService.executeTrade(this.orderSide, this.quantity, orderPrice)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isProcessing = false;
          this.successMessage = `${this.orderSide.toUpperCase()} order placed successfully! Order ID: ${result.orderId}`;
          
          // Update balance (demo)
          if (this.orderSide === 'buy') {
            this.balance -= (this.calculateTotal() + this.calculateFees());
          } else {
            this.balance += (this.calculateTotal() - this.calculateFees());
          }

          // Reset form
          this.quantity = 0;
          this.price = this.currentPrice;
          
          setTimeout(() => this.clearMessages(), 5000);
        },
        error: (error) => {
          this.isProcessing = false;
          this.errorMessage = 'Failed to place order. Please try again.';
          setTimeout(() => this.clearMessages(), 3000);
        }
      });
  }

  setPercentage(percent: number): void {
    const availableAmount = this.balance * (percent / 100);
    const priceToUse = this.orderType === 'market' ? this.currentPrice : this.price;
    if (priceToUse > 0) {
      this.quantity = Math.floor((availableAmount / priceToUse) * 100) / 100;
    }
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}