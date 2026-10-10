import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, DashboardStats, DepartmentUtilization } from '../models/models';

@Injectable({ providedIn: 'root' })
export class MonitoringService {
  private apiUrl = `${environment.apiUrl}/monitoring`;
  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.apiUrl}/dashboard`);
  }

  getDepartmentUtilization(financialYear?: string): Observable<ApiResponse<DepartmentUtilization[]>> {
    let params = new HttpParams();
    if (financialYear) params = params.set('financialYear', financialYear);
    return this.http.get<ApiResponse<DepartmentUtilization[]>>(`${this.apiUrl}/department-utilization`, { params });
  }

  getSpendingTrends(months?: number): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (months) params = params.set('months', String(months));
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/spending-trends`, { params });
  }

  runAnomalyDetection(): Observable<ApiResponse<{ budgetsChecked: number; newAlerts: number }>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/run-detection`, {});
  }
}
