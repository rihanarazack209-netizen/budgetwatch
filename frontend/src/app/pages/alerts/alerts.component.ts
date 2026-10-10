import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertService } from '../../core/services/alert.service';
import { AuthService } from '../../core/services/auth.service';
import { UtilService } from '../../core/services/util.service';
import { Alert, AlertStats } from '../../core/models/models';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatSelectModule, MatSnackBarModule, MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">Alerts & Irregularity Notification Center</h2>
          <p class="page-subtitle">Continuous rule-based surveillance warnings, spending spikes, and threshold breaches</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button (click)="markAllAsRead()">
            <mat-icon>done_all</mat-icon> Mark All as Read
          </button>
        </div>
      </div>

      <!-- Alert Metrics Cards -->
      <div class="stats-row" *ngIf="stats">
        <div class="stat-card">
          <div class="stat-icon" style="background: #ffebee;"><mat-icon style="color: #c62828;">crisis_alert</mat-icon></div>
          <div class="stat-info">
            <span class="stat-value" style="color: #c62828;">{{ stats.summary.critical }}</span>
            <span class="stat-label">Critical Severity</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff3e0;"><mat-icon style="color: #e65100;">warning</mat-icon></div>
          <div class="stat-info">
            <span class="stat-value" style="color: #e65100;">{{ stats.summary.high }}</span>
            <span class="stat-label">High Priority</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #f5f5f5;"><mat-icon style="color: #616161;">mark_email_unread</mat-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.summary.unread }}</span>
            <span class="stat-label">Unread Notifications</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #e8f5e9;"><mat-icon style="color: #2e7d32;">pending_actions</mat-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.summary.unresolved }}</span>
            <span class="stat-label">Pending Action</span>
          </div>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="filter-bar">
        <mat-form-field appearance="outline">
          <mat-label>Severity</mat-label>
          <mat-select [(value)]="selectedSeverity" (selectionChange)="loadAlerts()">
            <mat-option value="">All Severities</mat-option>
            <mat-option value="critical">Critical</mat-option>
            <mat-option value="high">High</mat-option>
            <mat-option value="medium">Medium</mat-option>
            <mat-option value="low">Low</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Alert Type</mat-label>
          <mat-select [(value)]="selectedType" (selectionChange)="loadAlerts()">
            <mat-option value="">All Types</mat-option>
            <mat-option value="under_utilization">Under-Utilization</mat-option>
            <mat-option value="overspending">Overspending</mat-option>
            <mat-option value="spending_spike">Spending Spike</mat-option>
            <mat-option value="threshold_breach">Threshold Breach</mat-option>
            <mat-option value="inactivity">Inactivity</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(value)]="selectedResolved" (selectionChange)="loadAlerts()">
            <mat-option value="">All (Active & Resolved)</mat-option>
            <mat-option value="false">Unresolved Only</mat-option>
            <mat-option value="true">Resolved Only</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-stroked-button (click)="resetFilters()" style="margin-bottom: 22px;">
          <mat-icon>restart_alt</mat-icon> Reset
        </button>
      </div>

      <!-- Alerts List -->
      <div class="alerts-container">
        <div *ngIf="alerts.length; else noAlerts">
          <div class="alert-box" *ngFor="let a of alerts" [class]="'severity-' + a.severity" [class.is-read]="a.isRead">
            <div class="alert-icon-col">
              <mat-icon [style.color]="severityColor(a.severity)">{{ util.getAlertTypeIcon(a.alertType) }}</mat-icon>
            </div>

            <div class="alert-content-col">
              <div class="alert-top">
                <div class="alert-title-row">
                  <span class="alert-badge-type">{{ util.getAlertTypeLabel(a.alertType) }}</span>
                  <span class="badge" [class]="util.getSeverityClass(a.severity)">{{ a.severity }}</span>
                  <span class="dept-tag" *ngIf="a.departmentId">{{ a.departmentId.name }}</span>
                </div>
                <span class="alert-time">{{ util.formatDate(a.createdAt) }}</span>
              </div>

              <p class="alert-msg">{{ a.message }}</p>

              <div class="alert-footer">
                <span class="code-ref" *ngIf="a.budgetId">Scheme Ref: {{ a.budgetId.budgetCode }}</span>
                <span class="resolved-note" *ngIf="a.isResolved">
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px; color: #2e7d32;">check_circle</mat-icon>
                  Resolved by {{ a.resolvedBy?.name || 'Administrator' }}
                </span>

                <div class="action-btns" *ngIf="!a.isResolved">
                  <button mat-button color="primary" *ngIf="!a.isRead" (click)="markAsRead(a)">
                    <mat-icon>drafts</mat-icon> Mark Read
                  </button>
                  <button mat-raised-button color="primary" *ngIf="auth.isFinanceOfficer()" (click)="resolveAlert(a)">
                    <mat-icon>task_alt</mat-icon> Resolve Irregularity
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ng-template #noAlerts>
          <div class="empty-state card">
            <mat-icon>verified</mat-icon>
            <h3>No Anomaly Alerts Found</h3>
            <p>All budgets and expenditures are complying with prescribed threshold parameters.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .alerts-container { display: flex; flex-direction: column; gap: 12px; }
    .alert-box {
      background: #fff; border-radius: 12px; padding: 18px 20px; box-shadow: var(--shadow);
      display: flex; gap: 16px; transition: background 0.2s;
    }
    .alert-box.is-read { background: #fafafa; opacity: 0.92; }

    .alert-icon-col {
      width: 44px; height: 44px; border-radius: 10px; background: #f5f5f5;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
    }

    .alert-content-col { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .alert-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .alert-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .alert-badge-type { font-weight: 700; color: #1a1a2e; font-size: 14px; }
    .dept-tag { background: #e8eaf6; color: #1a237e; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 500; }
    .alert-time { font-size: 12px; color: #888; }

    .alert-msg { font-size: 13.5px; color: #444; margin: 0; line-height: 1.5; }

    .alert-footer {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 6px; padding-top: 10px; border-top: 1px solid #f0f0f0; flex-wrap: wrap; gap: 8px;
    }
    .code-ref { font-size: 11.5px; color: #666; font-family: monospace; }
    .resolved-note { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #2e7d32; font-weight: 500; }
    .action-btns { display: flex; gap: 8px; margin-left: auto; }
  `]
})
export class AlertsComponent implements OnInit {
  alerts: Alert[] = [];
  stats: AlertStats | null = null;

  selectedSeverity = '';
  selectedType = '';
  selectedResolved = '';

  constructor(
    private alertService: AlertService,
    public auth: AuthService,
    public util: UtilService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadAlerts();
  }

  loadStats() {
    this.alertService.getStats().subscribe(res => {
      if (res.success) this.stats = res.data;
    });
  }

  loadAlerts() {
    const filter: any = {};
    if (this.selectedSeverity) filter.severity = this.selectedSeverity;
    if (this.selectedType) filter.alertType = this.selectedType;
    if (this.selectedResolved !== '') filter.isResolved = this.selectedResolved === 'true';

    this.alertService.getAlerts(filter).subscribe(res => {
      if (res.success) this.alerts = res.data;
    });
  }

  resetFilters() {
    this.selectedSeverity = '';
    this.selectedType = '';
    this.selectedResolved = '';
    this.loadAlerts();
  }

  markAsRead(a: Alert) {
    this.alertService.markAsRead(a._id).subscribe(() => {
      a.isRead = true;
      this.loadStats();
    });
  }

  markAllAsRead() {
    this.alertService.markAllRead().subscribe(() => {
      this.alerts.forEach(a => a.isRead = true);
      this.loadStats();
      this.snackBar.open('All alerts marked as read.', 'Close', { duration: 2500 });
    });
  }

  resolveAlert(a: Alert) {
    this.alertService.resolveAlert(a._id).subscribe({
      next: (res) => {
        a.isResolved = true;
        a.isRead = true;
        a.resolvedBy = { name: this.auth.currentUser()?.name || 'Administrator' };
        this.loadStats();
        this.snackBar.open('Irregularity alert marked as resolved.', 'Close', { duration: 3000 });
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Failed to resolve', 'Close', { duration: 3000 })
    });
  }

  severityColor(s: string): string {
    const m: any = { critical: '#c62828', high: '#e65100', medium: '#f9a825', low: '#0277bd' };
    return m[s] || '#666';
  }
}
