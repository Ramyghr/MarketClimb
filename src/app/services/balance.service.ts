// src/app/services/balance.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface CashBalanceResponse {
  cash_balance: number;
  available: number;
  locked: boolean;
}

@Injectable({ providedIn: 'root' })
export class BalanceService {
  private balanceSource = new BehaviorSubject<number>(100000);
  balance$ = this.balanceSource.asObservable();

  private apiUrl = `${environment.apiUrl}/portfolio/cash`;

  constructor(private http: HttpClient) {
    this.loadBalance();
    // Rafraîchissement toutes les 10 secondes (ou après chaque trade)
    interval(10000).subscribe(() => this.loadBalance());
  }

  private loadBalance(): void {
    this.http.get<CashBalanceResponse>(this.apiUrl).subscribe({
      next: (res) => this.balanceSource.next(res.available),
      error: () => {} // silent fail
    });
  }

  refresh(): void {
    this.loadBalance();
  }

  get balance(): number {
    return this.balanceSource.value;
  }
}