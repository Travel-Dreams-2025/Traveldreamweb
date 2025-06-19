import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// import { MatSnackBar } from '@angular/material/snack-bar'; // Descomenta si usas Angular Material SnackBar

// --- Interfaces necesarias (TODAS EXPORTADAS) ---

export interface CarritoItem {
  id_compra: number; // ID del item en el carrito (o ID de la compra)
  id_usuario?: number; // El ID del usuario asociado
  id_destino: number; // ID del destino
  nombre_Destino: string;
  descripcion: string;
  precio_Destino: number;
  cantidad: number;
  fecha_salida: string; // O Date, asegúrate de que el formato sea 'YYYY-MM-DD' para el backend
  image: string; // Asegúrate de que esta propiedad exista en tu serializador si la usas
  selected?: boolean; // Para la selección en el carrito
  cantidad_Disponible?: number; // Añadido para el stock disponible del destino
}

export interface CarritoAddItem {
  id_destino: number;
  cantidad: number;
  fecha_salida?: string; // Hacerlo opcional si a veces no se envía
  id_metodoPago?: number; // Hacerlo opcional si a veces no se envía o el backend tiene un default
}

export interface MetodoPago {
  id_metodoPago: number;
  nombrePago: string;
}

// Interfaz Destino exportada y completa
export interface Destino {
  id_destino: number;
  nombre_Destino: string;
  descripcion: string;
  precio_Destino: number;
  cantidad_Disponible: number; // Esencial para la validación de stock
  image: string;
  fecha_salida?: string | Date; // Asegúrate de que el tipo coincida con tu modelo
  mostrarSoldOut?: boolean; // Añadido para consistencia con el componente
  estaVigente?: boolean;   // Añadido para consistencia con el componente
  tieneCupo?: boolean;     // Añadido para consistencia con el componente
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
  estado_compra?: string; // Ahora esto se mapearía a 'estado_pago' del modelo Carrito
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

  constructor(
    private http: HttpClient,
    // private snackBar: MatSnackBar // Descomenta si usas Angular Material SnackBar
  ) { }

  // --- Métodos del Carrito (Ajustados al ViewSet) ---

