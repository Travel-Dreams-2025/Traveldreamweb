import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { DestinosService } from '../../services/destinos.service';
import { CarritoService, MetodoPago } from '../../services/carrito.service'; // Importa MetodoPago
import { Destino } from '../../models/destinos';
import { AuthService } from '../../services/auth.service';
<<<<<<< HEAD
import { AlertaComponent } from '../../alerta/alerta.component';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators'; // Importa catchError
import { of } from 'rxjs'; // Importa 'of' para usarlo con catchError si se requiere un fallback
=======
import { AlertaComponent } from '../../alerta/alerta.component'; // Asegúrate que este path sea correcto
// Importar operadores y tipos necesarios de RxJS
import { forkJoin, Observable, of } from 'rxjs'; // forkJoin no es necesario para la nueva lógica de agregar
import { catchError, tap } from 'rxjs/operators';
>>>>>>> 05bdd6bfb9a7fb141cf4ab025c3c4e62d3c5baf3

// Declarar bootstrap globalmente para acceder a la API de Bootstrap JS
// Asegúrate de que Bootstrap JS esté correctamente incluido en tu proyecto (por ejemplo, en angular.json)
declare var bootstrap: any;


@Component({
  selector: 'app-destinos',
<<<<<<< HEAD
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    AlertaComponent,
    CurrencyPipe,
    FormsModule
  ],
=======
  standalone: true, // Confirma que es standalone
  imports: [CommonModule, RouterModule, HttpClientModule, AlertaComponent, CurrencyPipe],
>>>>>>> 05bdd6bfb9a7fb141cf4ab025c3c4e62d3c5baf3
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
  // Estado para deshabilitar botón mientras procesa

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
<<<<<<< HEAD
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
=======
>>>>>>> 05bdd6bfb9a7fb141cf4ab025c3c4e62d3c5baf3
  }

  /**
   * Obtiene la lista de destinos públicos del servicio.
   */
  getDestinos(): void {
<<<<<<< HEAD
    this.destinosService.obtenerDestinosPublicos().subscribe({
      next: (data: Destino[]) => {
        this.destinosList = data;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al obtener destinos:', err);
        this.mostrarAlerta('Error al cargar los destinos', 'danger');
      }
=======
    this.destinosService.obtenerDestinos().subscribe(data => {
      this.destinosList = data;
>>>>>>> 05bdd6bfb9a7fb141cf4ab025c3c4e62d3c5baf3
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
    this.destinoSeleccionado = destino;
    this.cantidadSeleccionada = 1;
    this.actualizarPrecioTotalModal();
    this.agregandoAlCarrito = false;
    // Resetear estado del botón
    // Limpieza preventiva al abrir el modal
    this.cleanBodyStyles();
    this.removeModalBackdrop();
  }

  /**
   * Incrementa la cantidad seleccionada de un destino.
   */
  incrementarCantidad(): void {
<<<<<<< HEAD
    if (this.destinoSeleccionado && 
        this.cantidadSeleccionada < this.destinoSeleccionado.cantidad_Disponible) {
      this.cantidadSeleccionada++;
      this.actualizarPrecioTotalModal();
    } else if (this.destinoSeleccionado) {
      this.mostrarAlerta('No hay más cupos disponibles para este destino.', 'warning');
    }
=======
    this.cantidadSeleccionada++;
    this.actualizarPrecioTotalModal();
>>>>>>> 05bdd6bfb9a7fb141cf4ab025c3c4e62d3c5baf3
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
    // Evitar doble click

<<<<<<< HEAD
    if (!this.authService.isLoggedIn()) {
      this.cerrarModal();
      this.router.navigate(['/iniciar-sesion'], {
        queryParams: { returnUrl: this.router.url }
=======
    if (this.authService.isLoggedIn()) {
      this.agregandoAlCarrito = true;
      // Deshabilitar botón
      const idDestino = this.destinoSeleccionado.id_destino;
      const cantidad = this.cantidadSeleccionada;
      const nombreDestino = this.destinoSeleccionado.nombre_Destino;
      // Guardar nombre para mensajes

      // Determinar la fecha de salida. Como no hay un campo de entrada en este modal para la fecha,
      // usaremos la fecha actual. Puedes ajustar esto si necesitas que el usuario la seleccione.
      const fechaSalida = new Date().toISOString().split('T')[0]; // Formato 'YYYY-MM-DD'

      // Realizar una única llamada al servicio con la cantidad y la fecha de salida
      this.carritoService.agregarCarrito(idDestino, cantidad, fechaSalida).subscribe({
        next: (response) => {
          console.log('Destino agregado al carrito:', response);
          let alertMessage = `${nombreDestino} (x${cantidad}) agregado(s) al carrito con éxito.`;
          let alertType = 'success';

          console.log('INTENTO: Cerrar modal y mostrar alerta.'); // Log de depuración
          // Pasamos el mensaje y tipo de alerta al callback para mostrarla después de cerrar el modal
          this.cerrarModal(() => {
            console.log('CALLBACK: Modal cerrado. Procediendo a mostrar alerta.'); // Log de depuración
            // Añadimos un pequeño timeout para dar tiempo al backdrop a desaparecer completamente.
            setTimeout(() => {
              console.log('TIMEOUT: Mostrando alerta.'); // Log de depuración
              this.mostrarAlerta(alertMessage, alertType);
            }, 100); // 100 ms de retraso, ajusta si es necesario
          });

          this.agregandoAlCarrito = false; // Habilitar botón
        },
        error: (err) => {
          console.error('Error al intentar agregar al carrito', err); // Log de depuración
          this.mostrarAlerta(`Error al agregar ${nombreDestino} al carrito.`, 'danger');
          this.agregandoAlCarrito = false;
          // Habilitar botón
          this.cerrarModal(); // Cerrar modal en caso de error
        }
      });

    } else {
      this.agregandoAlCarrito = false;
      // Asegurarse que se resetee si no está logueado
      this.cerrarModal(() => { // Pasar callback para navegar después de cerrar
        console.log('CALLBACK: Usuario no logueado. Navegando a inicio de sesión.'); // Log de depuración
        this.router.navigate(['/iniciar-sesion']);
>>>>>>> 05bdd6bfb9a7fb141cf4ab025c3c4e62d3c5baf3
      });
    }
  }

<<<<<<< HEAD
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
=======
  // Modificación de la función cerrarModal para asegurar la eliminación de estilos de scroll
  cerrarModal(callback?: () => void): void {
    const modalElement = document.getElementById('destinoModal');
    if (modalElement) {
      console.log('cerrarModal: Elemento modal encontrado.'); // Log de depuración
      const modalInstance = bootstrap.Modal.getInstance(modalElement);

      if (modalInstance) {
        console.log('cerrarModal: Instancia de Bootstrap Modal encontrada.'); // Log de depuración
        // Añadir un listener para el evento 'hidden.bs.modal'
        modalElement.addEventListener('hidden.bs.modal', () => {
          console.log('cerrarModal: Evento hidden.bs.modal disparado. Realizando limpieza.'); // Log de depuración
          // Asegurarnos de remover la clase 'modal-open' y limpiar estilos de overflow del body
          this.cleanBodyStyles();
          // Intentar remover manualmente cualquier backdrop persistente
          this.removeModalBackdrop();
          // Ejecutar el callback si existe
          if (callback) {
            console.log('cerrarModal: Ejecutando callback del evento hidden.bs.modal.'); // Log de depuración
            callback();
          }
        }, { once: true }); // Usar { once: true } para que el listener se remueva automáticamente

        console.log('cerrarModal: Ocultando modal con instancia de Bootstrap.'); // Log de depuración
        modalInstance.hide();

      } else {
          console.warn('cerrarModal: No se encontró instancia de Bootstrap modal para #destinoModal.'); // Log de depuración
          // Si no se encuentra la instancia, realizamos la limpieza manual de inmediato.
          console.log('cerrarModal: No se encontró instancia, realizando limpieza manual inmediata.'); // Log de depuración
          this.cleanBodyStyles();
          this.removeModalBackdrop();
          if (callback) {
            console.log('cerrarModal: Ejecutando callback inmediatamente (sin instancia).'); // Log de depuración
            callback();
          }
      }
    } else {
        console.warn('cerrarModal: Elemento modal con ID #destinoModal no encontrado.'); // Log de depuración
        // Si el elemento modal no se encuentra, también limpiamos por si acaso.
        console.log('cerrarModal: Elemento modal no encontrado, realizando limpieza manual inmediata.'); // Log de depuración
        this.cleanBodyStyles();
        this.removeModalBackdrop();
        if (callback) {
            console.log('cerrarModal: Ejecutando callback inmediatamente (sin elemento modal).'); // Log de depuración
            callback();
        }
    }
  }

  // Nueva función para limpiar la clase modal-open y el estilo overflow del body
  private cleanBodyStyles(): void {
    document.body.classList.remove('modal-open');
    // Eliminar específicamente el estilo overflow si fue aplicado directamente (Bootstrap lo hace)
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = ''; // Restablecer al valor por defecto
    }
      // Opcional: también resetear padding-right que Bootstrap usa para compensar la scrollbar
    if (document.body.style.paddingRight !== '') {
        document.body.style.paddingRight = '';
    }
      console.log('cleanBodyStyles: Clase modal-open y estilo overflow del body limpiados.'); // Log de depuración
  }


  // Función para intentar remover el backdrop manualmente
  removeModalBackdrop(): void {
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      console.log('removeModalBackdrop: Backdrop de modal encontrado, intentando remover.'); // Log de depuración
      backdrop.remove();
    } else {
      console.log('removeModalBackdrop: No se encontró backdrop de modal.'); // Log de depuración
    }
  }


>>>>>>> 05bdd6bfb9a7fb141cf4ab025c3c4e62d3c5baf3
  mostrarAlerta(mensaje: string, tipo: string): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.cdRef.detectChanges();
    this.showAlert();
  }

<<<<<<< HEAD
  /**
   * Función de seguimiento para el rendimiento de la lista de destinos.
   * @param index El índice del elemento.
   * @param destino El objeto destino.
   * @returns El ID del destino.
   */
=======
  showAlert(): void {
    const toastElement = document.getElementById('liveToast');
    if (toastElement && typeof bootstrap !== 'undefined' && typeof bootstrap.Toast !== 'undefined') {
      try {
          console.log('showAlert: Intentando mostrar Bootstrap Toast.'); // Log de depuración
          const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastElement);
          toastBootstrap.show();
          console.log('showAlert: Bootstrap Toast mostrado.'); // Log de depuración
      } catch (e) {
          console.error("showAlert: Error al mostrar el toast de Bootstrap:", e); // Log de depuración
          this.limpiarAlertaDespuesDeTiempo();
      }
    } else {
      console.warn('showAlert: Elemento Toast con ID "liveToast" no encontrado o Bootstrap Toast no disponible.'); // Log de depuración
        this.limpiarAlertaDespuesDeTiempo();
    }
      setTimeout(() => {
              console.log('showAlert: Timeout para limpiar estado de alerta.'); // Log de depuración
              this.limpiarAlerta();
      }, 6000);
  }

  limpiarAlerta(): void {
    console.log('limpiarAlerta: Limpiando estado de alerta.'); // Log de depuración
    this.mensajeAlerta = '';
        this.tipoAlerta = '';
    this.cdRef.detectChanges();
  }

  limpiarAlertaDespuesDeTiempo(tiempo: number = 5000): void {
      console.log(`limpiarAlertaDespuesDeTiempo: Programando limpieza de alerta en ${tiempo}ms.`); // Log de depuración
      setTimeout(() => {
        this.limpiarAlerta();
      }, tiempo);
  }


>>>>>>> 05bdd6bfb9a7fb141cf4ab025c3c4e62d3c5baf3
  trackById(index: number, destino: Destino): number {
    return destino.id_destino;
  }
}