import {
  Component,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
  OnInit
} from '@angular/core';
import { Meta } from '../../../core/models/interfaces/Product.interface';

export interface PaginationEvent {
  page: number;
  limit: number;
}

@Component({
  selector: 'app-paginator',
  styleUrl: './paginator.scss',
  templateUrl: './paginator.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginatorComponent implements OnInit {
  // Inputs
  meta = input.required<Meta>();
  entityName = input('elementos');
  showPageSizeSelector = input(true);
  pageSizeOptions = input([10, 20, 50, 100]);
  maxVisiblePages = input(5);

  // Outputs
  pageChange = output<PaginationEvent>();

  ngOnInit(): void {
    this.visiblePages();
    console.log('Paginator initialized with meta:', this.meta().page);
  }
  // Computed values
  showPagination = computed(() => {
    const metaData = this.meta();
    return metaData.totalPages > 1;
  });

  startItem = computed(() => {
    const metaData = this.meta();
    return (metaData.page - 1) * metaData.limit + 1;
  });

  endItem = computed(() => {
    const metaData = this.meta();
    const calculated = metaData.page * metaData.limit;
    return Math.min(calculated, metaData.total);
  });

  visiblePages = computed(() => {
    const metaData = this.meta();
    const current = metaData.page;
    const total = metaData.totalPages;
    const maxVisible = this.maxVisiblePages();

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    const halfVisible = Math.floor(maxVisible / 2);

    let start = Math.max(1, current - halfVisible);
    let end = Math.min(total, current + halfVisible);

    // Ajustar si estamos cerca del inicio
    if (start === 1) {
      end = Math.min(total, maxVisible);
    }

    // Ajustar si estamos cerca del final
    if (end === total) {
      start = Math.max(1, total - maxVisible + 1);
    }

    // Agregar primera página y puntos suspensivos si es necesario
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }

    // Agregar páginas del rango
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Agregar puntos suspensivos y última página si es necesario
    if (end < total) {
      if (end < total - 1) {
        pages.push('...');
      }
      pages.push(total);
    }

    return pages;
  });

  goToPage(page: number): void {
    const metaData = this.meta();
    if (page < 1 || page > metaData.totalPages || page === metaData.page) {
      return;
    }

    this.pageChange.emit({
      page,
      limit: metaData.limit
    });
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newLimit = parseInt(target.value, 10);

    this.pageChange.emit({
      page: 1, // Resetear a primera página cuando cambia el tamaño
      limit: newLimit
    });
  }
}
