import { Component, Input, OnInit } from '@angular/core';

interface Trade {
  time: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
}

@Component({
  selector: 'app-recent-trades',
  templateUrl: './recent-trades.component.html',
  styleUrls: ['./recent-trades.component.css']
})
export class RecentTradesComponent implements OnInit {
  @Input() symbol: string = 'NASDAQ:TSLA';
  trades: Trade[] = [];

  ngOnInit() {
    this.loadSampleTrades();
  }

  loadSampleTrades() {
    this.trades = [
      { time: '10:01:23', price: 101.50, quantity: 2, side: 'buy' },
      { time: '10:01:25', price: 101.75, quantity: 1.5, side: 'sell' },
      { time: '10:01:30', price: 101.60, quantity: 3, side: 'buy' },
      { time: '10:01:40', price: 101.80, quantity: 0.5, side: 'sell' },
      { time: '10:01:55', price: 101.70, quantity: 4, side: 'buy' }
    ];
  }
}
