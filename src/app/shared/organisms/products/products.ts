import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCard } from '../../molecules/product-card/product-card';
import { ProductsApiResponse } from '../../../core/services/products.service';
import { PaginationEvent, PaginatorComponent } from "../../molecules/paginator/paginator";


@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCard, PaginatorComponent],
  templateUrl: './products.html',
  styleUrl: './products.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Products {
  dataApi = input<ProductsApiResponse | null>();
  inputPaginated = input<PaginationEvent | null>(null);
  paginated = output<PaginationEvent>();
  selectedCollection: string = '';

  onPageChange(event: PaginationEvent): void {
    this.paginated.emit(event);
  }
  /* get collectionOptions(): { label: string, value: string }[] {
    if (!this.selectedBrand) return [];
    const collections = Array.from(new Set(
      this.dataApi()?.data.filter((p: Product) => p.brand === this.selectedBrand).map((p: Product) => p.collection)
    ));
    return [
      { label: 'Todas las colecciones', value: '' },
      ...collections.map(c => ({ label: c, value: c }))
    ];
  } */
  /* public readonly brands = [
    { key: 'Kerastase', label: 'Kérastase' },
    { key: 'Loreal', label: `L'Oréal Proffesionnel` }
  ];
  private readonly productsService = inject(ProductsService);

  products: Product[] = this.productsService.getProducts();

  // Tipos de producto para el filtro horizontal (con imagen)
  productTypes = [
    { label: 'Todos', value: '', image: '' },
    { label: 'Shampoo', value: 'Shampoo', image: 'images/absolutRepairMolecular.jpg' },
    { label: 'Acondicionador', value: 'Acondicionador', image: 'images/vitaminoColorSpectrum.jpg' },
    { label: 'Mascarilla', value: 'Mascarilla', image: 'images/kerastase.png' },
    { label: 'Serum', value: 'Serum', image: 'images/kerastase.png' },
    { label: 'Crema Termoprotectora', value: 'Crema Termoprotectora', image: 'images/kerastase.png' },
  ]; */

/*
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
  this.selectedCollection = '';
}

// Handler para el cambio de colección (sidebar)
onCollectionChange(collection: string) {
  this.selectedCollection = collection;
}

get filteredProductsByBrand(): Record<string, Product[]> {
  const filterType = this.selectedType;
  const sort = this.selectedSort;
  const selectedBrand = this.selectedBrand;
  const selectedCollection = this.selectedCollection;
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
      .filter(p =>
        p.brand === brand &&
        (filterType === '' || p.type === filterType) &&
        (!selectedCollection || p.collection === selectedCollection)
      )
      .slice()
      .sort(sortFn);
  }
  return result;
}
 */

}

