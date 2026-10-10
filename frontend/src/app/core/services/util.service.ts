import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UtilService {
  formatINR(amount: number): string {
    if (!amount && amount !== 0) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  formatINRShort(amount: number): string {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  getUtilizationClass(pct: number): string {
    if (pct < 40) return 'util-critical';
    if (pct < 70) return 'util-warning';
    return 'util-good';
  }

  getProgressClass(pct: number): string {
    if (pct < 40) return 'progress-critical';
    if (pct < 70) return 'progress-warning';
    return 'progress-good';
  }

  getSeverityClass(severity: string): string {
    const map: any = { critical: 'badge-danger', high: 'badge-warning', medium: 'badge-purple', low: 'badge-info' };
    return map[severity] || 'badge-default';
  }

  getStatusClass(status: string): string {
    const map: any = { approved: 'badge-success', pending: 'badge-warning', rejected: 'badge-danger', active: 'badge-success', closed: 'badge-default', suspended: 'badge-danger' };
    return map[status] || 'badge-default';
  }

  getAlertTypeLabel(type: string): string {
    const map: any = {
      under_utilization: 'Under-Utilization',
      overspending: 'Overspending',
      spending_spike: 'Spending Spike',
      threshold_breach: 'Threshold Breach',
      inactivity: 'Inactivity'
    };
    return map[type] || type;
  }

  getAlertTypeIcon(type: string): string {
    const map: any = {
      under_utilization: 'trending_down',
      overspending: 'money_off',
      spending_spike: 'warning',
      threshold_breach: 'rule',
      inactivity: 'schedule'
    };
    return map[type] || 'info';
  }

  getMonthName(month: number): string {
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month - 1];
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getCategoryIcon(cat: string): string {
    const map: any = { salaries: 'people', infrastructure: 'business', operations: 'settings', training: 'school', procurement: 'shopping_cart', maintenance: 'build', IT: 'computer', other: 'category' };
    return map[cat] || 'receipt';
  }
}
