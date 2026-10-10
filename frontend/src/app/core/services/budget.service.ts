import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Budget, BudgetFilter, BudgetSummary } from '../models/models';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private apiUrl = `${environment.apiUrl}/budgets`;
  constructor(private http: HttpClient) {}

  getBudgets(filter?: BudgetFilter): Observable<ApiResponse<Budget[]>> {
    let params = new HttpParams();
    if (filter) {
      Object.entries(filter).forEach(([k, v]) => { if (v !== undefined && v !== '') params = params.set(k, String(v)); });
    }
    return this.http.get<ApiResponse<Budget[]>>(this.apiUrl, { params });
  }

  getBudget(id: string): Observable<ApiResponse<Budget>> {
    return this.http.get<ApiResponse<Budget>>(`${this.apiUrl}/${id}`);
  }

  createBudget(data: Partial<Budget>): Observable<ApiResponse<Budget>> {
    return this.http.post<ApiResponse<Budget>>(this.apiUrl, data);
  }

  updateBudget(id: string, data: Partial<Budget>): Observable<ApiResponse<Budget>> {
    return this.http.put<ApiResponse<Budget>>(`${this.apiUrl}/${id}`, data);
  }

  deleteBudget(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  getSummary(filter?: Partial<BudgetFilter>): Observable<ApiResponse<{ summary: BudgetSummary; byDepartment: any[] }>> {
    let params = new HttpParams();
    if (filter) Object.entries(filter).forEach(([k, v]) => { if (v) params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<{ summary: BudgetSummary; byDepartment: any[] }>>(`${this.apiUrl}/summary`, { params });
  }
}
