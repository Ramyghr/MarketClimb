import { Component } from '@angular/core';
import { TradingService } from '../../trading.service';

interface Asset {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  change24h: number;
}

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css']
})
export class PortfolioComponent {

  assets: Asset[] = [
    { symbol: 'NASDAQ:TSLA', name: 'Tesla', quantity: 5, price: 700, change24h: 1.5 },
    { symbol: 'NASDAQ:AAPL', name: 'Apple', quantity: 10, price: 175, change24h: -0.8 },
    { symbol: 'NASDAQ:GOOG', name: 'Google', quantity: 2, price: 2800, change24h: 0.3 }
  ];

  constructor(private tradingService: TradingService) {}

  selectAsset(asset: Asset) {
    this.tradingService.setSymbol(asset.symbol);
  }

  get totalValue(): number {
    return this.assets.reduce((sum, a) => sum + a.price * a.quantity, 0);
  }
}
