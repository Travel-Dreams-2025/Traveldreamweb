import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contacto.component.html',
  styleUrl: './contacto.component.css',
})
export class ContactoComponent {
  formgroup = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', Validators.required),
    message: new FormControl('', Validators.required),
  });

  botonEnviado = false; // Nueva variable para controlar el estado del botón

  clickContacto(): void {
    if (this.formgroup.valid && !this.botonEnviado) {
      this.botonEnviado = true; // Marcamos el botón como "enviado"
      const name = this.formgroup.controls.name.value;
      const email = this.formgroup.controls.email.value;
      const phone = this.formgroup.controls.phone.value;
      const message = this.formgroup.controls.message.value;
      console.log(
        'Name:',
        name,
        'Email:',
        email,
        'Phone:',
        phone,
        'Message:',
        message
      );

      // Simulación de envío (puedes reemplazar esto con tu lógica real)
      setTimeout(() => {
        alert('Mensaje enviado correctamente');
        this.formgroup.reset();
        this.botonEnviado = false; // Reseteamos el estado del botón después de la simulación
      }, 1500); // Simula un tiempo de espera de 1.5 segundos
    } else if (this.botonEnviado) {
      alert('Por favor, espera un momento...'); // Evita clics múltiples mientras se envía
    } else {
      alert('Por favor, completa todos los campos correctamente.');
    }
  }

  getButtonClass() {
    return this.botonEnviado
      ? 'btn btn-success btn-lg'
      : 'btn btn-success btn-lg btn-custom';
  }
}
