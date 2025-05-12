import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

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

  constructor(private fb: FormBuilder, private http: HttpClient) {
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

    // Llamamos al backend
    this.http.post('https://dreamtravel.pythonanywhere.com/api/accounts/password-reset/', { email }).subscribe({
      next: (res) => {
        this.mensaje = 'Si el correo está registrado, se enviará un enlace para restablecer tu contraseña.';
        console.log(res);
      },
      error: (err) => {
        this.mensaje = 'Ocurrió un error al intentar enviar el correo.';
        if (err.status === 400) {
          this.mensaje = 'Por favor, asegúrate de que el email esté registrado.';
        } else {
          this.mensaje = 'Hubo un problema con el servidor, intenta nuevamente más tarde.';
        }
        console.error(err);
      },
      complete: () => {
        this.loading = false; // Desactivar carga
      }
    });
  }
}
