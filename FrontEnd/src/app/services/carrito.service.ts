import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

interface CarritoItem {
  id_destino: number;
  cantidad: number;
  fecha_salida?: string;
  nombre_Destino?: string;
  precio_Destino?: number;
  image?: string;
}

interface CompraHistorial {
  fecha: string;
  items: {
    id_destino: number;
    cantidad: number;
    nombre_Destino?: string;
    precio_Destino?: number;
    image?: string;
    fecha?: string;
  }[];
  metodoPagoId: number;
  estado: 'pendiente' | 'completado' | 'cancelado';
}

@Injectable({
  providedIn: 'root',
})
export class CarritoService {
  private baseUrl = 'https://dreamtravel.pythonanywhere.com/api/v1';
  private historialKey = 'dreamtravel_historial';

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  // ========== MANEJO DE ERRORES ==========
  private handleError(error: any): Observable<never> {
    console.error('Error en CarritoService:', error);
    const errorMessage = error.error?.message || 'Error en la operación';
    this.showError(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  // ========== OPERACIONES DE CARRITO ==========
  agregarAlCarrito(item: CarritoItem): Observable<any> {
    return this.http.post(`${this.baseUrl}/cart/add/`, {
      id_destino: item.id_destino,
      cantidad: item.cantidad,
      fecha_salida: item.fecha_salida
    }).pipe(
      tap(() => this.showSuccess('Item agregado al carrito')),
      catchError(this.handleError)
    );
  }

  obtenerCarrito(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/cart/`).pipe(
      catchError(this.handleError)
    );
  }

  eliminarItem(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/remove/${id}/`).pipe(
      tap(() => this.showSuccess('Item eliminado del carrito')),
      catchError(this.handleError)
    );
  }

  actualizarCantidad(id: number, nuevaCantidad: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/cart/${id}/update-quantity/`, {
      cantidad: nuevaCantidad
    }).pipe(
      tap(() => this.showSuccess('Cantidad actualizada correctamente')),
      catchError(this.handleError)
    );
  }

  actualizarFecha(id: number, nuevaFecha: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/cart/${id}/update-date/`, {
      fecha_salida: nuevaFecha
    }).pipe(
      tap(() => this.showSuccess('Fecha actualizada correctamente')),
      catchError(this.handleError)
    );
  }

  // ========== CHECKOUT & PAGOS ==========
  checkout(id_destino: number, cantidad: number, metodoPagoId: number, itemData?: any): Observable<any> {
    const payload = {
      metodo_pago: metodoPagoId,
      items: [{
        id_destino,
        cantidad
      }]
    };

    return this.http.post(`${this.baseUrl}/checkout/`, payload).pipe(
      tap((response: any) => {
        const itemParaHistorial = {
          id_destino,
          cantidad,
          ...itemData // Incluye nombre, precio e imagen si están disponibles
        };
        this.registrarEnHistorial([itemParaHistorial], metodoPagoId);
        this.showSuccess('Compra realizada con éxito');
      }),
      catchError(this.handleError)
    );
  }

  checkoutMultiple(items: CarritoItem[], metodoPagoId: number): Observable<any> {
    const payload = {
      metodo_pago: metodoPagoId,
      items: items.map(item => ({
        id_destino: item.id_destino,
        cantidad: item.cantidad
      }))
    };

    return this.http.post(`${this.baseUrl}/checkout/`, payload).pipe(
      tap((response: any) => {
        this.registrarEnHistorial(items, metodoPagoId);
        this.limpiarCarrito().subscribe();
        this.showSuccess('Compra múltiple realizada con éxito');
      }),
      catchError(this.handleError)
    );
  }

  limpiarCarrito(): Observable<any> {
    return this.obtenerCarrito().pipe(
      switchMap((items: any[]) => {
        const deleteObservables = items.map(item => 
          this.eliminarItem(item.id_compra)
        );
        return forkJoin(deleteObservables);
      }),
      tap(() => {
        this.showSuccess('Carrito limpiado correctamente');
      }),
      catchError(this.handleError)
    );
  }

  // ========== HISTORIAL DE COMPRAS ==========
  private registrarEnHistorial(
    items: Array<{id_destino: number, cantidad: number, nombre_Destino?: string, precio_Destino?: number, image?: string}>,
    metodoPagoId: number
  ): void {
    const nuevaCompra: CompraHistorial = {
      fecha: new Date().toISOString(),
      items: items.map(item => ({
        id_destino: item.id_destino,
        cantidad: item.cantidad,
        nombre_Destino: item.nombre_Destino,
        precio_Destino: item.precio_Destino,
        image: item.image,
        fecha: new Date().toISOString()
      })),
      metodoPagoId,
      estado: 'completado'
    };

    const historialActual = this.obtenerHistorial();
    const nuevoHistorial = [nuevaCompra, ...historialActual];
    localStorage.setItem(this.historialKey, JSON.stringify(nuevoHistorial));
  }

  obtenerHistorial(): CompraHistorial[] {
    try {
      const historialStr = localStorage.getItem(this.historialKey);
      return historialStr ? JSON.parse(historialStr) : [];
    } catch (e) {
      console.error('Error leyendo historial:', e);
      return [];
    }
  }

  limpiarHistorial(): void {
    localStorage.removeItem(this.historialKey);
    this.showSuccess('Historial de compras limpiado');
  }

  // ========== DATOS CATALOGO ==========
  obtenerDestinos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/destinos/`).pipe(
      catchError(this.handleError)
    );
  }

  obtenerMetodosPago(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/metodos-pago/`).pipe(
      catchError(this.handleError)
    );
  }

  listarCompras(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/purchases/`).pipe(
      catchError(this.handleError)
    );
  }

  // ========== HELPERS ==========
  calcularTotal(items: any[]): number {
    return items.reduce((total, item) => {
      const precio = Number(item.precio_Destino) || 0;
      const cantidad = Number(item.cantidad) || 0;
      return total + (precio * cantidad);
    }, 0);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Fecha no disponible';
    try {
      return new Date(fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return fecha;
    }
  }
}