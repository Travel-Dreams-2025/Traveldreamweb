import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { CarritoService } from '../../services/carrito.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, MatSnackBarModule],
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
    private snackBar: MatSnackBar,
    private router: Router
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
    const historialLocal = this.carritoService.obtenerHistorialLocal();

    forkJoin({
      comprasBackend: this.userService.listarCompras().pipe(
        catchError(err => {
          console.error('Error al listar compras del backend:', err);
          return of([]);
        })
      )
    }).subscribe({
      next: ({comprasBackend}) => {
        this.compras = [
          ...this.mapearCompras(comprasBackend || []),
          ...this.mapearHistorialLocal(historialLocal || [])
        ];
      },
      error: (error: any) => {
        console.error('Error al cargar historial completo:', error);
        this.compras = this.mapearHistorialLocal(this.carritoService.obtenerHistorialLocal() || []);
        this.snackBar.open('Error al cargar historial desde el servidor. Mostrando historial local.', 'Cerrar', { duration: 5000 });
      }
    });
  }

  private mapearUsuario(usuario: any): any {
    const imageUrl = usuario.image 
      ? usuario.image 
      : 'assets/img/A01_avatar_mujer.png';

    return {
      first_name: usuario.first_name,
      last_name: usuario.last_name,
      image: imageUrl,
      telephone: usuario.telephone || 'No proporcionado',
      address: usuario.address || 'No proporcionada',
      dni: usuario.dni || 'No proporcionado'
    };
  }

  private mapearCompras(compras: any[]): any[] {
    const apiBaseUrlForDestinos = 'https://dreamtravelmp.pythonanywhere.com'; 

    return compras.map(compra => ({
      ...compra,
      fechaFormateada: this.formatearFecha(compra.fecha_compra),
      nombre_destino: compra.id_destino?.nombre_Destino || 'Destino Desconocido',
      destino: {
        image: compra.id_destino?.image
          ? apiBaseUrlForDestinos + compra.id_destino.image // Usamos la URL base de PythonAnywhere
          : 'assets/img/default-trip.jpg',
        nombre_Destino: compra.id_destino?.nombre_Destino || 'Destino Desconocido'
      },
      metodo_pago: {
        nombrePago: compra.id_metodoPago?.nombrePago || 'No especificado'
      },
      totalFormateado: this.formatearMoneda(compra.total_compra),
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
        this.snackBar.open('Perfil actualizado con éxito', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
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
          // Asume que response.imageUrl ya es la URL COMPLETA de PythonAnywhere.
          // Si tu backend solo devuelve la ruta relativa aquí, tendrías que concatenarla
          // con 'https://dreamtravelmp.pythonanywhere.com' + response.imageUrl.
          // Pero lo ideal es que el backend ya la devuelva completa.
          this.usuario.image = response.imageUrl; 
        }
        this.snackBar.open('Imagen de perfil actualizada', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
        this.loadingImage = false;
      },
      error: (error: any) => {
        console.error('Error al subir imagen:', error);
        this.snackBar.open('Error al actualizar la imagen', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
        this.loadingImage = false;
      }
    });
  }

  /**
   * Navega al componente de cambio de contraseña.
   */
  navigateToChangePassword(): void {
    this.router.navigate(['/cambiar-contrasena']);
  }
}