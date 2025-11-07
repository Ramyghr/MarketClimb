import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  sidebarExpanded: boolean = false;
  selectedSymbol: string = 'NASDAQ:TSLA'; // <-- add this

  
  // Add the buy/sell functions
  buy() {
    console.log(`Buying ${this.selectedSymbol}`);
    // Implement your logic here
  }

  sell() {
    console.log(`Selling ${this.selectedSymbol}`);
    // Implement your logic here
  }
}
