import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { CarritoService } from '../../services/carrito.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
      ),
      historialLocal: of(historialLocal || [])
    }).subscribe({
      next: ({comprasBackend, historialLocal}) => {
        this.compras = [
          ...this.mapearComprasBackend(comprasBackend),
          ...this.mapearHistorialLocal(historialLocal)
        ].sort((a, b) => 
          new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
        );
      },
      error: (error: any) => {
        console.error('Error al cargar historial completo:', error);
        this.compras = this.mapearHistorialLocal(historialLocal || []);
        this.snackBar.open('Error al cargar historial desde el servidor. Mostrando historial local.', 'Cerrar', { duration: 5000 });
      }
    });
  }

  private mapearUsuario(usuario: any): any {
    return {
      first_name: usuario.first_name,
      last_name: usuario.last_name,
      image: usuario.image || 'assets/img/A01_avatar_mujer.png',
      telephone: usuario.telephone || 'No proporcionado',
      address: usuario.address || 'No proporcionada',
      dni: usuario.dni || 'No proporcionado'
    };
  }

  private mapearComprasBackend(compras: any[]): any[] {
    if (!compras || !Array.isArray(compras)) return [];

    return compras.map(compra => {
      const cantidad = parseInt(compra.cantidad) || 1;
      const total = parseFloat(compra.total) || 0;
      
      return {
        id_compra: compra.id_compra,
        destino: {
          nombre_Destino: compra.nombre_Destino || 'Destino Desconocido',
          image: compra.image || 'assets/img/default-trip.jpg',
          descripcion: compra.descripcion || 'Sin descripción disponible'
        },
        cantidad: cantidad,
        total: total,
        fecha_creacion: compra.fecha_creacion,
        fechaFormateada: this.formatearFecha(compra.fecha_creacion),
        metodo_pago: { 
          nombrePago: compra.metodo_pago?.nombrePago || this.obtenerNombreMetodoPago(compra.id_metodoPago) || 'No especificado'
        },
        totalFormateado: this.formatearMoneda(total),
        esLocal: false,
        estado_pago: compra.estado_pago || 'unknown',
        fecha_salida: compra.fecha_salida ? this.formatearFecha(compra.fecha_salida, false) : 'No definida'
      };
    });
  }

  private obtenerNombreMetodoPago(idMetodo: number): string {
    const metodosPago: {[key: number]: string} = {
      1: 'Tarjeta / Mercado Pago',
      2: 'Transferencia Bancaria',
      3: 'Efectivo'
    };
    return metodosPago[idMetodo] || `Método ${idMetodo}`;
  }

  private mapearHistorialLocal(historial: any[]): any[] {
    if (!historial || !Array.isArray(historial)) return [];

    return historial.map(compra => {
      const items = compra.items || [];
      const primerItem = items[0] || {};
      
      const total = items.reduce((sum: number, item: any) => {
        return sum + ((item.precio_Destino || item.precio || 0) * (item.cantidad || 1));
      }, 0);

      const nombreDestino = items.map((item: any) => 
        item.nombre_Destino || item.nombre || 'Destino'
      ).join(', ') || 'Destino';

      const imagenDestino = primerItem.image || 'assets/img/default-trip.jpg';
      
      const metodoPago = compra.metodo_pago?.nombrePago || 
                       (compra.metodoPagoId ? this.obtenerNombreMetodoPago(compra.metodoPagoId) : 
                       'No especificado');

      return {
        id_compra: compra.id || compra.fecha,
        destino: {
          nombre_Destino: nombreDestino,
          image: imagenDestino,
          descripcion: primerItem.descripcion || 'Sin descripción disponible'
        },
        cantidad: items.reduce((sum: number, item: any) => sum + (item.cantidad || 1), 0),
        total: total,
        fecha_creacion: compra.fecha,
        fechaFormateada: this.formatearFecha(compra.fecha),
        metodo_pago: { 
          nombrePago: metodoPago
        },
        totalFormateado: this.formatearMoneda(total),
        esLocal: true,
        estado_pago: compra.estado_pago || 'completed',
        fecha_salida: primerItem.fecha_salida || 'No definida'
      };
    });
  }

  formatearFecha(fecha: string | Date, incluirHora: boolean = true): string {
    if (!fecha) return 'Fecha no disponible';
    
    try {
      const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
      const opciones: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      };

      if (incluirHora) {
        opciones.hour = '2-digit';
        opciones.minute = '2-digit';
      }

      return fechaObj.toLocaleDateString('es-AR', opciones);
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
        this.snackBar.open('Perfil actualizado con éxito', 'Cerrar', { 
          duration: 3000, 
          panelClass: ['snackbar-success'] 
        });
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
        this.snackBar.open('Imagen de perfil actualizada', 'Cerrar', { 
          duration: 3000, 
          panelClass: ['snackbar-success'] 
        });
        this.loadingImage = false;
      },
      error: (error: any) => {
        console.error('Error al subir imagen:', error);
        this.snackBar.open('Error al actualizar la imagen', 'Cerrar', { 
          duration: 3000, 
          panelClass: ['snackbar-error'] 
        });
        this.loadingImage = false;
      }
    });
  }

  navigateToChangePassword(): void {
    this.router.navigate(['/cambiar-contrasena']);
  }
}