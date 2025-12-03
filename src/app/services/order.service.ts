import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT',
  TAKE_PROFIT = 'TAKE_PROFIT'
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  FILLED = 'FILLED',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED'
}

export interface OrderCreate {
  symbol: string;
  order_type: OrderType;
  side: OrderSide;
  quantity: number;
  price?: number;
  stop_price?: number;
  time_in_force?: string;
}

export interface OrderResponse {
  id: number;
  user_id: number;
  symbol: string;
  order_type: OrderType;
  side: OrderSide;
  status: OrderStatus;
  quantity: number;
  filled_quantity: number;
  price?: number;
  stop_price?: number;
  average_fill_price?: number;
  total_fees: number;
  created_at: string;
  updated_at: string;
  filled_at?: string;
}

export interface OrderValidation {
  valid: boolean;
  estimated_cost: number;
  estimated_fee: number;
  available_cash?: number;
  available_shares?: number;
  sufficient_funds?: boolean;
  sufficient_shares?: boolean;
  error?: string;
}

export interface ExitPositionRequest {
  symbol: string;
  order_type: OrderType;
  price?: number;
}

export interface StockTransaction {
  id: number;
  user_id: number;
  order_id: number;
  symbol: string;
  transaction_type: string;
  quantity: number;
  price: number;
  fee: number;
  total_amount: number;
  executed_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;
  
  private ordersSubject = new BehaviorSubject<OrderResponse[]>([]);
  public orders$ = this.ordersSubject.asObservable();
  
  private pendingOrdersSubject = new BehaviorSubject<OrderResponse[]>([]);
  public pendingOrders$ = this.pendingOrdersSubject.asObservable();

  constructor(private http: HttpClient) {}

  createOrder(orderData: OrderCreate): Observable<OrderResponse> {
    console.log('Creating order:', orderData);
    return this.http.post<OrderResponse>(this.apiUrl, orderData).pipe(
      tap(order => {
        console.log('Order created:', order);
        this.refreshOrders();
      })
    );
  }

  validateOrder(orderData: OrderCreate): Observable<OrderValidation> {
    return this.http.post<OrderValidation>(`${this.apiUrl}/validate`, orderData).pipe(
      tap(validation => console.log('Order validation:', validation))
    );
  }

  getOrders(
    status?: OrderStatus,
    symbol?: string,
    orderType?: OrderType,
    side?: OrderSide,
    limit: number = 50,
    offset: number = 0
  ): Observable<OrderResponse[]> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (status) params = params.set('status', status);
    if (symbol) params = params.set('symbol', symbol);
    if (orderType) params = params.set('order_type', orderType);
    if (side) params = params.set('side', side);

    return this.http.get<OrderResponse[]>(this.apiUrl, { params }).pipe(
      tap(orders => this.ordersSubject.next(orders))
    );
  }

  getPendingOrders(symbol?: string): Observable<OrderResponse[]> {
    let params = new HttpParams();
    if (symbol) params = params.set('symbol', symbol);

    return this.http.get<OrderResponse[]>(`${this.apiUrl}/pending`, { params }).pipe(
      tap(orders => this.pendingOrdersSubject.next(orders))
    );
  }

  getOrder(orderId: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.apiUrl}/${orderId}`);
  }

  cancelOrder(orderId: number): Observable<OrderResponse> {
    return this.http.delete<OrderResponse>(`${this.apiUrl}/${orderId}`).pipe(
      tap(order => {
        console.log('Order cancelled:', order);
        this.refreshOrders();
      })
    );
  }

  exitPosition(request: ExitPositionRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/exit-position`, request).pipe(
      tap(response => {
        console.log('Position exited:', response);
        this.refreshOrders();
      })
    );
  }

  getOrderTransactions(orderId: number): Observable<StockTransaction[]> {
    return this.http.get<StockTransaction[]>(`${this.apiUrl}/${orderId}/transactions`);
  }

  getTransactionHistory(
    symbol?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
    offset: number = 0
  ): Observable<StockTransaction[]> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (symbol) params = params.set('symbol', symbol);
    if (startDate) params = params.set('start_date', startDate.toISOString());
    if (endDate) params = params.set('end_date', endDate.toISOString());

    return this.http.get<StockTransaction[]>(`${this.apiUrl}/history/transactions`, { params });
  }

  private refreshOrders(): void {
    this.getOrders().subscribe();
    this.getPendingOrders().subscribe();
  }

  parseSymbol(fullSymbol: string): string {
    const parts = fullSymbol.split(':');
    return parts.length === 2 ? parts[1] : fullSymbol;
  }
}