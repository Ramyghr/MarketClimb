import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

// -------------------------
// Interfaces
// -------------------------
export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  level?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  two_factor_enabled?: boolean;
  join_date?: string;
  location?: string;
  website?: string;
  bio?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  display_name?: string;
  password: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  website?: string;

  email_notifications?: boolean;
  push_notifications?: boolean;
  trade_alerts?: boolean;
  price_alerts?: boolean;
  news_alerts?: boolean;
  social_updates?: boolean;
  weekly_report?: boolean;
  default_order_type?: string;
  confirm_orders?: boolean;
  auto_stop_loss?: boolean;
  stop_loss_percent?: number;
  auto_take_profit?: boolean;
  take_profit_percent?: number;
  risk_level?: string;
}

// -------------------------
// Service
// -------------------------
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000';
  
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  
  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated$: Observable<boolean>;

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
    
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  }

  // -------------------------
  // LOGIN
  // -------------------------
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(res => this.handleAuthSuccess(res)),
        catchError(this.handleError)
      );
  }

  // -------------------------
  // REGISTER
  // -------------------------
  register(data: RegisterData): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data)
      .pipe(catchError(this.handleError));
  }

  // -------------------------
  // LOGOUT
  // -------------------------
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/signin']);
  }

  logoutAllDevices(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout-all-devices`, {})
      .pipe(
        tap(() => this.logout()),
        catchError(this.handleError)
      );
  }

  // -------------------------
  // FORGOT PASSWORD
  // -------------------------
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/reset-password-request`, { email })
      .pipe(catchError(this.handleError));
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/reset-password`, { token, new_password: newPassword })
      .pipe(catchError(this.handleError));
  }

  // -------------------------
  // GET CURRENT USER
  // -------------------------
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // -------------------------
  // CHECK AUTHENTICATION
  // -------------------------
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  // -------------------------
  // TOKEN
  // -------------------------
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // -------------------------
  // PRIVATE HELPERS
  // -------------------------
  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }

  private getStoredUser(): User | null {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        return null;
      }
    }
    return null;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.error?.detail) errorMessage = error.error.detail;
      else if (error.error?.message) errorMessage = error.error.message;
      else if (error.status === 401) errorMessage = 'Invalid credentials';
      else if (error.status === 404) errorMessage = 'Endpoint not found';
      else if (error.status === 500) errorMessage = 'Server error. Try again later';
      else errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error('AuthService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
