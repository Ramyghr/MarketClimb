import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService, User } from 'src/app/services/auth.service'; // make sure path is correct
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Input() navbarSolid: boolean = false;
  @Output() openNews = new EventEmitter<void>();

  isLoggedIn: boolean = false;
  userName: string = '';
  userAvatar: string = '';
  userBalance: number = 0;
  balanceVisible: boolean = true;

  isDashboard: boolean = false;
  profileDropdownOpen: boolean = false;
  notificationsOpen: boolean = false;
  mobileMenuOpen: boolean = false;

  notifications: any[] = [];
  unreadCount: number = 0;

  constructor(private router: Router, private authService: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    // Detect dashboard route
    this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.isDashboard = event.url.includes('/dashboard'));

    // Load current user
    this.loadUser();

    // Example notifications (replace with backend call if needed)
    this.notifications = [
      { id: 1, type: 'success', icon: '✅', title: 'Trade Executed', message: 'Your buy order for AAPL was filled at $178.50', time: '2m ago', unread: true },
      { id: 2, type: 'warning', icon: '⚠️', title: 'Price Alert', message: 'TSLA reached your target price of $250', time: '15m ago', unread: true },
      { id: 3, type: 'info', icon: '📊', title: 'Market Update', message: 'Fed announces interest rate decision', time: '1h ago', unread: false }
    ];
    this.updateUnreadCount();
  }

  loadUser(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.isLoggedIn = false;
      return;
    }

    // Support both synchronous User return or Observable<User>
    if ((currentUser as any).subscribe && typeof (currentUser as any).subscribe === 'function') {
      (currentUser as any).subscribe({
        next: (user: User) => {
          this.isLoggedIn = true;
          this.userName = `${user.first_name} ${user.last_name}`;
          this.userAvatar = (user as any).avatar || 'https://i.pravatar.cc/150?img=12';
          // Fetch balance from backend
          this.http.get<{ balance: number }>(`/user/balance`).subscribe(res => this.userBalance = res.balance);
        },
        error: () => { this.isLoggedIn = false; }
      });
    } else {
      const user = currentUser as User;
      this.isLoggedIn = true;
      this.userName = `${user.first_name} ${user.last_name}`;
      this.userAvatar = (user as any).avatar || 'https://i.pravatar.cc/150?img=12';
      // Fetch balance from backend
      this.http.get<{ balance: number }>(`/user/balance`).subscribe(res => this.userBalance = res.balance);
    }
  }

  logout(): void {
    const result: any = this.authService.logout();

    // If logout returns an Observable
    if (result && typeof result.subscribe === 'function') {
      result.subscribe({
        next: () => {
          this.isLoggedIn = false;
          this.router.navigate(['/signin']);
        },
        error: (err: any) => console.error('Logout failed', err)
      });
      return;
    }

    // If logout returns a Promise
    if (result && typeof result.then === 'function') {
      result
        .then(() => {
          this.isLoggedIn = false;
          this.router.navigate(['/signin']);
        })
        .catch((err: any) => console.error('Logout failed', err));
      return;
    }

    // Otherwise assume logout is synchronous (void)
    try {
      this.isLoggedIn = false;
      this.router.navigate(['/signin']);
    } catch (err: any) {
      console.error('Logout failed', err);
    }
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'success': return 'notification-success';
      case 'warning': return 'notification-warning';
      case 'info': return 'notification-info';
      default: return '';
    }
  }

  updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => n.unread).length;
  }

  toggleBalanceVisibility(): void { this.balanceVisible = !this.balanceVisible; }
  toggleProfileDropdown(): void { this.profileDropdownOpen = !this.profileDropdownOpen; if (this.profileDropdownOpen) this.notificationsOpen = false; }
  toggleNotifications(): void { this.notificationsOpen = !this.notificationsOpen; if (this.notificationsOpen) { this.profileDropdownOpen = false; this.notifications.forEach(n => n.unread = false); this.updateUnreadCount(); } }
  toggleMobileMenu(): void { this.mobileMenuOpen = !this.mobileMenuOpen; }

  goToProfile(): void { this.router.navigate(['/dashboard/account']); this.profileDropdownOpen = false; }
  goToSettings(): void { this.router.navigate(['/dashboard/account']); this.profileDropdownOpen = false; }
  goToFunding(): void { this.router.navigate(['/dashboard/account']); this.profileDropdownOpen = false; }

  formatBalance(balance: number): string {
    return balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  onNewsClick(): void { this.openNews.emit(); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown') && !target.closest('.profile-trigger')) this.profileDropdownOpen = false;
    if (!target.closest('.notifications-dropdown') && !target.closest('.notification-trigger')) this.notificationsOpen = false;
  }
}
