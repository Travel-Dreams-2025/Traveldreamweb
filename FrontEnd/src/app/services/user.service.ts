import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'https://dreamtravelmp.pythonanywhere.com/api/v1/'; 

  constructor(private http: HttpClient) { }

  listarCompras(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}carrito/`); 
  }
}