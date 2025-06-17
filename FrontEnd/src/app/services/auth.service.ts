import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http'; // Importa HttpErrorResponse
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { MatSnackBar } from '@angular/material/snack-bar'; // Importa MatSnackBar

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private BASE_API_URL = 'https://dreamtravelmp.pythonanywhere.com';
  private loginUrl = `${this.BASE_API_URL}/api/v1/auth/login/`;
  private registerUrl = `${this.BASE_API_URL}/api/v1/auth/register/`;
  private refreshTokenUrl = `${this.BASE_API_URL}/api/v1/auth/token/refresh/`;
  private changePasswordUrl = `${this.BASE_API_URL}/api/v1/auth/change-password/ `; 

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {} // Inyecta MatSnackBar

  login(credentials: any): Observable<any> {
    return this.http.post(this.loginUrl, credentials).pipe(
      map((response: any) => {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        return response;
      }),
      catchError((err) => this.handleError(err)) // Usa el handleError para errores de login
    );
  }

  register(user: any): Observable<any> {
    return this.http.post(this.registerUrl, user).pipe(
      map((response: any) => {
        return response;
      }),
      catchError((err) => this.handleError(err)) // Usa el handleError para errores de registro
    );
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post(this.refreshTokenUrl, { refresh: refreshToken }).pipe(
      map((response: any) => {
        localStorage.setItem('access_token', response.access);
        return response;
      }),
      catchError((err) => {
        this.logout(); // Si el refresh token falla, cierra la sesión
        return this.handleError(err); // Usa el handleError para errores de refresh token
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Puedes añadir una redirección aquí si lo deseas, por ejemplo:
    // this.router.navigate(['/iniciar-sesion']); 
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token'); // Devuelve true si el token existe
  }

  /**
   * Retorna el ID del usuario logueado.
   * Este método ahora decodifica el token JWT para obtener el ID real.
   */
  getLoggedInUserId(): number | null {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        return decodedToken.user_id || decodedToken.id || decodedToken.sub;
      } catch (e) {
        console.error('Error al decodificar el token o token inválido:', e);
        this.logout();
        return null;
      }
    }
    return null;
  }

  /**
   * Envía la solicitud de cambio de contraseña al backend.
   * @param oldPassword La contraseña actual del usuario.
   * @param newPassword La nueva contraseña.
   * @returns Un Observable con la respuesta del backend.
   */
  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    const payload = {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: newPassword // Se envía igual que new_password para la validación del serializador
    };
    return this.http.post<any>(this.changePasswordUrl, payload).pipe(
      catchError((err) => this.handleError(err)) // Usa el handleError para errores de cambio de contraseña
    );
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Ocurrió un error desconocido.';
    let userFriendlyMessage = 'Hubo un problema de comunicación con el servidor.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente o de la red: ${error.error.message}`;
      userFriendlyMessage = 'Parece que hay un problema con tu conexión a internet o el navegador.';
    } else {
      console.error(`Código de error del backend: ${error.status}, ` + `Cuerpo: ${JSON.stringify(error.error)}`);
      errorMessage = `Error del servidor: Código ${error.status}`;

      if (error.error) {
        if (typeof error.error === 'object') {
          // Errores de validación específicos (ej. {'old_password': ['Incorrecta']})
          if (error.error.old_password && error.error.old_password.length > 0) {
            userFriendlyMessage = error.error.old_password[0];
          } else if (error.error.new_password && error.error.new_password.length > 0) {
            userFriendlyMessage = error.error.new_password[0];
          } else if (error.error.email && error.error.email.length > 0) { // Para errores de registro/login
            userFriendlyMessage = error.error.email[0];
          } else if (error.error.password && error.error.password.length > 0) { // Para errores de validación de password en registro
            userFriendlyMessage = error.error.password[0];
          } else if (error.error.detail) { // Para errores genéricos de DRF (ej. "Credenciales inválidas")
            userFriendlyMessage = error.error.detail;
          } else if (error.error.error) { // Si el backend envía un campo 'error'
            userFriendlyMessage = error.error.error;
          } else {
            // Manejo de errores de validación con múltiples campos
            userFriendlyMessage = 'Error en la validación de datos. Por favor, revisa la información.';
            for (const key in error.error) {
              if (Array.isArray(error.error[key]) && error.error[key].length > 0) {
                userFriendlyMessage += ` ${key}: ${error.error[key].join(', ')}`;
              }
            }
          }
        } else if (typeof error.error === 'string') {
          userFriendlyMessage = error.error; // Si el error es una cadena simple
        }
      } else {
        userFriendlyMessage = `Error ${error.status}: El servidor no pudo procesar la solicitud.`;
      }
    }
    
    // Muestra el mensaje al usuario usando MatSnackBar
    this.snackBar.open(userFriendlyMessage, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-error'] // Clase CSS para el estilo del snackbar
    });
    
    return throwError(() => new Error(errorMessage));
  };
}