import { Component, OnInit } from '@angular/core';
import { SignupService } from '../../core/services/signup.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  step: number = 1;
  steps = [
    { number: 1, name: 'Personal Details' },
    { number: 2, name: 'Further Info' },
    { number: 3, name: 'Account Config' },
    { number: 4, name: 'Declaration' },
    { number: 5, name: 'Start Trading' }
  ];

  signupData: any = {}; // collect all steps here
  currentYear: number = new Date().getFullYear();
  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private signupService: SignupService,
    private router: Router
  ) { }

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
    this.loading = true;

    this.signupService.registerUser(this.signupData).subscribe({
      next: (response) => {
        console.log('User registered successfully:', response);
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Signup failed:', error);
        this.errorMessage = 'Signup failed. Please try again.';
        this.loading = false;
      }
    });
    
  }
  
}
