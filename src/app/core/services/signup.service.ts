import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SignupService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  /**
   * Register user - maps frontend data to backend format
   */
  registerUser(signupData: any): Observable<any> {
    console.log('📤 Raw signup data from steps:', signupData);

    // Build the payload matching UserCreate exactly
    const payload: any = {
      // REQUIRED FIELDS
      first_name: signupData.first_name || '',
      last_name: signupData.last_name || '',
      email: signupData.email || '',
      password: signupData.password || '',
      
      // OPTIONAL PROFILE FIELDS
      username: signupData.username || null,
      display_name: signupData.display_name || null,
      bio: signupData.bio || null,
      avatar_url: signupData.avatar_url || null,
      location: signupData.country || signupData.location || null,
      website: signupData.website || null,
      
      // NOTIFICATION SETTINGS (booleans with defaults)
      email_notifications: signupData.email_notifications !== undefined ? signupData.email_notifications : true,
      push_notifications: signupData.push_notifications !== undefined ? signupData.push_notifications : true,
      trade_alerts: signupData.trade_alerts !== undefined ? signupData.trade_alerts : true,
      price_alerts: signupData.price_alerts !== undefined ? signupData.price_alerts : true,
      news_alerts: signupData.news_alerts !== undefined ? signupData.news_alerts : true,
      social_updates: signupData.social_updates !== undefined ? signupData.social_updates : true,
      weekly_report: signupData.weekly_report !== undefined ? signupData.weekly_report : true,
      
      // TRADING PREFERENCES
      default_order_type: this.mapOrderType(signupData.account_type),
      confirm_orders: signupData.confirm_orders !== undefined ? signupData.confirm_orders : true,
      auto_stop_loss: signupData.auto_stop_loss !== undefined ? signupData.auto_stop_loss : false,
      stop_loss_percent: this.parseFloat(signupData.stop_loss_percent, 5.0, 1, 20),
      auto_take_profit: signupData.auto_take_profit !== undefined ? signupData.auto_take_profit : false,
      take_profit_percent: this.parseFloat(signupData.take_profit_percent, 10.0, 5, 50),
      risk_level: this.mapRiskLevel(signupData.leverage)
    };

    // Remove null values to let backend use defaults
    Object.keys(payload).forEach(key => {
      if (payload[key] === null || payload[key] === undefined || payload[key] === '') {
        delete payload[key];
      }
    });

    console.log('✅ Final payload to backend:', JSON.stringify(payload, null, 2));

    return this.http.post(`${this.apiUrl}/register`, payload).pipe(
      tap(response => {
        console.log('🎉 Registration successful:', response);
      }),
      catchError(error => {
        console.error('❌ Registration failed:', error);
        console.error('Status:', error.status);
        console.error('Error body:', error.error);
        
        let errorMessage = 'Registration failed';
        
        if (error.error?.detail) {
          if (typeof error.error.detail === 'string') {
            errorMessage = error.error.detail;
          } else if (Array.isArray(error.error.detail)) {
            // Pydantic validation errors
            const errors = error.error.detail.map((e: any) => 
              `${e.loc.join('.')}: ${e.msg}`
            ).join('; ');
            errorMessage = errors;
          }
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Map account_type to OrderType enum
   */
  private mapOrderType(accountType: string): string {
    if (!accountType) return 'MARKET';
    return accountType.toLowerCase() === 'demo' ? 'MARKET' : 'LIMIT';
  }

  /**
   * Map leverage to RiskLevel enum
   * Backend expects: CONSERVATIVE, MODERATE, AGGRESSIVE
   */
  private mapRiskLevel(leverage: any): string {
    const lev = typeof leverage === 'number' ? leverage : parseFloat(leverage);
    
    if (isNaN(lev) || lev <= 50) return 'CONSERVATIVE';
    if (lev <= 200) return 'MODERATE';
    return 'AGGRESSIVE';
  }

  /**
   * Parse float with min/max validation
   */
  private parseFloat(value: any, defaultValue: number, min?: number, max?: number): number {
    let num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) num = defaultValue;
    
    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;
    
    return num;
  }
}