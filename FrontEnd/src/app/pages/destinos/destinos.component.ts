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

@Component({
  selector: 'app-destinos',
  standalone: true,
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

  cerrarModal(callback?: () => void): void {
    const modalElement = document.getElementById('destinoModal');
    if (modalElement) {
      console.log('cerrarModal: Elemento modal encontrado.'); // Log de depuración
      const modalInstance = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        console.log('cerrarModal: Instancia de Bootstrap Modal encontrada. Ocultando modal.'); // Log de depuración

        const handleHidden = () => {
          console.log('cerrarModal: Evento hidden.bs.modal disparado.'); // Log de depuración
          if (callback) {
            console.log('cerrarModal: Ejecutando callback del evento hidden.bs.modal.'); // Log de depuración
            callback();
          }
          // Limpiar listener después de ejecutar
          modalElement.removeEventListener('hidden.bs.modal', handleHidden);
           // Opcional: Intentar remover manualmente el backdrop si persiste
           this.removeModalBackdrop();
        };

        // Limpiar cualquier listener anterior para evitar duplicados
        modalElement.removeEventListener('hidden.bs.modal', handleHidden); // Asegurar limpieza previa
        modalElement.addEventListener('hidden.bs.modal', handleHidden);

        modalInstance.hide();

      } else {
         console.warn('cerrarModal: No se encontró instancia de Bootstrap modal para #destinoModal. Posiblemente ya cerrado o error.'); // Log de depuración
         // Si no hay instancia (raro), intentar ejecutar callback inmediatamente
         if (callback) {
            console.log('cerrarModal: Ejecutando callback inmediatamente (sin instancia).'); // Log de depuración
            callback();
         }
         // Intentar remover manualmente el backdrop si existe
         this.removeModalBackdrop();
      }
    } else {
       console.warn('cerrarModal: Elemento modal con ID #destinoModal no encontrado.'); // Log de depuración
       // Si no hay elemento modal, ejecutar callback
       if (callback) {
          console.log('cerrarModal: Ejecutando callback inmediatamente (sin elemento modal).'); // Log de depuración
          callback();
       }
        // Intentar remover manualmente el backdrop si existe
       this.removeModalBackdrop();
    }
  }

  // Nueva función para intentar remover el backdrop manualmente
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
    // Forzar detección de cambios
    this.showAlert();
  }

  showAlert(): void {
    const toastElement = document.getElementById('liveToast'); 
    // Ajusta si tu ID es diferente
    if (toastElement && (window as any).bootstrap && (window as any).bootstrap.Toast) {
      try {
          console.log('showAlert: Intentando mostrar Bootstrap Toast.'); // Log de depuración
          const toastBootstrap = (window as any).bootstrap.Toast.getOrCreateInstance(toastElement);
        toastBootstrap.show();
           console.log('showAlert: Bootstrap Toast mostrado.'); // Log de depuración
      } catch (e) {
          console.error("showAlert: Error al mostrar el toast de Bootstrap:", e); // Log de depuración
          // Fallback si Bootstrap no está listo o falla
          this.limpiarAlertaDespuesDeTiempo();
      }
    } else {
      console.warn('showAlert: Elemento Toast con ID "liveToast" no encontrado o Bootstrap Toast no disponible.'); // Log de depuración
       this.limpiarAlertaDespuesDeTiempo(); // Asegura que se limpie igual
    }
     // Limpiar mensaje después de un tiempo
     // Nota: Bootstrap Toast tiene auto-hide, pero limpiamos el estado del componente igual
     // Se movió a una función separada para reutilizarla en el catch
    if (!toastElement) { // Solo iniciar timeout si no se usó el toast (que tiene su propio hide)
        console.log('showAlert: No se encontró elemento Toast, limpiando alerta con timeout.'); // Log de depuración
        this.limpiarAlertaDespuesDeTiempo();
    } else {
        // Si se usó el toast, podemos confiar en su 'hidden.bs.toast' o simplemente limpiar tras un tiempo mayor
      setTimeout(() => {
             console.log('showAlert: Timeout para limpiar estado de alerta.'); // Log de depuración
             this.limpiarAlerta();
         }, 6000); // Un poco más que el timeout típico del toast
    }
  }

  limpiarAlerta(): void {
    console.log('limpiarAlerta: Limpiando estado de alerta.'); // Log de depuración
    this.mensajeAlerta = '';
        this.tipoAlerta = '';
    this.cdRef.detectChanges(); // Actualizar vista
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