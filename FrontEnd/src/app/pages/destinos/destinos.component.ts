import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { DestinosService } from '../../services/destinos.service';
import { CarritoService } from '../../services/carrito.service';
import { Destino } from '../../models/destinos';
import { AuthService } from '../../services/auth.service';
import { AlertaComponent } from '../../alerta/alerta.component';

@Component({
  selector: 'app-destinos',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, AlertaComponent], 
  templateUrl: './destinos.component.html',
  styleUrls: ['./destinos.component.css']
})
export class DestinosComponent implements OnInit {
  destinosList: Destino[] = [];
  titulo: string = "Nuestros Destinos";
  tipoAlerta: string = '';
  mensajeAlerta: string = '';
  contadorCarrito: number = 0;
  destinoSeleccionado: Destino | null = null; // Para manejar el destino en el modal

  constructor(
    private destinosService: DestinosService,
    private carritoService: CarritoService,
    private authService: AuthService,
    private router: Router
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
  }

  agregarAlCarrito(destino: Destino | null): void {
    if (!destino) return; // Control por si acaso

    if (this.authService.isLoggedIn()) {
      this.carritoService.agregarCarrito(destino.id_destino).subscribe(() => {
        this.contadorCarrito++;
        this.mostrarAlerta('Producto agregado al carrito con éxito', 'success');
        
      }, (error: any) => {
        console.error('Error al agregar al carrito', error);
        this.mostrarAlerta('Error al agregar al carrito', 'danger');
      });
    } else {
      this.router.navigate(['/iniciar-sesion']);
    }
  }

  mostrarAlerta(mensaje: string, tipo: string): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.showAlert();
  }

  showAlert(): void {
    const toastElement = document.getElementById('liveToast'); 
    if (toastElement) {
        const toastBootstrap = new (window as any).bootstrap.Toast(toastElement);
        toastBootstrap.show();
    } else {
         console.warn('Elemento Toast con ID "liveToast" no encontrado. La alerta puede no mostrarse.');
      setTimeout(() => {
        this.mensajeAlerta = '';
        this.tipoAlerta = '';
           }, 5000);
    }
  }


  trackById(index: number, destino: Destino): number {
    return destino.id_destino;
  }
}