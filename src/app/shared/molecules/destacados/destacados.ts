import {
  Component,
  signal,
  computed,
  ViewChildren,
  ViewChild,
  QueryList,
  ElementRef,
  AfterViewInit,
  inject,
  DestroyRef,
  effect,
  PLATFORM_ID,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

interface ProductosDestacados {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-destacados',
  standalone: true,
  templateUrl: './destacados.html',
  styleUrls: ['./destacados.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: 'IMAGE_LOADER',
      useValue: (config: { src: string }) => {
        // This custom loader allows using images from the public folder
        return config.src;
      }
    }
  ]
})
export class Destacados implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly breakpointObserver = inject(BreakpointObserver);

  @ViewChild('productGrid') productGrid?: ElementRef<HTMLElement>;
  @ViewChildren('productCard') productCards!: QueryList<ElementRef<HTMLElement>>;

  // Products data
  private readonly allProducts = signal<ProductosDestacados[]>([
    {
      id: 'prod-1',
      name: 'Elixir Ultime',
      brand: 'Kérastase',
      description: 'Aceite sublime para todo tipo de cabello. Nutrición e hidratación intensa.',
      price: 9500,
      image: '/images/ker_nutritive.jpg'
    },
    {
      id: 'prod-2',
      name: 'Blond Absolu',
      brand: 'Kérastase',
      description: 'Tratamiento para cabello rubio, neutraliza tonos amarillos y repara.',
      price: 8900,
      image: '/images/kerastase.png'
    },
    {
      id: 'prod-3',
      name: 'Sérum Absolut Repair',
      brand: "L'Oréal",
      description: 'Sérum reparador intensivo para cabellos dañados y quebradizos.',
      price: 7500,
      image: '/images/kerastase.png'
    },
    {
      id: 'prod-4',
      name: 'Mythic Oil',
      brand: "L'Oréal",
      description: 'Aceite nutritivo que aporta brillo y suavidad sin apelmazar.',
      price: 8200,
      image: '/images/kerastase.png'
    },
    {
      id: 'prod-5',
      name: 'Genesis Sérum',
      brand: 'Kérastase',
      description: 'Sérum anti-caída que fortalece el folículo y previene la rotura.',
      price: 9800,
      image: '/images/kerastase.png'
    },
    {
      id: 'prod-6',
      name: 'Chronologiste',
      brand: 'Kérastase',
      description: 'Revitalizante y rejuvenecedor para cuero cabelludo y cabello.',
      price: 10500,
      image: '/images/kerastase.png'
    },
    {
      id: 'prod-7',
      name: 'Serie Expert',
      brand: "L'Oréal",
      description: 'Mascarilla profesional para cabello muy dañado con pro-keratina.',
      price: 6800,
      image: '/images/kerastase.png'
    },
    {
      id: 'prod-8',
      name: 'Steampod',
      brand: "L'Oréal",
      description: 'Sérum protector térmico para uso con planchas y herramientas calientes.',
      price: 5900,
      image: '/images/kerastase.png',
    },
    {
      id: 'prod-9',
      name: 'Blond Absolu',
      brand: 'Kérastase',
      description: 'Tratamiento para cabello rubio, neutraliza tonos amarillos y repara.',
      price: 8900,
      image: '/images/kerastase.png',
    },
    {
      id: 'prod-10',
      name: 'Blond Absolu',
      brand: 'Kérastase',
      description: 'Tratamiento para cabello rubio, neutraliza tonos amarillos y repara.',
      price: 8900,
      image: '/images/kerastase.png',
    },
    {
      id: 'prod-11',
      name: 'Blond Absolu',
      brand: 'Kérastase',
      description: 'Tratamiento para cabello rubio, neutraliza tonos amarillos y repara.',
      price: 8900,
      image: '/images/kerastase.png',
    },
    {
      id: 'prod-12',
      name: 'Blond Absolu',
      brand: 'Kérastase',
      description: 'Tratamiento para cabello rubio, neutraliza tonos amarillos y repara.',
      price: 8900,
      image: '/images/ker_nutritive.jpg',
    }
  ]);

  // Carousel control
  private readonly itemsPerPageSignal = signal(1); // Default for mobile/SSR
  private readonly currentPageSignal = signal(0);

  // Derived states
  readonly currentPage = this.currentPageSignal.asReadonly();
  readonly totalPages = computed(() =>
    Math.ceil(this.allProducts().length / this.itemsPerPageSignal())
  );

  readonly pageIndicators = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i)
  );

  readonly visibleProducts = computed(() => {
    const startIdx = this.currentPage() * this.itemsPerPageSignal();
    const endIdx = startIdx + this.itemsPerPageSignal();
    return this.allProducts().slice(startIdx, endIdx);
  });

  // Tracking loaded images and visible items
  private readonly loadedImages = signal<Set<string>>(new Set());
  private readonly visibleItems = signal<Set<string>>(new Set());

  // Intersection Observer
  private observer?: IntersectionObserver;

  constructor() {
    // Effect to initialize visible items when page changes
    effect(() => {
      const currentProducts = this.visibleProducts();
      setTimeout(() => {
        currentProducts.forEach(product => {
          this.visibleItems.update(set => {
            const newSet = new Set(set);
            newSet.add(product.id);
            return newSet;
          });
        });
      }, 100);
    });
  }

  ngAfterViewInit(): void {
    // Only run browser-specific code when in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.setupResponsiveLayout();
      this.setupIntersectionObserver();

      // Listen for window resize events
      fromEvent(window, 'resize')
        .pipe(
          debounceTime(300),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => this.setupResponsiveLayout());
    }

    // Initialize the first elements as visible
    setTimeout(() => {
      this.visibleProducts().forEach(product => {
        this.visibleItems.update(set => {
          const newSet = new Set(set);
          newSet.add(product.id);
          return newSet;
        });
      });
    }, 300);
  }

  private setupResponsiveLayout(): void {
    // Using BreakpointObserver for SSR-safe responsive behavior
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall, // < 600px
        Breakpoints.Small,  // 600px - 960px
        Breakpoints.Medium, // 960px - 1280px
        Breakpoints.Large   // > 1280px
      ])
