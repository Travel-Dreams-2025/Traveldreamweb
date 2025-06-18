// src/app/pages/politicas/politicas.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-politicas', // Selector para usar el componente en HTML
  standalone: true, //  Define el componente como autónomo
  imports: [CommonModule], // Importa módulos necesarios para el template
  templateUrl: './politicas.component.html', // Ruta al archivo HTML del componente
  styleUrls: ['./politicas.component.css'], // Ruta al archivo CSS del componente
})
export class PoliticasComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
  }
}
