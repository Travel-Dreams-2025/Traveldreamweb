import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.css'],
})
export class ContactoComponent implements OnInit {
  formgroup!: FormGroup;
  submitSuccess: boolean = false;
  submitError: boolean = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.formgroup = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      message: ['', Validators.required],
    });
    window.scrollTo(0, 0);
  }

  onSubmit(): void {
    this.submitSuccess = false;
    this.submitError = false;

    if (this.formgroup.invalid) {
      this.formgroup.markAllAsTouched();
      console.log('Formulario inválido.');
      return;
    }

    const formspreeUrl = 'https://formspree.io/f/xeokkjrr';

    this.http.post(formspreeUrl, this.formgroup.value).subscribe({
      next: (response: any) => {
        console.log('Mensaje enviado con éxito.');
        this.submitSuccess = true;
        this.formgroup.reset();
        Object.keys(this.formgroup.controls).forEach((key) => {
          this.formgroup.get(key)?.setErrors(null);
        });
        // this.router.navigate(['/gracias']);
      },
      error: (error) => {
        console.error('Error al enviar el formulario.', error);
        this.submitError = true;
      },
    });
  }
}
