import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-contact-map',
  imports: [],
  templateUrl: './contact-map.html',
  styleUrl: './contact-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactMap {
private readonly sanitizer = inject(DomSanitizer);

  title = input<string>('Nuestra ubicación');
  address = input<string>('Lugones 299, Villa María, Córdoba');
  mapUrl = input<string>('');
  mapTitle = input<string>('Mapa de ubicación MAA Hair Studio');

  readonly safeMapUrl = computed((): SafeResourceUrl | null => {
    const url = this.mapUrl();
    if (!url) return null;

    // Convert Google Maps share URL to embed URL if needed
    const embedUrl = this.convertToEmbedUrl(url);
    return embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl) : null;
  });

  private convertToEmbedUrl(url: string): string | null {
    // If it's already an embed URL, return as is
    if (url.includes('google.com/maps/embed')) {
      return url;
    }

     // For Lugones 299, Villa María, Córdoba - correct embed URL
    return 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3353.953792490634!2d-63.24353768484787!3d-32.40908198093571!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95cc4270e6c6c4ad%3A0x5c4e8e4a8b8b4b8b!2sLugones%20299%2C%20Villa%20Mar%C3%ADa%2C%20C%C3%B3rdoba%2C%20Argentina!5e0!3m2!1ses!2sar!4v1700000000000!5m2!1ses!2sar';

    return null;
  }
}


