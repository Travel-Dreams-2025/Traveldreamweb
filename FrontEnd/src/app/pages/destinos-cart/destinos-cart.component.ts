import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../services/carrito.service';
import { Destino } from '../../models/destinos';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Component({
  selector: 'app-destinos-cart',
  standalone: true,
  imports: [CommonModule,FormsModule, RouterModule],
  templateUrl: './destinos-cart.component.html',
  styleUrls: ['./destinos-cart.component.css']
})
export class DestinosCartComponent implements OnInit {
  carritoItems: any[] = [];
  destinos: Destino[] = []; // Aunque se obtiene, no parece usarse directamente en la plantilla actual para cada item del carrito.
  total: number = 0;
  defaultImage = 'url_de_imagen_por_defecto'; // Considera reemplazar esta URL con una imagen por defecto real
  metodosPago: any[] = [];
  metodoPagoSeleccionado: string = ''; // Es un string porque viene del value de un select HTML
  selectAll: boolean = false; // Property for the "Select All" checkbox

  constructor(private carritoService: CarritoService, private router: Router) {}

  ngOnInit(): void {
    this.obtenerCarrito();
    // obtenerDestinos() ya no es estrictamente necesario en ngOnInit si combinarDatos se maneja con la respuesta de obtenerCarrito
    // pero lo mantengo por si se usa en otra parte o para una futura mejora
    this.obtenerDestinos();
    this.obtenerMetodosPago();
  }

  obtenerMetodosPago(): void {
    this.carritoService.obtenerMetodosPago().subscribe({
      next: (metodos: any[]) => {
        this.metodosPago = metodos;
        // Asegurarse de que el método de pago seleccionado sea numérico if el value en el HTML es string
        // Esto se manejará en la función checkout
      },
      error: (error: any) => {
        console.error('Error al obtener los métodos de pago', error);
      }
    });
  }

  obtenerCarrito(): void {
    this.carritoService.obtenerCarrito().subscribe({
      next: (items: any[]) => {
        // Suponiendo que la respuesta del backend incluye id_destino, cantidad, precio_Destino, image, descripcion, fecha_salida y id_compra
        this.carritoItems = items.map(item => ({
          ...item,
          cantidad: Number(item.cantidad), // Asegúrate de que cantidad sea un número
          selected: true // Add 'selected' property and set to true by default
          // Si la fecha_salida viene como string en el formato correcto, se usará directamente
          // Si item ya incluye nombre_Destino, image, descripcion y precio_Destino del backend /cart/,
          // la llamada a obtenerDestinos y combinarDatos podría simplificarse o eliminarse.
          // Por ahora, mantenemos combinarDatos por si /cart/ no trae toda la info del destino.
        }));
         // Llama a combinarDatos después de obtener los ítems del carrito
        this.combinarDatos();
        this.selectAll = true; // Set "Select All" to true initially
      },
      error: (error: any) => {
        console.error('Error al obtener el carrito', error);
        this.carritoItems = []; // Limpiar el carrito si hay un error al obtenerlo
        this.calcularTotal(); // Recalcular total (será 0)
        this.selectAll = false; // Set "Select All" to false if cart is empty
      }
    });
  }

