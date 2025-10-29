// src/app/trading.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TradingService {

  // Holds the currently selected symbol, default to TSLA
  private selectedSymbol = new BehaviorSubject<string>('NASDAQ:TSLA');

  // Observable that components can subscribe to
  selectedSymbol$ = this.selectedSymbol.asObservable();

  constructor() { }

  // Update the selected symbol
  setSymbol(symbol: string) {
    this.selectedSymbol.next(symbol);
  }
}
