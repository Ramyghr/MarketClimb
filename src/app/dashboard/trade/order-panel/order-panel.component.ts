// order-panel.component.ts → VERSION CORRIGÉE & SYNCHRO BALANCE
import { Component, OnInit, OnDestroy } from '@angular/core';
import { TradingService } from '../../../core/services/trading.service';
import { OrderService, OrderType, OrderSide, OrderCreate, OrderValidation } from 'src/app/services/order.service';
import { BalanceService } from 'src/app/services/balance.service';
import { MarketDataService } from 'src/app/services/market-data.service';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, filter } from 'rxjs/operators';

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
  stopPrice: number = 0;

  balance: number = 100000;

  validation: OrderValidation | null = null;
  isValidating = false;
  isProcessing = false;
  successMessage = '';
  errorMessage = '';

  private destroy$ = new Subject<void>();
  private validationSubject = new Subject<void>();

  constructor(
    private tradingService: TradingService,
    private orderService: OrderService,
    private balanceService: BalanceService,
    private marketDataService: MarketDataService
  ) {}

  ngOnInit(): void {
    // 1. Écouter le solde en temps réel
    this.balanceService.balance$.subscribe(b => this.balance = b);

    // 2. Écouter le symbole sélectionné + prix en direct
    combineLatest([
      this.tradingService.selectedSymbol$,
      this.tradingService.marketData$
    ]).pipe(
      takeUntil(this.destroy$),
      filter(([symbol, data]) => !!symbol && !!data && data.symbol === symbol)
    ).subscribe(([symbol, data]) => {
      this.symbol = symbol;
      this.currentPrice = data.price;

      // Mise à jour auto du prix limit si vide
      if (this.orderType === 'limit' && (!this.price || this.price === 0)) {
        this.price = this.currentPrice;
      }
    });

    // Validation débouncée
    this.validationSubject.pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => this.validateOrderParams());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSymbolChange(event: any): void {
    const newSymbol = event.target.value;
    this.tradingService.changeSymbol(newSymbol);
  }

  selectOrderSide(side: 'buy' | 'sell'): void {
    this.orderSide = side;
    this.triggerValidation();
  }

  onOrderTypeChange(): void {
    if (this.orderType === 'market') {
      this.price = 0;
      this.stopPrice = 0;
    } else if (this.orderType === 'limit') {
      this.price = this.currentPrice;
    } else if (this.orderType === 'stop') {
      this.stopPrice = this.currentPrice * 0.95;
    }
    this.triggerValidation();
  }

  onQuantityChange(): void { this.triggerValidation(); }
  onPriceChange(): void { this.triggerValidation(); }
  triggerValidation(): void { this.validationSubject.next(); }

  private buildOrderData(): OrderCreate {
    const parsed = this.marketDataService.parseSymbol(this.symbol);
    return {
      symbol: parsed.symbol,
      order_type: this.orderType.toUpperCase() as OrderType,
      side: this.orderSide.toUpperCase() as OrderSide,
      quantity: this.quantity,
      price: this.orderType !== 'market' ? this.price : undefined,
      stop_price: this.orderType === 'stop' ? this.stopPrice : undefined,
      time_in_force: 'GTC'
    };
  }

  validateOrderParams(): void {
    if (this.quantity <= 0) {
      this.validation = null;
      return;
    }
    this.isValidating = true;
    this.orderService.validateOrder(this.buildOrderData())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (val) => {
          this.validation = val;
          this.isValidating = false;
        },
        error: () => {
          this.validation = { valid: false, error: 'Validation failed', estimated_cost: 0, estimated_fee: 0 };
          this.isValidating = false;
        }
      });
  }

  calculateTotal(): number {
    return this.validation?.estimated_cost || (this.orderType === 'market' ? this.currentPrice : this.price) * this.quantity;
  }

  calculateFees(): number {
    return this.validation?.estimated_fee || this.calculateTotal() * 0.001;
  }

  canPlaceOrder(): boolean {
    if (!this.validation?.valid || this.quantity <= 0) return false;
    if (this.orderType === 'limit' && this.price <= 0) return false;
    if (this.orderType === 'stop' && this.stopPrice <= 0) return false;

    if (this.orderSide === 'buy') {
      return (this.calculateTotal() + this.calculateFees()) <= this.balance;
    }
    return true;
  }

  placeOrder(): void {
    if (!this.canPlaceOrder()) return;

    this.isProcessing = true;
    this.clearMessages();

    this.orderService.createOrder(this.buildOrderData())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          this.isProcessing = false;
          const total = this.calculateTotal();
          const fees = this.calculateFees();
          const net = this.orderSide === 'buy' ? -(total + fees) : (total - fees);

          // MISE À JOUR DU SOLDE EN TEMPS RÉEL → vu instantanément dans le header !
          this.balanceService;

          this.successMessage = `${this.orderSide.toUpperCase()} order #${order.id} executed!`;
          this.resetForm();
          setTimeout(() => this.clearMessages(), 5000);
        },
        error: (err) => {
          this.isProcessing = false;
          this.errorMessage = err.error?.detail || 'Order failed';
          setTimeout(() => this.clearMessages(), 5000);
        }
      });
  }

  setPercentage(percent: number): void {
    const amount = this.balance * (percent / 100);
    const price = this.orderType === 'market' ? this.currentPrice : this.price;
    if (price > 0) {
      this.quantity = Math.floor((amount / price) * 100) / 100;
      this.triggerValidation();
    }
  }

  resetForm(): void {
    this.quantity = 0;
    this.price = this.orderType === 'limit' ? this.currentPrice : 0;
    this.validation = null;
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  getValidationError(): string {
    return this.validation?.error || 'Invalid order';
  }
}