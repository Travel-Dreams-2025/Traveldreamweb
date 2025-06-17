import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

// Validador personalizado para asegurar que las contraseñas coincidan
export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const newPassword = control.get('new_password');
    const confirmNewPassword = control.get('confirm_new_password');

    // Retorna null si alguno de los campos es nulo o si las contraseñas coinciden
    if (!newPassword || !confirmNewPassword || newPassword.value === confirmNewPassword.value) {
      return null;
    }
    return { mismatch: true }; // Error si no coinciden
  };
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  loading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Propiedades para controlar la visibilidad de la contraseña
  showOldPassword = false;
  showNewPassword = false;
  showConfirmNewPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.changePasswordForm = this.fb.group({
      old_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(6)]], // Mínimo 6 caracteres
      confirm_new_password: ['', [Validators.required]]
    }, { validators: passwordMatchValidator() }); // Aplica el validador personalizado aquí
  }

  ngOnInit(): void {
    // Si necesitas cargar datos iniciales o realizar alguna acción al iniciar
  }

  // Métodos para alternar la visibilidad de la contraseña
  toggleOldPasswordVisibility(): void {
    this.showOldPassword = !this.showOldPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmNewPasswordVisibility(): void {
    this.showConfirmNewPassword = !this.showConfirmNewPassword;
  }

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    // Marcar todos los controles como 'touched' para mostrar los errores de validación
    this.changePasswordForm.markAllAsTouched();

    if (this.changePasswordForm.invalid) {
      this.errorMessage = 'Por favor, corrige los errores del formulario.';
      this.loading = false;
      return;
    }

    const { old_password, new_password } = this.changePasswordForm.value;

    this.authService.changePassword(old_password, new_password).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.message || 'Contraseña actualizada exitosamente.';
        this.snackBar.open(this.successMessage ?? '', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
        
        // ¡CORRECCIÓN AQUÍ!: Redirigir a '/app-dash' en lugar de '/dashboard'
        this.router.navigate(['/app-dash']); 
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al cambiar contraseña:', error);
        
        this.successMessage = null; 
        this.errorMessage = 'Verifica los campos e intenta de nuevo.';
      }
    });
  }

  // Método para manejar la cancelación y volver al dashboard
  onCancel(): void {
    this.router.navigate(['/app-dash']); // ¡CORRECCIÓN AQUÍ también!
  }
}