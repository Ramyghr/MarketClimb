// bot-trades.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BotTradingService, BotTrade } from '../../../services/bot-trading.service';

@Component({
  selector: 'app-bot-trades',
  template: `
    <div class="bot-trades">
      <div class="trades-header">
        <h3>
          <mat-icon>swap_horiz</mat-icon>
          Trade History
        </h3>
        <div class="header-actions">
          <mat-button-toggle-group [(value)]="filterType" (change)="loadTrades()">
            <mat-button-toggle value="all">All</mat-button-toggle>
            <mat-button-toggle value="open">Open</mat-button-toggle>
            <mat-button-toggle value="closed">Closed</mat-button-toggle>
          </mat-button-toggle-group>
          <button mat-stroked-button (click)="refreshTrades()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      </div>

      <div class="trades-list" *ngIf="!loading && trades.length > 0">
        <mat-table [dataSource]="trades">
          <ng-container matColumnDef="time">
            <mat-header-cell *matHeaderCellDef>Time</mat-header-cell>
            <mat-cell *matCellDef="let trade">
              {{ trade.opened_at | date:'short' }}
            </mat-cell>
          </ng-container>

          <ng-container matColumnDef="symbol">
            <mat-header-cell *matHeaderCellDef>Symbol</mat-header-cell>
            <mat-cell *matCellDef="let trade">{{ trade.symbol }}</mat-cell>
          </ng-container>

          <ng-container matColumnDef="action">
            <mat-header-cell *matHeaderCellDef>Action</mat-header-cell>
            <mat-cell *matCellDef="let trade">
              <span [class.buy]="trade.action === 'BUY'" [class.sell]="trade.action === 'SELL'">
                {{ trade.action }}
              </span>
            </mat-cell>
          </ng-container>

          <ng-container matColumnDef="quantity">
            <mat-header-cell *matHeaderCellDef>Quantity</mat-header-cell>
            <mat-cell *matCellDef="let trade">{{ trade.quantity }}</mat-cell>
          </ng-container>

          <ng-container matColumnDef="entryPrice">
            <mat-header-cell *matHeaderCellDef>Entry</mat-header-cell>
            <mat-cell *matCellDef="let trade">{{ trade.entry_price | currency }}</mat-cell>
          </ng-container>

          <ng-container matColumnDef="exitPrice">
            <mat-header-cell *matHeaderCellDef>Exit</mat-header-cell>
            <mat-cell *matCellDef="let trade">
              {{ trade.exit_price ? (trade.exit_price | currency) : '-' }}
            </mat-cell>
          </ng-container>

          <ng-container matColumnDef="pnl">
            <mat-header-cell *matHeaderCellDef>P&L</mat-header-cell>
            <mat-cell *matCellDef="let trade">
              <div [class.positive]="trade.pnl > 0" [class.negative]="trade.pnl < 0">
                {{ trade.pnl | currency }}
                <small>({{ trade.pnl_pct | number:'1.2-2' }}%)</small>
              </div>
            </mat-cell>
          </ng-container>

          <ng-container matColumnDef="status">
            <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
            <mat-cell *matCellDef="let trade">
              <mat-chip [color]="trade.is_open ? 'primary' : 'accent'">
                {{ trade.is_open ? 'Open' : 'Closed' }}
              </mat-chip>
            </mat-cell>
          </ng-container>

          <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
          <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
        </mat-table>
      </div>

      <div class="loading" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading trades...</p>
      </div>

      <div class="empty-state" *ngIf="!loading && trades.length === 0">
        <mat-icon>info</mat-icon>
        <p>No trades found</p>
      </div>
    </div>
  `,
  styles: [`
    .bot-trades {
      padding: 20px;
    }
    .trades-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .trades-header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
    .header-actions {
      display: flex;
      gap: 10px;
    }
    .positive {
      color: #10b981;
      font-weight: 600;
    }
    .negative {
      color: #ef4444;
      font-weight: 600;
    }
    .buy {
      color: #10b981;
      font-weight: 600;
    }
    .sell {
      color: #ef4444;
      font-weight: 600;
    }
    .loading, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #6b7280;
    }
    .loading mat-spinner {
      margin-bottom: 16px;
    }
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
      margin-bottom: 12px;
    }
    mat-table {
      width: 100%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    mat-header-cell {
      font-weight: 600;
      color: #374151;
    }
    mat-cell, mat-header-cell {
      padding: 12px 16px;
    }
    mat-row {
      transition: background-color 0.2s;
    }
    mat-row:hover {
      background-color: #f9fafb;
    }
  `]
})
export class BotTradesComponent implements OnInit, OnDestroy {
  @Input() botId!: number;
  
  private destroy$ = new Subject<void>();
  
  trades: BotTrade[] = [];
  loading = false;
  filterType: 'all' | 'open' | 'closed' = 'all';
  displayedColumns = ['time', 'symbol', 'action', 'quantity', 'entryPrice', 'exitPrice', 'pnl', 'status'];

  constructor(private botService: BotTradingService) {}

  ngOnInit(): void {
    this.loadTrades();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTrades(): void {
    if (!this.botId) return;

    this.loading = true;
    const isOpen = this.filterType === 'all' ? undefined : this.filterType === 'open';
    
    this.botService.getBotTrades(this.botId, isOpen, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (trades) => {
          this.trades = trades;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load trades', err);
          this.loading = false;
        }
      });
  }

  refreshTrades(): void {
    this.loadTrades();
  }
}