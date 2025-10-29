import { Component, Input, OnInit } from '@angular/core';

interface Order {
  price: number;
  quantity: number;
}

@Component({
  selector: 'app-order-book',
  templateUrl: './order-book.component.html',
  styleUrls: ['./order-book.component.css']
})
export class OrderBookComponent implements OnInit {
  @Input() symbol: string = 'NASDAQ:TSLA';

  buyOrders: Order[] = [];
  sellOrders: Order[] = [];

  ngOnInit(): void {
    this.loadSampleOrders();
  }

  loadSampleOrders() {
    // Sample buy orders
    this.buyOrders = [
      { price: 101.25, quantity: 5 },
      { price: 101.00, quantity: 3.5 },
      { price: 100.75, quantity: 10 },
      { price: 100.50, quantity: 2.2 },
      { price: 100.25, quantity: 7 }
    ];

    // Sample sell orders
    this.sellOrders = [
      { price: 102.00, quantity: 4 },
      { price: 102.25, quantity: 6 },
      { price: 102.50, quantity: 3 },
      { price: 102.75, quantity: 1.5 },
      { price: 103.00, quantity: 8 }
    ];
  }
}
