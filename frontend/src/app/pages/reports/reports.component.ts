import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import * as saveAs from 'file-saver';
import { ReportService } from '../../core/services/report.service';
import { DepartmentService } from '../../core/services/department.service';
import { UtilService } from '../../core/services/util.service';
import { Department } from '../../core/models/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTableModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatSelectModule, MatProgressBarModule, MatSnackBarModule, NgChartsModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">Financial Audit & Analytical Reports</h2>
          <p class="page-subtitle">Generate statutory audit reports, budget reconciliation statements, and downloadable dossiers</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="exportCSV()">
            <mat-icon>file_download</mat-icon> Download CSV
          </button>
          <button mat-raised-button color="accent" (click)="exportPDF()">
            <mat-icon>picture_as_pdf</mat-icon> Download PDF
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <mat-form-field appearance="outline">
          <mat-label>Financial Year</mat-label>
          <mat-select [(value)]="selectedYear" (selectionChange)="loadData()">
            <mat-option value="2024-25">FY 2024-25</mat-option>
            <mat-option value="2023-24">FY 2023-24</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Department</mat-label>
          <mat-select [(value)]="selectedDept" (selectionChange)="loadData()">
            <mat-option value="">All Departments</mat-option>
            <mat-option *ngFor="let d of departments" [value]="d._id">{{ d.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Comparison Chart -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <span class="card-title">📊 Departmental Allocation vs Expenditure Analysis</span>
        </div>
        <canvas baseChart [data]="barChartData" [options]="barChartOptions" type="bar" style="max-height: 280px;"></canvas>
      </div>

      <!-- Breakdown Table -->
      <div class="table-container">
        <div class="table-toolbar">
          <span style="font-weight: 600; font-size: 15px;">Statement of Departmental Accounts (FY {{ selectedYear }})</span>
        </div>

        <table mat-table [dataSource]="summaryData" class="mat-elevation-z1">
          <!-- Dept -->
          <ng-container matColumnDef="department">
            <th mat-header-cell *matHeaderCellDef>Department</th>
            <td mat-cell *matCellDef="let s">
              <strong>{{ s.department }}</strong>
              <span class="code-badge" style="margin-left: 6px;">{{ s.code }}</span>
            </td>
          </ng-container>

          <!-- Allocated -->
          <ng-container matColumnDef="totalAllocated">
            <th mat-header-cell *matHeaderCellDef>Budget Allocated</th>
            <td mat-cell *matCellDef="let s">{{ util.formatINR(s.totalAllocated) }}</td>
          </ng-container>

          <!-- Spent -->
          <ng-container matColumnDef="totalSpent">
            <th mat-header-cell *matHeaderCellDef>Actual Expenditure</th>
            <td mat-cell *matCellDef="let s" style="color: #2e7d32; font-weight: 600;">
              {{ util.formatINR(s.totalSpent) }}
            </td>
          </ng-container>

          <!-- Remaining -->
          <ng-container matColumnDef="remaining">
            <th mat-header-cell *matHeaderCellDef>Balance Remaining</th>
            <td mat-cell *matCellDef="let s">{{ util.formatINR(s.remaining) }}</td>
          </ng-container>

          <!-- Utilization -->
          <ng-container matColumnDef="utilization">
            <th mat-header-cell *matHeaderCellDef>Utilization Rate</th>
            <td mat-cell *matCellDef="let s" style="min-width: 130px;">
              <span [class]="util.getUtilizationClass(s.utilization)">
                <strong>{{ s.utilization }}%</strong>
              </span>
              <mat-progress-bar [value]="s.utilization" [class]="util.getProgressClass(s.utilization)"></mat-progress-bar>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .code-badge { background: #e8eaf6; color: #1a237e; font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
  `]
})
export class ReportsComponent implements OnInit {
  departments: Department[] = [];
  summaryData: any[] = [];
  selectedYear = '2024-25';
  selectedDept = '';

  displayedColumns = ['department', 'totalAllocated', 'totalSpent', 'remaining', 'utilization'];

  barChartData: ChartData = {
    labels: [],
    datasets: [
      { label: 'Allocated Budget', data: [], backgroundColor: '#1a237e' },
      { label: 'Actual Expenditure', data: [], backgroundColor: '#2e7d32' }
    ]
  };
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: { ticks: { callback: (v) => `₹${(+v / 10000000).toFixed(0)}Cr` } }
    }
  };

  constructor(
    private reportService: ReportService,
    private deptService: DepartmentService,
    public util: UtilService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.deptService.getDepartments().subscribe(res => {
      if (res.success) this.departments = res.data;
    });
    this.loadData();
  }

  loadData() {
    this.reportService.getFinancialSummary({
      financialYear: this.selectedYear,
      departmentId: this.selectedDept
    }).subscribe(res => {
      if (res.success) {
        this.summaryData = res.data;
        this.updateChart(res.data);
      }
    });
  }

  updateChart(data: any[]) {
    this.barChartData = {
      labels: data.map(d => d.code || d.department),
      datasets: [
        { label: 'Allocated Budget', data: data.map(d => d.totalAllocated), backgroundColor: '#1a237e' },
        { label: 'Actual Expenditure', data: data.map(d => d.totalSpent), backgroundColor: '#2e7d32' }
      ]
    };
  }

  exportCSV() {
    this.reportService.downloadCSV({ financialYear: this.selectedYear, departmentId: this.selectedDept })
      .subscribe({
        next: (blob) => {
          (saveAs as any).saveAs(blob, `budget-report-${this.selectedYear}.csv`);
          this.snackBar.open('CSV report exported.', 'Close', { duration: 2500 });
        },
        error: () => this.snackBar.open('Failed to download CSV.', 'Close', { duration: 2500 })
      });
  }

  exportPDF() {
    this.reportService.downloadPDF({ financialYear: this.selectedYear, departmentId: this.selectedDept })
      .subscribe({
        next: (blob) => {
          (saveAs as any).saveAs(blob, `budget-report-${this.selectedYear}.pdf`);
          this.snackBar.open('PDF report exported.', 'Close', { duration: 2500 });
        },
        error: () => this.snackBar.open('Failed to download PDF.', 'Close', { duration: 2500 })
      });
  }
}
