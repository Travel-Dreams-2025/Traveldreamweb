import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { DestinosService } from '../../services/destinos.service';
import { CarritoService, MetodoPago } from '../../services/carrito.service'; // Importa MetodoPago
import { Destino } from '../../models/destinos';
import { AuthService } from '../../services/auth.service';
import { AlertaComponent } from '../../alerta/alerta.component';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators'; // Importa catchError
import { of } from 'rxjs'; // Importa 'of' para usarlo con catchError si se requiere un fallback

declare var bootstrap: any;

@Component({
  selector: 'app-destinos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    AlertaComponent,
    CurrencyPipe,
    FormsModule
  ],
  templateUrl: './destinos.component.html',
  styleUrls: ['./destinos.component.css']
})
export class DestinosComponent implements OnInit {
  destinosList: Destino[] = [];
  destinoSeleccionado: Destino | null = null;
  cantidadSeleccionada: number = 1;
  precioTotalModal: number = 0;
  agregandoAlCarrito: boolean = false;
  modal: any;
  mensajeAlerta: string = '';
  tipoAlerta: string = '';

  metodosPago: MetodoPago[] = []; // Nueva propiedad para los métodos de pago
  metodoPagoSeleccionado: number | null = null; // Nueva propiedad para el ID del método de pago seleccionado

  constructor(
    private destinosService: DestinosService,
    private carritoService: CarritoService,
    private authService: AuthService,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getDestinos();
    this.inicializarModal();
    this.loadMetodosPago(); // Carga los métodos de pago al iniciar el componente
  }

  /**
   * Inicializa el modal de Bootstrap.
   */
  inicializarModal(): void {
    const modalElement = document.getElementById('destinoModal');
    if (modalElement) {
      this.modal = new bootstrap.Modal(modalElement);
      
      // Manejar evento cuando el modal se cierra
      modalElement.addEventListener('hidden.bs.modal', () => {
        this.destinoSeleccionado = null;
      });
    }
  }

  /**
   * Obtiene la lista de destinos públicos del servicio.
   */
  getDestinos(): void {
    this.destinosService.obtenerDestinosPublicos().subscribe({
      next: (data: Destino[]) => {
        this.destinosList = data;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al obtener destinos:', err);
        this.mostrarAlerta('Error al cargar los destinos', 'danger');
      }
    });
  }

  /**
   * Carga los métodos de pago disponibles y selecciona el primero por defecto.
   */
  loadMetodosPago(): void {
    this.carritoService.getMetodosPago().pipe(
      catchError(error => {
        console.error('Error al cargar métodos de pago en DestinosComponent:', error);
        this.mostrarAlerta('No se pudieron cargar los métodos de pago. El carrito podría no funcionar correctamente.', 'error');
        return of([]); // Retorna un observable vacío para que la suscripción no falle
      })
    ).subscribe({
      next: (metodos: MetodoPago[]) => {
        this.metodosPago = metodos;
        if (this.metodosPago.length > 0) {
          // Selecciona el primer método de pago disponible por defecto
          this.metodoPagoSeleccionado = this.metodosPago[0].id_metodoPago;
          console.log('Método de pago seleccionado automáticamente:', this.metodoPagoSeleccionado);
        } else {
          console.warn('No se encontraron métodos de pago. Asegúrate de que existan en tu backend.');
          this.mostrarAlerta('No hay métodos de pago disponibles. Por favor, contacta al soporte.', 'warning');
        }
      }
    });
  }

  /**
   * Abre el modal de detalle del destino.
   * @param destino El destino a mostrar en el modal.
   */
  abrirModal(destino: Destino): void {
    if (destino.mostrarSoldOut) return;
    
    this.destinoSeleccionado = destino;
    this.cantidadSeleccionada = 1;
    this.actualizarPrecioTotalModal();
    
    if (this.modal) {
      this.modal.show();
    }
  }

