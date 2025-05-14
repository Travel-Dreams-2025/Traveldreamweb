import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'https://dreamtravel.pythonanywhere.com/api/v1/profiles/me/';
  private updateUrl = `${this.apiUrl}update/`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(contentType: string = 'application/json'): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return new HttpHeaders({
      'Content-Type': contentType,
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('ProfileService error:', error);
    if (error.status === 401) {
      this.authService.logout();
    }
    return throwError(() => ({
      status: error.status,
      message: error.error?.message || error.message || 'Error al procesar la solicitud'
    }));
  }

  getProfile(): Observable<any> {
    return this.http.get(this.apiUrl, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateProfile(profileData: {
    telephone: string;
    dni: string;
    address: string;
  }): Observable<any> {
    // Usamos directamente el endpoint correcto para actualización
    return this.http.patch(
      this.updateUrl,
      profileData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError((error) => {
        // Si PATCH falla, probamos con PUT (por si el backend lo espera)
        if (error.status === 405) {
          return this.http.put(
            this.updateUrl,
            profileData,
            { headers: this.getAuthHeaders() }
          ).pipe(
            catchError(this.handleError)
          );
        }
        return this.handleError(error);
      })
    );
  }

  updateProfileWithFormData(profileData: {
    telephone: string;
    dni: string;
    address: string;
  }): Observable<any> {
    const formData = new FormData();
    formData.append('telephone', profileData.telephone);
    formData.append('dni', profileData.dni);
    formData.append('address', profileData.address);

    return this.http.post(
      this.apiUrl,
      formData,
      { 
        headers: new HttpHeaders({
          'Authorization': `Bearer ${this.authService.getToken()}`
        })
      }
    ).pipe(
      catchError((error) => {
        // Si POST con FormData falla, probamos PUT con FormData
        if (error.status === 405) {
          return this.http.put(
            this.apiUrl,
            formData,
            { 
              headers: new HttpHeaders({
                'Authorization': `Bearer ${this.authService.getToken()}`
              })
            }
          );
        }
        return this.handleError(error);
      })
    );
  }
}