import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { Router, Event, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, AfterViewInit {

   @Input() navbarSolid: boolean = false;
  sidebarVisible: boolean = false;
  isDashboard: boolean = false;
  hideSidebarToggle: boolean = false;
  activeSection: string = 'home';
  isLoggedIn: boolean = false; // Replace with real auth check

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Detect dashboard and registration routes
    this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.isDashboard = event.url.includes('/dashboard');
        this.hideSidebarToggle = event.url.includes('/register');
      });

    // TODO: Replace with real auth check
    // Example: this.authService.isLoggedIn$.subscribe(status => this.isLoggedIn = status);
  }

  ngAfterViewInit(): void {
    // Highlight active section on scroll
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.activeSection = entry.target.id;
        }
      });
    }, { threshold: 0.5 });

    sections.forEach(section => observer.observe(section));
  }

  sidebarToggle(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

}
