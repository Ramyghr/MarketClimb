import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

// ============================================
// INTERFACES
// ============================================

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  bio: string;
  location: string;
  website: string;
  joinDate: Date;
  verified: boolean;
  premiumUser: boolean;
  level: number;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastPasswordChange: Date;
  activeSessions: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  tradeAlerts: boolean;
  priceAlerts: boolean;
  newsAlerts: boolean;
  socialUpdates: boolean;
  weeklyReport: boolean;
}

export interface TradingPreferences {
  defaultOrderType: 'MARKET' | 'LIMIT' | 'STOP';
  confirmOrders: boolean;
  autoStopLoss: boolean;
  stopLossPercent: number;
  autoTakeProfit: boolean;
  takeProfitPercent: number;
  riskLevel: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
}

export interface ConnectedAccount {
  id: string;
  platform: string;
  username: string;
  connected: boolean;
  icon: string;
}

// Backend response interface
interface UserSettingsInfo {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  email_notifications: boolean;
  push_notifications: boolean;
  trade_alerts: boolean;
  price_alerts: boolean;
  news_alerts: boolean;
  social_updates: boolean;
  weekly_report: boolean;
  default_order_type: string;
  confirm_orders: boolean;
  auto_stop_loss: boolean;
  stop_loss_percent: number;
  auto_take_profit: boolean;
  take_profit_percent: number;
  risk_level: string;
  two_factor_enabled: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  last_password_change: string;
  active_sessions: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = 'http://localhost:8000';

  // BehaviorSubjects for reactive data
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  public userProfile$ = this.userProfileSubject.asObservable();

  private securitySettingsSubject = new BehaviorSubject<SecuritySettings | null>(null);
  public securitySettings$ = this.securitySettingsSubject.asObservable();

  private notificationSettingsSubject = new BehaviorSubject<NotificationSettings | null>(null);
  public notificationSettings$ = this.notificationSettingsSubject.asObservable();

  private tradingPreferencesSubject = new BehaviorSubject<TradingPreferences | null>(null);
  public tradingPreferences$ = this.tradingPreferencesSubject.asObservable();