  /**
   * Obtiene los ítems del carrito de un usuario específico.
   * Utiliza la acción personalizada `by_user` del CarritoViewSet.
   * GET /api/v1/carrito/by_user/{userId}/
   */
  getCarritoByUserId(userId: number): Observable<CarritoItem[]> {
    return this.http.get<CarritoItem[]>(`${this.carritoBaseUrl}/by_user/${userId}/`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Elimina un ítem del carrito.
   * Utiliza el método DELETE por defecto del CarritoViewSet.
   * DELETE /api/v1/carrito/{id_compra}/
   */
  deleteCarritoItem(id_compra: number): Observable<void> {
    return this.http.delete<void>(`${this.carritoBaseUrl}/${id_compra}/`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Actualiza la cantidad y/o la fecha de salida de un ítem del carrito.
   * Utiliza el método PATCH por defecto del CarritoViewSet.
   * PATCH /api/v1/carrito/{id_compra}/
   */
  updateCarritoItem(id_compra: number, data: { cantidad?: number, fecha_salida?: string }): Observable<CarritoItem> {
    return this.http.patch<CarritoItem>(`${this.carritoBaseUrl}/${id_compra}/`, data).pipe(
      catchError(error => this.handleError(error))
    );
  }
  registrarCompra(compraData: any): Observable<any> {
    // Usa el mismo endpoint que usas para tarjeta, pero con tipo "efectivo"
    return this.http.post('/api/compras', {
      ...compraData,
      tipo_pago: 'efectivo',
      estado: 'completado'
    }).pipe(
      catchError(error => {
        console.error('Error al registrar compra:', error);
        throw error;
      })
    );
  }
  registrarCompraEfectivo(compraData: any): Observable<any> {
    const payload = {
      id_usuario: compraData.userId,
      id_destino: compraData.items[0].id_destino, // Asumiendo un solo item por compra
      id_metodoPago: compraData.metodoPagoId,
      nombre_Destino: compraData.items[0].nombre_Destino,
      descripcion: compraData.items[0].descripcion,
      image: compraData.items[0].image,
      total: compraData.total.toString(),
      cantidad: compraData.items[0].cantidad.toString(),
      estado_pago: 'approved',
      fecha_salida: compraData.items[0].fecha_salida || new Date().toISOString().split('T')[0]
    };
  
    return this.http.post('/api/v1/purchases/', payload).pipe(
      catchError(error => {
        console.error('Error al registrar compra en efectivo:', error);
        throw error;
      })
    );
  }
  /**
   * Agrega un nuevo ítem al carrito o actualiza uno existente.
   * Utiliza la acción personalizada `add_item` del CarritoViewSet.
   * POST /api/v1/carrito/add_item/
   */
  addItemCarrito(item: CarritoAddItem): Observable<CarritoItem> {
    return this.http.post<CarritoItem>(`${this.carritoBaseUrl}/add_item/`, item).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // --- Otros Métodos ---

  /**
   * Obtiene los detalles de un destino por su ID.
   * GET /api/v1/destinos/{destinoId}/
   */
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
  
  /**
   * Crea una preferencia de pago en Mercado Pago.
   * Utiliza el endpoint `@csrf_exempt` `create_preference` en tu backend.
   * POST /api/mercadopago/create_preference/
   */
  createMercadoPagoPreference(items: any[], userId: number): Observable<MercadoPagoPreferenceResponse> {
    const payload = {
      items: items,
      user_id: userId
    };
    return this.http.post<MercadoPagoPreferenceResponse>(this.mercadopagoCreatePreferenceUrl, payload).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Obtiene el historial de compras del usuario.
   * Utiliza el endpoint `listar_compras` en tu backend (ahora `/api/v1/purchases/`).
   */
  obtenerHistorialCompras(): Observable<CompraHistorialItem[]> {
    return this.http.get<CompraHistorialItem[]>(this.historialComprasApiUrl).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // --- Métodos para manejo de localStorage ---

  /**
   * Guarda una compra en el historial local (localStorage)
   * @param compraData Datos de la compra a guardar
   */
  guardarCompraLocal(compraData: any): void {
    try {
      const historial = this.obtenerHistorialLocal() || [];
      historial.push(compraData);
      localStorage.setItem('historial_compras_local', JSON.stringify(historial));
    } catch (error) {
      console.error('Error al guardar compra en localStorage:', error);
    }
  }

  /**
   * Obtiene el historial de compras desde localStorage
   * @returns Array con las compras almacenadas localmente
   */
  obtenerHistorialLocal(): any[] {
    try {
      const historialString = localStorage.getItem('historial_compras_local');
      return historialString ? JSON.parse(historialString) : [];
    } catch (error) {
      console.error('Error al obtener historial de localStorage:', error);
      return [];
    }
  }

  // --- Métodos de Utilidad (puedes personalizarlos con MatSnackBar si lo tienes) ---
  mostrarAlerta(message: string, type: 'success' | 'error' | 'warning' | 'info' | 'danger'): void {
    console.log(`ALERTA (${type.toUpperCase()}): ${message}`);
    // Si estás usando Angular Material SnackBar, descomenta y usa esto:
    /*
    let panelClass = '';
    if (type === 'success') {
      panelClass = 'snackbar-success';
    } else if (type === 'error') {
      panelClass = 'snackbar-error';
    } else if (type === 'warning') {
      panelClass = 'snackbar-warning';
    } else if (type === 'info') {
      panelClass = 'snackbar-info';
    }
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass]
    });
    */
    // Por ahora, usaremos alert() si no tienes MatSnackBar configurado
    // alert(`${type.toUpperCase()}: ${message}`); // Línea comentada para eliminar los pop-ups
  }
/**
 * Actualiza el stock de un destino
 * @param destinoId ID del destino
 * @param cantidad Cambio en el stock (positivo para aumentar, negativo para disminuir)
 */
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
    
    this.mostrarAlerta(userFriendlyMessage, 'error'); // Aquí todavía se llama a mostrarAlerta
    
    return throwError(() => new Error(errorMessage));
  }
}