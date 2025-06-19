import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-pago-pendiente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pago-pendiente.component.html',
  styleUrl: './pago-pendiente.component.css'
})
export class PagoPendienteComponent implements OnInit {
  paymentId: string | null = null;
  status: string | null = null;
  externalReference: string | null = null;
  paymentType: string | null = null;
  barcode: string | null = null;
  barcodeUrl: string | null = null;
  transactionAmount: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.paymentId = params['payment_id'] || params['collection_id'] || null;
      this.status = params['collection_status'] || params['status'] || null;
      this.externalReference = params['external_reference'] || null;
      this.paymentType = params['payment_type'] || null;
      this.transactionAmount = params['transaction_amount'] ? parseFloat(params['transaction_amount']) : null;

      this.barcode = params['barcode'] || null;
      this.barcodeUrl = params['barcode_url'] || null;

      console.log('PagoPendienteComponent: Parámetros recibidos de Mercado Pago:', params);
      console.log('ID de Pago:', this.paymentId);
      console.log('Estado del Pago:', this.status);
      console.log('Referencia Externa:', this.externalReference);
      console.log('Tipo de Pago:', this.paymentType);
      console.log('Monto:', this.transactionAmount);
      console.log('Código de Barras:', this.barcode);
      console.log('URL Código de Barras:', this.barcodeUrl);

      // Opcional: Notificar a tu backend sobre el pago pendiente
      // Esto es útil para actualizar el estado del pedido a 'pendiente' en tu DB,
      // pero la acreditación final siempre debe venir por el webhook de Mercado Pago.
      // this.miServicioDePagos.registrarPagoPendiente(this.paymentId, this.externalReference, this.paymentType).subscribe(
      //   (response) => console.log('Pago pendiente registrado en backend:', response),
      //   (error) => console.error('Error al registrar pago pendiente en backend:', error)
      // );
    });
  }

  // Método para que el usuario pueda volver a su dashboard
  volverAlDashboard(): void {
    // Intenta cerrar la pestaña actual. Solo funciona si la pestaña fue abierta por JS.
    if (window.opener && !window.opener.closed) {
      window.close(); 
    } else {
      // Si no se puede cerrar la pestaña, redirige dentro de la misma
      this.router.navigate(['/app-dash']); 
    }
  }
}