// src/app/components/pago-exito/pago-exito.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Si es standalone y usa CommonModule

@Component({
  selector: 'app-pago-exito',
  standalone: true, // <-- ¡Importante si estás en Angular moderno!
  imports: [CommonModule],
  templateUrl: './pago-exito.component.html',
  styleUrl: './pago-exito.component.css'
})
export class PagoExitoComponent { // <-- Debe estar exportado
  // ...
}