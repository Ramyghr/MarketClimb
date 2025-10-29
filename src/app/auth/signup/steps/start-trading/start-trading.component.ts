import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-start-trading',
  templateUrl: './start-trading.component.html',
  styleUrls: ['./start-trading.component.css']
})
export class StartTradingComponent implements OnInit {

  @Input() signupData: any; // All data from previous steps
  @Output() finishSignup = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void { }

  goToDashboard() {
    this.finishSignup.emit();
  }
}
