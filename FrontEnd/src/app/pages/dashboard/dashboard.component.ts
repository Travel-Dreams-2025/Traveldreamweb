import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Datos para imágenes del header
  images = [
    { src: 'assets/img/logo.svg', alt: 'Logo', height: 40 },
    { src: 'assets/img/user.svg', alt: 'Foto de Usuario', height: 40 }
  ];

  // Variables de estado
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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.obtenerPerfil();
    this.listarCompras();
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

  private manejarErrorPerfil(error: any): void {
    console.error('Error al obtener perfil:', error);
    this.error = 'Error al cargar el perfil. Por favor, intenta nuevamente.';
    this.loading = false;
    
    if (error.status === 401) {
      this.authService.logout();
      // Redirigir a login si es necesario
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

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      this.subirImagenPerfil();
    }
  }

  subirImagenPerfil(): void {
    if (!this.selectedFile) return;

    this.loadingImage = true;
    // Implementar lógica de subida de imagen aquí
    console.log('Subiendo imagen:', this.selectedFile.name);
    // Ejemplo:
    // this.profileService.uploadProfileImage(this.selectedFile).subscribe(...);
    this.loadingImage = false;
  }

  listarCompras(): void {
    this.userService.listarCompras().subscribe({
      next: (compras: any[]) => {
        this.compras = this.mapearCompras(compras);
      },
      error: (error: any) => {
        this.manejarErrorCompras(error);
      }
    });
  }

  private mapearCompras(compras: any[]): any[] {
    return compras.map(compra => ({
      ...compra,
      fechaFormateada: this.formatearFecha(compra.fecha_creacion),
      metodoPago: compra.id_metodoPago?.nombrePago || 'No especificado',
      totalFormateado: this.formatearMoneda(compra.total)
    }));
  }

  private manejarErrorCompras(error: any): void {
    console.error('Error al cargar compras:', error);
    this.error = 'Error al cargar el historial de compras.';
  }

  private formatearFecha(fecha: string): string {
    if (!fecha) return 'Fecha no disponible';
    
    try {
      return new Date(fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return fecha;
    }
  }

  private formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(monto);
  }
}