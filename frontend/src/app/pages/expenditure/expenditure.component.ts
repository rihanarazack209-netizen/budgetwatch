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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExpenditureService } from '../../core/services/expenditure.service';
import { BudgetService } from '../../core/services/budget.service';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { UtilService } from '../../core/services/util.service';
import { Expenditure, Budget, Department } from '../../core/models/models';

@Component({
  selector: 'app-expenditure',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatTableModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSnackBarModule, MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">Expenditure & Transactions</h2>
          <p class="page-subtitle">Record, audit, and authorize departmental expenditures and claim submissions</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openCreateModal()">
            <mat-icon>add</mat-icon> Record Expenditure
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select [(value)]="selectedCategory" (selectionChange)="loadExpenditures()">
            <mat-option value="">All Categories</mat-option>
            <mat-option *ngFor="let c of categories" [value]="c">{{ c | titlecase }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(value)]="selectedStatus" (selectionChange)="loadExpenditures()">
            <mat-option value="">All Statuses</mat-option>
            <mat-option value="approved">Approved</mat-option>
            <mat-option value="pending">Pending</mat-option>
            <mat-option value="rejected">Rejected</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" *ngIf="!auth.currentUser()?.department">
          <mat-label>Department</mat-label>
          <mat-select [(value)]="selectedDept" (selectionChange)="loadExpenditures()">
            <mat-option value="">All Departments</mat-option>
            <mat-option *ngFor="let d of departments" [value]="d._id">{{ d.name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-stroked-button (click)="resetFilters()" style="margin-bottom: 22px;">
          <mat-icon>restart_alt</mat-icon> Reset
        </button>
      </div>

      <!-- Expenditures Table -->
      <div class="table-container">
        <div class="table-toolbar">
          <span style="font-weight: 600; font-size: 15px;">Transactions Log ({{ totalCount }})</span>
        </div>

        <table mat-table [dataSource]="expenditures" class="mat-elevation-z1">
          <!-- TXN ID -->
          <ng-container matColumnDef="transactionId">
            <th mat-header-cell *matHeaderCellDef>Transaction ID</th>
            <td mat-cell *matCellDef="let e">
              <span class="code-badge">{{ e.transactionId }}</span>
            </td>
          </ng-container>

          <!-- Date -->
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let e">{{ util.formatDate(e.date) }}</td>
          </ng-container>

          <!-- Dept -->
          <ng-container matColumnDef="department">
            <th mat-header-cell *matHeaderCellDef>Department</th>
            <td mat-cell *matCellDef="let e">
              <strong>{{ getDeptName(e.departmentId) }}</strong>
            </td>
          </ng-container>

          <!-- Category -->
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let e">
              <span class="category-tag">
                <mat-icon>{{ util.getCategoryIcon(e.expenseCategory) }}</mat-icon>
                {{ e.expenseCategory | titlecase }}
              </span>
            </td>
          </ng-container>

          <!-- Description -->
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Description</th>
            <td mat-cell *matCellDef="let e" style="max-width: 250px;">
              <span class="desc-text" [matTooltip]="e.description">{{ e.description }}</span>
            </td>
          </ng-container>

          <!-- Amount -->
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let e">
              <span class="amount-val">{{ util.formatINR(e.amount) }}</span>
            </td>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let e">
              <span class="badge" [class]="util.getStatusClass(e.status)">{{ e.status }}</span>
            </td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let e">
              <div style="display: flex; gap: 4px;" *ngIf="e.status === 'pending' && auth.isFinanceOfficer()">
                <button mat-icon-button color="primary" (click)="approve(e)" matTooltip="Approve Transaction">
                  <mat-icon>check_circle</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="reject(e)" matTooltip="Reject Transaction">
                  <mat-icon>cancel</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell" colspan="8" style="text-align: center; padding: 32px;">
              No transactions recorded for the selected criteria.
            </td>
          </tr>
        </table>

        <mat-paginator [length]="totalCount" [pageSize]="pageSize" [pageSizeOptions]="[5, 10, 20]" (page)="onPageChange($event)"></mat-paginator>
      </div>

      <!-- Add Modal -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Record New Expenditure</h3>
            <button mat-icon-button (click)="closeModal()"><mat-icon>close</mat-icon></button>
          </div>
          <form [formGroup]="expenditureForm" (ngSubmit)="saveExpenditure()" class="modal-form">
            <mat-form-field appearance="outline">
              <mat-label>Budget Scheme Allocation</mat-label>
              <mat-select formControlName="budgetId">
                <mat-option *ngFor="let b of budgets" [value]="b._id">
                  {{ b.budgetCode }} - {{ getDeptName(b.departmentId) }} (Rem: {{ util.formatINRShort(b.allocatedAmount - b.spentAmount) }})
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Expense Category</mat-label>
              <mat-select formControlName="expenseCategory">
                <mat-option *ngFor="let c of categories" [value]="c">{{ c | titlecase }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Transaction Amount (in ₹)</mat-label>
              <input matInput type="number" formControlName="amount" placeholder="e.g. 150000000">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Transaction Date</mat-label>
              <input matInput type="date" formControlName="date">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Description & Purpose</mat-label>
              <textarea matInput rows="3" formControlName="description" placeholder="Provide vendor, bill reference, purpose details..."></textarea>
            </mat-form-field>

            <div class="file-upload-row">
              <label>Supporting Document (PDF/Doc/Image):</label>
              <input type="file" (change)="onFileSelected($event)" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx">
            </div>

            <div class="modal-actions">
              <button mat-button type="button" (click)="closeModal()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="expenditureForm.invalid || saving">
                {{ saving ? 'Recording...' : 'Submit Transaction' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .code-badge { background: #e8eaf6; color: #1a237e; font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
    .category-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; mat-icon { font-size: 16px; width: 16px; height: 16px; color: #5c6bc0; } }
    .desc-text { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: #333; }
    .amount-val { font-weight: 700; color: #1a1a2e; }
    .file-upload-row { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #555; margin-bottom: 12px; }

    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;
    }
    .modal-content {
      background: #fff; border-radius: 12px; width: 520px; max-width: 90vw; padding: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; h3 { font-size: 18px; margin: 0; color: #1a237e; } }
    .modal-form { display: flex; flex-direction: column; gap: 8px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
  `]
})
export class ExpenditureComponent implements OnInit {
  expenditures: Expenditure[] = [];
  budgets: Budget[] = [];
  departments: Department[] = [];
  totalCount = 0;
  pageSize = 10;
  pageIndex = 0;

  categories = ['salaries', 'infrastructure', 'operations', 'training', 'procurement', 'maintenance', 'IT', 'other'];
  selectedCategory = '';
  selectedStatus = '';
  selectedDept = '';

  displayedColumns: string[] = ['transactionId', 'date', 'department', 'category', 'description', 'amount', 'status', 'actions'];

  showModal = false;
  expenditureForm: FormGroup;
  selectedFile: File | null = null;
  saving = false;

  constructor(
    private expService: ExpenditureService,
    private budgetService: BudgetService,
    private deptService: DepartmentService,
    public auth: AuthService,
    public util: UtilService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.expenditureForm = this.fb.group({
      budgetId: ['', Validators.required],
      expenseCategory: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.deptService.getDepartments().subscribe(res => {
      if (res.success) this.departments = res.data;
    });
    this.budgetService.getBudgets({ status: 'active', limit: 100 }).subscribe(res => {
      if (res.success) this.budgets = res.data;
    });
    this.loadExpenditures();
  }

  loadExpenditures() {
    this.expService.getExpenditures({
      expenseCategory: this.selectedCategory,
      status: this.selectedStatus,
      departmentId: this.selectedDept,
      page: this.pageIndex + 1,
      limit: this.pageSize
    }).subscribe(res => {
      if (res.success) {
        this.expenditures = res.data;
        this.totalCount = res.pagination?.total || res.data.length;
      }
    });
  }

  resetFilters() {
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.selectedDept = '';
    this.pageIndex = 0;
    this.loadExpenditures();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadExpenditures();
  }

  getDeptName(dept: any): string {
    if (!dept) return 'N/A';
    return typeof dept === 'object' ? dept.name : 'N/A';
  }

  openCreateModal() {
    this.expenditureForm.reset({
      date: new Date().toISOString().split('T')[0]
    });
    this.selectedFile = null;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.selectedFile = event.target.files[0];
    }
  }

  saveExpenditure() {
    if (this.expenditureForm.invalid) return;
    this.saving = true;

    const formData = new FormData();
    Object.keys(this.expenditureForm.value).forEach(k => {
      formData.append(k, this.expenditureForm.value[k]);
    });
    if (this.selectedFile) {
      formData.append('supportingDocument', this.selectedFile);
    }

    this.expService.createExpenditure(formData).subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.snackBar.open('Expenditure recorded successfully!', 'Close', { duration: 3000 });
        this.loadExpenditures();
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Error recording expenditure', 'Close', { duration: 4000 });
      }
    });
  }

  approve(e: Expenditure) {
    this.expService.approveExpenditure(e._id).subscribe({
      next: () => {
        this.snackBar.open('Transaction approved!', 'Close', { duration: 3000 });
        this.loadExpenditures();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Approval failed', 'Close', { duration: 3000 })
    });
  }

  reject(e: Expenditure) {
    const reason = prompt('Please specify rejection reason:');
    if (!reason) return;
    this.expService.rejectExpenditure(e._id, reason).subscribe({
      next: () => {
        this.snackBar.open('Transaction rejected and funds reversed!', 'Close', { duration: 3000 });
        this.loadExpenditures();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Rejection failed', 'Close', { duration: 3000 })
    });
  }
}
