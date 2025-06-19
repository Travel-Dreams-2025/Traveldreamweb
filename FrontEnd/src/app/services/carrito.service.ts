import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface CarritoItem {
  id_compra: number;
  id_usuario?: number;
  id_destino: number;
  nombre_Destino: string;
  descripcion: string;
  precio_Destino: number;
  cantidad: number;
  fecha_salida: string;
  image: string;
  selected?: boolean;
  cantidad_Disponible?: number;
}

export interface CarritoAddItem {
  id_destino: number;
  cantidad: number;
  fecha_salida?: string;
  id_metodoPago?: number;
}

export interface MetodoPago {
  id_metodoPago: number;
  nombrePago: string;
}

export interface Destino {
  id_destino: number;
  nombre_Destino: string;
  descripcion: string;
  precio_Destino: number;
  cantidad_Disponible: number;
  image: string;
  fecha_salida?: string | Date;
  mostrarSoldOut?: boolean;
  estaVigente?: boolean;
  tieneCupo?: boolean;
}

export interface CompraHistorialItem {
  id_compra: number;
  id_usuario: number;
  id_destino: number;
  cantidad: number;
  precio_unitario: number;
  total_compra: number;
  fecha_compra: string;
  nombre_destino?: string;
  imagen_destino?: string;
  descripcion_destino?: string;
  fecha_salida_destino?: string;
  estado_compra?: string;
  id_metodoPago?: number;
}

export interface MercadoPagoPreferenceResponse {
  init_point: string;
  preference_id: string;
  external_reference: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private baseUrl = 'https://dreamtravelmp.pythonanywhere.com'; 
  private apiUrl = `${this.baseUrl}/api/v1`;
  private carritoBaseUrl = `${this.apiUrl}/carrito`;
  private metodosPagoUrl = `${this.apiUrl}/metodos-pago`;
  private destinosBaseUrl = `${this.apiUrl}/destinos`;
  private historialComprasApiUrl = `${this.apiUrl}/purchases`;
  private checkoutUrl = `${this.apiUrl}/checkout`;
  private mercadopagoCreatePreferenceUrl = `${this.apiUrl}/mercadopago/create_preference/`;

  constructor(private http: HttpClient) { }

  getCarritoByUserId(userId: number): Observable<CarritoItem[]> {
    return this.http.get<CarritoItem[]>(`${this.carritoBaseUrl}/by_user/${userId}/`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  deleteCarritoItem(id_compra: number): Observable<void> {
    return this.http.delete<void>(`${this.carritoBaseUrl}/${id_compra}/`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  updateCarritoItem(id_compra: number, data: { cantidad?: number, fecha_salida?: string }): Observable<CarritoItem> {
    return this.http.patch<CarritoItem>(`${this.carritoBaseUrl}/${id_compra}/`, data).pipe(
      catchError(error => this.handleError(error))
    );
  }

  addItemCarrito(item: CarritoAddItem): Observable<CarritoItem> {
    return this.http.post<CarritoItem>(`${this.carritoBaseUrl}/add_item/`, item).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getDestinoById(destinoId: number): Observable<Destino> {
    return this.http.get<Destino>(`${this.destinosBaseUrl}/${destinoId}/`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  getMetodosPago(): Observable<MetodoPago[]> {
    return this.http.get<MetodoPago[]>(this.metodosPagoUrl + '/').pipe(
      catchError(error => this.handleError(error))
    );
  }

  procesarCheckout(checkoutData: any): Observable<any> {
    return this.http.post<any>(`${this.checkoutUrl}/`, checkoutData).pipe(
      catchError(error => this.handleError(error))
    );
  }

  createMercadoPagoPreference(items: any[], userId: number): Observable<MercadoPagoPreferenceResponse> {
    const payload = {
      items: items,
      user_id: userId
    };
    return this.http.post<MercadoPagoPreferenceResponse>(this.mercadopagoCreatePreferenceUrl, payload).pipe(
      catchError(error => this.handleError(error))
    );
  }

  obtenerHistorialCompras(): Observable<CompraHistorialItem[]> {
    return this.http.get<CompraHistorialItem[]>(this.historialComprasApiUrl).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Nuevo método para guardar compras con tarjeta en el historial local
  guardarCompraTarjeta(compraData: any): void {
    try {
      const historial = this.obtenerHistorialLocal() || [];
      const nuevaCompra = {
        ...compraData,
        metodo_pago: { nombrePago: 'Tarjeta / Mercado Pago' },
        fecha: new Date().toISOString(),
        estado_pago: 'approved'
      };
      historial.push(nuevaCompra);
      localStorage.setItem('historial_compras_local', JSON.stringify(historial));
    } catch (error) {
      console.error('Error al guardar compra con tarjeta en localStorage:', error);
    }
  }

  obtenerHistorialLocal(): any[] {
    try {
      const historialString = localStorage.getItem('historial_compras_local');
      return historialString ? JSON.parse(historialString) : [];
    } catch (error) {
      console.error('Error al obtener historial de localStorage:', error);
      return [];
    }
  }

  mostrarAlerta(message: string, type: 'success' | 'error' | 'warning' | 'info' | 'danger'): void {
    console.log(`ALERTA (${type.toUpperCase()}): ${message}`);
  }

  actualizarStockDestino(destinoId: number, cantidad: number): Observable<any> {
    return this.http.patch(`${this.destinosBaseUrl}/${destinoId}/update_stock/`, { 
      cantidad: cantidad 
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido.';
    let userFriendlyMessage = 'Hubo un problema de comunicación con el servidor.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente o de la red: ${error.error.message}`;
      userFriendlyMessage = 'Parece que hay un problema con tu conexión a internet o el navegador.';
    } else {
      console.error(`Código de error del backend: ${error.status}, ` + `Cuerpo: ${JSON.stringify(error.error)}`);
      errorMessage = `Error del servidor: Código ${error.status}`;

      if (error.error) {
        if (typeof error.error === 'object') {
          if (error.error.cantidad && error.error.cantidad.length > 0) {
            userFriendlyMessage = error.error.cantidad[0];
          } else if (error.error.detail) {
            userFriendlyMessage = error.error.detail;
          } else if (error.error.error) {
            userFriendlyMessage = error.error.error;
          } else {
            userFriendlyMessage = 'Error en la validación de datos. Por favor, revisa la información.';
            for (const key in error.error) {
              if (Array.isArray(error.error[key]) && error.error[key].length > 0) {
                userFriendlyMessage += ` ${key}: ${error.error[key].join(', ')}`;
              }
            }
          }
        } else if (typeof error.error === 'string') {
          userFriendlyMessage = error.error;
        }
      } else {
        userFriendlyMessage = `Error ${error.status}: El servidor no pudo procesar la solicitud.`;
      }
    }
    
    this.mostrarAlerta(userFriendlyMessage, 'error');
    return throwError(() => new Error(errorMessage));
  }
}