import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Input() navbarSolid: boolean = false; // Keep for backward compatibility
  @Output() openNews = new EventEmitter<void>();

  onNewsClick() {
    this.openNews.emit(); // 🔥 triggers parent to show news overlay
  }

  // User data
  isLoggedIn: boolean = true; // TODO: Replace with real auth check
  userName: string = 'John Trader';
  userAvatar: string = 'https://i.pravatar.cc/150?img=12';
  userBalance: number = 125430.50;
  balanceVisible: boolean = true;
  
  // UI state
  isDashboard: boolean = false;
  profileDropdownOpen: boolean = false;
  notificationsOpen: boolean = false;
  mobileMenuOpen: boolean = false;
  
  // Notifications
  notifications = [
    {
      id: 1,
      type: 'success',
      icon: '✅',
      title: 'Trade Executed',
      message: 'Your buy order for AAPL was filled at $178.50',
      time: '2m ago',
      unread: true
    },
    {
      id: 2,
      type: 'warning',
      icon: '⚠️',
      title: 'Price Alert',
      message: 'TSLA reached your target price of $250',
      time: '15m ago',
      unread: true
    },
    {
      id: 3,
      type: 'info',
      icon: '📊',
      title: 'Market Update',
      message: 'Fed announces interest rate decision',
      time: '1h ago',
      unread: false
    }
  ];

  unreadCount: number = 0;

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Detect dashboard routes - FIXED VERSION
    this.router.events
      .pipe(
        filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        this.isDashboard = event.url.includes('/dashboard');
      });

    // Calculate unread notifications
    this.updateUnreadCount();

    // TODO: Replace with real auth service
    // this.authService.user$.subscribe(user => {
    //   this.isLoggedIn = !!user;
    //   this.userName = user?.name;
    //   this.userAvatar = user?.avatar;
    // });

    // TODO: Replace with real balance service
    // this.balanceService.balance$.subscribe(balance => {
    //   this.userBalance = balance;
    // });
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown') && !target.closest('.profile-trigger')) {
      this.profileDropdownOpen = false;
    }
    if (!target.closest('.notifications-dropdown') && !target.closest('.notification-trigger')) {
      this.notificationsOpen = false;
    }
  }

  toggleBalanceVisibility(): void {
    this.balanceVisible = !this.balanceVisible;
  }

  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
    if (this.profileDropdownOpen) {
      this.notificationsOpen = false;
    }
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.profileDropdownOpen = false;
      // Mark all as read
      this.notifications.forEach(n => n.unread = false);
      this.updateUnreadCount();
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

 

  updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => n.unread).length;
  }

  logout(): void {
    // TODO: Implement logout
    console.log('Logging out...');
    this.router.navigate(['/']);
  }

  goToProfile(): void {
    this.router.navigate(['/dashboard/account']);
    this.profileDropdownOpen = false;
  }

  goToSettings(): void {
    this.router.navigate(['/dashboard/account']);
    this.profileDropdownOpen = false;
  }

  goToFunding(): void {
    this.router.navigate(['/dashboard/account']);
    this.profileDropdownOpen = false;
  }

  formatBalance(balance: number): string {
    return balance.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  getNotificationClass(type: string): string {
    return `notification-${type}`;
  }
}