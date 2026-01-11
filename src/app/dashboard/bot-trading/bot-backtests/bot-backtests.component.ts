// src/app/dashboard/bot-trading/bot-backtests/bot-backtests.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BotTradingService, BacktestResponse, BacktestRequest } from '../../../services/bot-trading.service';

@Component({
  selector: 'app-bot-backtests',
  templateUrl: './bot-backtests.component.html',
  styleUrls: ['./bot-backtests.component.css']
})
export class BotBacktestsComponent implements OnInit, OnDestroy {
  @Input() botId!: number;
  
  private destroy$ = new Subject<void>();
  
  backtests: BacktestResponse[] = [];
  selectedBacktest: BacktestResponse | null = null;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  // Form state
  showBacktestForm = false;
  backtestForm!: FormGroup;
  runningBacktest = false;
  maxDate: string;

  constructor(
    private botService: BotTradingService,
    private fb: FormBuilder
  ) {
    // Set max date to today
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    console.log('🚀 BotBacktestsComponent initialized');
    console.log('🔑 Received botId:', this.botId);
    console.log('🔑 botId type:', typeof this.botId);
    
    if (!this.botId) {
      console.error('⚠️ WARNING: botId is undefined or null!');
    }
    
    this.initForm();
    this.loadBacktests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    // Default date range: last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    this.backtestForm = this.fb.group({
      start_date: [startDate.toISOString().split('T')[0], Validators.required],
      end_date: [endDate.toISOString().split('T')[0], Validators.required],
      initial_capital: [10000, [Validators.required, Validators.min(100)]]
    }, {
      validators: this.dateRangeValidator
    });
  }

  // Custom validator to ensure end date is after start date
  dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
    const start = group.get('start_date')?.value;
    const end = group.get('end_date')?.value;
    
    if (start && end && new Date(start) >= new Date(end)) {
      return { invalidRange: true };
    }
    
    return null;
  }

  loadBacktests(): void {
    if (!this.botId) {
      console.error('❌ botId is missing!', this.botId);
      return;
    }

    console.log('🔍 Loading backtests for botId:', this.botId);
    this.loading = true;
    this.error = null;
    
    this.botService.getBotBacktests(this.botId, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (backtests: BacktestResponse[]) => {
          console.log('✅ Backtests received:', backtests);
          console.log('📊 Number of backtests:', backtests.length);
          
          if (backtests.length > 0) {
            console.log('📝 First backtest structure:', backtests[0]);
            console.log('📝 Keys:', Object.keys(backtests[0]));
          }
          
          this.backtests = backtests;
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Error loading backtests:', err);
          console.error('❌ Error details:', {
            message: err.message,
            status: err.status,
            error: err.error
          });
          this.error = err.message || 'Failed to load backtests';
          this.loading = false;
        }
      });
  }

  runBacktest(): void {
    if (this.backtestForm.invalid || !this.botId) {
      console.error('❌ Form invalid or botId missing');
      console.log('Form value:', this.backtestForm.value);
      console.log('Form valid:', this.backtestForm.valid);
      console.log('botId:', this.botId);
      return;
    }

    this.runningBacktest = true;
    this.error = null;
    this.successMessage = null;

    // Get form values
    const formValue = this.backtestForm.value;
    
    // Convert dates to ISO 8601 format with time
    const startDate = new Date(formValue.start_date);
    const endDate = new Date(formValue.end_date);
    
    // Set start time to beginning of day (00:00:00)
    startDate.setHours(0, 0, 0, 0);
    
    // Set end time to end of day (23:59:59)
    endDate.setHours(23, 59, 59, 999);

    // Create properly formatted request
    const backtestRequest: BacktestRequest = {
      start_date: startDate.toISOString(),  // Will be like "2024-12-01T00:00:00.000Z"
      end_date: endDate.toISOString(),      // Will be like "2024-12-10T23:59:59.999Z"
      initial_capital: Number(formValue.initial_capital)
    };

    console.log('📤 Sending backtest request:', backtestRequest);
    console.log('📤 Request details:', {
      botId: this.botId,
      start_date: backtestRequest.start_date,
      end_date: backtestRequest.end_date,
      initial_capital: backtestRequest.initial_capital
    });

    this.botService.runBacktest(this.botId, backtestRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('✅ Backtest completed:', result);
          this.runningBacktest = false;
          this.showBacktestForm = false;
          this.successMessage = 'Backtest completed successfully!';
          
          // Add the new backtest to the list
          this.backtests.unshift(result);
          
          // Optionally select it immediately
          this.selectedBacktest = result;
          
          // Clear form
          this.initForm();
          
          // Clear success message after 5 seconds
          setTimeout(() => {
            this.successMessage = null;
          }, 5000);
        },
        error: (err) => {
          console.error('❌ Backtest failed:', err);
          console.error('❌ Error response:', err.error);
          
          this.runningBacktest = false;
          
          // Extract detailed error message
          let errorMsg = 'Failed to run backtest';
          
          if (err.error?.detail) {
            if (typeof err.error.detail === 'string') {
              errorMsg = err.error.detail;
            } else if (Array.isArray(err.error.detail)) {
              // Pydantic validation errors
              errorMsg = err.error.detail.map((e: any) => 
                `${e.loc.join('.')}: ${e.msg}`
              ).join(', ');
            }
          } else if (err.message) {
            errorMsg = err.message;
          }
          
          this.error = errorMsg;
          
          console.error('❌ Parsed error message:', errorMsg);
          
          // Clear error after 15 seconds (longer for debugging)
          setTimeout(() => {
            this.error = null;
          }, 15000);
        }
      });
  }

  cancelBacktest(): void {
    this.showBacktestForm = false;
    this.initForm();
    this.error = null;
  }

  viewBacktest(backtest: BacktestResponse): void {
    this.selectedBacktest = backtest;
  }

  refreshBacktests(): void {
    this.loadBacktests();
  }

  clearError(): void {
    this.error = null;
  }

  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'primary';
      case 'running':
        return 'accent';
      case 'failed':
      case 'error':
        return 'warn';
      default:
        return 'accent';
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'check_circle';
      case 'running':
        return 'hourglass_empty';
      case 'failed':
      case 'error':
        return 'error';
      default:
        return 'help';
    }
  }

  // Helper method to format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Helper method to format date and time for display
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}