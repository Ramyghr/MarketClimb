import { Component, OnInit, ElementRef } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  private toggleButton: any;
  sidebarVisible = false;

  constructor(public location: Location, private element: ElementRef) {}

  ngOnInit(): void {
    const navbar: HTMLElement = this.element.nativeElement;
    this.toggleButton = navbar.getElementsByClassName('navbar-toggler')[0];
  }

  sidebarOpen(): void {
    const html = document.getElementsByTagName('html')[0];
    setTimeout(() => this.toggleButton.classList.add('toggled'), 500);
    html.classList.add('nav-open');
    this.sidebarVisible = true;
  }

  sidebarClose(): void {
    const html = document.getElementsByTagName('html')[0];
    this.toggleButton.classList.remove('toggled');
    html.classList.remove('nav-open');
    this.sidebarVisible = false;
  }

  sidebarToggle(): void {
    this.sidebarVisible ? this.sidebarClose() : this.sidebarOpen();
  }

  isHome(): boolean {
    const path = this.location.prepareExternalUrl(this.location.path());
    return path === '/home' || path === '#/home';
  }
}
