import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CarritoService } from '../../../services/carrito.service';

@Component({
  selector: 'app-iniciar-sesion',
  templateUrl: './iniciar-sesion.component.html',
  styleUrls: ['./iniciar-sesion.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class IniciarSesionComponent implements OnInit {
  formGroup: FormGroup;
  errorMessage: string | null = null;
  isLoading: boolean = false;
  enviado: boolean = false;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router,
    private carritoService: CarritoService
  ) {
    this.formGroup = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    this.formGroup.get('password')?.valueChanges.subscribe(() => {
      this.errorMessage = null;
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.formGroup.valid) {
      this.isLoading = true;
      this.enviado = true;
      this.errorMessage = null;

      const { email, password, rememberMe } = this.formGroup.value;

      this.authService.login({ email, password }).subscribe({ 
        next: (response) => {
          this.isLoading = false;
          this.enviado = false;
          console.log('Login successful:', response);
          this.carritoService.mostrarAlerta('¡Inicio de sesión exitoso!', 'success');
          this.router.navigate(['/home']);
        },
        error: (errorResponse: HttpErrorResponse) => {
          this.isLoading = false;
          this.enviado = false;
          console.error('Login failed:', errorResponse);
          
          let userFriendlyMessage = 'Error al iniciar sesión. Por favor, verifica tus credenciales.';

          if (errorResponse.error) {
            if (typeof errorResponse.error === 'string') {
              userFriendlyMessage = errorResponse.error;
            } else if (errorResponse.error.non_field_errors && errorResponse.error.non_field_errors.length > 0) {
              userFriendlyMessage = errorResponse.error.non_field_errors[0];
            } else if (errorResponse.error.detail) {
              userFriendlyMessage = errorResponse.error.detail;
            } else {
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
          
          this.carritoService.mostrarAlerta(userFriendlyMessage, 'error');
          
          this.formGroup.get('password')?.reset(); 
          this.formGroup.get('password')?.markAsTouched();
        }
      });
    } else {
      this.formGroup.markAllAsTouched();
      if (this.formGroup.get('email')?.errors?.['required']) {
        this.carritoService.mostrarAlerta('El email es requerido', 'warning');
      } else if (this.formGroup.get('email')?.errors?.['email']) {
        this.carritoService.mostrarAlerta('Por favor, ingresa un email válido', 'warning');
      } else if (this.formGroup.get('password')?.errors?.['required']) {
        this.carritoService.mostrarAlerta('La contraseña es requerida', 'warning');
      }
    }
  }
}