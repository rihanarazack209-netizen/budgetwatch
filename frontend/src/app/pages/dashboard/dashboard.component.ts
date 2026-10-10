import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { MonitoringService } from '../../core/services/monitoring.service';
import { ExpenditureService } from '../../core/services/expenditure.service';
import { AuthService } from '../../core/services/auth.service';
import { UtilService } from '../../core/services/util.service';
import { DashboardStats } from '../../core/models/models';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule, MatChipsModule, NgChartsModule],
  template: `
    <div class="page-container">
      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div>
          <h2>Welcome back, {{ userFirstName }}! 👋</h2>
          <p>Here's the financial overview for FY 2024-25 as of {{ today }}</p>
        </div>
        <div class="banner-actions">
          <button mat-stroked-button routerLink="/monitoring" style="border-color:#fff;color:#fff">
            <mat-icon>radar</mat-icon> Run Detection
          </button>
        </div>
      </div>

      <!-- KPI Stats -->
      <div class="stats-row" *ngIf="stats">
        <div class="stat-card">
          <div class="stat-icon" style="background:#e8eaf6"><mat-icon style="color:#1a237e">account_balance_wallet</mat-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ util.formatINR(stats.totalAllocated) }}</span>
            <span class="stat-label">Total Budget Allocated</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#e8f5e9"><mat-icon style="color:#2e7d32">payments</mat-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ util.formatINR(stats.totalSpent) }}</span>
            <span class="stat-label">Total Expenditure</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" [style.background]="stats.utilizationPercentage < 40 ? '#ffebee' : stats.utilizationPercentage < 70 ? '#fff3e0' : '#e8f5e9'">
            <mat-icon [style.color]="stats.utilizationPercentage < 40 ? '#c62828' : stats.utilizationPercentage < 70 ? '#e65100' : '#2e7d32'">donut_large</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value" [class]="util.getUtilizationClass(stats.utilizationPercentage)">{{ stats.utilizationPercentage }}%</span>
            <span class="stat-label">Overall Utilization</span>
            <mat-progress-bar [value]="stats.utilizationPercentage" [class]="util.getProgressClass(stats.utilizationPercentage)"></mat-progress-bar>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fff3e0"><mat-icon style="color:#e65100">notifications_active</mat-icon></div>
          <div class="stat-info">
            <span class="stat-value" style="color:#e65100">{{ stats.totalAlerts }}</span>
            <span class="stat-label">Active Alerts</span>
            <span class="sub-info" *ngIf="stats.criticalAlerts > 0">{{ stats.criticalAlerts }} critical</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f3e5f5"><mat-icon style="color:#6a1b9a">business</mat-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.activeDepartments }}</span>
            <span class="stat-label">Active Departments</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#e3f2fd"><mat-icon style="color:#0277bd">pending_actions</mat-icon></div>
          <div class="stat-info">
            <span class="stat-value" style="color:#0277bd">{{ stats.pendingExpenditures }}</span>
            <span class="stat-label">Pending Approvals</span>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid-2" style="margin-bottom:20px">
        <div class="card">
          <div class="card-header"><span class="card-title">📊 Monthly Spending Trend</span></div>
          <canvas baseChart [data]="lineChartData" [options]="lineChartOptions" type="line" style="max-height:220px"></canvas>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">🥧 Expense Category Breakdown</span></div>
          <canvas baseChart [data]="pieChartData" [options]="pieChartOptions" type="doughnut" style="max-height:220px"></canvas>
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="grid-2" *ngIf="stats">
        <!-- Recent Transactions -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">💳 Recent Transactions</span>
            <button mat-button routerLink="/expenditure" color="primary">View All</button>
          </div>
          <div *ngIf="stats.recentTransactions && stats.recentTransactions.length > 0; else noTxn">
            <div class="list-item" *ngFor="let t of stats.recentTransactions">
              <div class="list-icon"><mat-icon>{{ util.getCategoryIcon(t.expenseCategory) }}</mat-icon></div>
              <div class="list-info">
                <span class="list-title">{{ formatDesc(t.description) }}</span>
                <span class="list-sub">{{ getDeptName(t.departmentId) }} · {{ util.formatDate(t.date) }}</span>
              </div>
              <div class="list-value">
                <strong>{{ util.formatINRShort(t.amount) }}</strong>
                <span class="badge" [class]="util.getStatusClass(t.status)">{{ t.status }}</span>
              </div>
            </div>
          </div>
          <ng-template #noTxn><div class="empty-state"><mat-icon>receipt</mat-icon><p>No transactions yet</p></div></ng-template>
        </div>

        <!-- Recent Alerts -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">🚨 Recent Alerts</span>
            <button mat-button routerLink="/alerts" color="primary">View All</button>
          </div>
          <div *ngIf="stats.recentAlerts && stats.recentAlerts.length > 0; else noAlert">
            <div class="list-item alert-item" [class]="'severity-' + a.severity" *ngFor="let a of stats.recentAlerts">
              <div class="list-icon" [style.color]="severityColor(a.severity)">
                <mat-icon>{{ util.getAlertTypeIcon(a.alertType) }}</mat-icon>
              </div>
              <div class="list-info">
                <span class="list-title">{{ util.getAlertTypeLabel(a.alertType) }}</span>
                <span class="list-sub">{{ getDeptName(a.departmentId) }} · {{ util.formatDate(a.createdAt) }}</span>
              </div>
              <span class="badge" [class]="util.getSeverityClass(a.severity)">{{ a.severity }}</span>
            </div>
          </div>
          <ng-template #noAlert><div class="empty-state"><mat-icon>check_circle</mat-icon><p>No active alerts</p></div></ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .welcome-banner {
      background: linear-gradient(135deg, #1a237e, #3949ab); color: #fff; border-radius: 16px;
      padding: 24px 28px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;
      h2 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
      p { font-size: 13px; color: rgba(255,255,255,0.75); }
    }

    .stat-card {
      background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      display: flex; align-items: center; gap: 16px;
    }
    .stat-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
    }
    .stat-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .stat-value { font-size: 20px; font-weight: 700; color: #1a1a2e; line-height: 1; }
    .stat-label { font-size: 12px; color: #666; }
    .sub-info { font-size: 11px; color: #c62828; font-weight: 500; }

    .list-item {
      display: flex; align-items: center; gap: 12px; padding: 10px 0;
      border-bottom: 1px solid #f5f5f5;
      &:last-child { border-bottom: none; }
    }
    .alert-item { padding: 10px 8px; border-radius: 6px; margin-bottom: 4px; border-bottom: none; }
    .list-icon { width: 36px; height: 36px; background: #f5f7ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; mat-icon { font-size: 18px; width: 18px; height: 18px; color: #5c6bc0; } }
    .list-info { flex: 1; display: flex; flex-direction: column; }
    .list-title { font-size: 13px; font-weight: 500; color: #333; }
    .list-sub { font-size: 11px; color: #999; }
    .list-value { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; strong { font-size: 13px; font-weight: 600; } }
  `]
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  lineChartData: ChartData = { labels: [], datasets: [{ label: 'Monthly Spending (₹ Cr)', data: [], borderColor: '#1a237e', backgroundColor: 'rgba(26,35,126,0.1)', fill: true, tension: 0.4 }] };
  lineChartOptions: ChartConfiguration['options'] = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v) => `₹${(+v / 10000000).toFixed(0)}Cr` } } } };

  pieChartData: ChartData = { labels: [], datasets: [{ data: [], backgroundColor: ['#1a237e','#3949ab','#5c6bc0','#f9a825','#e65100','#2e7d32','#0277bd','#6a1b9a'] }] };
  pieChartOptions: ChartConfiguration['options'] = { responsive: true, plugins: { legend: { position: 'right' } } };

  constructor(public auth: AuthService, private monitoring: MonitoringService, private expenditureService: ExpenditureService, public util: UtilService) {}

  ngOnInit() {
    this.monitoring.getDashboardStats().subscribe(res => {
      if (res.success) {
        this.stats = res.data;
        this.buildLineChart(res.data.monthlyTrend);
      }
    });
    this.expenditureService.getCategoryStats().subscribe(res => {
      if (res.success) this.buildPieChart(res.data);
    });
  }

  buildLineChart(trend: any[]) {
    this.lineChartData = {
      labels: trend.map(t => `${this.util.getMonthName(t._id.month)} ${t._id.year}`),
      datasets: [{ label: 'Spending (₹)', data: trend.map(t => t.total), borderColor: '#1a237e', backgroundColor: 'rgba(26,35,126,0.08)', fill: true, tension: 0.4, pointBackgroundColor: '#1a237e', pointRadius: 5 }]
    };
  }

  buildPieChart(cats: any[]) {
    this.pieChartData = {
      labels: cats.map(c => c._id.charAt(0).toUpperCase() + c._id.slice(1)),
      datasets: [{ data: cats.map(c => c.total), backgroundColor: ['#1a237e','#3949ab','#5c6bc0','#f9a825','#e65100','#2e7d32','#0277bd','#6a1b9a'] }]
    };
  }

  get userFirstName(): string {
    const name = this.auth.currentUser()?.name;
    return name ? name.split(' ')[0] : 'User';
  }

  getDeptName(dept: any): string {
    if (!dept) return 'N/A';
    return typeof dept === 'object' ? dept.name : 'N/A';
  }

  formatDesc(desc?: string): string {
    if (!desc) return '-';
    return desc.length > 45 ? desc.slice(0, 45) + '...' : desc;
  }

  severityColor(s: string): string {
    const m: any = { critical: '#c62828', high: '#e65100', medium: '#f9a825', low: '#0277bd' };
    return m[s] || '#666';
  }
}
