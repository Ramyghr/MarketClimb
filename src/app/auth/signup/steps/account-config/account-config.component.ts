import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-account-config',
  templateUrl: './account-config.component.html',
  styleUrls: ['./account-config.component.css']
})
export class AccountConfigComponent implements OnInit {
  @Output() stepCompleted = new EventEmitter<any>();  // ← Changed from 'next'

  configForm!: FormGroup;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  ngOnInit(): void {
    this.configForm = new FormGroup({
      // Account credentials (REQUIRED)
      username: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
      
      // Optional profile info
      display_name: new FormControl(''),
      bio: new FormControl(''),
      website: new FormControl('', [Validators.pattern(/^https?:\/\/.+/)]),
      
      // Trading preferences
      account_type: new FormControl('demo', [Validators.required]),
      base_currency: new FormControl('USD', [Validators.required]),
      leverage: new FormControl(50, [Validators.required, Validators.min(1), Validators.max(500)]),
      
      // Stop Loss & Take Profit (NEW - backend validates these)
      auto_stop_loss: new FormControl(false),
      stop_loss_percent: new FormControl(5.0, [Validators.min(1), Validators.max(20)]),
      auto_take_profit: new FormControl(false),
      take_profit_percent: new FormControl(10.0, [Validators.min(5), Validators.max(50)]),
      confirm_orders: new FormControl(true),
      
      // Notification preferences
      email_notifications: new FormControl(true),
      push_notifications: new FormControl(true),
      trade_alerts: new FormControl(true),
      price_alerts: new FormControl(true),
      news_alerts: new FormControl(true),
      social_updates: new FormControl(true),
      weekly_report: new FormControl(true)
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (!password || !confirmPassword) return null;
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    return (hasUpperCase && hasLowerCase && hasNumeric) ? null : { passwordStrength: true };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submitStep(): void {  // ← Changed method name to match
    if (this.configForm.valid) {
      const formValue = { ...this.configForm.value };
      delete formValue.confirmPassword; // Don't send confirmPassword to backend
      this.stepCompleted.emit(formValue);
    } else {
      this.configForm.markAllAsTouched();
    }
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.configForm.get(controlName);
    return !!(control && control.hasError(errorName) && (control.dirty || control.touched));
  }

  hasFormError(errorName: string): boolean {
    return !!(this.configForm.hasError(errorName) && this.configForm.get('confirmPassword')?.touched);
  }
}