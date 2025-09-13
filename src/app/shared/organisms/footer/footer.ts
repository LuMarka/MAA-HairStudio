import { Component, ChangeDetectionStrategy } from '@angular/core';
//import { RouterLink } from '@angular/router';
import { Logo } from '../../molecules/logo/logo';

@Component({
  selector: 'app-footer',
  imports: [ Logo],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Footer {
 readonly currentYear = new Date().getFullYear();

  readonly socialLinks = [
    { icon: 'instagram', url: 'https://instagram.com/maahairstyle', label: 'Instagram' },
    { icon: 'facebook', url: 'https://facebook.com/maahairstyle', label: 'Facebook' },
    { icon: 'whatsapp', url: 'https://wa.me/5493534015655', label: 'WhatsApp' }
  ];
}
