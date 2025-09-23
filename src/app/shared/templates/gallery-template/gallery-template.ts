import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { GalleryCards, type GalleryImage } from '../../molecules/gallery-cards/gallery-cards';

@Component({
  selector: 'app-gallery-template',
  imports: [GalleryCards],
  templateUrl: './gallery-template.html',
  styleUrl: './gallery-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryTemplate {
  readonly imagenesParaLaGaleria = signal<GalleryImage[]>([
    { id: '1', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '2', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '3', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '4', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '5', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '6', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '7', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '8', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '9', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '10', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '11', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '12', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '13', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '14', src: '/images/ale-pelu.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '15', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
    { id: '16', src: '/images/alejandra.jpg', alt: 'Ale', caption: 'Ale' },
  ]);
}
