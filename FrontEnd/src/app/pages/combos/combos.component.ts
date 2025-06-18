import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Añade esta importación

@Component({
  selector: 'app-combos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // Añade esto al array de imports
  ],
  templateUrl: './combos.component.html',
  styleUrls: ['./combos.component.css'],
})
export class CombosComponent implements OnInit {
  constructor() {}
  ngOnInit(): void {
    window.scrollTo(0, 0);
  }
}
