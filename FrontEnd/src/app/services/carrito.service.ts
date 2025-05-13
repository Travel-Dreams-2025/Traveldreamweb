import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CarritoService {
  private baseUrl = 'https://dreamtravel.pythonanywhere.com/api/v1'; // Django server URL base

  constructor(private http: HttpClient) {}

  agregarCarrito(id_destino: number, cantidad: number, fecha_salida: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/cart/add/`, {
      id_destino,
      cantidad,
      fecha_salida
    });
  }

  obtenerCarrito(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cart/`);
  }

  eliminarItem(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/remove/${id}/`);
  }

  actualizarItem(id: number, cantidad: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/cart/${id}/update-quantity/`, {
      cantidad,
    });
  }

  obtenerDestinos(): Observable<any> {
    return this.http.get(`${this.baseUrl}/destinos/`);
  }

  actualizarFecha(id: number, fecha_salida: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/cart/${id}/update-date/`, {
      fecha_salida,
    });
  }

  obtenerMetodosPago(): Observable<any> {
    return this.http.get(`${this.baseUrl}/metodos-pago/`);
  }

  // MODIFICACIÓN CRUCIAL: El backend espera los detalles de UN SOLO ítem para el checkout.
  // Este método ahora acepta el id del destino, la cantidad y el id del método de pago.
  checkout(id_destino: number, cantidad: number, id_metodoPago: number): Observable<any> {
    const checkoutPayload = {
      id_destino: id_destino,
      cantidad: cantidad,
      id_metodoPago: id_metodoPago
    };
    // Se envía un solo objeto JSON con los datos de un destino.
    return this.http.post(`${this.baseUrl}/checkout/`, checkoutPayload);
  }

  listarCompras(): Observable<any> {
    return this.http.get(`${this.baseUrl}/purchases/`);
  }
}