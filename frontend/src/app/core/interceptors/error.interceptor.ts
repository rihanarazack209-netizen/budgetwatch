import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError(err => {
      const msg = err.error?.message || 'An unexpected error occurred';
      if (err.status === 401) {
        localStorage.removeItem('bw_token');
        localStorage.removeItem('bw_user');
        router.navigate(['/login']);
        snackBar.open('Session expired. Please login again.', 'Close', { duration: 4000, panelClass: ['snack-error'] });
      } else if (err.status === 403) {
        snackBar.open('You are not authorized to perform this action.', 'Close', { duration: 4000, panelClass: ['snack-error'] });
      } else if (err.status === 0) {
        snackBar.open('Cannot connect to server. Please check your connection.', 'Close', { duration: 4000, panelClass: ['snack-error'] });
      } else if (err.status >= 500) {
        snackBar.open('Server error. Please try again.', 'Close', { duration: 4000, panelClass: ['snack-error'] });
      }
      return throwError(() => err);
    })
  );
};