.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        // Set items per page based on breakpoint
        if (result.breakpoints[Breakpoints.XSmall]) {
          this.itemsPerPageSignal.set(1);
        } else if (result.breakpoints[Breakpoints.Small] || result.breakpoints[Breakpoints.Medium]) {
          // Para tablets (Small y Medium), mostramos 2 para un diseño parejo.
          this.itemsPerPageSignal.set(2);
        } else {
          // Para Desktop (Large y XLarge), mostramos 4.
          this.itemsPerPageSignal.set(4);
        }

        // Ensure current page is valid
        if (this.currentPage() >= this.totalPages()) {
          this.goToPage(this.totalPages() - 1);
        }
      });
  }

  private setupIntersectionObserver(): void {
    if (!this.productCards) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute('data-product-id');
        if (entry.isIntersecting && id) {
          this.visibleItems.update(set => {
            const newSet = new Set(set);
            newSet.add(id);
            return newSet;
          });
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    this.productCards.forEach(card => {
      const element = card.nativeElement;
      const productId = element.getAttribute('data-product-id');
      if (productId) {
        this.observer?.observe(element);
      }
    });
  }

  onImageLoad(productId: string): void {
    this.loadedImages.update(set => {
      const newSet = new Set(set);
      newSet.add(productId);
      return newSet;
    });
  }

  isProductVisible(productId: string): boolean {
    return this.visibleItems().has(productId);
  }

  isImageLoaded(productId: string): boolean {
    return this.loadedImages().has(productId);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPageSignal.update(page => page + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPageSignal.update(page => page - 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPageSignal.set(page);
    }
  }

  isFirstPage(): boolean {
    return this.currentPage() === 0;
  }

  isLastPage(): boolean {
    return this.currentPage() === this.totalPages() - 1;
  }
}
