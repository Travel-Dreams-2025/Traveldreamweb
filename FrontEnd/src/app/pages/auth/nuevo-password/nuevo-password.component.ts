import * as bootstrap from 'bootstrap';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PasswordResetService } from '../../../services/password-reset.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';


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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private passwordResetService: PasswordResetService
  ) {
    this.form = this.fb.group({
      new_password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.uid = this.route.snapshot.paramMap.get('uid') || '';
    this.token = this.route.snapshot.paramMap.get('token') || '';
    console.log('UID:', this.uid, 'Token:', this.token);
  }

onSubmit(): void {
  if (this.form.invalid) return;

  this.enviado = true;
  const newPassword = this.form.value.new_password;

  this.passwordResetService.confirmPasswordReset(this.uid, this.token, newPassword)
    .subscribe({
      next: () => {
        this.enviado = false;

        const modalElement = document.getElementById('successModal');
        console.log('Modal Element:', modalElement);
        if (modalElement) {
          const successModal = new bootstrap.Modal(modalElement);
          successModal.show();

          setTimeout(() => {
            successModal.hide();
            this.router.navigate(['/iniciar-sesion']);
          }, 3000);
        }
      },
      error: (err: any) => {
        console.error('Error al actualizar la contraseña', err);
        this.mensaje = 'No se pudo actualizar la contraseña. Verifica el enlace.';
        this.enviado = false;
      }
    });
}
}
