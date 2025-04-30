import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Destino } from '../models/destinos';

@Injectable({
  providedIn: 'root',
})
export class DestinosService {
  private apiUrl = 'http://dtapp.pythonanywhere.com/api/v1/destinos/';

  constructor(private http: HttpClient) {}

  obtenerDestinos(): Observable<Destino[]> {
    return this.http.get<Destino[]>(this.apiUrl);
  }
}
