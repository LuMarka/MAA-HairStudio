import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

@Component({
  selector: 'app-gallery-image',
  standalone: true,
  templateUrl: './gallery-image.html',
  styleUrls: ['./gallery-image.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'gallery-image-component',
  },
})
export class GalleryImageComponent {
  readonly currentImage = input<GalleryImage | null>(null);
  readonly currentIndex = input<number>(0);
  readonly totalImages = input<number>(0);

  readonly nextImage = output<void>();
  readonly previousImage = output<void>();
}
