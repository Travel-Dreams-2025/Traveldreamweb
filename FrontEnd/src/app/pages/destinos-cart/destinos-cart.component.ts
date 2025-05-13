import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../services/carrito.service';
import { Destino } from '../../models/destinos';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs'; // Importar forkJoin, Observable, of
import { catchError, tap } from 'rxjs/operators'; // Importar operadores

@Component({
  selector: 'app-destinos-cart',
  standalone: true,
  imports: [CommonModule,FormsModule, RouterModule],
  templateUrl: './destinos-cart.component.html',
  styleUrls: ['./destinos-cart.component.css']
})
export class DestinosCartComponent implements OnInit {
  carritoItems: any[] = [];
  destinos: Destino[] = [];
  total: number = 0;
  defaultImage = 'url_de_imagen_por_defecto'; // Considera reemplazar esta URL con una imagen por defecto real
  metodosPago: any[] = [];
  metodoPagoSeleccionado: string = ''; // Es un string porque viene del value de un select HTML

  constructor(private carritoService: CarritoService, private router: Router) {}

  ngOnInit(): void {
    this.obtenerCarrito();
    this.obtenerDestinos();
    this.obtenerMetodosPago();
  }

  obtenerMetodosPago(): void {
    this.carritoService.obtenerMetodosPago().subscribe({
      next: (metodos: any[]) => {
        this.metodosPago = metodos;
      },
      error: (error: any) => {
        console.error('Error al obtener los métodos de pago', error);
      }
    });
  }

  obtenerCarrito(): void {
    this.carritoService.obtenerCarrito().subscribe({
      next: (items: any[]) => {
        this.carritoItems = items.map(item => ({
          ...item,
          cantidad: Number(item.cantidad) // Asegúrate de que cantidad sea un número
        }));
        this.combinarDatos();
      },
      error: (error: any) => {
        console.error('Error al obtener el carrito', error);
      }
    });
  }

  obtenerDestinos(): void {
    this.carritoService.obtenerDestinos().subscribe({
      next: (destinos: Destino[]) => {
        this.destinos = destinos;
        this.combinarDatos();
      },
      error: (error: any) => {
        console.error('Error al obtener los destinos', error);
      }
    });
  }

  combinarDatos(): void {
    if (this.carritoItems.length > 0 && this.destinos.length > 0) {
      this.carritoItems.forEach(item => {
        const destino = this.destinos.find(d => d.id_destino === item.id_destino);
        if (destino) {
          item.nombre_Destino = destino.nombre_Destino;
          item.descripcion = destino.descripcion;
          item.image = destino.image;
          item.precio_Destino = destino.precio_Destino;
        }
      });
      this.calcularTotal();
    }
  }

  eliminarItem(id: number): void {
    this.carritoService.eliminarItem(id).subscribe({
      next: () => {
        this.obtenerCarrito();
      },
      error: (error: any) => {
        console.error('Error al eliminar el item del carrito', error);
      }
    });
  }

  actualizarCantidad(item: any, nuevaCantidad: number): void {
    if (item.id_compra === undefined) {
      console.error('El id del item está undefined:', item);
      return;
    }

    nuevaCantidad = Number(nuevaCantidad);
    if (nuevaCantidad < 1) {
      nuevaCantidad = 1;
    }
    this.carritoService.actualizarItem(item.id_compra, nuevaCantidad).subscribe({
      next: () => {
        item.cantidad = nuevaCantidad; // Actualiza la cantidad localmente
        this.calcularTotal();
      },
      error: (error: any) => {
        console.error('Error al actualizar la cantidad del item', error);
      }
    });
  }

  calcularTotal(): void {
    this.total = this.carritoItems.reduce((sum, item) => sum + item.precio_Destino * item.cantidad, 0);
  }

  checkout(): void {
    if (!this.metodoPagoSeleccionado) {
      alert('Por favor, seleccione un método de pago.');
      return;
    }

    if (this.carritoItems.length === 0) {
      alert('Tu carrito está vacío. Agrega ítems antes de proceder al checkout.');
      this.router.navigate(['/destinos']);
      return;
    }

    // Convertir el id del método de pago a número
    const metodoPagoIdNumerico = Number(this.metodoPagoSeleccionado);
    if (isNaN(metodoPagoIdNumerico)) {
      console.error('Método de pago seleccionado no es un número válido:', this.metodoPagoSeleccionado);
      alert('Error: El método de pago seleccionado no es válido.');
      return;
    }

    // Array para almacenar los Observables de cada compra individual
    const checkoutObservables: Observable<any>[] = [];

    this.carritoItems.forEach(item => {
      // Para cada ítem en el carrito, creamos un Observable de compra individual
      checkoutObservables.push(
        this.carritoService.checkout(item.id_destino, item.cantidad, metodoPagoIdNumerico).pipe(
          tap(response => {
            console.log(`Compra de destino ${item.nombre_Destino} (x${item.cantidad}) exitosa:`, response);
            // Aquí podrías eliminar el ítem del carrito localmente si la compra fue exitosa
            // o dejar que la llamada a obtenerCarrito() después del forkJoin actualice el estado
          }),
          catchError(error => {
            console.error(`Error al comprar destino ${item.nombre_Destino} (x${item.cantidad}):`, error);
            // Devolver un observable que emite un valor (p.ej., un objeto con 'success: false')
            // para que forkJoin no falle por completo si una sola compra falla.
            return of({ success: false, item: item, error: error });
          })
        )
      );
    });

    // Ejecutar todas las llamadas de checkout concurrentemente
    forkJoin(checkoutObservables).subscribe({
      next: (results) => {
        let allSuccessful = true;
        let successCount = 0;
        let errorCount = 0;

        results.forEach(result => {
          if (result && result.success === false) {
            allSuccessful = false;
            errorCount++;
          } else {
            successCount++;
          }
        });

        if (allSuccessful) {
          alert('Todos los ítems del carrito comprados con éxito.');
          this.obtenerCarrito(); // Volver a cargar el carrito para limpiarlo
          this.router.navigate(['/destinos']); // Redirigir a la página de destinos
        } else {
          let message = `Se compraron ${successCount} de ${this.carritoItems.length} ítems.`;
          if (errorCount > 0) {
            message += ` Fallaron ${errorCount} ítems. Revisa la consola para más detalles.`;
          }
          alert(message);
          this.obtenerCarrito(); // Refrescar el carrito, que ahora contendrá solo los ítems que no se pudieron comprar (si el backend los mantiene)
        }
      },
      error: (err) => {
        // Este bloque se ejecutaría si forkJoin falla por una razón general (ej. problema de red),
        // pero no si las llamadas individuales fallan y se manejan con catchError.
        console.error('Error inesperado en el proceso de checkout:', err);
        alert('Error general al intentar finalizar la compra. Inténtelo de nuevo.');
      }
    });
  }

  actualizarFecha(item: any): void {
    if (item.id_compra === undefined) {
      console.error('El id del item está undefined:', item);
      return;
    }

    const nuevaFecha = item.fecha_salida;
    this.carritoService.actualizarFecha(item.id_compra, nuevaFecha).subscribe({
      next: () => {
        item.fecha_salida = nuevaFecha; // Actualiza la fecha localmente
        console.log('Fecha de salida actualizada:', nuevaFecha);
      },
      error: (error: any) => {
        console.error('Error al actualizar la fecha de salida', error);
      }
    });
  }
}