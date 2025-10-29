import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-order-panel',
  templateUrl: './order-panel.component.html',
  styleUrls: ['./order-panel.component.css']
})
export class OrderPanelComponent {
  @Input() symbol: string = 'NASDAQ:TSLA';
  @Output() symbolChange = new EventEmitter<string>();

  orderSide: 'buy' | 'sell' = 'buy';
  orderType: 'market' | 'limit' | 'stop' = 'market';

  price: number = 0;
  quantity: number = 0;
  stopLoss: number = 0;
  takeProfit: number = 0;

  buy() {
    console.log(`Buying ${this.quantity} of ${this.symbol} at ${this.price}`);
  }

  sell() {
    console.log(`Selling ${this.quantity} of ${this.symbol} at ${this.price}`);
  }

  calculateTotal() {
    if(this.orderType==='market') return 0;
    return this.price * this.quantity;
  }

  onSymbolChange(event: any) {
    this.symbol = event.target.value;
    this.symbolChange.emit(this.symbol);
  }
}