  // Esta función combina los detalles completos del destino con los ítems del carrito.
  // Es útil si la respuesta de /cart/ solo trae id_destino y cantidad, y necesitas
  // precio_Destino, nombre, descripción, etc., de /destinos/.
  // If /cart/ already trae todos los detalles del destino, esta función y obtenerDestinos() podrían no ser necesarios.
  combinarDatos(): void {
    // Solo combinar si hay ítems en el carrito Y destinos cargados
    if (this.carritoItems.length > 0 && this.destinos.length > 0) {
      this.carritoItems.forEach(item => {
        // Busca el destino completo en la lista de destinos cargada
        const destino = this.destinos.find(d => d.id_destino === item.id_destino);
        if (destino) {
          // Agrega los detalles del destino al ítem del carrito si no están ya presentes
          item.nombre_Destino = item.nombre_Destino || destino.nombre_Destino;
          item.descripcion = item.descripcion || destino.descripcion;
          item.image = item.image || destino.image; // Si item.image es null or undefined, usa destino.image
          item.precio_Destino = item.precio_Destino || destino.precio_Destino; // Asegúrate de tener el precio aquí

          // Asegúrate de que la fecha de salida estÃ© presente si no vino en la respuesta del carrito
          // Si la fecha viene del backend en el item del carrito, usala. Si no, podrías establecer una por defecto.
          // item.fecha_salida = item.fecha_salida || 'Fecha no disponible'; // Ejemplo si no viene del backend
        } else {
           console.warn(`Detalles del destino con ID ${item.id_destino} no encontrados.`);
           // Manejar el caso donde el destino no se encuentra (ej. eliminar el ítem o mostrar un error)
        }
      });
      this.calcularTotal(); // Recalcular el total después de combinar datos
    } else if (this.carritoItems.length > 0 && this.destinos.length === 0) {
       console.warn('Hay ítems en el carrito pero no se cargaron los destinos. No se pueden combinar datos.');
       this.calcularTotal(); // Calcular total solo con los datos disponibles si no se pueden combinar
    } else {
      this.total = 0; // Si no hay ítems en el carrito, el total es 0
    }
  }


  // Método para obtener la lista completa de destinos (usado por combinarDatos si es necesario)
  obtenerDestinos(): void {
    this.carritoService.obtenerDestinos().subscribe({
      next: (destinos: Destino[]) => {
        this.destinos = destinos;
         // Llama a combinarDatos después de obtener los destinos
        this.combinarDatos();
      },
      error: (error: any) => {
        console.error('Error al obtener los destinos', error);
        this.destinos = []; // Limpiar destinos si hay un error al obtenerlos
        this.combinarDatos(); // Intentar combinar con la lista de destinos vacía (no hará nada)
      }
    });
  }


  eliminarItem(id: number): void {
    this.carritoService.eliminarItem(id).subscribe({
      next: () => {
        this.obtenerCarrito(); // Recargar el carrito después de eliminar
      },
      error: (error: any) => {
        console.error('Error al eliminar el item del carrito', error);
        alert('Error al eliminar el ítem. Inténtelo de nuevo.');
      }
    });
  }

  // Actualiza la cantidad de un ítem en el backend y recalcula el total
  actualizarCantidad(item: any, nuevaCantidad: number): void {
    if (item.id_compra === undefined) {
      console.error('El id del item está undefined:', item);
      // Considerar eliminar este ítem del array carritoItems si no tiene id_compra
      return;
    }

    // Asegurarse de que la nueva cantidad sea un número entero positivo
    nuevaCantidad = Math.max(1, Math.floor(Number(nuevaCantidad)));

    // Si la cantidad no ha cambiado o es inválida (aunque Math.max(1, ...) lo previene), no hacer la llamada API
    if (nuevaCantidad === item.cantidad) {
        return;
    }

    // Opcional: Deshabilitar botones de cantidad o mostrar un spinner mientras actualiza
    // item.updatingQuantity = true; // You can add this property to the item

    this.carritoService.actualizarItem(item.id_compra, nuevaCantidad).subscribe({
      next: () => {
        item.cantidad = nuevaCantidad; // Actualiza la cantidad localmente
        this.calcularTotal(); // Recalcula el total del carrito
        // item.updatingQuantity = false; // Habilitar botones o ocultar spinner
      },
      error: (error: any) => {
        console.error('Error al actualizar la cantidad del item', error);
        alert('Error al actualizar la cantidad. Inténtelo de nuevo.');
        // item.updatingQuantity = false; // Habilitar botones o ocultar spinner
        // Opcional: Revertir la cantidad local a item.cantidad original si la llamada falla
      }
    });
  }

  // Calcula el total sumando el precio total de cada ítem seleccionado
  calcularTotal(): void {
      this.total = this.carritoItems.reduce((sum, item) =>
        sum + (item.selected ? (Number(item.precio_Destino) || 0) * (Number(item.cantidad) || 0) : 0), 0);
  }

  // Handle individual checkbox change and update total
  updateTotal(): void {
    this.calcularTotal();
    // Update "Select All" checkbox state based on individual checkboxes
    this.selectAll = this.carritoItems.every(item => item.selected);
  }

