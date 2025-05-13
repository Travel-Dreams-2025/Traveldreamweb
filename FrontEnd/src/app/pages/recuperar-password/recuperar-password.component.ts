import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PasswordResetService } from '../../services/password-reset.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './recuperar-password.component.html',
})
export class RecuperarPasswordComponent {
  form: FormGroup;
  mensaje: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      console.warn('Formulario inválido');
      return;
    }

    this.loading = true;
    const email = this.form.value.email;

    this.passwordResetService.requestPasswordReset(email).subscribe({
      next: (res) => {
        this.mensaje = 'Si el correo está registrado, se enviará un enlace para restablecer tu contraseña.';
        console.log('Respuesta del backend:', res);
      },
      error: (err) => {
        if (err.status === 400) {
          this.mensaje = 'Por favor, asegúrate de que el email esté registrado.';
        } else {
          this.mensaje = 'Hubo un problema con el servidor, intenta nuevamente más tarde.';
        }
        console.error('Error del backend:', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
