import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarritoService, CarritoItem, CarritoAddItem, MetodoPago, Destino } from '../../services/carrito.service'; 
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

declare var bootstrap: any;

@Component({
  selector: 'app-destinos-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './destinos-cart.component.html',
  styleUrls: ['./destinos-cart.component.css']
})
export class DestinosCartComponent implements OnInit {
  carritoItems: CarritoItem[] = [];
  metodosPago: MetodoPago[] = [];
  metodoPagoSeleccionado: number | null = null;
  total: number = 0;
  defaultImage: string = 'https://placehold.co/400x300/E0E0E0/4F4F4F?text=No+Image';

  userId: number | null = null; 
  selectAll: boolean = true;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  pagoEnProceso: boolean = false;

  constructor(
    private carritoService: CarritoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    const loggedInUserId = this.authService.getLoggedInUserId(); 

    if (loggedInUserId) {
      this.userId = loggedInUserId;
      
      // Cargar primero los métodos de pago (filtrando para excluir "Efectivo")
      this.carritoService.getMetodosPago().subscribe({
        next: (metodos) => {
          // Filtrar para excluir el método de pago "Efectivo"
          this.metodosPago = metodos
            .filter(m => m.nombrePago !== 'Efectivo')
            .map(m => ({
              ...m,
              id_metodoPago: Number(m.id_metodoPago)
            }));
          
          if (this.metodosPago.length > 0) {
            this.metodoPagoSeleccionado = this.metodosPago[0].id_metodoPago;
          }
          
          this.loadAllData();
        },
        error: (err) => {
          console.error('Error al cargar métodos de pago:', err);
          this.isLoading = false;
        }
      });
    } else {
      this.errorMessage = "Debes iniciar sesión para ver tu carrito.";
      this.isLoading = false;
      this.router.navigate(['/login']);
    }
  }

  onMetodoPagoChange(event: any): void {
    this.metodoPagoSeleccionado = Number(event.target.value);
    console.log('Método de pago cambiado a:', this.metodoPagoSeleccionado);
  }