  /**
   * Incrementa la cantidad seleccionada de un destino.
   */
  incrementarCantidad(): void {
    if (this.destinoSeleccionado && 
        this.cantidadSeleccionada < this.destinoSeleccionado.cantidad_Disponible) {
      this.cantidadSeleccionada++;
      this.actualizarPrecioTotalModal();
    } else if (this.destinoSeleccionado) {
      this.mostrarAlerta('No hay más cupos disponibles para este destino.', 'warning');
    }
  }

  /**
   * Decrementa la cantidad seleccionada de un destino.
   */
  decrementarCantidad(): void {
    if (this.cantidadSeleccionada > 1) {
      this.cantidadSeleccionada--;
      this.actualizarPrecioTotalModal();
    }
  }

  /**
   * Actualiza el precio total mostrado en el modal.
   */
  actualizarPrecioTotalModal(): void {
    if (this.destinoSeleccionado) {
      this.precioTotalModal = this.destinoSeleccionado.precio_Destino * this.cantidadSeleccionada;
    } else {
      this.precioTotalModal = 0;
    }
  }

  /**
   * Agrega el destino seleccionado al carrito de compras.
   */
  agregarAlCarrito(): void {
    if (!this.destinoSeleccionado || this.agregandoAlCarrito) return;

    if (!this.authService.isLoggedIn()) {
      this.cerrarModal();
      this.router.navigate(['/iniciar-sesion'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    // Validación para el método de pago antes de enviar al carrito
    if (this.metodoPagoSeleccionado === null) {
      console.error('Error: No se ha cargado un método de pago predeterminado.');
      this.mostrarAlerta('No se pudo determinar un método de pago. Intenta recargar la página o contacta al soporte.', 'error');
      return;
    }

    this.agregandoAlCarrito = true;
    const idDestino = this.destinoSeleccionado.id_destino;
    const cantidad = this.cantidadSeleccionada;
    const nombreDestino = this.destinoSeleccionado.nombre_Destino;
    const fechaSalida = new Date(this.destinoSeleccionado.fecha_salida).toISOString().split('T')[0];

    this.carritoService.addItemCarrito({
      id_destino: idDestino,
      cantidad: cantidad,
      fecha_salida: fechaSalida,
      id_metodoPago: this.metodoPagoSeleccionado // ¡AHORA SE INCLUYE EL ID DEL MÉTODO DE PAGO!
    }).subscribe({
      next: (response: any) => {
        this.mostrarAlerta(`${nombreDestino} (x${cantidad}) agregado al carrito`, 'success');
        this.cerrarModal();
        this.agregandoAlCarrito = false;
      },
      error: (err: HttpErrorResponse | any) => {
        console.error('Error al agregar al carrito:', err);
        const errorMessage = err.error?.error || err.message || 'Hubo un error al agregar el destino al carrito.';
        this.mostrarAlerta(`Error al agregar ${nombreDestino} al carrito: ${errorMessage}`, 'danger');
        this.agregandoAlCarrito = false;
      }
    });
  }

  /**
   * Cierra el modal de detalle del destino.
   */
  cerrarModal(): void {
    if (this.modal) {
      this.modal.hide();
    }
  }

  /**
   * Muestra una alerta en la interfaz de usuario.
   * @param mensaje El mensaje a mostrar.
   * @param tipo El tipo de alerta (ej. 'success', 'danger').
   */
  mostrarAlerta(mensaje: string, tipo: string): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.cdRef.detectChanges();
    
    const toastElement = document.getElementById('liveToast');
    if (toastElement) {
      const toast = new bootstrap.Toast(toastElement);
      toast.show();
    }
  }

  /**
   * Función de seguimiento para el rendimiento de la lista de destinos.
   * @param index El índice del elemento.
   * @param destino El objeto destino.
   * @returns El ID del destino.
   */
  trackById(index: number, destino: Destino): number {
    return destino.id_destino;
  }
}