export interface Destino {
  id_destino: number;
  nombre_Destino: string;
  descripcion: string;
  image: string;
  precio_Destino: number;
  fecha_salida: string | Date;
  cantidad_Disponible: number;
  // Nuevas propiedades opcionales
  estaVigente?: boolean;
  tieneCupo?: boolean;
  mostrarSoldOut?: boolean;
}