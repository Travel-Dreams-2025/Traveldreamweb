import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService, AppMessage } from '../../services/message.service';
import { Subscription } from 'rxjs'; // Necesitas esta importación

@Component({
  selector: 'app-message-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-display.component.html',
  styleUrls: ['./message-display.component.css']
})
export class MessageDisplayComponent implements OnInit, OnDestroy {
  currentMessage: AppMessage | null = null;
  private messageSubscription: Subscription | undefined;

  constructor(private messageService: MessageService) { }

  ngOnInit(): void {
    this.messageSubscription = this.messageService.messages$.subscribe(message => {
      this.currentMessage = message;
    });
  }

  ngOnDestroy(): void {
    // Es importante verificar si la suscripción existe antes de intentar desuscribirse
    if (this.messageSubscription) { // <--- Asegúrate de que esta comprobación esté presente
      this.messageSubscription.unsubscribe();
    }
  }

  closeMessage(): void {
    this.messageService.clearMessage();
  }

  getMessageClass(): string {
    if (!this.currentMessage) return '';
    return `alert alert-${this.currentMessage.type}`;
  }
}