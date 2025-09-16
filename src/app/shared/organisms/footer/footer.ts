import { Component, ChangeDetectionStrategy } from '@angular/core';

// Adjust the path as needed
//import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-footer',
  imports: [],
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
