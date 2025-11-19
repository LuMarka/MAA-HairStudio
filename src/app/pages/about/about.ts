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
  readonly title = 'Mi Historia: tradición, familia y belleza';
  readonly subtitle = 'Una pasión convertida en arte';
  readonly image = '/images/ale.jpg';
  readonly imageAlt = 'María - Fundadora de MAA Hair Studio';

  readonly textParagraphs = [
    '"Me llamo María Alejandra Alaniz y soy la segunda generación de una familia de peluqueros apasionados. Mi historia en el mundo de la peluquería comenzó hace muchos años, cuando mi madre y mi tía abrieron su propio salón de belleza. Desde entonces, he crecido rodeada de tijeras, peines y un profundo amor por el arte de crear.',
    'Hoy tengo el orgullo de liderar y acompañar el crecimiento de la tercera generación de nuestra familia en el rubro, continuando un legado que honra nuestras raíces y, a la vez, lleva mi propio sello. Mi objetivo es ofrecer un servicio exclusivo y personalizado a cada cliente, sin importar la edad. Quiero que se sientan acogidos, comprendidos y que vivan la magia de la transformación que aporta un buen servicio de peluquería.',
    'Trabajo con marcas profesionales y productos exclusivos, lo que me permite ofrecer las mejores técnicas y resultados que mis clientes buscan en un salón de belleza moderno. Mi pasión es crear, peinar y lograr que cada persona que entra en mi salón se sienta segura, especial y feliz.',
    'Para mí, la peluquería no es solo un trabajo: es una forma de vida. Es la oportunidad de hacer que alguien se sienta especial, de transformar su día y de ser parte de su historia. Estoy emocionada de seguir creciendo, evolucionando y de continuar siendo experta en vos."'
  ];

  readonly signature = '- María Alejandra, Fundadora de MAA Hair Studio';
}
