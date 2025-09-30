
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Injectable } from '@angular/core';
import { ProductCard } from '../../molecules/product-card/product-card';

interface Product {
  id: number;
  name: string;
  brand: 'Loreal' | 'Kerastase';
  collection: string; // en lugar de familia
  type: string;       // shampoo, conditioner, etc.
  description: string;
  price: number;
  image: string;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  getProducts(): Product[] {
    return [
      // Kerastase
      {
        id: 1,
        name: 'Bain Satin 2',
        brand: 'Kerastase',
        collection: 'Nutritive',
        type: 'Shampoo',
        description:
          'Shampoo nutritivo para cabello seco a muy seco. Limpia, nutre y suaviza el cabello.',
        price: 14500,
        image: 'images/ker_nutritive.jpg',
      },
      {
        id: 4,
        name: 'Masquintense',
        brand: 'Kerastase',
        collection: 'Nutritive',
        type: 'Máscara',
        description: 'Tratamiento intensivo para nutrir profundamente el cabello seco.',
        price: 18500,
        image: 'images/kerastase.png',
      },
      {
        id: 6,
        name: 'Ciment Thermique',
        brand: 'Kerastase',
        collection: 'Resistance',
        type: 'Crema Termoprotectora',
        description: 'Protege el cabello del calor y refuerza la fibra capilar.',
        price: 16000,
        image: '/images/kerastase.png',
      },
      {
        id: 7,
        name: 'Elixir Ultime',
        brand: 'Kerastase',
        collection: 'Elixir',
        type: 'Aceite',
        description: 'Aceite sublimador multiusos para todo tipo de cabello.',
        price: 21000,
        image: '/images/kerastase.png',
      },
      {
        id: 9,
        name: 'Genesis Bain Hydra-Fortifiant',
        brand: 'Kerastase',
        collection: 'Genesis',
        type: 'Shampoo',
        description: 'Shampoo fortificante anti-caída para cabello debilitado.',
        price: 15500,
        image: 'images/kerastase.png',
      },
      {
        id: 10,
        name: 'Discipline Maskeratine',
        brand: 'Kerastase',
        collection: 'Discipline',
        type: 'Máscara',
        description: 'Máscara suavizante para controlar el frizz y dar movimiento.',
        price: 19500,
        image: 'images/kerastase.png',
      },
      // Loreal
      {
        id: 2,
        name: 'Absolut Repair',
        brand: 'Loreal',
        collection: 'Absolut Repair',
        type: 'Shampoo',
        description: 'Repara y fortalece el cabello dañado, dejándolo suave y brillante.',
        price: 13200,
        image: 'images/absolutRepairMolecular.jpg',
      },
      {
        id: 3,
        name: 'Vitamino Color',
        brand: 'Loreal',
        collection: 'Vitamino Color',
        type: 'Acondicionador',
        description: 'Protege y prolonga el color del cabello teñido, aportando suavidad y brillo.',
        price: 12000,
        image: 'images/vitaminoColorSpectrum.jpg',
      },
      {
        id: 5,
        name: 'Metal Detox',
        brand: 'Loreal',
        collection: 'Metal Detox',
        type: 'Shampoo',
        description: 'Elimina los metales del agua y protege el cabello de la rotura.',
        price: 15000,
        image: 'images/metalDetox.jpg',
      },
      {
        id: 8,
        name: 'Pro Longer',
        brand: 'Loreal',
        collection: 'Pro Longer',
        type: 'Shampoo',
        description: 'Shampoo renovador de largos para puntas más fuertes.',
        price: 13500,
        image: 'images/absolutRepairMolecular.jpg',
      },
      {
        id: 11,
        name: 'Inforcer',
        brand: 'Loreal',
        collection: 'Inforcer',
        type: 'Acondicionador',
        description: 'Acondicionador fortalecedor anti-quiebre para cabellos frágiles.',
        price: 12500,
        image: 'images/absolutRepairMolecular.jpg',
      },
      {
        id: 12,
        name: 'Blondifier',
        brand: 'Loreal',
        collection: 'Blondifier',
        type: 'Shampoo',
        description: 'Shampoo iluminador para cabellos rubios o decolorados.',
        price: 14000,
        image: 'images/absolutRepairMolecular.jpg',
      },
    ];
  }
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCard],
  templateUrl: './products.html',
  styleUrl: './products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Products {
  public readonly brands = [
    { key: 'Kerastase', label: 'Kerastase' },
    { key: 'Loreal', label: `L'Oréal Proffesionnel` }
  ];
  private readonly productsService = inject(ProductsService);

  products: Product[] = this.productsService.getProducts();

  // Tipos de producto para el filtro horizontal (con imagen)
  productTypes = [
    { label: 'Todos', value: '', image: '' },
    { label: 'Shampoo', value: 'Shampoo', image: 'images/absolutRepairMolecular.jpg' },
    { label: 'Acondicionador', value: 'Acondicionador', image: 'images/vitaminoColorSpectrum.jpg' },
    { label: 'Máscara', value: 'Máscara', image: 'images/kerastase.png' },
    { label: 'Aceite', value: 'Aceite', image: 'images/kerastase.png' },
    { label: 'Crema Termoprotectora', value: 'Crema Termoprotectora', image: 'images/kerastase.png' },
  ];


selectedType: string = '';

// Handler para el cambio de tipo de producto (filtro horizontal)
selectType(type: string) {
  this.selectedType = type;
}

// Opciones de ordenamiento (solo las requeridas)
sortOptions = [
  { label: 'Nombre, A-Z', value: 'name-asc' },
  { label: 'Nombre, Z-A', value: 'name-desc' },
  { label: 'Precio, ascendente', value: 'price-asc' },
  { label: 'Precio, descendente', value: 'price-desc' },
  { label: 'Descuento', value: 'discount' },
];

// Opciones de marcas para el filtro lateral
brandOptions = [
  { label: 'Todas las marcas', value: '' },
  { label: 'Kerastase', value: 'Kerastase' },
  { label: `L'Oréal Professionnel`, value: 'Loreal' },
];

selectedBrand: string = '';


selectedSort: string = 'name-asc';

// Handler para el cambio de ordenamiento (sidebar)
onSortChange(sort: string) {
  this.selectedSort = sort;
}

// Handler para el cambio de marca (sidebar)
onBrandChange(brand: string) {
  this.selectedBrand = brand;
}

get filteredProductsByBrand(): Record<string, Product[]> {
  const filterType = this.selectedType;
  const sort = this.selectedSort;
  const selectedBrand = this.selectedBrand;
  const sortFn = (a: Product, b: Product) => {
    switch (sort) {
      case 'price-desc': return b.price - a.price;
      case 'price-asc': return a.price - b.price;
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      // Lógica para descuento (ejemplo: productos con descuento primero)
      case 'discount': return 0; // Implementar si hay campo de descuento
      default: return 0;
    }
  };
  // Si hay una marca seleccionada, solo mostrar esa
  const brandsToShow = selectedBrand ? [selectedBrand] : ['Loreal', 'Kerastase'];
  const result: Record<string, Product[]> = {};
  for (const brand of brandsToShow) {
    result[brand] = this.products
      .filter(p => p.brand === brand && (filterType === '' || p.type === filterType))
      .slice()
      .sort(sortFn);
  }
  return result;
}


}