  // Handle "Select All" checkbox change
  toggleSelectAll(): void {
    this.carritoItems.forEach(item => item.selected = this.selectAll);
    this.calcularTotal();
  }


  // Método para proceder al checkout de los ítems seleccionados
  checkout(): void {
    if (!this.metodoPagoSeleccionado) {
      alert('Por favor, seleccione un método de pago.');
      return;
    }

    const selectedItems = this.carritoItems.filter(item => item.selected);

    if (selectedItems.length === 0) {
      alert('No hay ítems seleccionados en tu carrito para proceder al checkout.');
      return;
    }


    // Convertir el id del mÃ©todo de pago a nÃºmero
    const metodoPagoIdNumerico = Number(this.metodoPagoSeleccionado);
    if (isNaN(metodoPagoIdNumerico) || metodoPagoIdNumerico <= 0) { // Validar que sea un nÃºmero positivo
      console.error('MÃ©todo de pago seleccionado no es un nÃºmero vÃ¡lido:', this.metodoPagoSeleccionado);
      alert('Error: El mÃ©todo de pago seleccionado no es vÃ¡lido.');
      return;
    }

    // Array para almacenar los Observables de cada compra individual
    const checkoutObservables: Observable<any>[] = [];

    selectedItems.forEach(item => {
      // Para cada Ã\u00adtems seleccionado en el carrito, creamos un Observable de compra individual
      // Usamos los datos id_destino y cantidad del Ã\u00adtem, y el mÃ©todo de pago seleccionado
      if (item.id_destino && item.cantidad > 0) { // Validar que el Ã\u00adtem tenga un id_destino y cantidad vÃ¡lida
         checkoutObservables.push(
            this.carritoService.checkout(item.id_destino, item.cantidad, metodoPagoIdNumerico).pipe(
              tap(response => {
                console.log(`Compra de destino ${item.nombre_Destino || item.id_destino} (x${item.cantidad}) exitosa:`, response);
                // AquÃ\u00ad podrÃ\u00adas eliminar el Ã\u00adtem del carrito localmente si la compra fue exitosa
                // o dejar que la llamada a obtenerCarrito() despuÃ©s del forkJoin actualice el estado
              }),
              catchError(error => {
                console.error(`Error al comprar destino ${item.nombre_Destino || item.id_destino} (x${item.cantidad}):`, error);
                // Devolver un observable que emite un valor (p.ej., un objeto con 'success: false')
                // para que forkJoin no falle por completo si una sola compra falla.
                // Incluimos el Ã\u00adtem en el objeto de error para referencia
                return of({ success: false, item: item, error: error });
              })
            )
          );
      } else {
         console.warn('Ã\u00adtem invÃ¡lido en el carrito, omitiendo checkout:', item);
         // Considerar mostrar una alerta al usuario sobre Ã\u00adtems invÃ¡lidos
      }
    });


    // Ejecutar todas las llamadas de checkout concurrentemente si hay observables vÃ¡lidos
    if (checkoutObservables.length > 0) {
        // Opcional: Mostrar un spinner global mientras se procesa el checkout
        // this.processingCheckout = true;

        forkJoin(checkoutObservables).subscribe({
          next: (results) => {
            // this.processingCheckout = false; // Ocultar spinner

            let allSuccessful = true;
            let successCount = 0;
            let errorCount = 0;
            const failedItems: any[] = []; // Para listar los Ã\u00adtems que fallaron

            results.forEach(result => {
              if (result && result.success === false) {
                allSuccessful = false;
                errorCount++;
                if (result.item) {
                    failedItems.push(result.item);
                }
              } else {
                successCount++;
              }
            });

            // Construir mensaje de alerta basado en los resultados
            let alertMessage = '';
            let alertType = '';

            if (allSuccessful) {
              alertMessage = 'Todos los ítems seleccionados comprados con éxito.';
              alertType = 'success';
            } else {
               alertMessage = `Se compraron ${successCount} de ${selectedItems.length} ítems seleccionados.`;
               if (errorCount > 0) {
                 alertMessage += ` Fallaron ${errorCount} ítems.`;
                 // Puedes añadir detalles de los ítems fallidos al mensaje si lo deseas
                 // alertMessage += ' Ítems fallidos: ' + failedItems.map(item => item.nombre_Destino || item.id_destino).join(', ');
                 alertMessage += ' Revisa la consola para más detalles específicos de cada fallo.';
               }
               alertType = successCount > 0 ? 'warning' : 'danger'; // warning si algunos pasaron, danger si fallaron todos
            }

            alert(alertMessage); // Mostrar alerta con el resumen

            // DespuÃ©s de intentar todas las compras, recargamos el carrito.
            // Si el backend elimina los Ã\u00adtems comprados exitosamente, esto limpiarÃ¡ el carrito
            // o dejarÃ¡ solo los Ã\u00adtems fallidos.
            this.obtenerCarrito();

            // Si todas las compras fueron exitosas, redirigimos
            if (allSuccessful) {
               this.router.navigate(['/destinos']); // Redirigir a la pÃ¡gina de destinos
            }
             // Si hubo fallos, nos quedamos en la pÃ¡gina del carrito (que se refrescarÃ¡ con obtenerCarrito)


          },
          error: (err) => {
            // Este bloque solo se ejecutarÃ\u00ada si forkJoin falla por una razÃ³n general (ej. problema de red serio),
            // no si las llamadas individuales fallan y se manejan con catchError.
            console.error('Error inesperado en el proceso de checkout:', err);
            alert('Error general al intentar finalizar la compra. IntÃ©ntelo de nuevo.');
            // this.processingCheckout = false; // Ocultar spinner
             this.obtenerCarrito(); // Intentar refrescar el carrito incluso en caso de error general
          }
        });
    } else {
        console.warn("No hay observables de checkout vÃ¡lidos para procesar.");
        alert('No hay ítems seleccionados en el carrito para comprar.');
        // No need to call obtenerCarrito() here as selectedItems was already checked
    }
  }

