import { Component, OnInit } from '@angular/core'; // Ya no se necesita ChangeDetectorRef
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DestinosService } from '../../services/destinos.service';
import { CarritoService, MetodoPago } from '../../services/carrito.service';
import { Destino } from '../../models/destinos';
import { AuthService } from '../../services/auth.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators'; // 'tap' no se está usando aquí, se puede eliminar si no se usa en otra parte
import { MessageService } from '../../services/message.service'; // Importa tu servicio de mensajes

// NOTA: 'declare var bootstrap: any;' SOLO es necesario si interactúas directamente
// con componentes de Bootstrap JS (como 'new bootstrap.Modal()').
// Si solo usas el modal, puedes mantenerla. Si no, se puede eliminar.
declare var bootstrap: any;


@Component({
  selector: 'app-destinos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
    CurrencyPipe
  ],
  templateUrl: './destinos.component.html',
  styleUrls: ['./destinos.component.css']
})
export class DestinosComponent implements OnInit {
  destinosList: Destino[] = [];
  titulo: string = "Nuestros Destinos";
  // Eliminadas: tipoAlerta: string = ''; mensajeAlerta: string = '';
  destinoSeleccionado: Destino | null = null;
  cantidadSeleccionada: number = 1;
  precioTotalModal: number = 0;
  agregandoAlCarrito: boolean = false;

  metodosPago: MetodoPago[] = [];
  metodoPagoSeleccionado: number | null = null;

  private modal: any; // Para almacenar la instancia del modal de Bootstrap

  constructor(
    private destinosService: DestinosService,
    private carritoService: CarritoService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService // Inyecta el MessageService
  ) {}

  ngOnInit(): void {
    this.getDestinos();
    this.inicializarModal();
    this.loadMetodosPago();
  }

  /**
   * Inicializa el modal de Bootstrap.
   */
  inicializarModal(): void {
    const modalElement = document.getElementById('destinoModal');
    if (modalElement) {
      this.modal = new bootstrap.Modal(modalElement);

      modalElement.addEventListener('hidden.bs.modal', () => {
        this.destinoSeleccionado = null;
        this.cleanBodyStyles();
        this.removeModalBackdrop();
      });
    }
  }

  /**
   * Obtiene la lista de destinos públicos del servicio.
   */
  getDestinos(): void {
    this.destinosService.obtenerDestinos().subscribe({
      next: (data: Destino[]) => {
        this.destinosList = data;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al obtener destinos:', err);
        // Usar 'error' en lugar de 'danger' para el tipo de alerta
        this.mostrarAlerta('Error al cargar los destinos. Intenta recargar la página.', 'error');
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
        return of([]);
      })
    ).subscribe({
      next: (metodos: MetodoPago[]) => {
        this.metodosPago = metodos;
        if (this.metodosPago.length > 0) {
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
    this.destinoSeleccionado = destino;
    this.cantidadSeleccionada = 1;
    this.actualizarPrecioTotalModal();
    this.agregandoAlCarrito = false;
    this.cleanBodyStyles();
    this.removeModalBackdrop();
    if (this.modal) {
      this.modal.show();
    }
  }

  /**
   * Incrementa la cantidad seleccionada de un destino.
   */
  incrementarCantidad(): void {
    if (this.destinoSeleccionado) {
      if (this.cantidadSeleccionada < this.destinoSeleccionado.cantidad_Disponible) {
        this.cantidadSeleccionada++;
        this.actualizarPrecioTotalModal();
      } else {
        this.mostrarAlerta('No hay más cupos disponibles para este destino.', 'warning');
      }
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
      id_metodoPago: this.metodoPagoSeleccionado
    }).subscribe({
      next: (response: any) => {
        this.mostrarAlerta(`${nombreDestino} (x${cantidad}) agregado al carrito con éxito.`, 'success');
        this.cerrarModal();
        this.agregandoAlCarrito = false;
      },
      error: (err: HttpErrorResponse | any) => {
        console.error('Error al agregar al carrito:', err);
        const errorMessage = err.error?.error || err.message || 'Hubo un error al agregar el destino al carrito.';
        // Usar 'error' en lugar de 'danger' para el tipo de alerta
        this.mostrarAlerta(`Error al agregar ${nombreDestino} al carrito: ${errorMessage}`, 'error');
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
    } else {
      console.warn('cerrarModal: No se encontró instancia de Bootstrap modal para #destinoModal. Limpiando manualmente.');
      this.cleanBodyStyles();
      this.removeModalBackdrop();
    }
  }

  /**
   * Nueva función para limpiar la clase modal-open y el estilo overflow del body
   */
  private cleanBodyStyles(): void {
    document.body.classList.remove('modal-open');
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
    }
    if (document.body.style.paddingRight !== '') {
      document.body.style.paddingRight = '';
    }
  }

  /**
   * Función para intentar remover el backdrop manualmente si persiste.
   */
  removeModalBackdrop(): void {
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

  /**
   * Muestra una alerta en la interfaz de usuario utilizando el MessageService global.
   * @param mensaje El mensaje a mostrar.
   * @param tipo El tipo de alerta (ej. 'success', 'error', 'warning', 'info').
   */
  mostrarAlerta(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info'): void {
    this.messageService.mostrarAlerta(mensaje, tipo);
    // Ya no necesitas manipular directamente el toast aquí.
    // Toda la lógica de mostrar/ocultar el toast y el setTimeout está en MessageDisplayComponent.
  }

  // Eliminados: showAlert(), limpiarAlerta(), limpiarAlertaDespuesDeTiempo()

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