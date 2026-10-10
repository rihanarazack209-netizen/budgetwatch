import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BudgetService } from '../../core/services/budget.service';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { UtilService } from '../../core/services/util.service';
import { Budget, Department } from '../../core/models/models';

@Component({
  selector: 'app-budget-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatTableModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressBarModule,
    MatDialogModule, MatSnackBarModule, MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">Budget Allocation & Management</h2>
          <p class="page-subtitle">Track, allocate, and oversee departmental financial year allocations</p>
        </div>
        <div class="header-actions" *ngIf="auth.isFinanceOfficer()">
          <button mat-raised-button color="primary" (click)="openCreateModal()">
            <mat-icon>add</mat-icon> Allocate New Budget
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <mat-form-field appearance="outline">
          <mat-label>Financial Year</mat-label>
          <mat-select [(value)]="selectedYear" (selectionChange)="loadBudgets()">
            <mat-option value="">All Years</mat-option>
            <mat-option value="2024-25">FY 2024-25</mat-option>
            <mat-option value="2023-24">FY 2023-24</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" *ngIf="!auth.currentUser()?.department">
          <mat-label>Department</mat-label>
          <mat-select [(value)]="selectedDept" (selectionChange)="loadBudgets()">
            <mat-option value="">All Departments</mat-option>
            <mat-option *ngFor="let d of departments" [value]="d._id">{{ d.name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(value)]="selectedStatus" (selectionChange)="loadBudgets()">
            <mat-option value="">All Statuses</mat-option>
            <mat-option value="active">Active</mat-option>
            <mat-option value="closed">Closed</mat-option>
            <mat-option value="suspended">Suspended</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-stroked-button (click)="resetFilters()" style="margin-bottom: 22px;">
          <mat-icon>restart_alt</mat-icon> Reset
        </button>
      </div>

      <!-- Budget Table -->
      <div class="table-container">
        <div class="table-toolbar">
          <span style="font-weight: 600; font-size: 15px;">Allocations ({{ totalCount }})</span>
        </div>

        <table mat-table [dataSource]="budgets" class="mat-elevation-z1">
          <!-- Code -->
          <ng-container matColumnDef="budgetCode">
            <th mat-header-cell *matHeaderCellDef>Code</th>
            <td mat-cell *matCellDef="let b">
              <span class="code-badge">{{ b.budgetCode }}</span>
            </td>
          </ng-container>

          <!-- FY -->
          <ng-container matColumnDef="financialYear">
            <th mat-header-cell *matHeaderCellDef>FY</th>
            <td mat-cell *matCellDef="let b">{{ b.financialYear }}</td>
          </ng-container>

          <!-- Dept -->
          <ng-container matColumnDef="department">
            <th mat-header-cell *matHeaderCellDef>Department</th>
            <td mat-cell *matCellDef="let b">
              <strong>{{ getDeptName(b.departmentId) }}</strong>
            </td>
          </ng-container>

          <!-- Allocated -->
          <ng-container matColumnDef="allocated">
            <th mat-header-cell *matHeaderCellDef>Allocated</th>
            <td mat-cell *matCellDef="let b">
              <span class="currency-val">{{ util.formatINR(b.allocatedAmount) }}</span>
            </td>
          </ng-container>

          <!-- Spent -->
          <ng-container matColumnDef="spent">
            <th mat-header-cell *matHeaderCellDef>Spent</th>
            <td mat-cell *matCellDef="let b">
              <span class="currency-val text-success">{{ util.formatINR(b.spentAmount) }}</span>
            </td>
          </ng-container>

          <!-- Remaining -->
          <ng-container matColumnDef="remaining">
            <th mat-header-cell *matHeaderCellDef>Remaining</th>
            <td mat-cell *matCellDef="let b">
              <span class="currency-val">{{ util.formatINR(b.allocatedAmount - b.spentAmount) }}</span>
            </td>
          </ng-container>

          <!-- Utilization -->
          <ng-container matColumnDef="utilization">
            <th mat-header-cell *matHeaderCellDef>Utilization</th>
            <td mat-cell *matCellDef="let b" style="min-width: 140px;">
              <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                <span [class]="util.getUtilizationClass(b.utilizationPercentage)">
                  <strong>{{ b.utilizationPercentage }}%</strong>
                </span>
              </div>
              <mat-progress-bar [value]="b.utilizationPercentage" [class]="util.getProgressClass(b.utilizationPercentage)"></mat-progress-bar>
            </td>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let b">
              <span class="badge" [class]="util.getStatusClass(b.status)">{{ b.status }}</span>
            </td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let b">
              <button mat-icon-button color="primary" *ngIf="auth.isFinanceOfficer()" (click)="openEditModal(b)" matTooltip="Edit Budget">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" *ngIf="auth.isAdmin() && b.spentAmount === 0" (click)="deleteBudget(b)" matTooltip="Delete">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell" colspan="9" style="text-align: center; padding: 32px;">
              No budget records found matching selected filters.
            </td>
          </tr>
        </table>

        <mat-paginator [length]="totalCount" [pageSize]="pageSize" [pageSizeOptions]="[5, 10, 20]" (page)="onPageChange($event)"></mat-paginator>
      </div>

      <!-- Add/Edit Modal (Inline Overlay) -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Edit Budget Details' : 'Allocate New Budget' }}</h3>
            <button mat-icon-button (click)="closeModal()"><mat-icon>close</mat-icon></button>
          </div>
          <form [formGroup]="budgetForm" (ngSubmit)="saveBudget()" class="modal-form">
            <mat-form-field appearance="outline">
              <mat-label>Financial Year</mat-label>
              <mat-select formControlName="financialYear">
                <mat-option value="2024-25">2024-25</mat-option>
                <mat-option value="2025-26">2025-26</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" *ngIf="!isEditing">
              <mat-label>Department</mat-label>
              <mat-select formControlName="departmentId">
                <mat-option *ngFor="let d of departments" [value]="d._id">{{ d.name }} ({{ d.code }})</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Allocated Amount (in ₹)</mat-label>
              <input matInput type="number" formControlName="allocatedAmount" placeholder="e.g. 500000000">
            </mat-form-field>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" *ngIf="!isEditing">
              <mat-form-field appearance="outline">
                <mat-label>Start Date</mat-label>
                <input matInput type="date" formControlName="startDate">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>End Date</mat-label>
                <input matInput type="date" formControlName="endDate">
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" *ngIf="isEditing">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="active">Active</mat-option>
                <mat-option value="closed">Closed</mat-option>
                <mat-option value="suspended">Suspended</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Scheme / Allocation Notes</mat-label>
              <textarea matInput rows="3" formControlName="notes" placeholder="Specify scheme names or operational purpose..."></textarea>
            </mat-form-field>

            <div class="modal-actions">
              <button mat-button type="button" (click)="closeModal()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="budgetForm.invalid || saving">
                {{ saving ? 'Saving...' : 'Save Budget' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .code-badge { background: #e8eaf6; color: #1a237e; font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
    .currency-val { font-weight: 600; }
    .text-success { color: #2e7d32; }
    
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;
    }
    .modal-content {
      background: #fff; border-radius: 12px; width: 500px; max-width: 90vw; padding: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; h3 { font-size: 18px; margin: 0; color: #1a237e; } }
    .modal-form { display: flex; flex-direction: column; gap: 8px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
  `]
})
export class BudgetManagementComponent implements OnInit {
  budgets: Budget[] = [];
  departments: Department[] = [];
  totalCount = 0;
  pageSize = 10;
  pageIndex = 0;

  selectedYear = '2024-25';
  selectedDept = '';
  selectedStatus = '';

  displayedColumns: string[] = ['budgetCode', 'financialYear', 'department', 'allocated', 'spent', 'remaining', 'utilization', 'status', 'actions'];

  showModal = false;
  isEditing = false;
  currentBudgetId: string | null = null;
  budgetForm: FormGroup;
  saving = false;

  constructor(
    private budgetService: BudgetService,
    private deptService: DepartmentService,
    public auth: AuthService,
    public util: UtilService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.budgetForm = this.fb.group({
      financialYear: ['2024-25', Validators.required],
      departmentId: ['', Validators.required],
      allocatedAmount: [null, [Validators.required, Validators.min(1)]],
      startDate: ['2024-04-01'],
      endDate: ['2025-03-31'],
      status: ['active'],
      notes: ['']
    });
  }

  ngOnInit() {
    this.deptService.getDepartments().subscribe(res => {
      if (res.success) this.departments = res.data;
    });
    this.loadBudgets();
  }

  loadBudgets() {
    this.budgetService.getBudgets({
      financialYear: this.selectedYear,
      departmentId: this.selectedDept,
      status: this.selectedStatus,
      page: this.pageIndex + 1,
      limit: this.pageSize
    }).subscribe(res => {
      if (res.success) {
        this.budgets = res.data;
        this.totalCount = res.pagination?.total || res.data.length;
      }
    });
  }

  resetFilters() {
    this.selectedYear = '';
    this.selectedDept = '';
    this.selectedStatus = '';
    this.pageIndex = 0;
    this.loadBudgets();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBudgets();
  }

  getDeptName(dept: any): string {
    if (!dept) return 'N/A';
    return typeof dept === 'object' ? dept.name : 'N/A';
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentBudgetId = null;
    this.budgetForm.reset({
      financialYear: '2024-25',
      startDate: '2024-04-01',
      endDate: '2025-03-31',
      status: 'active'
    });
    this.budgetForm.get('departmentId')?.setValidators([Validators.required]);
    this.budgetForm.get('departmentId')?.updateValueAndValidity();
    this.showModal = true;
  }

  openEditModal(b: Budget) {
    this.isEditing = true;
    this.currentBudgetId = b._id;
    this.budgetForm.patchValue({
      financialYear: b.financialYear,
      allocatedAmount: b.allocatedAmount,
      status: b.status,
      notes: b.notes || '',
      endDate: b.endDate ? b.endDate.split('T')[0] : ''
    });
    this.budgetForm.get('departmentId')?.clearValidators();
    this.budgetForm.get('departmentId')?.updateValueAndValidity();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveBudget() {
    if (this.budgetForm.invalid) return;
    this.saving = true;
    if (this.isEditing && this.currentBudgetId) {
      this.budgetService.updateBudget(this.currentBudgetId, this.budgetForm.value).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.snackBar.open('Budget updated successfully!', 'Close', { duration: 3000 });
          this.loadBudgets();
        },
        error: (err) => {
          this.saving = false;
          this.snackBar.open(err.error?.message || 'Error updating budget', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.budgetService.createBudget(this.budgetForm.value).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.snackBar.open('Budget created successfully!', 'Close', { duration: 3000 });
          this.loadBudgets();
        },
        error: (err) => {
          this.saving = false;
          this.snackBar.open(err.error?.message || 'Error creating budget', 'Close', { duration: 3000 });
        }
      });
    }
  }

  deleteBudget(b: Budget) {
    if (confirm(`Are you sure you want to delete budget ${b.budgetCode}?`)) {
      this.budgetService.deleteBudget(b._id).subscribe({
        next: () => {
          this.snackBar.open('Budget deleted successfully!', 'Close', { duration: 3000 });
          this.loadBudgets();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Cannot delete budget', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
