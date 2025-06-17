import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // Mantener FormsModule para [(ngModel)]
import { DestinosService } from '../../services/destinos.service';
import { CarritoService, MetodoPago } from '../../services/carrito.service';
import { Destino } from '../../models/destinos';
import { AuthService } from '../../services/auth.service';
import { AlertaComponent } from '../../alerta/alerta.component';
import { Observable, of } from 'rxjs'; // Necesario para 'of' y 'Observable'
import { catchError, tap } from 'rxjs/operators'; // Necesario para operadores de RxJS

// Declarar bootstrap globalmente para acceder a la API de Bootstrap JS
// Asegúrate de que Bootstrap JS esté correctamente incluido en tu proyecto (ejemplo: en angular.json)
declare var bootstrap: any;

@Component({
  selector: 'app-destinos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    FormsModule, // Importar FormsModule
    AlertaComponent,
    CurrencyPipe
  ],
  templateUrl: './destinos.component.html',
  styleUrls: ['./destinos.component.css']
})
export class DestinosComponent implements OnInit {
  destinosList: Destino[] = [];
  titulo: string = "Nuestros Destinos";
  tipoAlerta: string = '';
  mensajeAlerta: string = '';
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
    private cdRef: ChangeDetectorRef // Para forzar detección de cambios en alertas
  ) {}

  ngOnInit(): void {
    this.getDestinos();
    this.inicializarModal(); // Inicializar el modal al inicio
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
        this.cleanBodyStyles(); // Limpiar estilos del body al cerrar
        this.removeModalBackdrop(); // Remover backdrop al cerrar
      });
    }
  }

  /**
   * Obtiene la lista de destinos públicos del servicio.
   */
  getDestinos(): void {
    this.destinosService.obtenerDestinos().subscribe({ // Asumo obtenerDestinosPublicos es el método correcto
      next: (data: Destino[]) => {
        this.destinosList = data;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al obtener destinos:', err);
        this.mostrarAlerta('Error al cargar los destinos. Intenta recargar la página.', 'danger');
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
    this.cleanBodyStyles(); // Limpieza preventiva al abrir el modal (en caso de que estuviera mal cerrado)
    this.removeModalBackdrop(); // Remoción preventiva de backdrop
    if (this.modal) {
      this.modal.show(); // Mostrar el modal
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

    // Verificar autenticación
    if (!this.authService.isLoggedIn()) {
      this.cerrarModal(); // Cerrar el modal antes de redirigir
      this.router.navigate(['/iniciar-sesion'], {
        queryParams: { returnUrl: this.router.url } // Redirigir al usuario de vuelta a esta página
      });
      return; // Detener la ejecución
    }

    // Validación para el método de pago antes de enviar al carrito
    if (this.metodoPagoSeleccionado === null) {
      console.error('Error: No se ha cargado un método de pago predeterminado.');
      this.mostrarAlerta('No se pudo determinar un método de pago. Intenta recargar la página o contacta al soporte.', 'error');
      return;
    }

    this.agregandoAlCarrito = true; // Deshabilitar el botón

    const idDestino = this.destinoSeleccionado.id_destino;
    const cantidad = this.cantidadSeleccionada;
    const nombreDestino = this.destinoSeleccionado.nombre_Destino;
    // Asumiendo que `fecha_salida` se toma del destino seleccionado, no de `new Date()`
    const fechaSalida = new Date(this.destinoSeleccionado.fecha_salida).toISOString().split('T')[0];

    // Usar el método addItemCarrito con el objeto completo
    this.carritoService.addItemCarrito({
      id_destino: idDestino,
      cantidad: cantidad,
      fecha_salida: fechaSalida,
      id_metodoPago: this.metodoPagoSeleccionado
    }).subscribe({
      next: (response: any) => {
        this.mostrarAlerta(`${nombreDestino} (x${cantidad}) agregado al carrito con éxito.`, 'success');
        this.cerrarModal(); // Cerrar el modal
        this.agregandoAlCarrito = false; // Habilitar el botón
      },
      error: (err: HttpErrorResponse | any) => {
        console.error('Error al agregar al carrito:', err);
        const errorMessage = err.error?.error || err.message || 'Hubo un error al agregar el destino al carrito.';
        this.mostrarAlerta(`Error al agregar ${nombreDestino} al carrito: ${errorMessage}`, 'danger');
        this.agregandoAlCarrito = false; // Habilitar el botón
      }
    });
  }

  /**
   * Cierra el modal de detalle del destino.
   * Se modificó para usar la instancia de Bootstrap y asegurar la limpieza.
   */
  cerrarModal(): void {
    if (this.modal) {
      this.modal.hide();
      // El listener 'hidden.bs.modal' en inicializarModal() se encargará de la limpieza
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
   * Muestra una alerta en la interfaz de usuario utilizando el componente AlertaComponent.
   * @param mensaje El mensaje a mostrar.
   * @param tipo El tipo de alerta (ej. 'success', 'danger', 'warning', 'info', 'error').
   */
  mostrarAlerta(mensaje: string, tipo: string): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.cdRef.detectChanges(); // Forzar la detección de cambios para que la alerta se muestre inmediatamente
    this.showAlert(); // Mostrar el toast de Bootstrap
  }

  /**
   * Muestra el toast de Bootstrap.
   */
  showAlert(): void {
    const toastElement = document.getElementById('liveToast');
    if (toastElement && typeof bootstrap !== 'undefined' && typeof bootstrap.Toast !== 'undefined') {
      try {
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastElement);
        toastBootstrap.show();
      } catch (e) {
        console.error("Error al mostrar el toast de Bootstrap:", e);
        // Si hay un error, limpiar la alerta de forma manual
        this.limpiarAlertaDespuesDeTiempo();
      }
    } else {
      console.warn('Elemento Toast con ID "liveToast" no encontrado o Bootstrap Toast no disponible.');
      // Si no se puede usar Bootstrap Toast, limpiar la alerta después de un tiempo
      this.limpiarAlertaDespuesDeTiempo();
    }
    // Asegurarse de que la alerta se oculte después de un tiempo, incluso si el toast de Bootstrap falla
    setTimeout(() => {
      this.limpiarAlerta();
    }, 6000); // Duración del toast + un pequeño margen
  }

  /**
   * Limpia el mensaje y tipo de alerta.
   */
  limpiarAlerta(): void {
    this.mensajeAlerta = '';
    this.tipoAlerta = '';
    this.cdRef.detectChanges(); // Forzar la detección de cambios para ocultar la alerta
  }

  /**
   * Limpia la alerta después de un tiempo especificado.
   * @param tiempo El tiempo en milisegundos para limpiar la alerta (por defecto 5000ms).
   */
  limpiarAlertaDespuesDeTiempo(tiempo: number = 5000): void {
    setTimeout(() => {
      this.limpiarAlerta();
    }, tiempo);
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