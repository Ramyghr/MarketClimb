import { Component, OnInit, OnDestroy } from '@angular/core';
import { 
  AccountService, 
  UserProfile, 
  SecuritySettings, 
  NotificationSettings, 
  TradingPreferences,
  ConnectedAccount 
} from '../../core/services/account.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit, OnDestroy {
  activeSection: 'profile' | 'security' | 'notifications' | 'trading' | 'connections' | 'subscription' = 'profile';

  // Data
  userProfile!: UserProfile;
  securitySettings!: SecuritySettings;
  notificationSettings!: NotificationSettings;
  tradingPreferences!: TradingPreferences;
  connectedAccounts: ConnectedAccount[] = [];

  // Edit modes
  isEditingProfile: boolean = false;
  isChangingPassword: boolean = false;
  isSaving: boolean = false;

  // Forms
  profileForm: any = {};
  passwordForm = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Messages
  successMessage: string = '';
  errorMessage: string = '';

  private destroy$ = new Subject<void>();

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    // Subscribe to all account data
    this.accountService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(profile => {
        this.userProfile = profile;
        this.profileForm = { ...profile };
      });

    this.accountService.securitySettings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => this.securitySettings = settings);

    this.accountService.notificationSettings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => this.notificationSettings = settings);

    this.accountService.tradingPreferences$
      .pipe(takeUntil(this.destroy$))
      .subscribe(prefs => this.tradingPreferences = prefs);

    this.accountService.connectedAccounts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(accounts => this.connectedAccounts = accounts);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  switchSection(section: 'profile' | 'security' | 'notifications' | 'trading' | 'connections' | 'subscription'): void {
    this.activeSection = section;
    this.clearMessages();
  }

  // Profile Methods
  editProfile(): void {
    this.isEditingProfile = true;
  }

  cancelEditProfile(): void {
    this.isEditingProfile = false;
    this.profileForm = { ...this.userProfile };
  }

  saveProfile(): void {
    this.isSaving = true;
    this.accountService.updateProfile(this.profileForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.isEditingProfile = false;
          this.showSuccess('Profile updated successfully!');
        },
        error: () => {
          this.isSaving = false;
          this.showError('Failed to update profile');
        }
      });
  }

  onAvatarChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.accountService.uploadAvatar(file)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.showSuccess('Avatar updated successfully!'),
          error: () => this.showError('Failed to upload avatar')
        });
    }
  }

  // Security Methods
  togglePasswordChange(): void {
    this.isChangingPassword = !this.isChangingPassword;
    if (!this.isChangingPassword) {
      this.passwordForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
    }
  }

  changePassword(): void {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.showError('Passwords do not match');
      return;
    }

    this.isSaving = true;
    this.accountService.changePassword(this.passwordForm.oldPassword, this.passwordForm.newPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.isChangingPassword = false;
          this.passwordForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
          this.showSuccess('Password changed successfully!');
        },
        error: () => {
          this.isSaving = false;
          this.showError('Failed to change password');
        }
      });
  }

  toggle2FA(): void {
    const newValue = !this.securitySettings.twoFactorEnabled;
    this.accountService.updateSecuritySettings({ twoFactorEnabled: newValue })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.showSuccess(`Two-factor authentication ${newValue ? 'enabled' : 'disabled'}`),
        error: () => this.showError('Failed to update 2FA settings')
      });
  }

  // Notification Methods
  updateNotificationSetting(key: keyof NotificationSettings): void {
    const newSettings = {
      ...this.notificationSettings,
      [key]: !this.notificationSettings[key]
    };
    this.accountService.updateNotificationSettings(newSettings)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  // Trading Preferences Methods
  updateTradingPreference(key: keyof TradingPreferences, value: any): void {
    const newPrefs = {
      ...this.tradingPreferences,
      [key]: value
    };
    this.accountService.updateTradingPreferences(newPrefs)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.showSuccess('Trading preferences updated'),
        error: () => this.showError('Failed to update preferences')
      });
  }

  // Connected Accounts Methods
  toggleConnection(account: ConnectedAccount): void {
    if (account.connected) {
      this.accountService.disconnectAccount(account.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.showSuccess(`Disconnected from ${account.platform}`),
          error: () => this.showError('Failed to disconnect')
        });
    } else {
      this.accountService.connectAccount(account.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.showSuccess(`Connected to ${account.platform}`),
          error: () => this.showError('Failed to connect')
        });
    }
  }

  // Account Actions
  exportData(): void {
    this.accountService.exportData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'marketclimb-data.json';
        a.click();
        window.URL.revokeObjectURL(url);
        this.showSuccess('Data exported successfully!');
      });
  }

  deleteAccount(): void {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.accountService.deleteAccount()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccess('Account deleted successfully');
            // Redirect to login
          },
          error: () => this.showError('Failed to delete account')
        });
    }
  }

  // Helper Methods
  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.clearMessages(), 3000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.clearMessages(), 3000);
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  getMemberSince(): string {
    const years = new Date().getFullYear() - this.userProfile.joinDate.getFullYear();
    return years > 0 ? `${years} year${years > 1 ? 's' : ''}` : 'Less than a year';
  }
}   