import { Routes } from '@angular/router';
import { authGuard, loginGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'budgets', loadComponent: () => import('./pages/budget-management/budget-management.component').then(m => m.BudgetManagementComponent) },
      { path: 'expenditure', loadComponent: () => import('./pages/expenditure/expenditure.component').then(m => m.ExpenditureComponent) },
      { path: 'monitoring', loadComponent: () => import('./pages/monitoring/monitoring.component').then(m => m.MonitoringComponent) },
      { path: 'alerts', loadComponent: () => import('./pages/alerts/alerts.component').then(m => m.AlertsComponent) },
      { path: 'reports', loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent) },
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
