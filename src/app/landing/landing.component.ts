import { Component, OnInit } from '@angular/core';
import * as AOS from 'aos';

interface Asset {
  name: string;
  price: number;
  change: number; // percentage change
  currency: string;
}

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {

  assets: Asset[] = [
  { name: 'Bitcoin', price: 58000, change: 2.3, currency: 'USD' },
  { name: 'Apple (AAPL)', price: 145.32, change: -1.1, currency: 'USD' },
  { name: 'Gold', price: 1750, change: 0.5, currency: 'USD' },
  { name: 'Tesla (TSLA)', price: 720, change: 1.8, currency: 'USD' },
  { name: 'Ethereum', price: 4100, change: -0.7, currency: 'USD' },
  { name: 'Crude Oil', price: 82.5, change: 0.2, currency: 'USD' }
];


  constructor() { }

  ngOnInit(): void {
    AOS.init({
      duration: 1000,
      once: true,
    });

    // Optional: refresh prices from API every 30s
    // setInterval(() => { this.updateAssetPrices(); }, 30000);
  }

  // Example for live update (replace with API call)
  updateAssetPrices() {
    this.assets.forEach(asset => {
      const randomChange = (Math.random() * 2 - 1).toFixed(2); // ±1%
      asset.change = +randomChange;
      asset.price = +(asset.price * (1 + asset.change / 100)).toFixed(2);
    });
  }

}
