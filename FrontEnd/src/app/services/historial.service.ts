import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  // BehaviorSubject para mantener el estado del historial
  private historialSubject = new BehaviorSubject<any[]>(this.cargarHistorialInicial());
  
  // Observable público para componentes
  public historial$: Observable<any[]> = this.historialSubject.asObservable();

  constructor() { }

  // Cargar historial desde localStorage al iniciar
  private cargarHistorialInicial(): any[] {
    try {
      const historial = localStorage.getItem('dreamtravel_historial');
      return historial ? JSON.parse(historial) : [];
    } catch (error) {
      console.error('Error al cargar historial', error);
      return [];
    }
  }

  // Agregar nueva compra al historial
  agregarCompra(compra: any): void {
    const historialActual = this.historialSubject.value;
    const nuevoHistorial = [compra, ...historialActual]; // Nuevas compras primero
    
    localStorage.setItem('dreamtravel_historial', JSON.stringify(nuevoHistorial));
    this.historialSubject.next(nuevoHistorial);
  }

  // Obtener historial completo (sincrónico)
  obtenerHistorial(): any[] {
    return this.historialSubject.value;
  }

  // Limpiar historial (útil para logout)
  limpiarHistorial(): void {
    localStorage.removeItem('dreamtravel_historial');
    this.historialSubject.next([]);
  }

  // Método para formatear compras antes de guardar
  formatearCompra(items: any[], total: number, metodoPago: string): any {
    return {
      fecha: new Date().toISOString(),
      items: items.map(item => ({
        id: item.id_compra || item.id_destino,
        nombre: item.nombre_Destino,
        imagen: item.image,
        cantidad: item.cantidad,
        precioUnitario: item.precio_Destino,
        subtotal: item.cantidad * item.precio_Destino
      })),
      total,
      metodoPago,
      estado: 'completado'
    };
  }
}