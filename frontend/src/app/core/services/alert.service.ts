import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Alert, AlertStats } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private apiUrl = `${environment.apiUrl}/alerts`;
  constructor(private http: HttpClient) {}

  getAlerts(filter?: any): Observable<ApiResponse<Alert[]>> {
    let params = new HttpParams();
    if (filter) Object.entries(filter).forEach(([k, v]) => { if (v !== undefined && v !== '') params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<Alert[]>>(this.apiUrl, { params });
  }

  getStats(): Observable<ApiResponse<AlertStats>> {
    return this.http.get<ApiResponse<AlertStats>>(`${this.apiUrl}/stats`);
  }

  markAsRead(id: string): Observable<ApiResponse<Alert>> {
    return this.http.put<ApiResponse<Alert>>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllRead(): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/mark-all-read`, {});
  }

  resolveAlert(id: string): Observable<ApiResponse<Alert>> {
    return this.http.put<ApiResponse<Alert>>(`${this.apiUrl}/${id}/resolve`, {});
  }

  deleteAlert(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
