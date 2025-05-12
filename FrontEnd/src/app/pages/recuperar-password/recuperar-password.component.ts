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

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    console.log('onSubmit fue llamado');
    console.log('Email ingresado:', this.form.value.email); // Verificacion del mail

    if (this.form.invalid) {
      console.warn('Formulario inválido');
      return;
    }

    const email = this.form.value.email;

    // Llamamos al backend
    this.http.post('https://tu-backend.com/api/password-reset/', { email }).subscribe({
      next: (res) => {
        this.mensaje = 'Si el correo esta registrado, se enviará un enlace para restablecer tu contraseña.';
        console.log(res); 
      },
      error: (err) => {
        this.mensaje = 'Ocurrió un error al intentar enviar el correo.';
        console.error(err);
      }
    });
  }
}
