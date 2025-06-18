import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Importamos todas las interfaces desde carrito.service para consistencia
import { CarritoService, CarritoItem, CarritoAddItem, MetodoPago, Destino } from '../../services/carrito.service'; 
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http'; // Importa HttpErrorResponse
import { forkJoin, of } from 'rxjs'; // Importar operadores de RxJS
import { switchMap, catchError, map } from 'rxjs/operators'; // Importar operadores de RxJS

declare var bootstrap: any; // Declaramos bootstrap para usar sus funciones de modal

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
  total: number = 0; // Total general del carrito (de ítems seleccionados)
  defaultImage: string = 'https://placehold.co/400x300/E0E0E0/4F4F4F?text=No+Image'; // Imagen por defecto

  destinoSeleccionado: Destino | null = null;
  cantidadSeleccionada: number = 1;
  precioTotalModal: number = 0;
  agregandoAlCarrito: boolean = false;
  private destinoModal: any;

  // Propiedad 'userId' declarada explícitamente y tipada
  userId: number | null = null; 

  selectAll: boolean = true; // Estado del checkbox "Seleccionar Todo"
  isLoading: boolean = false; // Nuevo: Para manejar el estado de carga
  errorMessage: string | null = null; // Nuevo: Para mostrar errores al usuario

  //Estado del pago
  pagoEnProceso: boolean = false; 

  constructor(
    private carritoService: CarritoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true; // Inicia el estado de carga
    
    // CORREGIDO: Asumimos que getLoggedInUserId() devuelve directamente un number | null
    const loggedInUserId = this.authService.getLoggedInUserId(); 

    if (loggedInUserId) {
      this.userId = loggedInUserId; // Asigna el ID del usuario
      this.loadAllData(); // Carga todos los datos necesarios
    } else {
      this.errorMessage = "Debes iniciar sesión para ver tu carrito.";
      this.isLoading = false; // Finaliza el estado de carga
      this.router.navigate(['/login']); // Redirige si no está logueado
    }

    // Inicializa el modal después de que el DOM esté listo
    setTimeout(() => {
      const modalElement = document.getElementById('destinoModal');
      if (modalElement) {
        this.destinoModal = new bootstrap.Modal(modalElement);
      }
    }, 0);
  }

  // --- FUNCIÓN PARA CARGAR TODOS LOS DATOS CON STOCK ---
  loadAllData(): void {
    // Solo carga si userId está definido
    if (this.userId === null) { 
      // Esto debería ser manejado por ngOnInit antes de llamar a loadAllData,
      // pero es una seguridad adicional.
      this.isLoading = false; 
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin([
      this.carritoService.getCarritoByUserId(this.userId),
      this.carritoService.getMetodosPago()
    ]).pipe(
      switchMap(([carritoResponse, metodosPagoResponse]) => { // Ahora `metodosPagoResponse` será `MetodoPago[]`
        this.metodosPago = metodosPagoResponse;
        if (this.metodosPago.length > 0 && this.metodoPagoSeleccionado === null) {
          this.metodoPagoSeleccionado = this.metodosPago[0].id_metodoPago; // Selecciona el primero por defecto si no hay uno
        }

        if (carritoResponse && carritoResponse.length > 0) {
          const destinoRequests = carritoResponse.map(item => 
            this.carritoService.getDestinoById(item.id_destino).pipe(
              catchError((err: HttpErrorResponse) => {
                console.error(`Error al cargar detalles del destino ${item.id_destino}:`, err);
                // Retornar un objeto Destino completo para evitar errores de tipo
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
            map((destinos: Destino[]) => { // Tipado explícito para 'destinos'
              return carritoResponse.map((item: CarritoItem) => { // Tipado explícito para 'item'
                const destinoDetalles = destinos.find(d => d.id_destino === item.id_destino);
                return {
                  ...item,
                  cantidad: Number(item.cantidad), // <--- ¡CORRECCIÓN CLAVE AQUÍ: Asegurarse que item.cantidad sea número!
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
      (itemsConStock: CarritoItem[]) => { // Tipado para itemsConStock
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

  /**
   * Actualiza la cantidad de un ítem en el carrito.
   * @param item El ítem del carrito a actualizar.
   * @param nuevaCantidad La nueva cantidad deseada.
   */
  actualizarCantidad(item: CarritoItem, nuevaCantidad: number): void {
    this.errorMessage = null;

    // Asegurarse de que nuevaCantidad sea un número y no sea menor que 1
    nuevaCantidad = Number(nuevaCantidad); // <--- ¡CORRECCIÓN CLAVE AQUÍ: Asegurarse que nuevaCantidad sea número!
    if (nuevaCantidad < 1) {
      nuevaCantidad = 1;
    }
    
    console.log('Validando cantidad (Cliente - TIPOS):', {
      nuevaCantidad: nuevaCantidad, typeof_nuevaCantidad: typeof nuevaCantidad,
      cantidadDisponibleItem: item.cantidad_Disponible, typeof_cantidadDisponibleItem: typeof item.cantidad_Disponible,
      nombreDestino: item.nombre_Destino,
      itemCantidadActual: item.cantidad, typeof_itemCantidadActual: typeof item.cantidad 
    });

    // Validación del lado del cliente
    if (item.cantidad_Disponible !== undefined && nuevaCantidad > item.cantidad_Disponible) {
      this.carritoService.mostrarAlerta(
        `Solo quedan ${item.cantidad_Disponible} cupos disponibles para ${item.nombre_Destino}.`,
        'warning'
      );
      console.error('VALIDACIÓN CLIENTE: Cantidad solicitada excede el stock disponible. Solicitud no enviada.'); // Mensaje de depuración
      return; // ESTO DEBERÍA DETENER LA SOLICITUD
    }

    if (nuevaCantidad === item.cantidad) {
      console.log('La cantidad es la misma, no se realiza la actualización.');
      return; 
    }

    if (item.id_compra) {
      console.log(`Enviando solicitud PATCH al backend para item ${item.id_compra} con nueva cantidad: ${nuevaCantidad}`);
      this.carritoService.updateCarritoItem(item.id_compra, { cantidad: nuevaCantidad }).subscribe({
        next: (updatedItem: CarritoItem) => {
          item.cantidad = updatedItem.cantidad; 
          this.updateTotal();
          console.log(`Cantidad actualizada para el item ${item.id_compra} a ${updatedItem.cantidad}`);
          this.carritoService.mostrarAlerta('Cantidad actualizada correctamente.', 'success');
          this.loadAllData(); // Recargar todos los datos, incluyendo el stock
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al actualizar cantidad del ítem (Backend):', error); // Mensaje más específico
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

  /**
   * Elimina un ítem específico del carrito.
   * @param id_compra El ID del ítem de compra a eliminar.
   */
  eliminarItem(id_compra: number): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.carritoService.deleteCarritoItem(id_compra).subscribe({
      next: () => {
        console.log('Ítem eliminado con éxito');
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

  /**
   * Actualiza el total del carrito sumando los precios de los ítems seleccionados.
   */
  updateTotal(): void {
    this.total = this.carritoItems
      .filter((item: CarritoItem) => item.selected)
      .reduce((sum: number, item: CarritoItem) => sum + (item.precio_Destino * item.cantidad), 0);
  }

  /**
   * Alterna la selección de todos los elementos del carrito.
   */
  toggleSelectAll(): void {
    this.carritoItems.forEach(item => item.selected = this.selectAll);
    this.updateTotal(); 
  }

  /**
   * Prepara y muestra el modal para "Comprar ahora" un destino específico.
   * @param item El ítem del carrito que se desea comprar individualmente.
   */
  buyNow(item: CarritoItem): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.carritoService.getDestinoById(item.id_destino).subscribe({
      next: (destinoData: Destino) => {
        this.destinoSeleccionado = destinoData;
        
        if (this.destinoSeleccionado.cantidad_Disponible <= 0) {
          this.destinoSeleccionado.mostrarSoldOut = true; 
          this.cantidadSeleccionada = 0;
        } else {
          this.cantidadSeleccionada = 1;
        }

        this.updatePrecioTotalModal();
        if (this.destinoModal) {
          this.destinoModal.show();
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar detalles del destino para BuyNow:', error);
        this.carritoService.mostrarAlerta('Error al cargar la información del destino.', 'error');
        this.isLoading = false;
      }
    });
  }

  /**
   * Decrementa la cantidad seleccionada en el modal de compra individual.
   */
  decrementarCantidadModal(): void {
    if (this.cantidadSeleccionada > 1) {
      this.cantidadSeleccionada--;
      this.updatePrecioTotalModal();
    }
  }

  /**
   * Incrementa la cantidad seleccionada en el modal de compra individual.
   */
  incrementarCantidadModal(): void {
    if (this.destinoSeleccionado && this.cantidadSeleccionada < this.destinoSeleccionado.cantidad_Disponible) {
      this.cantidadSeleccionada++;
      this.updatePrecioTotalModal();
    } else if (this.destinoSeleccionado) {
        this.carritoService.mostrarAlerta('No hay más cupos disponibles para este destino.', 'warning');
    }
  }

  /**
   * Maneja el cambio manual de cantidad en el input del modal.
   * @param event El evento del input.
   */
  onCantidadChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let value = parseInt(inputElement.value, 10);

    if (isNaN(value) || value < 1) {
      value = 1;
    }
    if (this.destinoSeleccionado && value > this.destinoSeleccionado.cantidad_Disponible) {
      value = this.destinoSeleccionado.cantidad_Disponible;
      this.carritoService.mostrarAlerta(`Solo quedan ${this.destinoSeleccionado.cantidad_Disponible} cupos.`, 'warning');
    }
    this.cantidadSeleccionada = value;
    this.updatePrecioTotalModal();
  }

  /**
   * Actualiza el precio total mostrado en el modal de compra individual.
   */
  updatePrecioTotalModal(): void {
    if (this.destinoSeleccionado) {
      this.precioTotalModal = this.destinoSeleccionado.precio_Destino * this.cantidadSeleccionada;
    } else {
      this.precioTotalModal = 0;
    }
  }

  /**
   * Cierra el modal de compra individual y reinicia sus propiedades.
   */
  cerrarModal(): void {
    if (this.destinoModal) {
      this.destinoModal.hide();
    }
    this.destinoSeleccionado = null;
    this.cantidadSeleccionada = 1;
    this.precioTotalModal = 0;
    this.agregandoAlCarrito = false;
  }

  /**
   * Confirma la adición de un destino al carrito desde el modal.
   */
  agregarAlCarritoConfirmado(): void {
    this.agregandoAlCarrito = true;
    const userId = this.authService.getLoggedInUserId(); 

    if (!this.destinoSeleccionado || !this.destinoSeleccionado.id_destino) {
      console.error('Error: No hay destino seleccionado o ID de destino al intentar agregar al carrito.');
      this.carritoService.mostrarAlerta('Error: No se pudo identificar el destino.', 'error');
      this.agregandoAlCarrito = false;
      return;
    }

    if (!userId) { 
      console.error('Usuario no autenticado.');
      this.carritoService.mostrarAlerta('Debes iniciar sesión para agregar ítems al carrito.', 'info');
      this.agregandoAlCarrito = false;
      this.router.navigate(['/login']);
      return;
    }

    if (this.metodoPagoSeleccionado === null) {
        this.carritoService.mostrarAlerta('Por favor, selecciona un método de pago antes de agregar al carrito.', 'warning');
        this.agregandoAlCarrito = false;
        return;
    }

    const item: CarritoAddItem = {
      id_destino: this.destinoSeleccionado.id_destino,
      cantidad: this.cantidadSeleccionada,
      fecha_salida: typeof this.destinoSeleccionado.fecha_salida === 'string'
        ? this.destinoSeleccionado.fecha_salida
        : this.destinoSeleccionado.fecha_salida?.toISOString(),
      id_metodoPago: this.metodoPagoSeleccionado
    };

    this.carritoService.addItemCarrito(item).subscribe({
      next: (response: CarritoItem) => {
        console.log('Item agregado al carrito:', response);
        this.carritoService.mostrarAlerta('El destino se agregó al carrito correctamente.', 'success');
        this.agregandoAlCarrito = false;
        this.cerrarModal();
        this.loadAllData(); 
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al agregar ítem al carrito (Backend):', error);
        let userFriendlyMessage = 'Hubo un error al agregar el destino al carrito.';
        if (error.error && typeof error.error === 'object' && error.error.cantidad && error.error.cantidad.length > 0) {
            userFriendlyMessage = error.error.cantidad[0];
        } else if (error.message) {
            userFriendlyMessage = error.message;
        }
        this.carritoService.mostrarAlerta(userFriendlyMessage, 'error');
        this.agregandoAlCarrito = false;
      }
    });
  }

  /**
   * Inicia el proceso de checkout para los ítems seleccionados.
   */
  checkout(): void {
    const userId = this.authService.getLoggedInUserId(); 
    if (!userId) { 
      console.error('Usuario no autenticado para el checkout.');
      this.carritoService.mostrarAlerta('Debes iniciar sesión para finalizar tu compra.', 'info');
      this.router.navigate(['/login']);
      return;
    }

    const itemsToCheckout = this.carritoItems.filter((item: CarritoItem) => item.selected);

    if (itemsToCheckout.length === 0) {
      this.carritoService.mostrarAlerta('Por favor, selecciona al menos un destino para proceder al checkout.', 'warning');
      return;
    }

    if (!this.metodoPagoSeleccionado) {
      this.carritoService.mostrarAlerta('Por favor, selecciona un método de pago.', 'warning');
      return;
    }

    const mercadopagoItems = itemsToCheckout.map(item => ({
      title: item.nombre_Destino,
      quantity: item.cantidad,
      unit_price: item.precio_Destino,
      currency_id: 'ARS',
      description: item.descripcion,
      id_destino: item.id_destino
    }));

    this.pagoEnProceso = true;
    
    this.carritoService.createMercadoPagoPreference(mercadopagoItems, userId).subscribe({
      next: (preferenceResponse: any) => {
        const initPoint = preferenceResponse.init_point;
        if (initPoint) {
          window.open(initPoint, '_blank');
          this.carritoService.mostrarAlerta('Se está abriendo Mercado Pago en una nueva pestaña. Por favor, revísala para completar tu pago.', 'info');
        } else {
          console.error('No se recibió el init_point de Mercado Pago:', preferenceResponse);
          this.carritoService.mostrarAlerta('No se pudo iniciar el proceso de pago con Mercado Pago.', 'error');
          this.pagoEnProceso = false; // Restablecer si falla la obtención del init_point
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
        this.pagoEnProceso = false; // Restablecer si hay un error en la llamada
      }
    });
  }

  /**
   * Restablece el estado del proceso de pago, ocultando el overlay.
   */
  resetPaymentProcess(): void {
    this.pagoEnProceso = false; // Esto oculta el overlay del HTML
    this.carritoService.mostrarAlerta('Proceso de pago cancelado. Puedes continuar con tu carrito.', 'info');
    // Opcional: Si deseas recargar el carrito por si hay cambios en el backend mientras se intentaba pagar:
    // this.loadAllData();

    // Redirijimos al inicio
    this.router.navigate(['/']);
  }

  // Usamos id_compra como identificador único para trackBy
  trackById(index: number, item: CarritoItem): number {
    return item.id_compra; 
  }
}