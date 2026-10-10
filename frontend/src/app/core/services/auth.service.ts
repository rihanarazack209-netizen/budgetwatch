import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginRequest, AuthResponse, ApiResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  currentUser = signal<User | null>(this.loadUser());
  isLoggedIn = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'admin');
  isFinanceOfficer = computed(() => this.currentUser()?.role === 'finance_officer' || this.currentUser()?.role === 'admin');

  constructor(private http: HttpClient, private router: Router) {}

  private loadUser(): User | null {
    const u = localStorage.getItem('bw_user');
    return u ? JSON.parse(u) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('bw_token');
  }

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem('bw_token', res.data.token);
          localStorage.setItem('bw_user', JSON.stringify(res.data.user));
          this.currentUser.set(res.data.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('bw_token');
    localStorage.removeItem('bw_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      tap(res => {
        if (res.success) {
          this.currentUser.set(res.data);
          localStorage.setItem('bw_user', JSON.stringify(res.data));
        }
      })
    );
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/change-password`, data);
  }

  updateProfile(data: { name: string }): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/profile`, data).pipe(
      tap(res => { if (res.success) { this.currentUser.set(res.data); localStorage.setItem('bw_user', JSON.stringify(res.data)); }})
    );
  }

  canAccess(roles: string[]): boolean {
    const role = this.currentUser()?.role;
    return role ? roles.includes(role) : false;
  }
}
