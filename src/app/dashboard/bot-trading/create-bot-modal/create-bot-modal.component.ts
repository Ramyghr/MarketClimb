// ============================================
// FILE 1: create-bot-modal.component.ts
// Save as: src/app/dashboard/bot-trading/create-bot-modal/create-bot-modal.component.ts
// ============================================

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BotTradingService, BotStrategyType, StrategyTemplate } from '../../../services/bot-trading.service';

@Component({
  selector: 'app-create-bot-modal',
  templateUrl: './create-bot-modal.component.html',
  styleUrls: ['./create-bot-modal.component.scss']
})
export class CreateBotModalComponent implements OnInit {
  @Input() strategyTemplates: StrategyTemplate[] = [];
  @Output() botCreated = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  botForm!: FormGroup;
  currentStep = 1;
  totalSteps = 3;
  loading = false;
  error: string | null = null;
  
  selectedTemplate: StrategyTemplate | null = null;
  strategyParams: any = {};
  
  intervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
  assetTypes = ['STOCK', 'CRYPTO', 'FOREX', 'COMMODITY'];

  constructor(
    private fb: FormBuilder,
    private botService: BotTradingService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.botForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      symbol: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(20)]],
      asset_type: ['STOCK', Validators.required],
      strategy_type: ['', Validators.required],
      interval: ['5m', Validators.required],
      max_position_size: [1000, [Validators.required, Validators.min(10)]],
      stop_loss_pct: [null, [Validators.min(0.1), Validators.max(50)]],
      take_profit_pct: [null, [Validators.min(0.1), Validators.max(100)]],
      max_daily_trades: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      max_daily_loss: [500, [Validators.required, Validators.min(10)]],
      max_open_trades: [3, [Validators.required, Validators.min(1), Validators.max(20)]],
      use_leverage: [false],
      leverage: [1, [Validators.min(1), Validators.max(20)]]
    });
  }

  selectStrategy(template: StrategyTemplate): void {
    this.selectedTemplate = template;
    this.botForm.patchValue({
      strategy_type: template.strategy_type,
      interval: template.recommended_intervals[0] || '5m'
    });
    this.strategyParams = { ...template.default_params };
  }

  updateStrategyParam(key: string, value: any): void {
    this.strategyParams[key] = parseFloat(value) || value;
  }

  onStrategyParamInput(event: Event, key: string): void {
    const input = event.target as HTMLInputElement;
    this.updateStrategyParam(key, input.value);
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      const controls = ['name', 'symbol', 'asset_type'];
      const allValid = controls.every(key => this.botForm.get(key)?.valid);
      if (!allValid) {
        this.markFormGroupTouched(this.botForm);
        return;
      }
    }
    
    if (this.currentStep === 2) {
      if (!this.selectedTemplate) {
        this.error = 'Please select a trading strategy';
        return;
      }
    }
    
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.error = null;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.error = null;
    }
  }

  createBot(): void {
    if (this.botForm.invalid) {
      this.markFormGroupTouched(this.botForm);
      this.error = 'Please fill all required fields correctly';
      return;
    }

    if (!this.selectedTemplate) {
      this.error = 'Please select a strategy';
      return;
    }

    this.loading = true;
    this.error = null;

    const botData = {
      ...this.botForm.value,
      strategy_params: this.strategyParams,
      symbol: this.botForm.value.symbol.toUpperCase()
    };

    this.botService.createBot(botData)
      .subscribe({
        next: () => {
          this.loading = false;
          this.botCreated.emit();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.detail || 'Failed to create bot';
        }
      });
  }

  closeModal(): void {
    this.close.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  getStrategyParamKeys(): string[] {
    return this.selectedTemplate ? Object.keys(this.selectedTemplate.default_params) : [];
  }

  getStrategyParamDescription(key: string): string {
    return this.selectedTemplate?.param_descriptions?.[key] || key;
  }

  getRiskLevelColor(level: string): string {
    switch (level) {
      case 'LOW': return '#4caf50';
      case 'MEDIUM': return '#ff9800';
      case 'HIGH': return '#f44336';
      default: return '#999';
    }
  }

  getRiskLevelIcon(level: string): string {
    switch (level) {
      case 'LOW': return 'check_circle';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      default: return 'help';
    }
  }
}

// ============================================
// INSTRUCTIONS:
// ============================================
// 1. Replace your create-bot-modal.component.ts with the code above
// 2. Your create-bot-modal.component.html is already correct (from document index 9)
// 3. Create create-bot-modal.component.scss (see the SCSS I provided earlier)
// 4. Make sure ReactiveFormsModule is imported in app.module.ts
// 
// The modal should now fully work with all 3 steps:
// - Step 1: Basic Info (name, symbol, asset type)
// - Step 2: Strategy Selection (choose from templates)
// - Step 3: Risk Management (position size, stop loss, etc)
//