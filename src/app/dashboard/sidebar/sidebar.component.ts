import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService, User } from 'src/app/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isAdmin = false;
  expandedSections: { [key: string]: boolean } = {
    trading: true,
    market: true,
    community: true,
    account: true
  };
  
  private userSubscription: Subscription | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      // Only check role property since User interface doesn't have is_admin
      this.isAdmin = user?.role === 'admin' || 
                     user?.role === 'superadmin' || 
                     user?.role === 'super_admin';
    });
    
    // Load saved section state from localStorage
    this.loadSectionState();
  }

  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section];
    this.saveSectionState();
  }

  private saveSectionState(): void {
    localStorage.setItem('sidebarSections', JSON.stringify(this.expandedSections));
  }

  private loadSectionState(): void {
    const saved = localStorage.getItem('sidebarSections');
    if (saved) {
      try {
        this.expandedSections = { ...this.expandedSections, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Error loading sidebar state:', e);
      }
    }
  }

  // Optional: Add methods to collapse/expand all
  collapseAllSections(): void {
    Object.keys(this.expandedSections).forEach(key => {
      this.expandedSections[key] = false;
    });
    this.saveSectionState();
  }

  expandAllSections(): void {
    Object.keys(this.expandedSections).forEach(key => {
      this.expandedSections[key] = true;
    });
    this.saveSectionState();
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}