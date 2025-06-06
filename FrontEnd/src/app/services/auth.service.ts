import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loginUrl = 'https://dreamtravel.pythonanywhere.com/api/v1/auth/login/';
  private registerUrl = 'https://dreamtravel.pythonanywhere.com/api/v1/auth/register/';
  private refreshTokenUrl =
    'https://dreamtravel.pythonanywhere.com/api/v1/auth/token/refresh/';

  constructor(private http: HttpClient) {}

  login(credentials: any): Observable<any> {
    return this.http.post(this.loginUrl, credentials).pipe(
      map((response: any) => {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        return response;
      }),
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  register(user: any): Observable<any> {
    return this.http.post(this.registerUrl, user).pipe(
      map((response: any) => {
        return response;
      }),
      catchError((err) => {
        return throwError(err);
      })
    );
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post(this.refreshTokenUrl, { refresh: refreshToken }).pipe(
      map((response: any) => {
        localStorage.setItem('access_token', response.access);
        return response;
      }),
      catchError((err) => {
        this.logout();
        return throwError(err);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token'); // Devuelve true si el token existe
  }
}