  loadAllData(): void {
    if (this.userId === null) {
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin([
      this.carritoService.getCarritoByUserId(this.userId),
      this.carritoService.getMetodosPago()
    ]).pipe(
      switchMap(([carritoResponse, metodosPagoResponse]) => {
        // Filtrar métodos de pago para excluir "Efectivo"
        this.metodosPago = metodosPagoResponse.filter(m => m.nombrePago !== 'Efectivo');
        if (this.metodosPago.length > 0 && this.metodoPagoSeleccionado === null) {
          this.metodoPagoSeleccionado = this.metodosPago[0].id_metodoPago;
        }

        if (carritoResponse && carritoResponse.length > 0) {
          const destinoRequests = carritoResponse.map(item => 
            this.carritoService.getDestinoById(item.id_destino).pipe(
              catchError((err: HttpErrorResponse) => {
                console.error(`Error al cargar detalles del destino ${item.id_destino}:`, err);
                return of<Destino>({ 
                  id_destino: item.id_destino, 
                  cantidad_Disponible: 0, 
                  precio_Destino: item.precio_Destino, 
                  nombre_Destino: item.nombre_Destino,
                  descripcion: '', 
                  image: '', 
                  fecha_salida: '', 
                  mostrarSoldOut: false, 
                  estaVigente: false, 
                  tieneCupo: false 
                });
              })
            )
          );
          return forkJoin(destinoRequests).pipe(
            map((destinos: Destino[]) => {
              return carritoResponse.map((item: CarritoItem) => {
                const destinoDetalles = destinos.find(d => d.id_destino === item.id_destino);
                return {
                  ...item,
                  cantidad: Number(item.cantidad),
                  cantidad_Disponible: destinoDetalles?.cantidad_Disponible || 0,
                  precio_Destino: destinoDetalles?.precio_Destino || item.precio_Destino, 
                  selected: this.selectAll 
                };
              });
            })
          );
        } else {
          return of([]); 
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error al cargar datos del carrito o métodos de pago:', error);
        this.errorMessage = 'Hubo un error al cargar tu carrito o los métodos de pago. Por favor, inténtalo de nuevo.';
        this.isLoading = false;
        return of([]);
      })
    ).subscribe(
      (itemsConStock: CarritoItem[]) => {
        this.carritoItems = itemsConStock;
        this.updateTotal(); 
        this.isLoading = false;
      },
      (error: HttpErrorResponse) => {
        console.error('Error final en subscribe (loadAllData):', error);
        this.errorMessage = 'Hubo un error al cargar el carrito.';
        this.isLoading = false;
      }
    );
  }

  updateTotal(): void {
    this.total = this.carritoItems
      .filter((item: CarritoItem) => item.selected)
      .reduce((sum: number, item: CarritoItem) => sum + (item.precio_Destino * item.cantidad), 0);
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.carritoItems.forEach(item => item.selected = this.selectAll);
    this.updateTotal();
  }

  actualizarCantidad(item: CarritoItem, nuevaCantidad: number): void {
    this.errorMessage = null;
    nuevaCantidad = Number(nuevaCantidad);
    if (nuevaCantidad < 1) {
      nuevaCantidad = 1;
    }
    
    if (item.cantidad_Disponible !== undefined && nuevaCantidad > item.cantidad_Disponible) {
      this.carritoService.mostrarAlerta(
        `Solo quedan ${item.cantidad_Disponible} cupos disponibles para ${item.nombre_Destino}.`,
        'warning'
      );
      return;
    }

    if (nuevaCantidad === item.cantidad) {
      return; 
    }

    if (item.id_compra) {
      this.carritoService.updateCarritoItem(item.id_compra, { cantidad: nuevaCantidad }).subscribe({
        next: (updatedItem: CarritoItem) => {
          item.cantidad = updatedItem.cantidad; 
          this.updateTotal();
          this.carritoService.mostrarAlerta('Cantidad actualizada correctamente.', 'success');
          this.loadAllData();
        },
        error: (error: HttpErrorResponse) => {
          this.loadAllData();
          let userFriendlyMessage = 'Hubo un error al actualizar la cantidad.';
          if (error.error && typeof error.error === 'object' && error.error.cantidad && error.error.cantidad.length > 0) {
            userFriendlyMessage = error.error.cantidad[0];
          } else if (error.message) {
            userFriendlyMessage = error.message;
          }
          this.carritoService.mostrarAlerta(`Error: ${userFriendlyMessage}`, 'error');
        }
      });
    }
  }

  incrementarCantidad(item: CarritoItem): void {
    this.actualizarCantidad(item, item.cantidad + 1);
  }

  decrementarCantidad(item: CarritoItem): void {
    this.actualizarCantidad(item, item.cantidad - 1);
  }

  eliminarItem(id_compra: number): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.carritoService.deleteCarritoItem(id_compra).subscribe({
      next: () => {
        this.carritoService.mostrarAlerta('Ítem eliminado correctamente.', 'success');
        this.loadAllData(); 
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al eliminar ítem:', error);
        this.errorMessage = 'Hubo un error al eliminar el ítem del carrito.';
        this.isLoading = false;
        this.carritoService.mostrarAlerta('Error al eliminar ítem.', 'error');
      }
    });
  }

  checkout(): void {
    const userId = this.authService.getLoggedInUserId(); 
    if (!userId) { 
      this.carritoService.mostrarAlerta('Debes iniciar sesión para finalizar tu compra.', 'info');
      this.router.navigate(['/login']);
      return;
    }
  
    const itemsToCheckout = this.carritoItems.filter(item => item.selected);
  
    if (itemsToCheckout.length === 0) {
      this.carritoService.mostrarAlerta('Por favor, selecciona al menos un destino para proceder al checkout.', 'warning');
      return;
    }
  
    if (this.metodoPagoSeleccionado === null || this.metodoPagoSeleccionado === undefined) {
      this.carritoService.mostrarAlerta('Por favor, selecciona un método de pago.', 'warning');
      return;
    }
  
    const metodoPago = this.metodosPago.find(m => 
      Number(m.id_metodoPago) === Number(this.metodoPagoSeleccionado)
    );
    
    if (!metodoPago) {
      console.error('Método de pago no encontrado. Métodos disponibles:', this.metodosPago);
      this.carritoService.mostrarAlerta('Método de pago no válido. Por favor, selecciona otro.', 'error');
      return;
    }
  
    // Procesar pago con tarjeta
    if (metodoPago.nombrePago === 'Tarjeta') {
      // Guardar datos de compra localmente antes de procesar el pago
      const compraData = {
        userId: userId,
        metodoPagoId: this.metodoPagoSeleccionado,
        total: this.total,
        items: itemsToCheckout.map(item => ({
          id_destino: item.id_destino,
          nombre_Destino: item.nombre_Destino,
          descripcion: item.descripcion,
          image: item.image,
          cantidad: item.cantidad,
          precio_Destino: item.precio_Destino,
          fecha_salida: item.fecha_salida
        })),
        fecha: new Date().toISOString()
      };
  
      this.carritoService.guardarCompraTarjeta(compraData);
      this.procesarPagoConTarjeta(itemsToCheckout, userId);
    } else {
      this.carritoService.mostrarAlerta(`El método de pago '${metodoPago.nombrePago}' no está configurado.`, 'error');
    }
  }

  private procesarPagoConTarjeta(itemsToCheckout: CarritoItem[], userId: number): void {
    this.pagoEnProceso = true;
    
    const mercadopagoItems = itemsToCheckout.map(item => ({
      title: item.nombre_Destino,
      quantity: item.cantidad,
      unit_price: item.precio_Destino,
      currency_id: 'ARS',
      description: item.descripcion,
      id_destino: item.id_destino
    }));

    this.carritoService.createMercadoPagoPreference(mercadopagoItems, userId).subscribe({
      next: (preferenceResponse: any) => {
        const initPoint = preferenceResponse.init_point;
        if (initPoint) {
          window.open(initPoint, '_blank');
          this.carritoService.mostrarAlerta('Se está abriendo Mercado Pago en una nueva pestaña. Por favor, revísala para completar tu pago.', 'info');
        } else {
          console.error('No se recibió el init_point de Mercado Pago:', preferenceResponse);
          this.carritoService.mostrarAlerta('No se pudo iniciar el proceso de pago con Mercado Pago.', 'error');
          this.pagoEnProceso = false;
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al crear la preferencia de Mercado Pago (Backend):', error); 
        let userFriendlyMessage = 'Hubo un error al preparar el pago con Mercado Pago. Inténtalo de nuevo.';
        if (error.error && typeof error.error === 'object' && error.error.error) {
            userFriendlyMessage = error.error.error;
        } else if (error.message) {
            userFriendlyMessage = error.message;
        }
        this.carritoService.mostrarAlerta(userFriendlyMessage, 'error');
        this.pagoEnProceso = false;
      }
    });
  }

  resetPaymentProcess(): void {
    this.pagoEnProceso = false;
    this.carritoService.mostrarAlerta('Proceso de pago cancelado. Puedes continuar con tu carrito.', 'info');
    this.router.navigate(['/']);
  }

  trackById(index: number, item: CarritoItem): number {
    return item.id_compra; 
  }
}