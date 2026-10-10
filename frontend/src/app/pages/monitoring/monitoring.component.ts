import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MonitoringService } from '../../core/services/monitoring.service';
import { AlertService } from '../../core/services/alert.service';
import { UtilService } from '../../core/services/util.service';
import { DepartmentUtilization, Alert } from '../../core/models/models';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressBarModule, MatSnackBarModule, MatChipsModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">Real-Time Monitoring & Anomaly Detection</h2>
          <p class="page-subtitle">Algorithmic surveillance of spending velocity, inactivity, and budget threshold compliance</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="triggerAnomalyDetection()" [disabled]="runningScan">
            <mat-icon>{{ runningScan ? 'sync' : 'smart_toy' }}</mat-icon>
            {{ runningScan ? 'Scanning Rules...' : 'Run Anomaly Detection Engine' }}
          </button>
        </div>
      </div>

      <!-- Time Elapsed Banner -->
      <div class="elapsed-card">
        <div class="elapsed-info">
          <div class="elapsed-badge">
            <mat-icon>calendar_month</mat-icon>
            <span>FY 2024-25 Progress: <strong>{{ timeElapsedPct }}% Elapsed</strong></span>
          </div>
          <p class="elapsed-desc">
            Departments with under <strong>40%</strong> utilization when <strong>70%</strong> of the fiscal period has elapsed are automatically flagged for under-utilization audit.
          </p>
        </div>
        <div class="elapsed-bar-container">
          <mat-progress-bar mode="determinate" [value]="timeElapsedPct" style="height: 10px; border-radius: 5px;"></mat-progress-bar>
        </div>
      </div>

      <!-- Department Utilization Overview Grid -->
      <h3 style="font-size: 17px; font-weight: 600; margin-bottom: 16px; color: #1a237e;">
        Departmental Utilization Breakdown
      </h3>

      <div class="grid-3" style="margin-bottom: 28px;">
        <div class="dept-card" *ngFor="let d of departments" [class]="'border-' + getHealthClass(d.utilizationPercentage)">
          <div class="dept-card-header">
            <div>
              <h4 class="dept-name">{{ d.departmentName }}</h4>
              <span class="dept-code">{{ d.departmentCode }} · {{ d.budgetCount }} Budget Schemes</span>
            </div>
            <span class="badge" [class]="getHealthBadge(d.utilizationPercentage)">
              {{ getHealthStatus(d.utilizationPercentage) }}
            </span>
          </div>

          <div class="dept-stats">
            <div class="stat-col">
              <span class="stat-muted">Allocated</span>
              <span class="stat-num">{{ util.formatINRShort(d.totalAllocated) }}</span>
            </div>
            <div class="stat-col">
              <span class="stat-muted">Spent</span>
              <span class="stat-num text-spent">{{ util.formatINRShort(d.totalSpent) }}</span>
            </div>
            <div class="stat-col">
              <span class="stat-muted">Remaining</span>
              <span class="stat-num">{{ util.formatINRShort(d.totalRemaining) }}</span>
            </div>
          </div>

          <div class="utilization-section">
            <div class="util-text">
              <span>Utilization Rate</span>
              <strong [class]="util.getUtilizationClass(d.utilizationPercentage)">{{ d.utilizationPercentage }}%</strong>
            </div>
            <mat-progress-bar [value]="d.utilizationPercentage" [class]="util.getProgressClass(d.utilizationPercentage)"></mat-progress-bar>
          </div>

          <div class="risk-indicator" *ngIf="d.utilizationPercentage < 40">
            <mat-icon style="color: #c62828;">warning</mat-icon>
            <span>Under-spending risk: Funds may lapse if velocity not increased.</span>
          </div>
          <div class="risk-indicator" *ngIf="d.utilizationPercentage >= 85">
            <mat-icon style="color: #e65100;">error_outline</mat-icon>
            <span>Overrun risk: Utilization approaching 100% threshold.</span>
          </div>
        </div>
      </div>

      <!-- Detection Engine Rule Criteria -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <span class="card-title">🤖 Active Analytical & AI Detection Rules</span>
        </div>
        <div class="rules-grid">
          <div class="rule-box">
            <div class="rule-icon"><mat-icon style="color: #c62828;">trending_down</mat-icon></div>
            <div>
              <strong>Rule 1: Under-Utilization Detector</strong>
              <p>Triggers when departmental utilization is &lt; 40% after 70% of financial cycle time has elapsed.</p>
            </div>
          </div>
          <div class="rule-box">
            <div class="rule-icon"><mat-icon style="color: #d32f2f;">money_off</mat-icon></div>
            <div>
              <strong>Rule 2: Overspending Breach</strong>
              <p>Triggers critical alert immediately if aggregated expenditures exceed approved allocation amount.</p>
            </div>
          </div>
          <div class="rule-box">
            <div class="rule-icon"><mat-icon style="color: #f57c00;">bolt</mat-icon></div>
            <div>
              <strong>Rule 3: Spending Spike Anomaly</strong>
              <p>Flags single transaction exceeding 30% of entire budget or 3x historical average ticket size.</p>
            </div>
          </div>
          <div class="rule-box">
            <div class="rule-icon"><mat-icon style="color: #1976d2;">schedule</mat-icon></div>
            <div>
              <strong>Rule 4: Prolonged Inactivity Audit</strong>
              <p>Identifies schemes with zero recorded vouchers for &gt; 30 days while significant funds remain idle.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .elapsed-card {
      background: #fff; border-radius: 12px; padding: 20px 24px; box-shadow: var(--shadow);
      margin-bottom: 24px; display: flex; flex-direction: column; gap: 14px;
    }
    .elapsed-badge {
      display: inline-flex; align-items: center; gap: 8px; color: #1a237e; font-size: 15px; margin-bottom: 4px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .elapsed-desc { font-size: 13px; color: #555; margin: 0; }

    .dept-card {
      background: #fff; border-radius: 12px; padding: 20px; box-shadow: var(--shadow);
      display: flex; flex-direction: column; gap: 16px; border-top: 4px solid #ccc;
    }
    .border-critical { border-top-color: #c62828 !important; }
    .border-warning { border-top-color: #e65100 !important; }
    .border-good { border-top-color: #2e7d32 !important; }

    .dept-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .dept-name { font-size: 15px; font-weight: 600; color: #1a1a2e; margin: 0 0 2px 0; }
    .dept-code { font-size: 12px; color: #777; }

    .dept-stats {
      display: grid; grid-template-columns: 1fr 1fr 1fr; background: #f8f9fa;
      padding: 12px; border-radius: 8px; text-align: center;
    }
    .stat-col { display: flex; flex-direction: column; gap: 2px; }
    .stat-muted { font-size: 11px; color: #777; text-transform: uppercase; }
    .stat-num { font-size: 13px; font-weight: 700; color: #222; }
    .text-spent { color: #2e7d32; }

    .utilization-section { display: flex; flex-direction: column; gap: 6px; }
    .util-text { display: flex; justify-content: space-between; font-size: 13px; }

    .risk-indicator {
      display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: #444;
      background: #fafafa; padding: 8px 10px; border-radius: 6px; border: 1px dashed #ddd;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .rules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .rule-box {
      display: flex; gap: 12px; padding: 14px; background: #f8f9fe; border-radius: 10px;
      strong { font-size: 13px; color: #1a237e; display: block; margin-bottom: 4px; }
      p { font-size: 12px; color: #666; margin: 0; line-height: 1.4; }
    }
    .rule-icon { width: 36px; height: 36px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  `]
})
export class MonitoringComponent implements OnInit {
  departments: DepartmentUtilization[] = [];
  timeElapsedPct = 58; // Calculated percentage of current financial year
  runningScan = false;

  constructor(
    private monitoringService: MonitoringService,
    public util: UtilService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.calculateTimeElapsed();
    this.loadDepartmentUtilization();
  }

  calculateTimeElapsed() {
    const start = new Date('2024-04-01').getTime();
    const end = new Date('2025-03-31').getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = Math.max(0, Math.min(now - start, total));
    this.timeElapsedPct = Math.round((elapsed / total) * 100);
  }

  loadDepartmentUtilization() {
    this.monitoringService.getDepartmentUtilization('2024-25').subscribe(res => {
      if (res.success) this.departments = res.data;
    });
  }

  triggerAnomalyDetection() {
    this.runningScan = true;
    this.monitoringService.runAnomalyDetection().subscribe({
      next: (res) => {
        this.runningScan = false;
        this.snackBar.open(
          `Analysis complete: ${res.data.budgetsChecked} budgets evaluated. ${res.data.newAlerts} new anomalies flagged.`,
          'View Alerts',
          { duration: 5000 }
        );
        this.loadDepartmentUtilization();
      },
      error: () => {
        this.runningScan = false;
        this.snackBar.open('Anomaly engine execution failed.', 'Close', { duration: 3000 });
      }
    });
  }

  getHealthClass(pct: number): string {
    if (pct < 40) return 'critical';
    if (pct < 70) return 'warning';
    return 'good';
  }

  getHealthBadge(pct: number): string {
    if (pct < 40) return 'badge-danger';
    if (pct < 70) return 'badge-warning';
    return 'badge-success';
  }

  getHealthStatus(pct: number): string {
    if (pct < 40) return 'Under-Utilized';
    if (pct < 70) return 'Moderate';
    return 'Optimal';
  }
}
