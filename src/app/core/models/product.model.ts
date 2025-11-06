import { Category } from './interfaces/category.interface';

// Esta es la interfaz del Producto adaptada para la VISTA de Detalle.
// Contiene solo los campos necesarios de la interfaz 'Datum' de tu API.
export interface ProductDetailModel {
  id: string;
  name: string;          // BBDD: name
  volume: string;        // BBDD: volume (Tipo: string)
  originalPrice: number; // BBDD: originalPrice (precio tachado)
  price: number;         // BBDD: price (precio final)
  description: string;   // BBDD: description
  desiredResult: string; // BBDD: desired_result (Nombre corregido)
  type_hair: string;     // BBDD: type_hair (Nombre corregido)
  images: string[];      // Array de URLs de imágenes
  category: string;         // BBDD: brand (Marca)
}
