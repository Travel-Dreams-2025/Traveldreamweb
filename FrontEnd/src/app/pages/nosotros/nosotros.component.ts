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
        // Asegura que la lista entrante sea un array
        this.profesionalList = Array.isArray(profesionalList) ? profesionalList.filter(p => p != null) : [];
        this.ordenarProfesionales();
      },
      error: (error) => {
        console.error('Error al obtener profesionales:', error);
        this.profesionalList = []; // Establece a un array vacío en caso de error
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

    const orderedList: any[] = [];

    // Añade los logos de Travel Dreams si existen
    if (travelDreamsLogos[0]) {
      orderedList.push(travelDreamsLogos[0]);
    }
    // Añade el primer "otro" miembro si existe
    if (otherMembers[0]) {
      orderedList.push(otherMembers[0]);
    }
    // Añade el segundo logo de Travel Dreams si existe
    if (travelDreamsLogos[1]) {
      orderedList.push(travelDreamsLogos[1]);
    }

    // Añade el resto de los "otros" miembros a partir del segundo
    orderedList.push(...otherMembers.slice(1));

    // Asigna la lista limpia y ordenada
    this.profesionalList = orderedList;
  }

  trackById(index: number, nosotros: any): number {
    return nosotros?.id_nosotros || index;
  }
}