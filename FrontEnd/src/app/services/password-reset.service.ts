import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {

  private apiUrl = 'https://dreamtravel.pythonanywhere.com/api/accounts/password-reset/';

  constructor(private http: HttpClient) { }

  // Metodo para solicitar reestablecimiento de contraseña
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(this.apiUrl, { email });
  }
}
