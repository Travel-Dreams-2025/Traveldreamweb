import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { CarritoService } from '../../services/carrito.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  images = [
    { src: 'assets/img/logo.svg', alt: 'Logo', height: 40 },
    { src: 'assets/img/user.svg', alt: 'Foto de Usuario', height: 40 }
  ];

  compras: any[] = [];
  usuario: any = null;
  usuarioEditado: any = {};
  loading: boolean = true;
  loadingSave: boolean = false;
  loadingImage: boolean = false;
  error: string | null = null;
  editMode: boolean = false;
  selectedFile: File | null = null;

  constructor(
    private userService: UserService,
    private profileService: ProfileService,
    private authService: AuthService,
    private carritoService: CarritoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.obtenerPerfil();
    this.cargarHistorialCompleto();
  }

  obtenerPerfil(): void {
    this.loading = true;
    this.error = null;
    
    this.profileService.getProfile().subscribe({
      next: (usuario: any) => {
        this.usuario = this.mapearUsuario(usuario);
        this.loading = false;
      },
      error: (error: any) => {
        this.manejarErrorPerfil(error);
      }
    });
  }

  private cargarHistorialCompleto(): void {
    forkJoin({
      comprasBackend: this.userService.listarCompras(),
      historialLocal: this.carritoService.obtenerHistorial()
    }).subscribe({
      next: ({comprasBackend, historialLocal}) => {
        this.compras = [
          ...this.mapearCompras(comprasBackend || []),
          ...this.mapearHistorialLocal(historialLocal || [])
        ];
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.compras = this.mapearHistorialLocal(this.carritoService.obtenerHistorial() || []);
      }
    });
  }

  private mapearUsuario(usuario: any): any {
    return {
      first_name: usuario.first_name,
      last_name: usuario.last_name,
      image: usuario.image 
        ? 'https://dreamtravel.pythonanywhere.com' + usuario.image 
        : 'assets/img/A01_avatar_mujer.png',
      telephone: usuario.telephone || 'No proporcionado',
      address: usuario.address || 'No proporcionada',
      dni: usuario.dni || 'No proporcionado'
    };
  }

  private mapearCompras(compras: any[]): any[] {
    return compras.map(compra => ({
      ...compra,
      fechaFormateada: this.formatearFecha(compra.fecha_creacion),
      metodoPago: compra.id_metodoPago?.nombrePago || 'No especificado',
      totalFormateado: this.formatearMoneda(compra.total),
      esLocal: false
    }));
  }

  private mapearHistorialLocal(historial: any): any[] {
    if (!historial || !Array.isArray(historial)) return [];
    
    return historial.map(compra => {
      const primerItem = compra.items[0] || {};
      const total = compra.items.reduce((sum: number, item: any) => {
        return sum + ((item.precio_Destino || 0) * (item.cantidad || 1));
      }, 0);

      return {
        id_compra: compra.fecha,
        destino: {
          nombre_Destino: compra.items.map((i: any) => i.nombre_Destino || 'Destino').join(', '),
          image: primerItem.image || 'assets/img/default-trip.jpg'
        },
        cantidad: compra.items.reduce((sum: number, item: any) => sum + (item.cantidad || 1), 0),
        total: total,
        fecha_creacion: compra.fecha,
        fechaFormateada: this.formatearFecha(compra.fecha),
        metodo_pago: { 
          nombrePago: compra.metodoPagoId ? `Método ${compra.metodoPagoId}` : 'No especificado' 
        },
        totalFormateado: this.formatearMoneda(total),
        esLocal: true
      };
    });
  }

  formatearFecha(fecha: string | Date): string {
    if (!fecha) return 'Fecha no disponible';
    
    try {
      const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
      return fechaObj.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return typeof fecha === 'string' ? fecha : 'Fecha inválida';
    }
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(monto || 0);
  }

  private manejarErrorPerfil(error: any): void {
    console.error('Error al obtener perfil:', error);
    this.error = 'Error al cargar el perfil. Por favor, intenta nuevamente.';
    this.loading = false;
    
    if (error.status === 401) {
      this.authService.logout();
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.usuarioEditado = {
        telephone: this.usuario.telephone,
        dni: this.usuario.dni,
        address: this.usuario.address
      };
    }
  }

  guardarCambios(): void {
    if (!this.validarDatosPerfil()) return;

    this.loadingSave = true;
    this.error = null;

    this.profileService.updateProfile(this.usuarioEditado).subscribe({
      next: (response) => {
        this.actualizarUsuarioLocal();
        this.editMode = false;
        this.loadingSave = false;
        this.snackBar.open('Perfil actualizado con éxito', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        this.manejarErrorActualizacion(error);
      }
    });
  }

  private validarDatosPerfil(): boolean {
    if (!this.usuarioEditado.dni || this.usuarioEditado.dni.length < 7) {
      this.error = 'El DNI debe tener al menos 7 caracteres';
      return false;
    }
    return true;
  }

  private actualizarUsuarioLocal(): void {
    this.usuario = {
      ...this.usuario,
      telephone: this.usuarioEditado.telephone,
      dni: this.usuarioEditado.dni,
      address: this.usuarioEditado.address
    };
  }

  private manejarErrorActualizacion(error: any): void {
    console.error('Error al actualizar perfil:', error);
    
    if (error.status === 401) {
      this.error = 'Sesión expirada. Por favor, vuelve a iniciar sesión.';
      this.authService.logout();
    } else if (error.status === 400) {
      this.error = 'Datos inválidos. Verifica la información ingresada.';
    } else {
      this.error = 'Error al guardar los cambios. Intenta nuevamente.';
    }
    
    this.loadingSave = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.subirImagenPerfil();
    }
  }

  subirImagenPerfil(): void {
    if (!this.selectedFile) return;

    this.loadingImage = true;
    
    this.profileService.uploadProfileImage(this.selectedFile).subscribe({
      next: (response: any) => {
        if (this.usuario) {
          this.usuario.image = response.imageUrl;
        }
        this.snackBar.open('Imagen de perfil actualizada', 'Cerrar', { duration: 3000 });
        this.loadingImage = false;
      },
      error: (error) => {
        console.error('Error al subir imagen:', error);
        this.snackBar.open('Error al actualizar la imagen', 'Cerrar', { duration: 3000 });
        this.loadingImage = false;
      }
    });
  }
}