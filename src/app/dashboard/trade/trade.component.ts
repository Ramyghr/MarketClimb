import { Component, OnInit } from '@angular/core';
import { TradingService } from '../../trading.service';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.css']
})
export class TradeComponent implements OnInit {
  selectedSymbol: string = 'NASDAQ:TSLA';

  constructor(private tradingService: TradingService) {}

  ngOnInit() {
    this.tradingService.selectedSymbol$.subscribe(symbol => {
      this.selectedSymbol = symbol;
    });
  }
  
 buy() {
    console.log(`Buying ${this.selectedSymbol}`);
    // TODO: Add actual buy logic here
  }

  sell() {
    console.log(`Selling ${this.selectedSymbol}`);
    // TODO: Add actual sell logic here
  }
}
