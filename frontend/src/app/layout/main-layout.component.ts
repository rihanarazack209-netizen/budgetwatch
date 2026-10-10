import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { AlertService } from '../core/services/alert.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatBadgeModule, MatMenuModule, MatButtonModule, MatTooltipModule, MatDividerModule, CommonModule],
  template: `
    <div class="app-shell">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="collapsed">
        <div class="sidebar-header">
          <div class="logo">
            <div class="logo-icon">
              <mat-icon>account_balance</mat-icon>
            </div>
            <div class="logo-text" *ngIf="!collapsed">
              <span class="logo-name">BudgetWatch</span>
              <span class="logo-sub">Gov. Finance System</span>
            </div>
          </div>
          <button mat-icon-button class="collapse-btn" (click)="collapsed = !collapsed" matTooltip="Toggle sidebar">
            <mat-icon>{{ collapsed ? 'menu' : 'menu_open' }}</mat-icon>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" [matTooltip]="collapsed ? 'Dashboard' : ''" matTooltipPosition="right">
            <mat-icon>dashboard</mat-icon>
            <span *ngIf="!collapsed">Dashboard</span>
          </a>
          <a routerLink="/budgets" routerLinkActive="active" class="nav-item" [matTooltip]="collapsed ? 'Budget Management' : ''" matTooltipPosition="right">
            <mat-icon>account_balance_wallet</mat-icon>
            <span *ngIf="!collapsed">Budget Management</span>
          </a>
          <a routerLink="/expenditure" routerLinkActive="active" class="nav-item" [matTooltip]="collapsed ? 'Expenditure' : ''" matTooltipPosition="right">
            <mat-icon>receipt_long</mat-icon>
            <span *ngIf="!collapsed">Expenditure</span>
          </a>
          <a routerLink="/monitoring" routerLinkActive="active" class="nav-item" [matTooltip]="collapsed ? 'Monitoring' : ''" matTooltipPosition="right">
            <mat-icon>monitoring</mat-icon>
            <span *ngIf="!collapsed">Monitoring</span>
          </a>
          <a routerLink="/alerts" routerLinkActive="active" class="nav-item" [matTooltip]="collapsed ? 'Alerts' : ''" matTooltipPosition="right">
            <mat-icon [matBadge]="unreadAlerts > 0 ? unreadAlerts : null" matBadgeColor="warn" matBadgeSize="small">notifications</mat-icon>
            <span *ngIf="!collapsed">Alerts</span>
          </a>
          <a routerLink="/reports" routerLinkActive="active" class="nav-item" [matTooltip]="collapsed ? 'Reports' : ''" matTooltipPosition="right">
            <mat-icon>assessment</mat-icon>
            <span *ngIf="!collapsed">Reports</span>
          </a>
          <a *ngIf="auth.isAdmin()" routerLink="/admin" routerLinkActive="active" class="nav-item" [matTooltip]="collapsed ? 'Admin Panel' : ''" matTooltipPosition="right">
            <mat-icon>admin_panel_settings</mat-icon>
            <span *ngIf="!collapsed">Admin Panel</span>
          </a>
        </nav>

        <div class="sidebar-footer" *ngIf="!collapsed">
          <div class="user-info">
            <div class="user-avatar">{{ initials }}</div>
            <div class="user-details">
              <span class="user-name">{{ auth.currentUser()?.name }}</span>
              <span class="user-role">{{ roleLabel }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-content" [class.expanded]="collapsed">
        <header class="top-header">
          <div class="header-left">
            <h1 class="page-heading">{{ getPageTitle() }}</h1>
          </div>
          <div class="header-right">
            <button mat-icon-button routerLink="/alerts" matTooltip="View alerts">
              <mat-icon [matBadge]="unreadAlerts > 0 ? unreadAlerts : null" matBadgeColor="warn">notifications</mat-icon>
            </button>
            <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
              <div class="header-avatar">{{ initials }}</div>
              <span>{{ userFirstName }}</span>
              <mat-icon>arrow_drop_down</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              <div class="menu-header">
                <strong>{{ auth.currentUser()?.name }}</strong>
                <small>{{ auth.currentUser()?.email }}</small>
                <span class="badge badge-info mt-1">{{ roleLabel }}</span>
              </div>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="auth.logout()">
                <mat-icon>logout</mat-icon> Sign Out
              </button>
            </mat-menu>
          </div>
        </header>

        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell { display: flex; height: 100vh; overflow: hidden; }

    .sidebar {
      width: 260px; background: #1a237e; color: #fff; display: flex; flex-direction: column;
      transition: width 0.3s ease; flex-shrink: 0; overflow: hidden; position: relative; z-index: 10;
      box-shadow: 4px 0 12px rgba(0,0,0,0.15);
    }
    .sidebar.collapsed { width: 68px; }

    .sidebar-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); min-height: 72px;
    }
    .logo { display: flex; align-items: center; gap: 10px; overflow: hidden; flex: 1; }
    .logo-icon {
      width: 40px; height: 40px; background: #f9a825; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { color: #1a237e; font-size: 22px; width: 22px; height: 22px; }
    }
    .logo-text { overflow: hidden; }
    .logo-name { display: block; font-size: 16px; font-weight: 700; color: #fff; white-space: nowrap; }
    .logo-sub { display: block; font-size: 10px; color: rgba(255,255,255,0.6); white-space: nowrap; }
    .collapse-btn { color: rgba(255,255,255,0.7) !important; }

    .sidebar-nav { flex: 1; overflow-y: auto; padding: 12px 0; }
    .nav-item {
      display: flex; align-items: center; gap: 14px; padding: 12px 16px; color: rgba(255,255,255,0.75);
      text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 0;
      transition: all 0.2s; cursor: pointer; position: relative; white-space: nowrap;
      mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    }
    .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .nav-item.active {
      background: rgba(249,168,37,0.2); color: #f9a825;
      border-right: 3px solid #f9a825;
    }
    .nav-item.active mat-icon { color: #f9a825; }

    .sidebar-footer { border-top: 1px solid rgba(255,255,255,0.1); padding: 16px; }
    .user-info { display: flex; align-items: center; gap: 10px; }
    .user-avatar {
      width: 36px; height: 36px; background: #f9a825; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: #1a237e; flex-shrink: 0;
    }
    .user-name { display: block; font-size: 13px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; }
    .user-role { display: block; font-size: 11px; color: rgba(255,255,255,0.5); }

    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .top-header {
      height: 64px; background: #fff; display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); z-index: 5; flex-shrink: 0;
    }
    .page-heading { font-size: 18px; font-weight: 600; color: #1a237e; }
    .header-right { display: flex; align-items: center; gap: 8px; }
    .user-btn { display: flex; align-items: center; gap: 6px; font-size: 13px; }
    .header-avatar {
      width: 32px; height: 32px; background: #1a237e; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: #f9a825;
    }

    .content-area { flex: 1; overflow-y: auto; background: #f0f2f5; }

    .menu-header { padding: 12px 16px; display: flex; flex-direction: column; gap: 2px; }
    .menu-header strong { font-size: 14px; }
    .menu-header small { font-size: 12px; color: #666; }
    .mt-1 { margin-top: 4px; }

    @media (max-width: 768px) {
      .sidebar { width: 68px; }
      .sidebar.collapsed { width: 0; }
    }
  `]
})
export class MainLayoutComponent {
  collapsed = false;
  unreadAlerts = 0;

  constructor(public auth: AuthService, private alertService: AlertService) {
    this.loadAlertCount();
  }

  loadAlertCount() {
    this.alertService.getStats().subscribe(res => {
      if (res.success) this.unreadAlerts = res.data.summary.unread;
    });
  }

  get userFirstName(): string {
    const name = this.auth.currentUser()?.name;
    return name ? name.split(' ')[0] : 'User';
  }

  get initials(): string {
    const name = this.auth.currentUser()?.name || '';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  get roleLabel(): string {
    const map: any = { admin: 'Administrator', finance_officer: 'Finance Officer', department_head: 'Dept. Head' };
    return map[this.auth.currentUser()?.role || ''] || '';
  }

  router = inject(Router);

  getPageTitle(): string {
    const url = this.router.url.split('?')[0];
    const map: any = {
      '/dashboard': 'Dashboard',
      '/budgets': 'Budget Management',
      '/expenditure': 'Expenditure Tracking',
      '/monitoring': 'Monitoring & Detection',
      '/alerts': 'Alerts Center',
      '/reports': 'Reports & Analytics',
      '/admin': 'Admin Panel'
    };
    return map[url] || 'BudgetWatch';
  }
}
