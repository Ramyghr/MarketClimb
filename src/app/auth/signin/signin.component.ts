import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service'; // Adjust the path if your AuthService is located elsewhere

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  loginForm!: FormGroup;
  currentYear: number = new Date().getFullYear();
  
  // UI State
  isLoading: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;
  returnUrl: string = '/dashboard';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get return URL from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // Check if already stored in localStorage
    const storedUrl = localStorage.getItem('redirectUrl');
    if (storedUrl) {
      this.returnUrl = storedUrl;
      localStorage.removeItem('redirectUrl');
    }

    // Initialize form
    this.loginForm = new FormGroup({
      email: new FormControl('', [
        Validators.required, 
        Validators.email
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6)
      ]),
      rememberMe: new FormControl(false)
    });
  }

  onSubmit(): void {
    // Clear previous errors
    this.errorMessage = '';

    // Check if form is valid
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Set loading state
    this.isLoading = true;

    // Get form values
    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    // Call auth service
    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        
        // Navigate to return URL or dashboard
        this.router.navigate([this.returnUrl]);
        
        // Reset loading state
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Login failed:', error);
        
        // Set error message
        this.errorMessage = error.message || 'Login failed. Please try again.';
        
        // Reset loading state
        this.isLoading = false;
        
        // Clear password field for security
        this.loginForm.patchValue({ password: '' });
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Helper methods for template
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control && control.hasError(errorName) && (control.dirty || control.touched));
  }
}