import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;
  constructor(private http: HttpClient) {}

  getUsers(filter?: any): Observable<ApiResponse<User[]>> {
    let params = new HttpParams();
    if (filter) Object.entries(filter).forEach(([k, v]) => { if (v) params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/users`, { params });
  }

  createUser(data: any): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/users`, data);
  }

  updateUser(id: string, data: any): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/users/${id}`, data);
  }

  deactivateUser(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/users/${id}`);
  }

  getAuditLogs(filter?: any): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (filter) Object.entries(filter).forEach(([k, v]) => { if (v) params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/audit-logs`, { params });
  }

  getThresholds(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/thresholds`);
  }

  updateThresholds(data: { key: string; value: number }[]): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/thresholds`, data);
  }

  getSystemStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats`);
  }
}
