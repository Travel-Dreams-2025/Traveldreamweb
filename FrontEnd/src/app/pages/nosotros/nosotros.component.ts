import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NosotrosService } from '../../services/nosotros.service';

@Component({
  selector: 'app-nosotros',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nosotros.component.html',
  styleUrls: ['./nosotros.component.css'],
})
export class NosotrosComponent implements OnInit {
  mision =
    'Desde hace 20 años, Travel Dreams ha sido la brújula que guía a aventureros de todas las edades en sus viajes más esperados. Nuestra misión trasciende un simple itinerario; es una promesa de aventura, descubrimiento y recuerdos que perduran toda la vida.';
  profesionalList: any[] = [];
  defaultImage: string = 'ruta/a/imagen/default.png';

  constructor(private nosotrosService: NosotrosService) {}

  ngOnInit(): void {
    this.obtenerProfesionales();
  }

  obtenerProfesionales(): void {
    this.nosotrosService.obtenerProfesionales().subscribe({
      next: (profesionalList) => {
        this.profesionalList = profesionalList;
        this.ordenarProfesionales();
      },
      error: (error) => {
        console.error(error);
      },
    });
  }

  ordenarProfesionales(): void {
    const travelDreamsLogos = this.profesionalList.filter(
      (p) => p.nombre_apellido === 'Travel Dreams'
    );
    const otherMembers = this.profesionalList.filter(
      (p) => p.nombre_apellido !== 'Travel Dreams'
    );
    this.profesionalList = [
      travelDreamsLogos[0],
      otherMembers[0],
      travelDreamsLogos[1],
      ...otherMembers.slice(1),
    ];
  }

  trackById(index: number, nosotros: any): number {
    return nosotros.id_nosotros;
  }
}
