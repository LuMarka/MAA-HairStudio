import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meta } from '../../../core/models/interfaces/Product.interface';

export interface PaginationEvent {
  page: number;
  limit: number;
}

@Component({
  selector: 'app-paginator',
  imports: [CommonModule],
  templateUrl: './paginator.html',
  styleUrl: './paginator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginatorComponent {
  // Inputs
  readonly meta = input.required<Meta>();
  readonly entityName = input('elementos');
  readonly showPageSizeSelector = input(true);
  readonly pageSizeOptions = input([10, 20, 50, 100]);
  readonly maxVisiblePages = input(5);
  readonly disabled = input(false);

  // Output
  readonly pageChange = output<PaginationEvent>();

  // Computed values
  readonly showPagination = computed(() => this.meta().totalPages > 1);

  readonly currentPage = computed(() => this.meta().page);
  readonly totalPages = computed(() => this.meta().totalPages);
  readonly hasNextPage = computed(() => this.meta().hasNextPage);
  readonly hasPrevPage = computed(() => this.meta().hasPrevPage);
  readonly totalItems = computed(() => this.meta().total);
  readonly itemsPerPage = computed(() => this.meta().limit);

  readonly startItem = computed(() => {
    const meta = this.meta();
    return meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  });

  readonly endItem = computed(() => {
    const meta = this.meta();
    return Math.min(meta.page * meta.limit, meta.total);
  });

  readonly itemsInfo = computed(() => {
    const start = this.startItem();
    const end = this.endItem();
    const total = this.totalItems();
    const entity = this.entityName();

    if (total === 0) {
      return `No hay ${entity}`;
    }

    return `Mostrando ${start} - ${end} de ${total} ${entity}`;
  });

  readonly visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const maxVisible = this.maxVisiblePages();

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [];
    const delta = Math.floor(maxVisible / 2);

    let start = Math.max(1, current - delta);
    let end = Math.min(total, current + delta);

    // Ajustar ventana si estamos cerca de los extremos
    if (current <= delta) {
      end = Math.min(total, maxVisible);
    } else if (current + delta >= total) {
      start = Math.max(1, total - maxVisible + 1);
    }

    // Agregar primera página y ellipsis si es necesario
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }

    // Agregar páginas del rango visible
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Agregar ellipsis y última página si es necesario
    if (end < total) {
      if (end < total - 1) {
        pages.push('...');
      }
      pages.push(total);
    }

    return pages;
  });

  // Navigation methods
  goToFirstPage(): void {
    if (this.disabled() || !this.hasPrevPage()) return;
    this.emitPageChange(1);
  }

  goToPreviousPage(): void {
    if (this.disabled() || !this.hasPrevPage()) return;
    this.emitPageChange(this.currentPage() - 1);
  }

  goToNextPage(): void {
    if (this.disabled() || !this.hasNextPage()) return;
    this.emitPageChange(this.currentPage() + 1);
  }

  goToLastPage(): void {
    if (this.disabled() || !this.hasNextPage()) return;
    this.emitPageChange(this.totalPages());
  }

  goToPage(page: number | '...'): void {
    if (typeof page !== 'number' || this.disabled() || page === this.currentPage()) {
      return;
    }

    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.emitPageChange(page);
  }

  onPageSizeChange(event: Event): void {
    if (this.disabled()) return;

    const target = event.target as HTMLSelectElement;
    const newLimit = Number(target.value);

    if (isNaN(newLimit) || newLimit <= 0) {
      return;
    }

    this.emitPageChange(1, newLimit);
  }

  // Helper methods
  isCurrentPage(page: number | '...'): boolean {
    return typeof page === 'number' && page === this.currentPage();
  }

  isPageDisabled(page: number | '...'): boolean {
    return this.disabled() || typeof page !== 'number';
  }

  getPageAriaLabel(page: number | '...'): string {
    if (typeof page !== 'number') {
      return 'Más páginas';
    }

    if (this.isCurrentPage(page)) {
      return `Página actual ${page}`;
    }

    return `Ir a página ${page}`;
  }

  private emitPageChange(page: number, limit?: number): void {
    this.pageChange.emit({
      page,
      limit: limit ?? this.itemsPerPage()
    });
  }
}
