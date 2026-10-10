import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;
  constructor(private http: HttpClient) {}

  getFinancialSummary(filter?: any): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (filter) Object.entries(filter).forEach(([k, v]) => { if (v) params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/financial-summary`, { params });
  }

  getExpenditureReport(filter?: any): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (filter) Object.entries(filter).forEach(([k, v]) => { if (v) params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/expenditure`, { params });
  }

  downloadCSV(filter?: any): Observable<Blob> {
    let params = new HttpParams();
    if (filter) Object.entries(filter).forEach(([k, v]) => { if (v) params = params.set(k, String(v)); });
    return this.http.get(`${this.apiUrl}/export/csv`, { params, responseType: 'blob' });
  }

  downloadPDF(filter?: any): Observable<Blob> {
    let params = new HttpParams();
    if (filter) Object.entries(filter).forEach(([k, v]) => { if (v) params = params.set(k, String(v)); });
    return this.http.get(`${this.apiUrl}/export/pdf`, { params, responseType: 'blob' });
  }
}
