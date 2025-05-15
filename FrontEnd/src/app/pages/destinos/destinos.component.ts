import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { DestinosService } from '../../services/destinos.service';
import { CarritoService } from '../../services/carrito.service';
import { Destino } from '../../models/destinos';
import { AuthService } from '../../services/auth.service';
import { AlertaComponent } from '../../alerta/alerta.component';
import { FormsModule } from '@angular/forms';


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
  }

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

  getDestinos(): void {
    this.destinosService.obtenerDestinosPublicos().subscribe({
      next: (data: Destino[]) => {
        this.destinosList = data;
      },
      error: (err) => {
        console.error('Error al obtener destinos:', err);
        this.mostrarAlerta('Error al cargar los destinos', 'danger');
      }
    });
  }

  abrirModal(destino: Destino): void {
    if (destino.mostrarSoldOut) return;
    
    this.destinoSeleccionado = destino;
    this.cantidadSeleccionada = 1;
    this.actualizarPrecioTotalModal();
    
    if (this.modal) {
      this.modal.show();
    }
  }

  incrementarCantidad(): void {
    if (this.destinoSeleccionado && 
        this.cantidadSeleccionada < this.destinoSeleccionado.cantidad_Disponible) {
      this.cantidadSeleccionada++;
      this.actualizarPrecioTotalModal();
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

    // Si el usuario no está logueado, redirigir a login
    if (!this.authService.isLoggedIn()) {
      this.cerrarModal();
      this.router.navigate(['/iniciar-sesion'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.agregandoAlCarrito = true;
    const idDestino = this.destinoSeleccionado.id_destino;
    const cantidad = this.cantidadSeleccionada;
    const nombreDestino = this.destinoSeleccionado.nombre_Destino;
    const fechaSalida = new Date(this.destinoSeleccionado.fecha_salida).toISOString().split('T')[0];

    this.carritoService.agregarCarrito(idDestino, cantidad, fechaSalida).subscribe({
      next: (response) => {
        this.mostrarAlerta(`${nombreDestino} (x${cantidad}) agregado al carrito`, 'success');
        this.cerrarModal();
        this.agregandoAlCarrito = false;
      },
      error: (err) => {
        console.error('Error al agregar al carrito:', err);
        this.mostrarAlerta(`Error al agregar ${nombreDestino} al carrito`, 'danger');
        this.agregandoAlCarrito = false;
      }
    });
  }

  cerrarModal(): void {
    if (this.modal) {
      this.modal.hide();
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