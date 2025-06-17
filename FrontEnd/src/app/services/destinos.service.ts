import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Destino } from '../models/destinos';

@Injectable({
  providedIn: 'root',
})
export class DestinosService {
  private apiUrl = 'https://dreamtravelmp.pythonanywhere.com/api/v1/destinos/';

  constructor(private http: HttpClient) {}

  obtenerDestinosPublicos(): Observable<Destino[]> {
    return this.http.get<Destino[]>(this.apiUrl).pipe(
      map(destinos => this.procesarDestinos(destinos))
    );
  }

  private procesarDestinos(destinos: Destino[]): Destino[] {
    if (!destinos) return [];
    
    const ahora = new Date();
    return destinos.map(destino => {
      if (!destino || !destino.fecha_salida) return destino;
      
      const fechaSalida = new Date(destino.fecha_salida);
      const estaVigente = fechaSalida > ahora;
      const tieneCupo = destino.cantidad_Disponible > 0;
      
      // Añadimos propiedades para controlar el estado
      return {
        ...destino,
        estaVigente,
        tieneCupo,
        mostrarSoldOut: estaVigente && !tieneCupo
      };
    }).filter(destino => destino.estaVigente); // Solo mostramos destinos vigentes
  }
}