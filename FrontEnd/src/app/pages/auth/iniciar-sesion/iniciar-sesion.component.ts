import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-iniciar-sesion',
  templateUrl: './iniciar-sesion.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class IniciarSesionComponent {
  formGroup: FormGroup;
  loginError: string = '';
  enviado: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.formGroup = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });

    this.formGroup.get('password')?.valueChanges.subscribe(() => {
      this.loginError = '';
    });
  }

onSubmit() {
  if (this.formGroup.valid) {
    this.enviado = true;
    this.authService.login(this.formGroup.value).subscribe(
      response => {
        console.log('Login successful:', response);
        this.enviado = false;
        this.router.navigate(['/']);
      },
      error => {
        console.error('Login failed:', error);
        this.formGroup.get('password')?.reset();
        this.formGroup.get('password')?.markAsTouched();
        this.loginError = 'Email o contraseña incorrectos.';
        this.enviado = false;
      }
    );
  } else {
    console.log('Form is invalid');
  }
}
}