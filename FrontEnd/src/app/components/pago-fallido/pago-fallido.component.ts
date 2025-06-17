import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-pago-fallido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pago-fallido.component.html',
  styleUrl: './pago-fallido.component.css'
})
export class PagoFallidoComponent implements OnInit {
  status: string | null = null;
  reason: string | null = null;
  externalReference: string | null = null;
  paymentId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.status = params['collection_status'] || params['status'] || null;
      // 'reason' es más genérico, 'status_detail' es de MP
      this.reason = params['reason'] || params['status_detail'] || null; 
      this.externalReference = params['external_reference'] || null;
      this.paymentId = params['payment_id'] || params['collection_id'] || null;

      console.log('PagoFallidoComponent: Parámetros recibidos de Mercado Pago:', params);
      console.log('Estado del Pago Fallido:', this.status);
      console.log('Motivo del Fallo:', this.reason);
      console.log('Referencia Externa (tu ID de orden):', this.externalReference);
      console.log('ID de Pago:', this.paymentId);

      // Opcional: Aquí podrías querer enviar esta información a tu backend
      // para registrar el intento fallido de pago o notificar al usuario/administrador.
      // this.miServicioDePagos.registrarPagoFallido(this.paymentId, this.externalReference, this.reason).subscribe(
      //   () => console.log('Intento de pago fallido registrado en backend'),
      //   (err) => console.error('Error al registrar pago fallido:', err)
      // );
    });
  }

  // Método para que el usuario pueda volver a su carrito o intentar de nuevo
  volverAlCarrito(): void {
    // Intenta cerrar la pestaña actual. Solo funciona si la pestaña fue abierta por JS.
    if (window.opener && !window.opener.closed) {
      window.close(); 
    } else {
      // Si no se puede cerrar la pestaña, redirige dentro de la misma
      this.router.navigate(['/destinos-cart']); 
    }
  }

  // Método para ir al dashboard
  irAlDashboard(): void {
    // Intenta cerrar la pestaña actual. Solo funciona si la pestaña fue abierta por JS.
    if (window.opener && !window.opener.closed) {
      window.close();
    } else {
      // Si no se puede cerrar la pestaña, redirige dentro de la misma
      this.router.navigate(['/app-dash']);
    }
  }
}