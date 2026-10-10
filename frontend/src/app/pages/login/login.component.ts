import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="login-page">
      <div class="login-left">
        <div class="left-content">
          <div class="emblem">
            <mat-icon>account_balance</mat-icon>
          </div>
          <h1>AI-Based Budget Utilization Monitoring System</h1>
          <p>Empowering transparent, accountable, and efficient public finance management through real-time analytics and intelligent anomaly detection.</p>
          <div class="features">
            <div class="feature-item"><mat-icon>verified</mat-icon><span>Real-time budget tracking</span></div>
            <div class="feature-item"><mat-icon>verified</mat-icon><span>AI-powered anomaly detection</span></div>
            <div class="feature-item"><mat-icon>verified</mat-icon><span>Department-wise utilization monitoring</span></div>
            <div class="feature-item"><mat-icon>verified</mat-icon><span>Automated alerts & reporting</span></div>
          </div>
          <div class="orgs">
            <span>In partnership with</span>
            <div class="org-badges">
              <span class="org-badge">CAG of India</span>
              <span class="org-badge">Unified Mentor</span>
            </div>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="login-header">
            <div class="login-logo"><mat-icon>account_balance</mat-icon></div>
            <h2>BudgetWatch</h2>
            <p>Sign in to your account</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <mat-form-field appearance="outline">
              <mat-label>Email Address</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput type="email" formControlName="email" placeholder="name@gov.in" autocomplete="email">
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">Please enter a valid email</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password" autocomplete="current-password">
              <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword">
                <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">Password is required</mat-error>
            </mat-form-field>

            <div *ngIf="errorMsg" class="error-banner">
              <mat-icon>error_outline</mat-icon> {{ errorMsg }}
            </div>

            <button mat-raised-button type="submit" class="login-btn" [disabled]="loading">
              <mat-spinner *ngIf="loading" diameter="20" class="btn-spinner"></mat-spinner>
              <span *ngIf="!loading">Sign In</span>
            </button>
          </form>

          <div class="demo-creds">
            <p class="creds-title">⚡ One-Click Quick Sign In</p>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <button mat-stroked-button type="button" class="quick-btn" (click)="quickLogin('admin@budgetwatch.gov.in', 'Admin@123')">
                <span class="badge badge-danger">ADMIN</span>
                <span>admin&#64;budgetwatch.gov.in</span>
                <mat-icon style="margin-left:auto; font-size:16px; width:16px; height:16px;">arrow_forward</mat-icon>
              </button>
              <button mat-stroked-button type="button" class="quick-btn" (click)="quickLogin('priya.sharma@budgetwatch.gov.in', 'User@123')">
                <span class="badge badge-info">FINANCE</span>
                <span>priya.sharma&#64;budgetwatch.gov.in</span>
                <mat-icon style="margin-left:auto; font-size:16px; width:16px; height:16px;">arrow_forward</mat-icon>
              </button>
              <button mat-stroked-button type="button" class="quick-btn" (click)="quickLogin('sunita.patel@budgetwatch.gov.in', 'User@123')">
                <span class="badge badge-success">DEPT HEAD</span>
                <span>sunita.patel&#64;budgetwatch.gov.in</span>
                <mat-icon style="margin-left:auto; font-size:16px; width:16px; height:16px;">arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </div>
        <p class="footer-text">© 2024 BudgetWatch · Government Finance Management System</p>
      </div>
    </div>
  `,
  styles: [`
    .login-page { display: flex; height: 100vh; overflow: hidden; }

    .login-left {
      flex: 1.2; background: linear-gradient(135deg, #0d1257 0%, #1a237e 50%, #283593 100%);
      display: flex; align-items: center; justify-content: center; padding: 48px;
    }
    .left-content { max-width: 480px; color: #fff; }
    .emblem {
      width: 72px; height: 72px; background: #f9a825; border-radius: 18px;
      display: flex; align-items: center; justify-content: center; margin-bottom: 28px;
      mat-icon { font-size: 40px; width: 40px; height: 40px; color: #1a237e; }
    }
    .left-content h1 { font-size: 28px; font-weight: 700; line-height: 1.3; margin-bottom: 16px; }
    .left-content > p { font-size: 15px; color: rgba(255,255,255,0.75); line-height: 1.6; margin-bottom: 32px; }

    .features { display: flex; flex-direction: column; gap: 12px; margin-bottom: 36px; }
    .feature-item { display: flex; align-items: center; gap: 10px; font-size: 14px; color: rgba(255,255,255,0.85); }
    .feature-item mat-icon { color: #f9a825; font-size: 18px; width: 18px; height: 18px; }

    .orgs span { font-size: 12px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; }
    .org-badges { display: flex; gap: 8px; margin-top: 8px; }
    .org-badge { background: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 20px; font-size: 12px; color: rgba(255,255,255,0.8); }

    .login-right {
      width: 480px; display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: #f0f2f5; padding: 32px;
    }
    .login-card {
      background: #fff; border-radius: 20px; padding: 40px; width: 100%; max-width: 400px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    }
    .login-header { text-align: center; margin-bottom: 28px; }
    .login-logo {
      width: 56px; height: 56px; background: #1a237e; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;
      mat-icon { color: #f9a825; font-size: 30px; width: 30px; height: 30px; }
    }
    .login-header h2 { font-size: 24px; font-weight: 700; color: #1a237e; margin-bottom: 4px; }
    .login-header p { color: #666; font-size: 14px; }

    .login-form { display: flex; flex-direction: column; gap: 4px; }
    .login-btn {
      background: #1a237e !important; color: #fff !important; padding: 12px !important;
      font-size: 15px !important; font-weight: 600 !important; border-radius: 10px !important; height: 48px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-spinner { display: inline-block; }
    ::ng-deep .btn-spinner circle { stroke: #fff !important; }

    .error-banner {
      background: #ffebee; color: #c62828; border-radius: 8px; padding: 10px 14px;
      display: flex; align-items: center; gap: 8px; font-size: 13px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .demo-creds {
      margin-top: 24px; padding: 16px; background: #f5f7ff; border-radius: 10px;
      border: 1px dashed #c5cae9;
    }
    .creds-title { font-size: 12px; font-weight: 600; color: #1a237e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
    .quick-btn {
      display: flex !important; align-items: center !important; gap: 8px !important;
      padding: 8px 12px !important; font-size: 12px !important; border-radius: 8px !important;
      text-align: left !important; width: 100% !important; background: #fff !important;
      border-color: #c5cae9 !important;
      &:hover { background: #e8eaf6 !important; border-color: #1a237e !important; }
    }

    .footer-text { font-size: 12px; color: #999; margin-top: 16px; text-align: center; }

    @media (max-width: 768px) {
      .login-left { display: none; }
      .login-right { width: 100%; }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  showPassword = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private snackBar: MatSnackBar) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  fillCreds(email: string, password: string) {
    this.loginForm.patchValue({ email, password });
  }

  quickLogin(email: string, password: string) {
    this.loginForm.patchValue({ email, password });
    this.onSubmit();
  }

  onSubmit() {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';
    this.auth.login(this.loginForm.value).subscribe({
      next: () => { this.router.navigate(['/dashboard']); },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }
}
