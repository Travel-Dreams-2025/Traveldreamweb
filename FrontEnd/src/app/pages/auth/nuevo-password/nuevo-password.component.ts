import * as bootstrap from 'bootstrap';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PasswordResetService } from '../../../services/password-reset.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';


// Validador personalizado para confirmar que las contraseñas coinciden
export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const newPassword = control.get('new_password');
    const confirmPassword = control.get('confirm_password');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { mismatch: true }; // Error si no coinciden
    }
    return null; // No hay error
  };
}


@Component({
  selector: 'app-nuevo-password',
  standalone: true,
  templateUrl: './nuevo-password.component.html',
  imports: [CommonModule, ReactiveFormsModule],
})
export class NuevoPasswordComponent implements OnInit {
  form: FormGroup;
  mensaje: string = '';
  uid: string = '';
  token: string = '';
  enviado = false;

  // Propiedades para controlar la visibilidad de la contraseña
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private passwordResetService: PasswordResetService
  ) {
    this.form = this.fb.group({
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required], // Añadido el campo de confirmación
    }, { validators: passwordMatchValidator() }); // Añadido el validador de coincidencia al FormGroup
  }

  ngOnInit(): void {
    this.uid = this.route.snapshot.paramMap.get('uid') || '';
    this.token = this.route.snapshot.paramMap.get('token') || '';
    console.log('UID:', this.uid, 'Token:', this.token);
  }

  // Métodos para alternar la visibilidad de la contraseña
  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    // Marcar todos los controles como touched para mostrar errores de validación
    this.form.markAllAsTouched();
    
    if (this.form.invalid) {
      this.mensaje = 'Por favor, corrige los errores del formulario.';
      return;
    }

    this.enviado = true;
    const newPassword = this.form.value.new_password; // Solo enviamos la nueva contraseña al backend

    this.passwordResetService.confirmPasswordReset(this.uid, this.token, newPassword)
      .subscribe({
        next: () => {
          this.enviado = false;

          const modalElement = document.getElementById('successModal');
          if (modalElement) {
            const successModal = new bootstrap.Modal(modalElement);
            successModal.show();

            // --- ¡CORRECCIÓN CLAVE AQUÍ! ---
            // Escuchar el evento 'hidden.bs.modal' para navegar después de que el modal esté completamente oculto.
            // Esto asegura que Bootstrap termine de manejar el modal y el foco antes de navegar.
            modalElement.addEventListener('hidden.bs.modal', () => {
              this.router.navigate(['/iniciar-sesion']);
            }, { once: true }); // Usar { once: true } para que el listener se elimine automáticamente.

            // Eliminado el setTimeout para ocultar el modal automáticamente.
            // El usuario ahora cerrará el modal manualmente (con el botón o la "X").
            // Esto elimina posibles conflictos de foco/aria-hidden durante el cierre automático.
            // -------------------------------
          }
        },
        error: (err: any) => {
          console.error('Error al actualizar la contraseña', err);
          this.enviado = false;
          // Intenta extraer un mensaje de error más específico del backend
          let errorMessage = 'No se pudo actualizar la contraseña. Verifica el enlace o intenta de nuevo.';
          if (err.error && typeof err.error === 'object') {
            if (err.error.error) { // Si el backend envía un campo 'error'
              errorMessage = err.error.error;
            } else if (err.error.detail) { // Si el backend envía un campo 'detail'
              errorMessage = err.error.detail;
            } else if (err.error.new_password && err.error.new_password.length > 0) { // Errores de validación de contraseña
              errorMessage = 'Contraseña inválida: ' + err.error.new_password[0];
            } else if (err.error.token) { // Errores relacionados con el token (más comunes para enlaces caducados/inválidos)
                errorMessage = err.error.token;
            } else {
              // Si hay otros errores de validación de campo
              const fieldErrors = Object.values(err.error).flat().join(', ');
              if (fieldErrors) {
                errorMessage = 'Errores de validación: ' + fieldErrors;
              }
            }
          } else if (typeof err.error === 'string') {
              errorMessage = err.error; // Si el error es una cadena simple
          }
          this.mensaje = errorMessage;
        }
      });
  }
}
