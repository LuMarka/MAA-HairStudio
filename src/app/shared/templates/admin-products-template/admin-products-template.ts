
import { Component, signal } from '@angular/core';
import { Product } from '../../../core/models/interfaces/Product.interface';

@Component({
  selector: 'app-admin-products-template',
  templateUrl: './admin-products-template.html',
  styleUrl: './admin-products-template.scss',
  standalone: true,
})
export class AdminProductsTemplate {
    editingProduct = signal<Product|null>(null);

    openEditModal(product: Product) {
      // Copia para edición segura
      this.editingProduct.set({ ...product });
    }

    closeEditModal() {
      this.editingProduct.set(null);
    }

    submitEditProduct(event: Event) {
      event.preventDefault();
      const form = event.target as HTMLFormElement;
      const elements = form.elements as any;
      const updated: Product = {
        id: this.editingProduct()!.id,
        name: elements.namedItem('name').value,
        brand: elements.namedItem('brand').value,
        collection: elements.namedItem('collection').value,
        type: elements.namedItem('type').value,
        description: elements.namedItem('description').value,
        price: Number(elements.namedItem('price').value),
        cantidad: Number(elements.namedItem('cantidad').value),
        image: elements.namedItem('image').value
      };
      this.products.update(list => list.map(p => p.id === updated.id ? updated : p));
      this.closeEditModal();
    }
  // Estado local de productos (mock inicial)
  products = signal<Product[]>([
    {
      id: 1,
      name: 'Bain Satin Riche',
      brand: 'Kerastase',
      collection: 'Nutritive',
      type: 'Shampoo',
      description: 'Nutre y limpia el cabello seco.',
      price: 1200,
      cantidad: 10,
      image: 'https://example.com/img1.jpg'
    },
    {
      id: 2,
      name: 'Masquintense',
      brand: 'Kerastase',
      collection: 'Nutritive',
      type: 'Mascarilla',
      description: 'Tratamiento intenso para cabello seco.',
      price: 1800,
      cantidad: 5,
      image: 'https://example.com/img2.jpg'
    }
  ]);

  // Actualiza campo editable
  updateField(id: number, field: keyof Product, value: string | number) {
    this.products.update(list =>
      list.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  }

  // Guardar producto (simulado)
  saveProduct(id: number) {
    // Aquí iría la llamada al backend para guardar cambios
    alert('Producto guardado: ' + id);
  }

  // Eliminar producto
  deleteProduct(id: number) {
    this.products.update(list => list.filter(p => p.id !== id));
  }

  // Agregar producto
  addProduct(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const elements = form.elements as any;
    const name = elements.namedItem('name').value;
    const brand = elements.namedItem('brand').value;
    const collection = elements.namedItem('collection').value;
    const type = elements.namedItem('type').value;
    const description = elements.namedItem('description').value;
    const price = Number(elements.namedItem('price').value);
    const cantidad = Number(elements.namedItem('cantidad').value);
    const image = elements.namedItem('image').value;

    // Si ya existe, suma stock
    let updated = false;
    this.products.update(list => list.map(p => {
      if (
        p.name === name &&
        p.brand === brand &&
        p.collection === collection &&
        p.type === type
      ) {
        updated = true;
        return { ...p, cantidad: p.cantidad + cantidad };
      }
      return p;
    }));
    if (!updated) {
      const newProduct: Product = {
        id: Date.now(),
        name,
        brand,
        collection,
        type,
        description,
        price,
        cantidad,
        image
      };
      this.products.update(list => [...list, newProduct]);
    }
    form.reset();
  }
}
