import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DestinosService } from '../../services/destinos.service';
import { CarritoService, MetodoPago } from '../../services/carrito.service';
import { Destino } from '../../models/destinos';
import { AuthService } from '../../services/auth.service';
import { AlertaComponent } from '../../alerta/alerta.component';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

declare var bootstrap: any;

@Component({
  selector: 'app-destinos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
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
  private modal: any;

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
    this.loadMetodosPago();
  }

  private verificarDisponibilidad(destinos: Destino[]): Destino[] {
    return destinos.map(destino => {
      return {
        ...destino,
        mostrarSoldOut: destino.cantidad_Disponible <= 0
      };
    });
  }

  getDestinos(): void {
    this.destinosService.obtenerDestinos().subscribe({
      next: (data: Destino[]) => {
        this.destinosList = this.verificarDisponibilidad(data);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al obtener destinos:', err);
        this.mostrarAlerta('Error al cargar los destinos. Intenta recargar la página.', 'danger');
      }
    });
  }

  loadMetodosPago(): void {
    this.carritoService.getMetodosPago().pipe(
      catchError(error => {
        console.error('Error al cargar métodos de pago:', error);
        this.mostrarAlerta('No se pudieron cargar los métodos de pago. El carrito podría no funcionar correctamente.', 'error');
        return of([]);
      })
    ).subscribe({
      next: (metodos: MetodoPago[]) => {
        this.metodosPago = metodos;
        if (this.metodosPago.length > 0) {
          this.metodoPagoSeleccionado = this.metodosPago[0].id_metodoPago;
        }
      }
    });
  }

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

  abrirModal(destino: Destino): void {
    if (destino.mostrarSoldOut) return;
    
    this.destinoSeleccionado = destino;
    this.cantidadSeleccionada = 1;
    this.actualizarPrecioTotalModal();
    this.agregandoAlCarrito = false;
    
    if (this.modal) {
      this.modal.show();
    }
  }

  incrementarCantidad(): void {
    if (this.destinoSeleccionado && 
        this.cantidadSeleccionada < this.destinoSeleccionado.cantidad_Disponible) {
      this.cantidadSeleccionada++;
      this.actualizarPrecioTotalModal();
    } else {
      this.mostrarAlerta('No hay más cupos disponibles para este destino.', 'warning');
    }
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

    if (!this.authService.isLoggedIn()) {
      this.cerrarModal();
      this.router.navigate(['/iniciar-sesion'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    if (this.metodoPagoSeleccionado === null) {
      this.mostrarAlerta('No se pudo determinar un método de pago. Intenta recargar la página.', 'error');
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
        this.mostrarAlerta(`Error al agregar ${nombreDestino} al carrito: ${errorMessage}`, 'danger');
        this.agregandoAlCarrito = false;
      }
    });
  }

  cerrarModal(): void {
    if (this.modal) {
      this.modal.hide();
    } else {
      this.cleanBodyStyles();
      this.removeModalBackdrop();
    }
  }

  private cleanBodyStyles(): void {
    document.body.classList.remove('modal-open');
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
    }
    if (document.body.style.paddingRight !== '') {
      document.body.style.paddingRight = '';
    }
  }

  private removeModalBackdrop(): void {
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

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

  trackById(index: number, destino: Destino): number {
    return destino.id_destino;
  }
}