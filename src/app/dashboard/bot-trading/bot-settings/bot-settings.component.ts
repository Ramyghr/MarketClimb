// bot-settings.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BotTradingService, Bot, BotStrategyType } from '../../../services/bot-trading.service';

@Component({
  selector: 'app-bot-settings',
  template: `
    <div class="bot-settings">
      <div class="settings-header">
        <h3>
          <mat-icon>settings</mat-icon>
          Bot Settings
        </h3>
        <div class="header-actions">
          <button mat-stroked-button (click)="resetForm()" [disabled]="!settingsForm.dirty">
            <mat-icon>refresh</mat-icon>
            Reset
          </button>
          <button mat-raised-button color="primary" (click)="saveSettings()" 
                  [disabled]="settingsForm.invalid || !settingsForm.dirty || saving">
            <mat-icon *ngIf="!saving">save</mat-icon>
            <mat-spinner diameter="20" *ngIf="saving"></mat-spinner>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <form [formGroup]="settingsForm" class="settings-form">
        <mat-card class="settings-section">
          <mat-card-header>
            <mat-card-title>Basic Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Bot Name</mat-label>
                <input matInput formControlName="name">
                <mat-error *ngIf="settingsForm.get('name')?.hasError('required')">
                  Name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Symbol</mat-label>
                <input matInput formControlName="symbol">
                <mat-error *ngIf="settingsForm.get('symbol')?.hasError('required')">
                  Symbol is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width" *ngIf="showStrategyField">
                <mat-label>Strategy Type</mat-label>
                <mat-select formControlName="strategy_type">
                  <mat-option *ngFor="let strategy of strategyTypes" [value]="strategy">
                    {{ formatStrategy(strategy) }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="settingsForm.get('strategy_type')?.hasError('required')">
                  Strategy is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3"></textarea>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="settings-section">
          <mat-card-header>
            <mat-card-title>Risk Management</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Max Position Size ($)</mat-label>
                <input matInput type="number" formControlName="max_position_size">
                <mat-error *ngIf="settingsForm.get('max_position_size')?.hasError('required')">
                  Required
                </mat-error>
                <mat-error *ngIf="settingsForm.get('max_position_size')?.hasError('min')">
                  Must be at least 1
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Max Daily Trades</mat-label>
                <input matInput type="number" formControlName="max_daily_trades">
                <mat-error *ngIf="settingsForm.get('max_daily_trades')?.hasError('required')">
                  Required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Stop Loss (%)</mat-label>
                <input matInput type="number" formControlName="stop_loss_pct" step="0.1">
                <mat-hint>Optional - Leave empty for no stop loss</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Take Profit (%)</mat-label>
                <input matInput type="number" formControlName="take_profit_pct" step="0.1">
                <mat-hint>Optional - Leave empty for no take profit</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Max Daily Loss ($)</mat-label>
                <input matInput type="number" formControlName="max_daily_loss">
                <mat-hint>Stop trading after this loss</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Max Open Trades</mat-label>
                <input matInput type="number" formControlName="max_open_trades">
                <mat-error *ngIf="settingsForm.get('max_open_trades')?.hasError('required')">
                  Required
                </mat-error>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="settings-section">
          <mat-card-header>
            <mat-card-title>Leverage Settings</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-slide-toggle formControlName="use_leverage" class="leverage-toggle">
              Enable Leverage Trading
            </mat-slide-toggle>
            
            <div class="form-grid" *ngIf="settingsForm.get('use_leverage')?.value">
              <mat-form-field appearance="outline">
                <mat-label>Leverage Multiplier</mat-label>
                <mat-select formControlName="leverage">
                  <mat-option [value]="1">1x (No Leverage)</mat-option>
                  <mat-option [value]="2">2x</mat-option>
                  <mat-option [value]="3">3x</mat-option>
                  <mat-option [value]="5">5x</mat-option>
                  <mat-option [value]="10">10x</mat-option>
                  <mat-option [value]="20">20x (High Risk)</mat-option>
                </mat-select>
                <mat-hint>Higher leverage = Higher risk</mat-hint>
              </mat-form-field>

              <mat-card class="warning-card full-width">
                <mat-icon>warning</mat-icon>
                <div>
                  <h5>⚠️ Leverage Warning</h5>
                  <p>Leverage amplifies both gains and losses. Use with caution and proper risk management.</p>
                </div>
              </mat-card>
            </div>
          </mat-card-content>
        </mat-card>

        <div class="success-message" *ngIf="successMessage">
          <mat-icon>check_circle</mat-icon>
          {{ successMessage }}
        </div>

        <div class="error-message" *ngIf="errorMessage">
          <mat-icon>error</mat-icon>
          {{ errorMessage }}
        </div>
      </form>
    </div>
  `,
  styles: [`
    .bot-settings {
      padding: 20px;
    }
    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .settings-header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
    .header-actions {
      display: flex;
      gap: 10px;
    }
    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .settings-section {
      margin-bottom: 0;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .full-width {
      grid-column: 1 / -1;
    }
    .leverage-toggle {
      margin-bottom: 15px;
    }
    .warning-card {
      padding: 16px;
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .warning-card mat-icon {
      color: #ff9800;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .warning-card h5 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #e65100;
    }
    .warning-card p {
      margin: 0;
      font-size: 13px;
      color: #666;
    }
    .success-message, .error-message {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 15px;
      border-radius: 8px;
      font-weight: 500;
    }
    .success-message {
      background: #d1fae5;
      color: #065f46;
    }
    .success-message mat-icon {
      color: #065f46;
    }
    .error-message {
      background: #fee2e2;
      color: #991b1b;
    }
    .error-message mat-icon {
      color: #991b1b;
    }
  `]
})
export class BotSettingsComponent implements OnInit {
  @Input() bot!: Bot;
  @Input() showStrategyField: boolean = false;
  @Output() botUpdated = new EventEmitter<Bot>();
  