  // Mock connected accounts (no backend endpoint yet)
  private connectedAccountsSubject = new BehaviorSubject<ConnectedAccount[]>([
    { id: '1', platform: 'Binance', username: 'not connected', connected: false, icon: '🔶' },
    { id: '2', platform: 'Coinbase', username: 'not connected', connected: false, icon: '🔵' },
    { id: '3', platform: 'Robinhood', username: 'not connected', connected: false, icon: '🟢' },
    { id: '4', platform: 'MetaMask', username: 'not connected', connected: false, icon: '🦊' }
  ]);
  public connectedAccounts$ = this.connectedAccountsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load user settings on service initialization
    this.loadUserSettings();
  }

  // ============================================
  // LOAD ALL SETTINGS
  // ============================================

  loadUserSettings(): void {
    this.http.get<UserSettingsInfo>(`${this.apiUrl}/user/settingsInfo`).pipe(
      tap(data => {
        // Map backend data to frontend interfaces
        this.userProfileSubject.next(this.mapToUserProfile(data));
        this.securitySettingsSubject.next(this.mapToSecuritySettings(data));
        this.notificationSettingsSubject.next(this.mapToNotificationSettings(data));
        this.tradingPreferencesSubject.next(this.mapToTradingPreferences(data));
      }),
      catchError(error => {
        console.error('Failed to load user settings:', error);
        return throwError(() => error);
      })
    ).subscribe();
  }

  // ============================================
  // MAPPING FUNCTIONS (Backend → Frontend)
  // ============================================

  private mapToUserProfile(data: UserSettingsInfo): UserProfile {
    return {
      id: '',  // Set from /user/me if needed
      username: data.username,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      avatar: data.avatar_url || 'https://i.pravatar.cc/150?img=68',
      bio: data.bio || '',
      location: data.location || '',
      website: data.website || '',
      joinDate: new Date(), // Set from /user/me if needed
      verified: data.email_verified,
      premiumUser: false, // Set based on subscription
      level: 0 // Set from /user/me
    };
  }

  private mapToSecuritySettings(data: UserSettingsInfo): SecuritySettings {
    return {
      twoFactorEnabled: data.two_factor_enabled,
      emailVerified: data.email_verified,
      phoneVerified: data.phone_verified,
      lastPasswordChange: new Date(data.last_password_change),
      activeSessions: data.active_sessions
    };
  }

  private mapToNotificationSettings(data: UserSettingsInfo): NotificationSettings {
    return {
      emailNotifications: data.email_notifications,
      pushNotifications: data.push_notifications,
      tradeAlerts: data.trade_alerts,
      priceAlerts: data.price_alerts,
      newsAlerts: data.news_alerts,
      socialUpdates: data.social_updates,
      weeklyReport: data.weekly_report
    };
  }

  private mapToTradingPreferences(data: UserSettingsInfo): TradingPreferences {
    return {
      defaultOrderType: data.default_order_type as 'MARKET' | 'LIMIT' | 'STOP',
      confirmOrders: data.confirm_orders,
      autoStopLoss: data.auto_stop_loss,
      stopLossPercent: data.stop_loss_percent,
      autoTakeProfit: data.auto_take_profit,
      takeProfitPercent: data.take_profit_percent,
      riskLevel: data.risk_level as 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE'
    };
  }

  // ============================================
  // PROFILE METHODS
  // ============================================

  updateProfile(profile: Partial<UserProfile>): Observable<any> {
    // Map frontend camelCase to backend snake_case
    const payload: any = {};
    
    if (profile.firstName !== undefined) payload.first_name = profile.firstName;
    if (profile.lastName !== undefined) payload.last_name = profile.lastName;
    if (profile.username !== undefined) payload.username = profile.username;
    if (profile.email !== undefined) payload.email = profile.email;
    if (profile.bio !== undefined) payload.bio = profile.bio;
    if (profile.location !== undefined) payload.location = profile.location;
    if (profile.website !== undefined) payload.website = profile.website;

    return this.http.patch(`${this.apiUrl}/user/update`, payload).pipe(
      tap(() => {
        // Update local state
        const currentProfile = this.userProfileSubject.value;
        if (currentProfile) {
          this.userProfileSubject.next({ ...currentProfile, ...profile });
        }
      }),
      catchError(this.handleError)
    );
  }

  uploadAvatar(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    // TODO: Replace with your actual upload endpoint
    return this.http.post<{ avatar_url: string }>(`${this.apiUrl}/user/upload-avatar`, formData).pipe(
      tap(response => {
        // Update local state
        const currentProfile = this.userProfileSubject.value;
        if (currentProfile) {
          this.userProfileSubject.next({
            ...currentProfile,
            avatar: response.avatar_url
          });
        }
      }),
      map(response => response.avatar_url),
      catchError(this.handleError)
    );
  }

  // ============================================
  // SECURITY METHODS
  // ============================================

  updateSecuritySettings(settings: Partial<SecuritySettings>): Observable<any> {
    const payload: any = {};
    
    if (settings.twoFactorEnabled !== undefined) {
      payload.two_factor_enabled = settings.twoFactorEnabled;
    }

    return this.http.patch(`${this.apiUrl}/user/security-settings`, payload).pipe(
      tap(() => {
        const current = this.securitySettingsSubject.value;
        if (current) {
          this.securitySettingsSubject.next({ ...current, ...settings });
        }
      }),
      catchError(this.handleError)
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    // Backend expects token-based password reset
    // For changing password while logged in, you might need a different endpoint
    // For now, using the reset-password flow
    
    return this.http.post(`${this.apiUrl}/user/change-password`, {
      old_password: oldPassword,
      new_password: newPassword
    }).pipe(
      tap(() => {
        const settings = this.securitySettingsSubject.value;
        if (settings) {
          this.securitySettingsSubject.next({
            ...settings,
            lastPasswordChange: new Date()
          });
        }
      }),
      catchError(this.handleError)
    );
  }

  // ============================================
  // NOTIFICATION METHODS
  // ============================================

  updateNotificationSettings(settings: Partial<NotificationSettings>): Observable<any> {
    // Map to backend format
    const payload: any = {};
    
    if (settings.emailNotifications !== undefined) payload.email_notifications = settings.emailNotifications;
    if (settings.pushNotifications !== undefined) payload.push_notifications = settings.pushNotifications;
    if (settings.tradeAlerts !== undefined) payload.trade_alerts = settings.tradeAlerts;
    if (settings.priceAlerts !== undefined) payload.price_alerts = settings.priceAlerts;
    if (settings.newsAlerts !== undefined) payload.news_alerts = settings.newsAlerts;
    if (settings.socialUpdates !== undefined) payload.social_updates = settings.socialUpdates;
    if (settings.weeklyReport !== undefined) payload.weekly_report = settings.weeklyReport;

    return this.http.patch(`${this.apiUrl}/user/notification-settings`, payload).pipe(
      tap(() => {
        const current = this.notificationSettingsSubject.value;
        if (current) {
          this.notificationSettingsSubject.next({ ...current, ...settings });
        }
      }),
      catchError(this.handleError)
    );
  }

  // ============================================
  // TRADING PREFERENCES METHODS
  // ============================================

  updateTradingPreferences(preferences: Partial<TradingPreferences>): Observable<any> {
    // Map to backend format
    const payload: any = {};
    
    if (preferences.defaultOrderType !== undefined) payload.default_order_type = preferences.defaultOrderType;
    if (preferences.confirmOrders !== undefined) payload.confirm_orders = preferences.confirmOrders;
    if (preferences.autoStopLoss !== undefined) payload.auto_stop_loss = preferences.autoStopLoss;
    if (preferences.stopLossPercent !== undefined) payload.stop_loss_percent = preferences.stopLossPercent;
    if (preferences.autoTakeProfit !== undefined) payload.auto_take_profit = preferences.autoTakeProfit;
    if (preferences.takeProfitPercent !== undefined) payload.take_profit_percent = preferences.takeProfitPercent;
    if (preferences.riskLevel !== undefined) payload.risk_level = preferences.riskLevel;

    return this.http.patch(`${this.apiUrl}/user/trading-preferences`, payload).pipe(
      tap(() => {
        const current = this.tradingPreferencesSubject.value;
        if (current) {
          this.tradingPreferencesSubject.next({ ...current, ...preferences });
        }
      }),
      catchError(this.handleError)
    );
  }

  // ============================================
  // CONNECTED ACCOUNTS (MOCK - No backend yet)
  // ============================================

  connectAccount(accountId: string): Observable<boolean> {
    // TODO: Implement when backend endpoint is ready
    const accounts = this.connectedAccountsSubject.value.map(acc => 
      acc.id === accountId ? { ...acc, connected: true, username: 'connected_user' } : acc
    );
    this.connectedAccountsSubject.next(accounts);
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 1000);
    });
  }

  disconnectAccount(accountId: string): Observable<boolean> {
    // TODO: Implement when backend endpoint is ready
    const accounts = this.connectedAccountsSubject.value.map(acc => 
      acc.id === accountId ? { ...acc, connected: false, username: 'not connected' } : acc
    );
    this.connectedAccountsSubject.next(accounts);
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 500);
    });
  }

  // ============================================
  // ACCOUNT ACTIONS
  // ============================================

  exportData(): Observable<Blob> {
    // TODO: Implement backend endpoint for data export
    return this.http.get(`${this.apiUrl}/user/export-data`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteAccount(): Observable<any> {
    // TODO: Implement backend endpoint for account deletion
    return this.http.delete(`${this.apiUrl}/user/delete-account`).pipe(
      catchError(this.handleError)
    );
  }

  // ============================================
  // LOGOUT
  // ============================================

  logoutAllSessions(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout-all-devices`, {}).pipe(
      catchError(this.handleError)
    );
  }

  // ============================================
  // ERROR HANDLING
  // ============================================

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error?.detail) {
      errorMessage = typeof error.error.detail === 'string' 
        ? error.error.detail 
        : JSON.stringify(error.error.detail);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('AccountService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}