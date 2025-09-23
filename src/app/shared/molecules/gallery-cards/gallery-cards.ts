import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

@Component({
  selector: 'app-gallery-cards',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './gallery-cards.html',
  styleUrls: ['./gallery-cards.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'gallery-component',
  },
})
export class GalleryCards {
  readonly images = input<GalleryImage[]>([]);

  private readonly currentIndexSignal = signal(0);
  private readonly isScrollPausedSignal = signal(false);

  readonly currentIndex = this.currentIndexSignal.asReadonly();
  readonly isScrollPaused = this.isScrollPausedSignal.asReadonly();
  readonly hasImages = computed(() => this.images().length > 0);

  readonly currentImageData = computed(() => {
    const images = this.images();
    const index = this.currentIndex();
    return images[index] ?? null;
  });

  // Duplicamos las imágenes para el bucle de animación CSS.
  readonly duplicatedImages = computed(() => {
    const originalImages = this.images();
    if (originalImages.length === 0) return [];
    return [...originalImages, ...originalImages];
  });

  selectByIndex(index: number): void {
    const totalImages = this.images().length;
    if (index >= 0 && index < totalImages) {
      this.currentIndexSignal.set(index);
    }
  }

  nextImage(): void {
    this.currentIndexSignal.update(
      current => (current + 1) % this.images().length
    );
  }

  previousImage(): void {
    this.currentIndexSignal.update(
      current => (current - 1 + this.images().length) % this.images().length
    );
  }

  pauseScroll(): void {
    this.isScrollPausedSignal.set(true);
  }

  resumeScroll(): void {
    this.isScrollPausedSignal.set(false);
  }
}
