import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PasswordResetService {
  private apiUrl = 'https://dreamtravelmp.pythonanywhere.com/api/accounts';

  constructor(private http: HttpClient) {}

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/password-reset/`, { email });
  }

  confirmPasswordReset(uid: string, token: string, new_password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/password-reset-confirm/${uid}/${token}/`, {
      new_password,
    });
  }
}
