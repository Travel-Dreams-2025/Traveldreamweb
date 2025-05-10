import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'https://dreamtravel.pythonanywhere.com/api/v1/profiles/me/';

  constructor(private http: HttpClient) { }

  // Obtener perfil
  getProfile(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // Actualizar perfil (ejemplo adicional)
  updateProfile(data: any): Observable<any> {
    return this.http.put(this.apiUrl, data);
  }
}