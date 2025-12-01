import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // Adjust path

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  currentYear: number = new Date().getFullYear();
  
  // UI State
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  emailSent: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = new FormGroup({
      email: new FormControl('', [
        Validators.required,
        Validators.email
      ])
    });
  }

  onSubmit(): void {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    // Check if form is valid
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    // Set loading state
    this.isLoading = true;

    // Get email value
    const email = this.forgotPasswordForm.value.email;

    // Call auth service
    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        console.log('Password reset email sent:', response);
        
        // Set success message
        this.successMessage = 'Password reset instructions have been sent to your email.';
        this.emailSent = true;
        
        // Reset loading state
        this.isLoading = false;
        
        // Optional: Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/signin']);
        }, 3000);
      },
      error: (error) => {
        console.error('Forgot password failed:', error);
        
        // Set error message
        this.errorMessage = error.message || 'Failed to send reset email. Please try again.';
        
        // Reset loading state
        this.isLoading = false;
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/signin']);
  }

  // Helper methods for template
  get email() {
    return this.forgotPasswordForm.get('email');
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.forgotPasswordForm.get(controlName);
    return !!(control && control.hasError(errorName) && (control.dirty || control.touched));
  }
}