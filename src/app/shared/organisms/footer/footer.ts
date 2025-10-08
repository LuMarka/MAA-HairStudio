import { ChangeDetectionStrategy, Component, input, signal, computed } from '@angular/core';

interface FooterSocialLink {
  icon: 'instagram' | 'whatsapp';
  url: string;
  label: string;
}

interface FooterSchedule {
  days: string;
  hours: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Footer {
  // Datos configurables
  title = input<string>('MAA Hair Studio');
  description = input<string>('El espacio pensado para lograr tu mejor versión ✨');
  address = input<string>('Lugones 299, Villa María, Córdoba');
  phone = input<string>('+54 9 353 401-5655');
  contactTitle = input<string>('Contacto');
  scheduleTitle = input<string>('Horarios');
  schedules = input<FooterSchedule[]>([
    { days: 'Lunes', hours: '14:00 - 19:30'},
    { days: 'Martes a Viernes', hours: '8:00 - 19:30' },
    { days: 'Sábados', hours: '8:00 - 16:00' },

  ]);
  followTitle = input<string>('Seguinos');
  socialLinks = input<FooterSocialLink[]>([
    { icon: 'instagram', url: 'https://www.instagram.com/hairstudio.maa/', label: 'Instagram' },
    { icon: 'whatsapp', url: 'https://wa.me/5493534015655/?text=Hola!%20Quisiera%20realizar%20una%20consulta', label: 'WhatsApp' }

  ]);
  copyright = input<string>('© MAA Hair Studio. Todos los derechos reservados.');
  designer = input<string>('Designed by LBJ Devs.');
  locationIcon = input<string>('📌'); // 📍
  phoneIcon = input<string>('📞'); //
  // Año actual
  readonly currentYear = computed(() => new Date().getFullYear());
}
