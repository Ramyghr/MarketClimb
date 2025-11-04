import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

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
  defaultOrderType: 'market' | 'limit' | 'stop';
  confirmOrders: boolean;
  autoStopLoss: boolean;
  stopLossPercent: number;
  autoTakeProfit: boolean;
  takeProfitPercent: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
}

export interface ConnectedAccount {
  id: string;
  platform: string;
  username: string;
  connected: boolean;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private userProfileSubject = new BehaviorSubject<UserProfile>({
    id: 'user-001',
    username: 'TradeMaster',
    email: 'trademaster@marketclimb.com',
    firstName: 'John',
    lastName: 'Trader',
    avatar: 'https://i.pravatar.cc/150?img=68',
    bio: 'Professional trader | 5+ years experience | Crypto & Stocks enthusiast',
    location: 'New York, USA',
    website: 'https://trademaster.io',
    joinDate: new Date('2020-01-15'),
    verified: true,
    premiumUser: true
  });
  public userProfile$ = this.userProfileSubject.asObservable();

  private securitySettingsSubject = new BehaviorSubject<SecuritySettings>({
    twoFactorEnabled: true,
    emailVerified: true,
    phoneVerified: false,
    lastPasswordChange: new Date('2024-09-15'),
    activeSessions: 3
  });
  public securitySettings$ = this.securitySettingsSubject.asObservable();

  private notificationSettingsSubject = new BehaviorSubject<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    tradeAlerts: true,
    priceAlerts: true,
    newsAlerts: false,
    socialUpdates: true,
    weeklyReport: true
  });
  public notificationSettings$ = this.notificationSettingsSubject.asObservable();

  private tradingPreferencesSubject = new BehaviorSubject<TradingPreferences>({
    defaultOrderType: 'limit',
    confirmOrders: true,
    autoStopLoss: true,
    stopLossPercent: 5,
    autoTakeProfit: false,
    takeProfitPercent: 10,
    riskLevel: 'moderate'
  });
  public tradingPreferences$ = this.tradingPreferencesSubject.asObservable();

  private connectedAccountsSubject = new BehaviorSubject<ConnectedAccount[]>([
    { id: '1', platform: 'Binance', username: 'trader123', connected: true, icon: '🔶' },
    { id: '2', platform: 'Coinbase', username: 'john_trader', connected: true, icon: '🔵' },
    { id: '3', platform: 'Robinhood', username: 'not connected', connected: false, icon: '🟢' },
    { id: '4', platform: 'MetaMask', username: '0x742d...3f5a', connected: true, icon: '🦊' }
  ]);
  public connectedAccounts$ = this.connectedAccountsSubject.asObservable();

  constructor() {}

  // Profile Methods
  updateProfile(profile: Partial<UserProfile>): Observable<boolean> {
    const currentProfile = this.userProfileSubject.value;
    this.userProfileSubject.next({ ...currentProfile, ...profile });
    return of(true).pipe(delay(500)); // Simulate API call
  }

  uploadAvatar(file: File): Observable<string> {
    // Simulate file upload
    const reader = new FileReader();
    return new Observable(observer => {
      reader.onload = (e: any) => {
        setTimeout(() => {
          const newAvatarUrl = e.target.result;
          this.updateProfile({ avatar: newAvatarUrl });
          observer.next(newAvatarUrl);
          observer.complete();
        }, 1000);
      };
      reader.readAsDataURL(file);
    });
  }

  // Security Methods
  updateSecuritySettings(settings: Partial<SecuritySettings>): Observable<boolean> {
    const currentSettings = this.securitySettingsSubject.value;
    this.securitySettingsSubject.next({ ...currentSettings, ...settings });
    return of(true).pipe(delay(500));
  }

  changePassword(oldPassword: string, newPassword: string): Observable<boolean> {
    // Simulate password change
    return new Observable(observer => {
      setTimeout(() => {
        const settings = this.securitySettingsSubject.value;
        this.securitySettingsSubject.next({
          ...settings,
          lastPasswordChange: new Date()
        });
        observer.next(true);
        observer.complete();
      }, 1000);
    });
  }

  enable2FA(): Observable<{ secret: string; qrCode: string }> {
    return of({
      secret: 'JBSWY3DPEHPK3PXP',
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }).pipe(delay(500));
  }

  // Notification Methods
  updateNotificationSettings(settings: Partial<NotificationSettings>): Observable<boolean> {
    const currentSettings = this.notificationSettingsSubject.value;
    this.notificationSettingsSubject.next({ ...currentSettings, ...settings });
    return of(true).pipe(delay(300));
  }

  // Trading Preferences Methods
  updateTradingPreferences(preferences: Partial<TradingPreferences>): Observable<boolean> {
    const currentPrefs = this.tradingPreferencesSubject.value;
    this.tradingPreferencesSubject.next({ ...currentPrefs, ...preferences });
    return of(true).pipe(delay(300));
  }

  // Connected Accounts Methods
  connectAccount(accountId: string): Observable<boolean> {
    const accounts = this.connectedAccountsSubject.value.map(acc => 
      acc.id === accountId ? { ...acc, connected: true, username: 'connected_user' } : acc
    );
    this.connectedAccountsSubject.next(accounts);
    return of(true).pipe(delay(1000));
  }

  disconnectAccount(accountId: string): Observable<boolean> {
    const accounts = this.connectedAccountsSubject.value.map(acc => 
      acc.id === accountId ? { ...acc, connected: false, username: 'not connected' } : acc
    );
    this.connectedAccountsSubject.next(accounts);
    return of(true).pipe(delay(500));
  }

  // Account Actions
  exportData(): Observable<Blob> {
    const data = {
      profile: this.userProfileSubject.value,
      settings: {
        security: this.securitySettingsSubject.value,
        notifications: this.notificationSettingsSubject.value,
        trading: this.tradingPreferencesSubject.value
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    return of(blob).pipe(delay(1000));
  }

  deleteAccount(): Observable<boolean> {
    // Simulate account deletion
    return of(true).pipe(delay(2000));
  }
}