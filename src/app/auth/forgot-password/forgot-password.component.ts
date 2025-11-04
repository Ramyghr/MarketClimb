import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isSubmitted: boolean = false;
  isLoading: boolean = false;
  currentYear: number = new Date().getFullYear();

  constructor() {}

  ngOnInit(): void {
    this.forgotPasswordForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      console.log('Password reset requested for:', this.forgotPasswordForm.value.email);
      
      // TODO: Call your authentication service here
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        this.isSubmitted = true;
      }, 1500);
      
    } else {
      this.forgotPasswordForm.markAllAsTouched();
      console.log('Form Invalid');
    }
  }

  resetForm(): void {
    this.isSubmitted = false;
    this.forgotPasswordForm.reset();
  }
}