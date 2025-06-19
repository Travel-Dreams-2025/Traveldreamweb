// src/app/components/pago-exito/pago-exito.component.ts
import { Component, OnInit } from '@angular/core'; // Añade OnInit
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // Para la llamada al backend, asumiendo HttpClient

@Component({
  selector: 'app-pago-exito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pago-exito.component.html',
  styleUrl: './pago-exito.component.css'
})
export class PagoExitoComponent implements OnInit { // Implementa OnInit
  paymentId: string | null = null;
  status: string | null = null;
  externalReference: string | null = null;

  // Puedes añadir una variable para el estado de la verificación
  verificandoPago: boolean = true; 
  pagoVerificadoExito: boolean = false;
  errorVerificacion: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient // Inyecta HttpClient para las llamadas HTTP
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.paymentId = params['payment_id'] || params['collection_id'] || null;
      this.status = params['collection_status'] || params['status'] || null; // 'approved', 'pending', 'rejected'
      this.externalReference = params['external_reference'] || null;

      console.log('PagoExitoComponent: Parámetros recibidos de Mercado Pago:', params);
      console.log('ID de Pago:', this.paymentId);
      console.log('Estado del Pago:', this.status);
      console.log('Referencia Externa (tu ID de orden):', this.externalReference);

      // Si el pago no fue aprobado o no hay ID, quizás no hacemos la verificación o mostramos un error
      if (this.paymentId && this.status === 'approved') { // Solo verifica si el estado es 'approved'
        this.verificarPagoEnBackend(this.paymentId, this.externalReference);
      } else {
        this.verificandoPago = false; // No hay necesidad de verificar si no hay ID o no está aprobado
        this.errorVerificacion = 'No se pudo verificar el pago, estado no aprobado o ID faltante.';
        // Podrías redirigir a una página de fallo o pendiente si el status no es 'approved'
        if (this.status === 'pending') {
             this.router.navigate(['/pago-pendiente'], { queryParams: params });
        } else if (this.status === 'rejected') {
             this.router.navigate(['/pago-fallido'], { queryParams: params });
        }
      }
    });
  }

  verificarPagoEnBackend(paymentId: string, externalReference: string | null): void {
    // URL de tu endpoint de backend para verificar el pago
    const backendVerifyUrl = 'TU_URL_DEL_BACKEND/api/pagos/verificar-mp'; 
    
    // Envía el paymentId y externalReference a tu backend
    this.http.post(backendVerifyUrl, { paymentId, externalReference }).subscribe({
      next: (response: any) => {
        console.log('Pago verificado en backend:', response);
        this.verificandoPago = false;
        if (response.success) { // Asume que tu backend devuelve un 'success: true'
          this.pagoVerificadoExito = true;
          // Aquí puedes actualizar la UI o redirigir al usuario si es necesario
        } else {
          this.errorVerificacion = response.message || 'Error al verificar el pago en el backend.';
        }
      },
      error: (err) => {
        console.error('Error al verificar pago en backend:', err);
        this.verificandoPago = false;
        this.errorVerificacion = 'Ocurrió un error al verificar tu pago. Por favor, contacta a soporte.';
      }
    });
  }

  volverAlDashboard(): void {
    // Si la página de éxito está en una pestaña separada, intentar cerrarla
    // Esto solo funciona si la pestaña fue abierta por el script.
    if (window.opener && !window.opener.closed) {
      // Opcional: enviar un mensaje a la ventana original si aún está abierta
      // window.opener.postMessage('pagoCompletado', 'http://localhost:4200'); 
      window.close(); // Intenta cerrar esta pestaña
    } else {
      // Si no se puede cerrar la pestaña o no hay ventana original, redirige dentro de la misma
      this.router.navigate(['/app-dash']); 
    }
  }
}