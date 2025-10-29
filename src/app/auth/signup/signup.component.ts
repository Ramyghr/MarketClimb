import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
// signup.component.ts
export class SignupComponent implements OnInit {
  step: number = 1;
  steps = [
    { number: 1, name: 'Personal Details' },
    { number: 2, name: 'Further Info' },
    { number: 3, name: 'Account Config' },
    { number: 4, name: 'Declaration' },
    { number: 5, name: 'Start Trading' }
  ];

  signupData: any = {};
  currentYear: number = new Date().getFullYear();

  constructor() { }

  ngOnInit(): void { }

  nextStep(data?: any, stepNumber?: number): void {
    if (data) {
      this.signupData = { ...this.signupData, ...data };
    }
    if (stepNumber) {
      this.step = stepNumber + 1;
    } else {
      this.step++;
    }
  }

  previousStep(): void {
    if (this.step > 1) {
      this.step--;
    }
  }

  isStepCompleted(stepNumber: number): boolean {
    return this.step > stepNumber;
  }

  finishSignup(): void {
    console.log('Signup complete', this.signupData);
    // redirect or show success message
  }
}
