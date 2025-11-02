import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilters {
  search: string;
  category: string;
  status: 'all' | 'active' | 'inactive';
  sortBy: 'name' | 'price' | 'stock' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-admin-products-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-products-manager.html',
  styleUrl: './admin-products-manager.scss'
})
export class AdminProductsManager implements OnInit {
  // Product management state
  products = signal<Product[]>([]);
  selectedProducts = signal<Set<string>>(new Set());
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Modal states
  showAddModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  currentProduct = signal<Product | null>(null);

  // Filters
  filters = signal<ProductFilters>({
    search: '',
    category: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Categories (this should come from a service)
  categories = signal<string[]>([
    'Champú',
    'Acondicionador',
    'Mascarillas',
    'Serum',
    'Crema Termoprotectora',
    'Crema para Peinar',
  ]);

  // Forms
  productForm: FormGroup;

  // Computed values
  filteredProducts = computed(() => {
    let filtered = this.products();
    const currentFilters = this.filters();

    // Search filter
    if (currentFilters.search) {
      const search = currentFilters.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (currentFilters.category) {
      filtered = filtered.filter(product => product.category === currentFilters.category);
    }

    // Status filter
    if (currentFilters.status !== 'all') {
      const isActive = currentFilters.status === 'active';
      filtered = filtered.filter(product => product.isActive === isActive);
    }

    // Sort
    filtered.sort((a, b) => {
      const { sortBy, sortOrder } = currentFilters;
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'stock':
          comparison = a.stock - b.stock;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  });

  selectedCount = computed(() => this.selectedProducts().size);

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.productForm = this.createProductForm();
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  private createProductForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      category: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      image: ['', Validators.required],
      isActive: [true]
    });
  }

  // CRUD Operations
  async loadProducts(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Shampoo Kérastase Nutritive',
          description: 'Shampoo nutritivo para cabello seco',
          price: 15000,
          category: 'Champú',
          stock: 25,
          image: '/images/products/kerastase-nutritive.jpg',
          isActive: true,
          createdAt: new Date('2023-01-15'),
          updatedAt: new Date('2023-01-15')
        },
        {
          id: '2',
          name: 'Mascarilla Olaplex No.3',
          description: 'Tratamiento reconstructor de enlaces',
          price: 28000,
          category: 'Tratamientos',
          stock: 15,
          image: '/images/products/olaplex-3.jpg',
          isActive: true,
          createdAt: new Date('2023-01-10'),
          updatedAt: new Date('2023-01-10')
        }
      ];

      this.products.set(mockProducts);
    } catch (error) {
      this.error.set('Error al cargar productos');
      console.error('Products loading error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveProduct(event?: Event): Promise<void> {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    try {
      const formData = this.productForm.value;

      if (this.currentProduct()) {
        // Update existing product
        await this.updateProduct(this.currentProduct()!.id, formData);
      } else {
        // Create new product
        await this.createProduct(formData);
      }

      this.closeModals();
    } catch (error) {
      this.error.set('Error al guardar producto');
      console.error('Product save error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async createProduct(data: Partial<Product>): Promise<void> {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create new product with generated ID
    const newProduct: Product = {
      id: Date.now().toString(), // Simple ID generation
      name: data.name || '',
      description: data.description || '',
      price: data.price || 0,
      category: data.category || '',
      stock: data.stock || 0,
      image: data.image || '/images/products/default.jpg',
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to local state
    this.products.update(products => [newProduct, ...products]);
    console.log('Product created:', newProduct);
  }

  private async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update in local state
    this.products.update(products =>
      products.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date() } : p)
    );
    console.log('Product updated:', id, data);
  }

  async deleteProduct(id: string): Promise<void> {
    this.isLoading.set(true);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Remove from local state
      this.products.update(products => products.filter(p => p.id !== id));
      this.closeModals();
    } catch (error) {
      this.error.set('Error al eliminar producto');
      console.error('Product delete error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteSelectedProducts(): Promise<void> {
    const selectedIds = Array.from(this.selectedProducts());

    if (selectedIds.length === 0) return;

    this.isLoading.set(true);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Remove from local state
      this.products.update(products =>
        products.filter(p => !selectedIds.includes(p.id))
      );

      this.selectedProducts.set(new Set());
    } catch (error) {
      this.error.set('Error al eliminar productos seleccionados');
      console.error('Bulk delete error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Modal management
  openAddModal(): void {
    this.currentProduct.set(null);
    this.productForm.reset();
    this.productForm.patchValue({ isActive: true });
    this.showAddModal.set(true);
  }

  openEditModal(product: Product): void {
    this.currentProduct.set(product);
    this.productForm.patchValue(product);
    this.showEditModal.set(true);
  }

  openDeleteModal(product: Product): void {
    this.currentProduct.set(product);
    this.showDeleteModal.set(true);
  }

  closeModals(): void {
    this.showAddModal.set(false);
    this.showEditModal.set(false);
    this.showDeleteModal.set(false);
    this.currentProduct.set(null);
  }

  // Selection management
  toggleProductSelection(productId: string): void {
    this.selectedProducts.update(selected => {
      const newSelected = new Set(selected);
      if (newSelected.has(productId)) {
        newSelected.delete(productId);
      } else {
        newSelected.add(productId);
      }
      return newSelected;
    });
  }

  toggleAllSelection(): void {
    const filtered = this.filteredProducts();
    const selected = this.selectedProducts();

    if (selected.size === filtered.length) {
      // Deselect all
      this.selectedProducts.set(new Set());
    } else {
      // Select all filtered
      this.selectedProducts.set(new Set(filtered.map(p => p.id)));
    }
  }

  // Filter management
  updateFilters(updates: Partial<ProductFilters>): void {
    this.filters.update(current => ({ ...current, ...updates }));
  }

  // Event handlers for form elements
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateFilters({ search: target.value || '' });
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateFilters({ category: target.value || '' });
  }

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateFilters({ status: target.value as ProductFilters['status'] });
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateFilters({ sortBy: target.value as ProductFilters['sortBy'] });
  }

  clearFilters(): void {
    this.filters.set({
      search: '',
      category: '',
      status: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  }

  // Utility methods
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  }

  getStockStatus(stock: number): 'high' | 'medium' | 'low' | 'out' {
    if (stock === 0) return 'out';
    if (stock <= 5) return 'low';
    if (stock <= 15) return 'medium';
    return 'high';
  }
}
