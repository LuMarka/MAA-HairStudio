import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-floating-cta-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './floating-cta-button.html',
  styleUrl: './floating-cta-button.scss',

})
export class FloatingCtaButton {
  readonly buttonLabel = 'Reservar turno por WhatsApp';

  private readonly whatsappNumber = '5493534015655';
  private readonly whatsappMessage = 'Hola! Quisiera reservar un turno en MAA Hair Studio';

  openWhatsApp(): void {
    const encodedMessage = encodeURIComponent(this.whatsappMessage);
    const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}
