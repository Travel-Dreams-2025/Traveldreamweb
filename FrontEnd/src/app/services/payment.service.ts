// src/app/services/payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface PaymentRequest {
  user_id: number;
  items: {
    id_destino: number;
    nombre_Destino: string;
    descripcion: string;
    image: string;
    precio_Destino: string;
    cantidadComprada: number;
    fecha_salida: string;
    cantidad_Disponible: number;
    id_metodoPago: number;
    id_categoria: number;
  }[];
}

interface PaymentResponse {
  message: string;
  init_point: string;
  preference_id: string;
  external_reference: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'https://dreamtravelmp.pythonanywhere.com/api/v1/mercadopago/';

  constructor(private http: HttpClient) { }

  createMercadoPagoPreference(paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/create_preference/`, paymentData);
  }
}