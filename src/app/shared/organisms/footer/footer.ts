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
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Footer {
  // Datos configurables
  title = input<string>('MAA Hair Studio');
  description = input<string>('Tu belleza es nuestra pasión. Especialistas en cuidado capilar y estética.');
  address = input<string>('Lugones 299, Villa María, Córdoba');
  phone = input<string>('+54 9 353 401-5655');
  contactTitle = input<string>('Contacto');
  scheduleTitle = input<string>('Horarios');
  schedules = input<FooterSchedule[]>([
    { days: 'Lunes a Viernes', hours: '10:00 - 19:00' },
    { days: 'Sábados', hours: '10:00 - 14:00' },
    { days: 'Domingos', hours: 'Cerrado' }
  ]);
  followTitle = input<string>('Seguinos');
  socialLinks = input<FooterSocialLink[]>([
    { icon: 'instagram', url: 'https://www.instagram.com/hairstudio.maa/', label: 'Instagram' },
    { icon: 'whatsapp', url: 'https://wa.me/5493534015655/?text=Hola!%20Quisiera%20realizar%20una%20consulta', label: 'WhatsApp' }

  ]);
  copyright = input<string>('© MAA Hair Studio. Todos los derechos reservados.');
  designer = input<string>('Designed by LBJ Devs.');
  locationIcon = input<string>('📌'); // <-- Ahora configurable 📍
  phoneIcon = input<string>('📞'); // <-- Ahora configurable
  // Año actual
  readonly currentYear = computed(() => new Date().getFullYear());
}
