import { Component, OnInit, Input, Output, EventEmitter, HostListener, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService, User } from 'src/app/services/auth.service';
import { BalanceService } from 'src/app/services/balance.service'; // ← NOUVEAU
import { Subscription } from 'rxjs'; // ← pour se désabonner proprement

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() navbarSolid: boolean = false;
  @Output() openNews = new EventEmitter<void>();

  isLoggedIn: boolean = false;
  userName: string = '';
  userAvatar: string = '';
  userEmail: string = '';
  userBalance: number = 0;
  balanceVisible: boolean = true;

  isDashboard: boolean = false;
  profileDropdownOpen: boolean = false;
  notificationsOpen: boolean = false;
  mobileMenuOpen: boolean = false;

  notifications: any[] = [];
  unreadCount: number = 0;

  // Abonnement au solde partagé
  private balanceSub!: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private balanceService: BalanceService  // ← Injection du service partagé
  ) {}

  ngOnInit(): void {
    // Détection du dashboard
    this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.isDashboard = event.url.includes('/dashboard'));

    // Chargement de l'utilisateur
    this.loadUser();

    // Écoute en temps réel du solde (c’est ÇA qui fait tout !)
    this.balanceSub = this.balanceService.balance$.subscribe(balance => {
      this.userBalance = balance;
    });

    // Notifications mock (ou à remplacer plus tard)
    this.notifications = [
      { id: 1, type: 'success', icon: 'Check', title: 'Trade Executed', message: 'Your buy order for AAPL was filled at $178.50', time: '2m ago', unread: true },
      { id: 2, type: 'warning', icon: 'Warning', title: 'Price Alert', message: 'TSLA reached your target price of $250', time: '15m ago', unread: true },
      { id: 3, type: 'info', icon: 'Chart', title: 'Market Update', message: 'Fed announces interest rate decision', time: '1h ago', unread: false }
    ];
    this.updateUnreadCount();
  }

  ngOnDestroy(): void {
    this.balanceSub?.unsubscribe(); // Nettoyage propre
  }

  loadUser(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.isLoggedIn = false;
      return;
    }

    const handleUser = (user: User) => {
      this.isLoggedIn = true;
      this.userName = `${user.first_name} ${user.last_name}`;
      this.userEmail = user.email || 'trader@marketclimb.com';
      this.userAvatar = (user as any).avatar || 'https://i.pravatar.cc/150?img=12';
    };

    if ((currentUser as any).subscribe) {
      (currentUser as any).subscribe({
        next: (user: User) => handleUser(user),
        error: () => this.isLoggedIn = false
      });
    } else {
      handleUser(currentUser as User);
    }
  }

  // Le reste reste IDENTIQUE
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