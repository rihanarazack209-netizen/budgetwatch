import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
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
import { AdminService } from '../../core/services/admin.service';
import { DepartmentService } from '../../core/services/department.service';
import { UtilService } from '../../core/services/util.service';
import { User, Department } from '../../core/models/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatTabsModule, MatCardModule, MatTableModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSnackBarModule, MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">System Administration & Governance Control</h2>
          <p class="page-subtitle">Manage users, ministerial units, rule engine thresholds, and security audit logs</p>
        </div>
      </div>

      <!-- Quick System Stats -->
      <div class="stats-row" *ngIf="sysStats">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e8eaf6;"><mat-icon style="color: #1a237e;">group</mat-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ sysStats.activeUsers }}</span>
            <span class="stat-label">Active System Users</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #e0f2f1;"><mat-icon style="color: #00796b;">domain</mat-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ sysStats.activeDepartments }}</span>
            <span class="stat-label">Configured Departments</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff8e1;"><mat-icon style="color: #f57f17;">rule</mat-icon></div>
          <div class="stat-info">
            <span class="stat-value">{{ thresholds.length }}</span>
            <span class="stat-label">Configured Thresholds</span>
          </div>
        </div>
      </div>

      <!-- Admin Tabs -->
      <mat-card style="border-radius: 12px;">
        <mat-tab-group>
          <!-- TAB 1: USER MANAGEMENT -->
          <mat-tab label="User Accounts">
            <div class="tab-body">
              <div class="tab-actions">
                <span class="tab-section-title">Authorized Personnel Directory</span>
                <button mat-raised-button color="primary" (click)="showUserModal = true">
                  <mat-icon>person_add</mat-icon> Add New User
                </button>
              </div>

              <table mat-table [dataSource]="users" class="mat-elevation-z1">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let u"><strong>{{ u.name }}</strong></td>
                </ng-container>
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>Email</th>
                  <td mat-cell *matCellDef="let u">{{ u.email }}</td>
                </ng-container>
                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef>Role</th>
                  <td mat-cell *matCellDef="let u">
                    <span class="badge" [class]="getRoleBadge(u.role)">{{ u.role }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="department">
                  <th mat-header-cell *matHeaderCellDef>Department</th>
                  <td mat-cell *matCellDef="let u">{{ u.departmentId?.name || '-' }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let u">
                    <span class="badge" [class]="u.isActive ? 'badge-success' : 'badge-danger'">
                      {{ u.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let u">
                    <button mat-icon-button color="warn" *ngIf="u.isActive" (click)="deactivateUser(u)" matTooltip="Deactivate Account">
                      <mat-icon>block</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="['name', 'email', 'role', 'department', 'status', 'actions']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['name', 'email', 'role', 'department', 'status', 'actions'];"></tr>
              </table>
            </div>
          </mat-tab>

          <!-- TAB 2: DEPARTMENTS -->
          <mat-tab label="Departments">
            <div class="tab-body">
              <div class="tab-actions">
                <span class="tab-section-title">Governmental Ministries & Bodies</span>
                <button mat-raised-button color="primary" (click)="showDeptModal = true">
                  <mat-icon>add_business</mat-icon> Register Department
                </button>
              </div>

              <table mat-table [dataSource]="departments" class="mat-elevation-z1">
                <ng-container matColumnDef="code">
                  <th mat-header-cell *matHeaderCellDef>Code</th>
                  <td mat-cell *matCellDef="let d"><span class="code-badge">{{ d.code }}</span></td>
                </ng-container>
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Ministry / Department Name</th>
                  <td mat-cell *matCellDef="let d"><strong>{{ d.name }}</strong></td>
                </ng-container>
                <ng-container matColumnDef="description">
                  <th mat-header-cell *matHeaderCellDef>Operational Domain</th>
                  <td mat-cell *matCellDef="let d">{{ d.description || '-' }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let d">
                    <span class="badge badge-success">Active</span>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="['code', 'name', 'description', 'status']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['code', 'name', 'description', 'status'];"></tr>
              </table>
            </div>
          </mat-tab>

          <!-- TAB 3: THRESHOLDS -->
          <mat-tab label="Detection Rules & Thresholds">
            <div class="tab-body">
              <span class="tab-section-title" style="display: block; margin-bottom: 12px;">
                Configurable Surveillance Parameters
              </span>
              <p style="font-size: 13px; color: #555; margin-bottom: 20px;">
                Adjust criteria for the automated background engine. Changes affect future anomaly scanning runs.
              </p>

              <div class="thresholds-form">
                <div class="threshold-card" *ngFor="let t of thresholds">
                  <div class="t-info">
                    <strong>{{ formatThresholdKey(t.key) }}</strong>
                    <p>{{ t.description }}</p>
                  </div>
                  <div class="t-input">
                    <input type="number" [(ngModel)]="t.value" class="custom-num-input">
                  </div>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
                  <button mat-raised-button color="primary" (click)="saveThresholds()">
                    <mat-icon>save</mat-icon> Update Threshold Settings
                  </button>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- TAB 4: AUDIT LOGS -->
          <mat-tab label="System Audit Trail">
            <div class="tab-body">
              <span class="tab-section-title" style="display: block; margin-bottom: 16px;">
                Cryptographic & Action History Log ({{ totalLogs }})
              </span>

              <table mat-table [dataSource]="auditLogs" class="mat-elevation-z1">
                <ng-container matColumnDef="timestamp">
                  <th mat-header-cell *matHeaderCellDef>Timestamp</th>
                  <td mat-cell *matCellDef="let l">{{ util.formatDate(l.createdAt) }}</td>
                </ng-container>
                <ng-container matColumnDef="user">
                  <th mat-header-cell *matHeaderCellDef>User</th>
                  <td mat-cell *matCellDef="let l">
                    <strong>{{ l.userName || l.userId?.name || 'System' }}</strong>
                  </td>
                </ng-container>
                <ng-container matColumnDef="action">
                  <th mat-header-cell *matHeaderCellDef>Action</th>
                  <td mat-cell *matCellDef="let l">
                    <span class="badge badge-purple">{{ l.action }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="entity">
                  <th mat-header-cell *matHeaderCellDef>Target Entity</th>
                  <td mat-cell *matCellDef="let l">{{ l.entity }}</td>
                </ng-container>
                <ng-container matColumnDef="ip">
                  <th mat-header-cell *matHeaderCellDef>IP Address</th>
                  <td mat-cell *matCellDef="let l"><small>{{ l.ipAddress || '127.0.0.1' }}</small></td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="['timestamp', 'user', 'action', 'entity', 'ip']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['timestamp', 'user', 'action', 'entity', 'ip'];"></tr>

                <tr class="mat-row" *matNoDataRow>
                  <td class="mat-cell" colspan="5" style="text-align: center; padding: 24px;">
                    No audit trail events captured yet.
                  </td>
                </tr>
              </table>

              <mat-paginator [length]="totalLogs" [pageSize]="pageSize" [pageSizeOptions]="[10, 25, 50]" (page)="onPageChange($event)"></mat-paginator>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>

      <!-- Add User Modal -->
      <div class="modal-backdrop" *ngIf="showUserModal" (click)="showUserModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add Authorized User</h3>
            <button mat-icon-button (click)="showUserModal = false"><mat-icon>close</mat-icon></button>
          </div>
          <form [formGroup]="userForm" (ngSubmit)="saveUser()" class="modal-form">
            <mat-form-field appearance="outline">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="name">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Email Address</mat-label>
              <input matInput type="email" formControlName="email">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Default Password</mat-label>
              <input matInput type="password" formControlName="password">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>System Role</mat-label>
              <mat-select formControlName="role">
                <mat-option value="admin">Administrator</mat-option>
                <mat-option value="finance_officer">Finance Officer</mat-option>
                <mat-option value="department_head">Department Head</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Department</mat-label>
              <mat-select formControlName="departmentId">
                <mat-option [value]="null">None / Headquarters</mat-option>
                <mat-option *ngFor="let d of departments" [value]="d._id">{{ d.name }}</mat-option>
              </mat-select>
            </mat-form-field>
            <div class="modal-actions">
              <button mat-button type="button" (click)="showUserModal = false">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="userForm.invalid">Create Account</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Dept Modal -->
      <div class="modal-backdrop" *ngIf="showDeptModal" (click)="showDeptModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Register Ministry / Department</h3>
            <button mat-icon-button (click)="showDeptModal = false"><mat-icon>close</mat-icon></button>
          </div>
          <form [formGroup]="deptForm" (ngSubmit)="saveDept()" class="modal-form">
            <mat-form-field appearance="outline">
              <mat-label>Department Code</mat-label>
              <input matInput formControlName="code" placeholder="e.g. MOEFCC">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Full Department Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g. Ministry of Environment">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Description / Mandate</mat-label>
              <textarea matInput rows="3" formControlName="description"></textarea>
            </mat-form-field>
            <div class="modal-actions">
              <button mat-button type="button" (click)="showDeptModal = false">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="deptForm.invalid">Register</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-body { padding: 24px 8px; }
    .tab-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .tab-section-title { font-size: 16px; font-weight: 600; color: #1a237e; }
    .code-badge { background: #e8eaf6; color: #1a237e; font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }

    .threshold-card {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px; background: #f9fbfd; border: 1px solid #e1e8ed; border-radius: 8px; margin-bottom: 12px;
    }
    .t-info { strong { font-size: 14px; color: #1a1a2e; } p { font-size: 12px; color: #666; margin: 4px 0 0 0; } }
    .custom-num-input {
      width: 90px; padding: 8px 12px; font-size: 14px; font-weight: 600;
      border: 1px solid #ccc; border-radius: 6px; text-align: right;
    }

    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;
    }
    .modal-content {
      background: #fff; border-radius: 12px; width: 480px; max-width: 90vw; padding: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; h3 { font-size: 18px; margin: 0; color: #1a237e; } }
    .modal-form { display: flex; flex-direction: column; gap: 8px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
  `]
})
export class AdminComponent implements OnInit {
  sysStats: any = null;
  users: User[] = [];
  departments: Department[] = [];
  thresholds: any[] = [];
  auditLogs: any[] = [];
  totalLogs = 0;
  pageSize = 10;
  pageIndex = 0;

  showUserModal = false;
  showDeptModal = false;
  userForm: FormGroup;
  deptForm: FormGroup;

  constructor(
    private adminService: AdminService,
    private deptService: DepartmentService,
    public util: UtilService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['User@123', [Validators.required, Validators.minLength(6)]],
      role: ['department_head', Validators.required],
      departmentId: [null]
    });

    this.deptForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadStats();
    this.loadUsers();
    this.loadDepartments();
    this.loadThresholds();
    this.loadAuditLogs();
  }

  loadStats() {
    this.adminService.getSystemStats().subscribe(res => {
      if (res.success) this.sysStats = res.data;
    });
  }

  loadUsers() {
    this.adminService.getUsers().subscribe(res => {
      if (res.success) this.users = res.data;
    });
  }

  loadDepartments() {
    this.deptService.getDepartments().subscribe(res => {
      if (res.success) this.departments = res.data;
    });
  }

  loadThresholds() {
    this.adminService.getThresholds().subscribe(res => {
      if (res.success) this.thresholds = res.data;
    });
  }

  loadAuditLogs() {
    this.adminService.getAuditLogs({ page: this.pageIndex + 1, limit: this.pageSize }).subscribe(res => {
      if (res.success) {
        this.auditLogs = res.data;
        this.totalLogs = res.pagination?.total || res.data.length;
      }
    });
  }

  onPageChange(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadAuditLogs();
  }

  formatThresholdKey(k: string): string {
    return k.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  saveThresholds() {
    this.adminService.updateThresholds(this.thresholds).subscribe({
      next: () => this.snackBar.open('Thresholds updated successfully!', 'Close', { duration: 2500 }),
      error: () => this.snackBar.open('Failed to update thresholds.', 'Close', { duration: 2500 })
    });
  }

  saveUser() {
    if (this.userForm.invalid) return;
    this.adminService.createUser(this.userForm.value).subscribe({
      next: () => {
        this.showUserModal = false;
        this.userForm.reset({ role: 'department_head', password: 'User@123' });
        this.loadUsers();
        this.loadStats();
        this.snackBar.open('User account created.', 'Close', { duration: 2500 });
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error creating user', 'Close', { duration: 3000 })
    });
  }

  saveDept() {
    if (this.deptForm.invalid) return;
    this.deptService.createDepartment(this.deptForm.value).subscribe({
      next: () => {
        this.showDeptModal = false;
        this.deptForm.reset();
        this.loadDepartments();
        this.loadStats();
        this.snackBar.open('Department registered successfully.', 'Close', { duration: 2500 });
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error registering department', 'Close', { duration: 3000 })
    });
  }

  deactivateUser(u: User) {
    if (confirm(`Deactivate user account ${u.name}?`)) {
      this.adminService.deactivateUser(u.id).subscribe({
        next: () => {
          this.loadUsers();
          this.snackBar.open('User deactivated.', 'Close', { duration: 2500 });
        },
        error: (err) => this.snackBar.open(err.error?.message || 'Deactivation failed', 'Close', { duration: 2500 })
      });
    }
  }

  getRoleBadge(role: string): string {
    const map: any = { admin: 'badge-danger', finance_officer: 'badge-info', department_head: 'badge-success' };
    return map[role] || 'badge-default';
  }
}
