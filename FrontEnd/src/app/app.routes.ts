import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { IniciarSesionComponent } from './pages/auth/iniciar-sesion/iniciar-sesion.component';
import { RegistroComponent } from './pages/auth/registro/registro.component';
import { NosotrosComponent } from './pages/nosotros/nosotros.component';
import { DestinosComponent } from './pages/destinos/destinos.component';
import { ContactoComponent } from './pages/contacto/contacto.component';
import { Pagina404Component } from './pages/pagina404/pagina404.component';
import { ProfesionalComponent } from './pages/nosotros/profesional/profesional.component';
import { DestinosCartComponent } from './pages/destinos-cart/destinos-cart.component';
import { DestinosDetailsComponent } from './pages/destinos-details/destinos-details.component';
import { AuthGuard } from './interceptors/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RecuperarPasswordComponent } from './pages/recuperar-password/recuperar-password.component';
import { NuevoPasswordComponent } from './pages/auth/nuevo-password/nuevo-password.component';
import { PoliticasComponent } from './pages/politicas/politicas.component';
import { CombosComponent } from './pages/combos/combos.component'; // Importación de CombosComponent
import { ChangePasswordComponent } from './pages/change-password/change-password.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'destinos', component: DestinosComponent },
  { path: 'destinos/:id', component: DestinosDetailsComponent },
  {
    path: 'destinos-cart',
    component: DestinosCartComponent,
    canActivate: [AuthGuard],
  },
  { path: 'app-dash', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'contacto', component: ContactoComponent },
  { path: 'iniciar-sesion', component: IniciarSesionComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'nosotros', component: NosotrosComponent },
  { path: 'nosotros/:id', component: ProfesionalComponent },
  { path: 'recuperar-password', component: RecuperarPasswordComponent },
  { path: 'new-password', component: NuevoPasswordComponent },
  { path: 'cambiar-contrasena', component: ChangePasswordComponent },
  { path: 'politicas', component: PoliticasComponent },
  { path: 'combos', component: CombosComponent }, // Ruta para CombosComponent
  {
    path: 'novedades',
    loadComponent: () =>
      import('./pages/novedades/novedades.component').then(
        (m) => m.NovedadesComponent
      ),
  },
  { path: '**', component: Pagina404Component },
];