  // Nuevo método para comprar un solo ítem
  buyNow(item: any): void {
    if (!this.metodoPagoSeleccionado) {
      alert('Por favor, seleccione un método de pago.');
      return;
    }

    // Convertir el id del método de pago a número
    const metodoPagoIdNumerico = Number(this.metodoPagoSeleccionado);
    if (isNaN(metodoPagoIdNumerico) || metodoPagoIdNumerico <= 0) { // Validar que sea un número positivo
      console.error('Método de pago seleccionado no es un número válido:', this.metodoPagoSeleccionado);
      alert('Error: El método de pago seleccionado no es válido.');
      return;
    }

    // Validar que el ítem tenga los datos necesarios
    if (!item.id_destino || item.cantidad <= 0) {
      console.warn('Ítem inválido para comprar ahora:', item);
      alert('No se puede comprar este ítem. Datos incompletos o cantidad inválida.');
      return;
    }

    // Realizar el checkout para el single item
    this.carritoService.checkout(item.id_destino, item.cantidad, metodoPagoIdNumerico).subscribe({
      next: (response) => {
        console.log(`Compra de destino ${item.nombre_Destino || item.id_destino} (x${item.cantidad}) exitosa:`, response);
        alert(`¡Compra de "${item.nombre_Destino || 'ítem'}" realizada con éxito!`);
        this.obtenerCarrito(); // Recargar el carrito después de la compra exitosa
        this.router.navigate(['/destinos']); // Redirigir a la página de destinos
      },
      error: (error) => {
        console.error(`Error al comprar destino ${item.nombre_Destino || item.id_destino} (x${item.cantidad}):`, error);
        alert('Error al realizar la compra. Inténtelo de nuevo.');
      }
    });
  }


  // ELIMINADO: Este mÃ©todo ya no es necesario porque la fecha no es editable por el usuario.
  /*
  actualizarFecha(item: any): void {
    if (item.id_compra === undefined) {
      console.error('El id del item estÃ¡ undefined:', item);
      return;
    }

    const nuevaFecha = item.fecha_salida;
    this.carritoService.actualizarFecha(item.id_compra, nuevaFecha).subscribe({
      next: () => {
        item.fecha_salida = nuevaFecha; // Actualiza la fecha localmente
        console.log('Fecha de salida actualizada:', nuevaFecha);
      },
      error: (error: any) => {
        console.error('Error al actualizar la fecha de salida', error);
      }
    });
  }
  */
}