  settingsForm!: FormGroup;
  saving = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  strategyTypes: string[] = [];

  constructor(
    private fb: FormBuilder,
    private botService: BotTradingService
  ) {}

  ngOnInit(): void {
    this.strategyTypes = Object.values(BotStrategyType);
    this.initForm();
  }

  initForm(): void {
    this.settingsForm = this.fb.group({
      name: [this.bot.name, [Validators.required, Validators.maxLength(100)]],
      description: [this.bot.description || ''],
      symbol: [this.bot.symbol, Validators.required],
      strategy_type: [this.bot.strategy_type, this.showStrategyField ? Validators.required : null],
      max_position_size: [this.bot.max_position_size, [Validators.required, Validators.min(1)]],
      stop_loss_pct: [this.bot.stop_loss_pct],
      take_profit_pct: [this.bot.take_profit_pct],
      max_daily_trades: [this.bot.max_daily_trades, [Validators.required, Validators.min(1)]],
      max_daily_loss: [this.bot.max_daily_loss],
      max_open_trades: [this.bot.max_open_trades, [Validators.required, Validators.min(1)]],
      use_leverage: [this.bot.use_leverage],
      leverage: [this.bot.leverage]
    });
  }

  resetForm(): void {
    this.initForm();
    this.successMessage = null;
    this.errorMessage = null;
  }

  formatStrategy(strategy: string): string {
    return strategy.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) {
      return;
    }
    
    this.saving = true;
    this.successMessage = null;
    this.errorMessage = null;

    const updateData = this.settingsForm.value;

    this.botService.updateBot(this.bot.id, updateData)
      .subscribe({
        next: (updatedBot) => {
          this.saving = false;
          this.successMessage = 'Settings saved successfully!';
          this.botUpdated.emit(updatedBot);
          this.settingsForm.markAsPristine();
          
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err.message || 'Failed to save settings';
          
          setTimeout(() => {
            this.errorMessage = null;
          }, 5000);
        }
      });
  }
}