import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { NavComponent } from './shared/nav/nav.component';
import { FooterComponent } from './shared/footer/footer.component';
import { MessageDisplayComponent } from './components/message-display/message-display.component'; // Asegúrate que la ruta sea correcta

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    HeaderComponent,
    NavComponent,
    FooterComponent,
    // ¡¡¡Agrega MessageDisplayComponent a tus imports!!!
    MessageDisplayComponent // <--- Esta es la clave
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'front-end';
  showNavFooter: boolean = true;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Esconde el nav y el footer en el DashboardComponent
        this.showNavFooter = !this.router.url.includes('app-dashboard');
      }
    });
  }
}
