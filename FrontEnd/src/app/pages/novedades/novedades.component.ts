import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  template: `
    <app-header></app-header>
    
    <main class="container my-5">
      <h1 class="text-center mb-4">Próximamente en Dreamtravel</h1>
      <p class="text-center lead mb-5">
        Presentamos la vista previa de lo que será nuestra aplicación móvil de Dreamtravel, 
        para todos los dispositivos android. El mismo contará con todas las funcionalidades 
        que conocés y disfrutás de la versión web, en el alcance de tu mano, a todo momento 
        y con el mejor servicio que nos destaca.
      </p>
      
      <div class="video-container">
        <iframe 
          src="https://www.youtube.com/embed/DyPIvu6c4k0" 
          width="100%" 
          height="480" 
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </div>
    </main>
  `,
  styles: [`
    .video-container {
      position: relative;
      padding-bottom: 56.25%; /* 16:9 ratio */
      height: 0;
      overflow: hidden;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .video-container iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  `]
})
export class NovedadesComponent {}