// user.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'https://dreamtravel.pythonanywhere.com/api/v1';

  constructor(private http: HttpClient) {}

  obtenerPerfil(): Observable<any> {
    return this.http.get(`${this.baseUrl}/perfil/`);
  }

  listarCompras(): Observable<any> {
    return this.http.get(`${this.baseUrl}/purchases/`);
  }
}
