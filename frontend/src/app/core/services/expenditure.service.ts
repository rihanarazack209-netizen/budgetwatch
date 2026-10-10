import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Expenditure } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ExpenditureService {
  private apiUrl = `${environment.apiUrl}/expenditures`;
  constructor(private http: HttpClient) {}

  getExpenditures(filter?: any): Observable<ApiResponse<Expenditure[]>> {
    let params = new HttpParams();
    if (filter) Object.entries(filter).forEach(([k, v]) => { if (v !== undefined && v !== '') params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<Expenditure[]>>(this.apiUrl, { params });
  }

  getExpenditure(id: string): Observable<ApiResponse<Expenditure>> {
    return this.http.get<ApiResponse<Expenditure>>(`${this.apiUrl}/${id}`);
  }

  createExpenditure(data: FormData): Observable<ApiResponse<Expenditure>> {
    return this.http.post<ApiResponse<Expenditure>>(this.apiUrl, data);
  }

  updateExpenditure(id: string, data: Partial<Expenditure>): Observable<ApiResponse<Expenditure>> {
    return this.http.put<ApiResponse<Expenditure>>(`${this.apiUrl}/${id}`, data);
  }

  deleteExpenditure(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  approveExpenditure(id: string): Observable<ApiResponse<Expenditure>> {
    return this.http.put<ApiResponse<Expenditure>>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectExpenditure(id: string, reason: string): Observable<ApiResponse<Expenditure>> {
    return this.http.put<ApiResponse<Expenditure>>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  getCategoryStats(filter?: any): Observable<ApiResponse<{ _id: string; total: number; count: number }[]>> {
    let params = new HttpParams();
    if (filter) Object.entries(filter).forEach(([k, v]) => { if (v) params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/categories/stats`, { params });
  }
}
