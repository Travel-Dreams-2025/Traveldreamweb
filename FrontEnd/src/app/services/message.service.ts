import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

// 1. Definimos la interfaz para la estructura de un mensaje
export interface AppMessage {
  text: string;
  type: 'success' | 'error' | 'info' | 'warning'; // Define los tipos de alerta
}

@Injectable({
  providedIn: 'root' // Esto hace que el servicio esté disponible en toda la aplicación
})
export class MessageService {
  // Un Subject es un tipo especial de Observable que permite enviar valores.
  // Aquí emitirá mensajes (o null para limpiar el mensaje).
  private messageSubject = new Subject<AppMessage | null>();

  // Este es el Observable al que los componentes se suscribirán para recibir mensajes.
  // Usamos .asObservable() para que los componentes no puedan "emitir" mensajes, solo "escuchar".
  messages$ = this.messageSubject.asObservable();

  constructor() { }

  /**
   * Muestra un mensaje de alerta en la UI.
   * @param text El contenido del mensaje.
   * @param type El tipo de mensaje ('success', 'error', 'info', 'warning').
   */
  mostrarAlerta(text: string, type: AppMessage['type']): void {
    this.messageSubject.next({ text, type });

    // Opcional: Oculta el mensaje automáticamente después de 5 segundos
    setTimeout(() => this.clearMessage(), 5000);
  }

  /**
   * Oculta el mensaje actual.
   */
  clearMessage(): void {
    this.messageSubject.next(null);
  }
}