import { Component, OnInit } from '@angular/core'; // Añadido OnInit
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http'; // Importa HttpErrorResponse
import { CarritoService } from '../../../services/carrito.service'; // Importa CarritoService para alertas

@Component({
  selector: 'app-iniciar-sesion',
  templateUrl: './iniciar-sesion.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class IniciarSesionComponent implements OnInit { // Implementa OnInit
  formGroup: FormGroup; // Mantiene tu nombre de formulario
  errorMessage: string | null = null; // Usaremos esta para los mensajes de error
  isLoading: boolean = false; // Para el estado de carga
  enviado: boolean = false; // Mantiene tu propiedad 'enviado'

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router,
    private carritoService: CarritoService // Inyecta CarritoService
  ) {
    this.formGroup = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Tu lógica de valueChanges para password puede quedarse aquí si es necesaria
    this.formGroup.get('password')?.valueChanges.subscribe(() => {
      this.errorMessage = null; // Limpia el error al cambiar la contraseña
    });
  }

  onSubmit(): void { // Tipado de 'void' para el método
    if (this.formGroup.valid) {
      this.isLoading = true; // Activa el estado de carga
      this.enviado = true; // Activa tu propiedad 'enviado'
      this.errorMessage = null; // Limpia mensajes de error previos

      const { email, password, rememberMe } = this.formGroup.value; // Obtener todos los valores del formulario

      // CORREGIDO: Asegúrate de que login acepte un objeto con email y password
      this.authService.login({ email, password }).subscribe({ 
        next: (response) => {
          this.isLoading = false;
          this.enviado = false;
          console.log('Login successful:', response);
          this.carritoService.mostrarAlerta('¡Inicio de sesión exitoso!', 'success');
          this.router.navigate(['/home']); // O a donde quieras redirigir después del login
        },
        error: (errorResponse: HttpErrorResponse) => { // Tipado para un mejor manejo de errores
          this.isLoading = false;
          this.enviado = false;
          console.error('Login failed:', errorResponse);
          
          let userFriendlyMessage = 'Error al iniciar sesión. Por favor, verifica tus credenciales.';

          // Intenta extraer un mensaje de error más específico del backend
          if (errorResponse.error) {
            if (typeof errorResponse.error === 'string') {
              // Si el error es una cadena simple
              userFriendlyMessage = errorResponse.error;
            } else if (errorResponse.error.non_field_errors && errorResponse.error.non_field_errors.length > 0) {
              // Errores generales del formulario (Django REST Framework)
              userFriendlyMessage = errorResponse.error.non_field_errors[0];
            } else if (errorResponse.error.detail) {
              // Errores de detalle (comunes en 401/403)
              userFriendlyMessage = errorResponse.error.detail;
            } else {
              // Otros errores de validación de campos
              let fieldErrors = [];
              for (const key in errorResponse.error) {
                if (Array.isArray(errorResponse.error[key])) {
                  fieldErrors.push(`${key}: ${errorResponse.error[key].join(', ')}`);
                } else {
                  fieldErrors.push(`${key}: ${errorResponse.error[key]}`);
                }
              }
              if (fieldErrors.length > 0) {
                userFriendlyMessage = 'Errores de validación: ' + fieldErrors.join('; ');
              }
            }
          }
          this.errorMessage = userFriendlyMessage; // Asigna el mensaje para mostrar en la UI
          this.carritoService.mostrarAlerta(`Login fallido: ${userFriendlyMessage}`, 'error');

          // Opcional: limpiar la contraseña para que el usuario la reingrese
          this.formGroup.get('password')?.reset(); 
          this.formGroup.get('password')?.markAsTouched(); // Para que las validaciones se muestren
        }
      });
    } else {
      // Marcar los campos como tocados para que se muestren los mensajes de validación
      this.formGroup.markAllAsTouched();
      this.carritoService.mostrarAlerta('Por favor, completa todos los campos requeridos y válidos.', 'warning');
    }
  }
}
