import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ProfileService } from '../../services/profile.service'; // Nuevo servicio

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
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
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private userService: UserService,
    private profileService: ProfileService // Inyectamos el nuevo servicio
  ) {}

  ngOnInit(): void {
    this.obtenerPerfil();
    this.listarCompras();
  }

  obtenerPerfil(): void {
    this.loading = true;
    this.error = null;
    
    this.profileService.getProfile().subscribe({
      next: (usuario: any) => {
        this.usuario = {
          ...usuario,
          // Aseguramos valores por defecto para campos opcionales
          image: usuario.image ? 'https://dreamtravel.pythonanywhere.com' + usuario.image : 'assets/img/A01_avatar_mujer.png',
          telephone: usuario.telephone || 'No proporcionado',
          address: usuario.address || 'No proporcionada',
          dni: usuario.dni || 'No proporcionado'
        };
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al obtener el perfil del usuario', error);
        this.error = 'Error al cargar el perfil. Por favor, intenta nuevamente.';
        this.loading = false;
      }
    });
  }

  listarCompras(): void {
    this.userService.listarCompras().subscribe({
      next: (compras: any[]) => {
        this.compras = compras;
      },
      error: (error: any) => {
        console.error('Error al listar las compras', error);
        // Puedes agregar manejo de errores específico para compras aquí
      }
    });
  }
}