import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { DestinosService } from '../../services/destinos.service';
import { CarritoService } from '../../services/carrito.service';
import { Destino } from '../../models/destinos';
import { AuthService } from '../../services/auth.service';
import { AlertaComponent } from '../../alerta/alerta.component'; // Asegúrate que este path sea correcto
// Importar operadores y tipos necesarios de RxJS
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// Declarar bootstrap globalmente para acceder a la API de Bootstrap JS
// Asegúrate de que Bootstrap JS esté correctamente incluido en tu proyecto (por ejemplo, en angular.json)
declare var bootstrap: any;


@Component({
  selector: 'app-destinos',
  standalone: true, // Confirma que es standalone
  imports: [CommonModule, RouterModule, HttpClientModule, AlertaComponent, CurrencyPipe],
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

  constructor(
    private destinosService: DestinosService,
    private carritoService: CarritoService,
    private authService: AuthService,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getDestinos();
  }

  getDestinos(): void {
    this.destinosService.obtenerDestinos().subscribe(data => {
      this.destinosList = data;
    });
  }

  abrirModal(destino: Destino): void {
    this.destinoSeleccionado = destino;
    this.cantidadSeleccionada = 1;
    this.actualizarPrecioTotalModal();
    this.agregandoAlCarrito = false;
    // Resetear estado del botón
    // Opcional: Asegurarse que no haya backdrops o clases modal-open persistentes antes de abrir
    this.removeModalBackdrop();
    document.body.classList.remove('modal-open');
  }

  incrementarCantidad(): void {
    this.cantidadSeleccionada++;
    this.actualizarPrecioTotalModal();
  }

  decrementarCantidad(): void {
    if (this.cantidadSeleccionada > 1) {
      this.cantidadSeleccionada--;
      this.actualizarPrecioTotalModal();
    }
  }

  actualizarPrecioTotalModal(): void {
    if (this.destinoSeleccionado) {
      this.precioTotalModal = this.destinoSeleccionado.precio_Destino * this.cantidadSeleccionada;
    }
  }

  agregarAlCarrito(): void {
    if (!this.destinoSeleccionado || this.agregandoAlCarrito) return;
    // Evitar doble click

    if (this.authService.isLoggedIn()) {
      this.agregandoAlCarrito = true;
      // Deshabilitar botón
      const idDestino = this.destinoSeleccionado.id_destino;
      const cantidad = this.cantidadSeleccionada;
      const nombreDestino = this.destinoSeleccionado.nombre_Destino;
      // Guardar nombre para mensajes

      // Crear un array de Observables llamando al servicio N veces
      const llamadasAlCarrito$: Observable<any>[] = [];
      for (let i = 0; i < cantidad; i++) {
        llamadasAlCarrito$.push(
          // Llamada al servicio que solo acepta 1 argumento (id)
          this.carritoService.agregarCarrito(idDestino).pipe(
            catchError(error => {
              // Manejar error individual para que forkJoin no falle por completo
              console.error(`Error al agregar unidad ${i + 1} de ${nombreDestino}`, error);
              // Devolver un observable que emite un valor (p.ej., null o un objeto de error)
              // para indicar fallo parcial pero permitir que forkJoin continúe.
              return of({ success: false, error: error }); // O simplemente `of(null)` si no necesitas el detalle
            })

          )
        );
      }

      // Ejecutar todas las llamadas concurrentemente
      if (llamadasAlCarrito$.length > 0) {
        forkJoin(llamadasAlCarrito$).subscribe({
          next: (results) => {
            const exitosas = results.filter(res => res === null || (res && res.success !== false)).length;
            const fallidas = cantidad - exitosas;

            let alertMessage: string;
            let alertType: string;

            if (fallidas === 0) {
              alertMessage = `${nombreDestino} (x${cantidad}) agregado(s) al carrito con éxito.`;
              alertType = 'success';
            } else {
              alertMessage = `Se agregaron ${exitosas} de ${cantidad} unidades de ${nombreDestino}. Hubo ${fallidas} errores.`;
              alertType = 'warning';
            }

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
            console.error('Error inesperado en forkJoin al agregar al carrito', err); // Log de depuración
            this.mostrarAlerta(`Error general al intentar agregar ${nombreDestino}.`, 'danger');
            this.agregandoAlCarrito = false;
            // Habilitar botón
             this.cerrarModal(); // Cerrar modal en caso de error general también
          }
        });
      } else {
        console.warn("Cantidad seleccionada es 0 o inválida."); // Log de depuración
        this.agregandoAlCarrito = false; // Habilitar botón
      }

    } else {
      this.agregandoAlCarrito = false;
      // Asegurarse que se resetee si no está logueado
      this.cerrarModal(() => { // Pasar callback para navegar después de cerrar
        console.log('CALLBACK: Usuario no logueado. Navegando a inicio de sesión.'); // Log de depuración
        this.router.navigate(['/iniciar-sesion']);
      });
    }
  }

  // Modificación de la función cerrarModal para mejorar el manejo del backdrop y la clase modal-open
  cerrarModal(callback?: () => void): void {
    const modalElement = document.getElementById('destinoModal');
    if (modalElement) {
      console.log('cerrarModal: Elemento modal encontrado.'); // Log de depuración
      // Intentar obtener la instancia del modal de Bootstrap
      const modalInstance = bootstrap.Modal.getInstance(modalElement);

      if (modalInstance) {
        console.log('cerrarModal: Instancia de Bootstrap Modal encontrada.'); // Log de depuración
        // Añadir un listener para el evento 'hidden.bs.modal' que se dispara cuando el modal ha terminado de ocultarse
        modalElement.addEventListener('hidden.bs.modal', () => {
          console.log('cerrarModal: Evento hidden.bs.modal disparado. Realizando limpieza.'); // Log de depuración
          // Asegurarnos de remover la clase 'modal-open' del body para restablecer el scroll
          document.body.classList.remove('modal-open');
          // Intentar remover manualmente cualquier backdrop persistente
          this.removeModalBackdrop();
          // Ejecutar el callback si existe, después de la limpieza
          if (callback) {
            console.log('cerrarModal: Ejecutando callback del evento hidden.bs.modal.'); // Log de depuración
            callback();
          }
        }, { once: true }); // Usar { once: true } para que el listener se remueva automáticamente después de ejecutarse una vez

        console.log('cerrarModal: Ocultando modal con instancia de Bootstrap.'); // Log de depuración
        // Ocultar el modal usando la API de Bootstrap
        modalInstance.hide();

      } else {
         console.warn('cerrarModal: No se encontró instancia de Bootstrap modal para #destinoModal.'); // Log de depuración
         // Si no se encuentra la instancia (puede ocurrir en casos de cierre forzado o errores),
         // realizamos la limpieza manualmente de inmediato.
         console.log('cerrarModal: No se encontró instancia, realizando limpieza manual inmediata.'); // Log de depuración
         document.body.classList.remove('modal-open');
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
       document.body.classList.remove('modal-open');
       this.removeModalBackdrop();
       if (callback) {
          console.log('cerrarModal: Ejecutando callback inmediatamente (sin elemento modal).'); // Log de depuración
          callback();
       }
    }
  }


  // Función para intentar remover el backdrop manualmente
  // Permanece igual, ya es una buena práctica de respaldo.
  removeModalBackdrop(): void {
    // Bootstrap 5 usa la clase 'modal-backdrop' por defecto
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      console.log('removeModalBackdrop: Backdrop de modal encontrado, intentando remover.'); // Log de depuración
      backdrop.remove();
    } else {
      console.log('removeModalBackdrop: No se encontró backdrop de modal.'); // Log de depuración
    }
  }


  mostrarAlerta(mensaje: string, tipo: string): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.cdRef.detectChanges();
    // Forzar detección de cambios para que la alerta se muestre
    this.showAlert();
  }

  showAlert(): void {
    const toastElement = document.getElementById('liveToast'); 
    // Asegúrate de que el ID 'liveToast' coincida con el de tu componente de alerta.
    // También verificamos si bootstrap y bootstrap.Toast están disponibles globalmente.
    if (toastElement && typeof bootstrap !== 'undefined' && typeof bootstrap.Toast !== 'undefined') {
      try {
          console.log('showAlert: Intentando mostrar Bootstrap Toast.'); // Log de depuración
          // Obtener o crear una instancia del Toast de Bootstrap
          const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastElement);
          // Mostrar el Toast
        toastBootstrap.show();
           console.log('showAlert: Bootstrap Toast mostrado.'); // Log de depuración
      } catch (e) {
          console.error("showAlert: Error al mostrar el toast de Bootstrap:", e); // Log de depuración
          // Fallback: si hay un error con Bootstrap, limpiar la alerta después de un tiempo.
          this.limpiarAlertaDespuesDeTiempo();
      }
    } else {
      console.warn('showAlert: Elemento Toast con ID "liveToast" no encontrado o Bootstrap Toast no disponible.'); // Log de depuración
       // Si no se encuentra el elemento Toast o Bootstrap Toast no está disponible, limpiar alerta.
       this.limpiarAlertaDespuesDeTiempo();
    }
     // Independientemente de si se usó el Toast de Bootstrap (que tiene auto-hide),
     // programamos la limpieza del estado de la alerta en el componente después de un tiempo.
     // Esto asegura que la alerta desaparezca del DOM y el estado del componente se resetee.
      setTimeout(() => {
             console.log('showAlert: Timeout para limpiar estado de alerta.'); // Log de depuración
             this.limpiarAlerta();
     }, 6000); // Ajusta este tiempo si tu Toast de Bootstrap tiene una duración diferente.
  }

  limpiarAlerta(): void {
    console.log('limpiarAlerta: Limpiando estado de alerta.'); // Log de depuración
    this.mensajeAlerta = '';
        this.tipoAlerta = '';
    this.cdRef.detectChanges(); // Actualizar vista para remover la alerta
  }

  limpiarAlertaDespuesDeTiempo(tiempo: number = 5000): void {
     console.log(`limpiarAlertaDespuesDeTiempo: Programando limpieza de alerta en ${tiempo}ms.`); // Log de depuración
     setTimeout(() => {
       this.limpiarAlerta();
     }, tiempo);
  }


  trackById(index: number, destino: Destino): number {
    return destino.id_destino;
  }
}