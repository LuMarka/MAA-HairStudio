import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AboutTemplate } from '../../shared/templates/about-template/about-template';

@Component({
  selector: 'app-about',
  imports: [AboutTemplate],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class About {
  readonly title = 'Mi Historia';
  readonly subtitle = 'Una pasión convertida en arte';
  readonly image = '/images/ale.jpg';
  readonly imageAlt = 'María - Fundadora de MAA Hair Studio';

  readonly textParagraphs = [
    'Hace más de 15 años comencé este hermoso camino en el mundo de la belleza y el cuidado capilar. Lo que empezó como una simple curiosidad se convirtió en mi mayor pasión.',
    'Después de formarme en las mejores academias de Buenos Aires y especializarme en técnicas europeas de coloración y corte, decidí abrir mi propio estudio en Villa María, donde cada cliente recibe un tratamiento personalizado y único.',
    'Mi filosofía siempre ha sido la misma: no existe una sola técnica que funcione para todos. Cada cabello tiene su propia personalidad, y mi trabajo es descubrir cuál es la mejor manera de realzar la belleza natural de cada persona.',
    'En MAA Hair Studio, no solo transformamos cabello, creamos experiencias. Cada corte, cada color, cada peinado está pensado para que te sientas única y especial.'
  ];

  readonly signature = '- María Alejandra, Fundadora de MAA Hair Studio';
}
