import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ServicesTemplate, ServiceStep, ServiceBenefit } from "../../shared/templates/services-template/services-template";

@Component({
  selector: 'app-services',
  imports: [ServicesTemplate],
  templateUrl: './services.html',
  styleUrl: './services.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Services {
  // Datos principales del servicio
  readonly title = signal('Beauty Scan');
  readonly subtitle = signal('Diagnóstico capilar online y propuesta de servicios personalizados');
  readonly description = signal('¿Te gustaría un diagnóstico profesional para tu cabello sin salir de casa? Con Beauty Scan, obtené una evaluación precisa y una propuesta de servicios de peluquería diseñada exclusivamente para ti, todo desde la comodidad de tu hogar.');
  readonly image = signal('images/ale-pelu.jpg');
  readonly imageAlt = signal('Beauty Scan - Diagnóstico capilar online con María Alejandra Alaníz');

  // Sección: Cómo funciona
  readonly howItWorksTitle = signal('¿Cómo funciona?');
  readonly steps = signal<ServiceStep[]>([
    {
      title: 'Sesión online con una experta',
      description: 'Conéctate por videollamada con nuestra especialista, María Alejandra Alaníz, para una consulta personalizada.'
    },
    {
      title: 'Análisis completo',
      description: 'Durante la sesión, compartirás tus productos actuales, tu rutina de cuidado y tus objetivos o preocupaciones sobre tu cabello.'
    },
    {
      title: 'Diagnóstico preciso',
      description: 'Nuestra experta realizará un diagnóstico detallado, identificando áreas de mejora para optimizar la salud y apariencia de tu pelo.'
    },
    {
      title: 'Propuesta personalizada',
      description: 'A partir de este análisis, recibirás una propuesta a medida que puede incluir servicios de color y corte, y tratamientos capilares para mejorar la salud y el aspecto de tu cabello.'
    },
    {
      title: 'Presupuesto y plan a tu medida',
      description: 'Recibirás un presupuesto detallado y un plan de acción para que sepas exactamente qué esperar. Además, podrás agendar una cita en nuestro salón para realizar los servicios recomendados.'
    }
  ]);

  // Sección: Beneficios para ti
  readonly benefitsTitle = signal('Beneficios para ti');
  readonly benefits = signal<ServiceBenefit[]>([
    {
      title: 'Conveniencia',
      description: 'Recibe un diagnóstico profesional y una propuesta de servicios desde la comodidad de tu hogar, ahorrando tiempo de desplazamiento.'
    },
    {
      title: 'Personalización',
      description: 'Nuestra experta se dedica a tus necesidades específicas, creando un plan de belleza único y ajustado a tus objetivos.'
    },
    {
      title: 'Resultados garantizados',
      description: 'Nuestros servicios están diseñados para mejorar significativamente la salud y apariencia de tu cabello, ofreciendo resultados que verás y sentirás.'
    },
    {
      title: 'Transparencia total',
      description: 'Conoce de antemano el plan y el presupuesto de tu servicio, sin sorpresas.'
    }
  ]);

  // Sección: Beneficios para nuestro salón
  readonly additionalBenefitsTitle = signal('Beneficios para nuestro salón');
  readonly additionalBenefits = signal<ServiceBenefit[]>([
    {
      title: 'Optimización del tiempo',
      description: 'Al llegar al salón, ya tendremos un claro entendimiento de tus necesidades, lo que nos permite ser más eficientes y dedicar más tiempo a la ejecución de los servicios.'
    },
    {
      title: 'Atención enfocada',
      description: 'La consulta previa nos permite concentrarnos en los servicios específicos que necesitas, haciendo que tu visita sea más productiva y satisfactoria.'
    },
    {
      title: 'Mejor experiencia del cliente',
      description: 'Al llegar con un plan ya establecido, la experiencia es más fluida, personalizada y se enfoca en brindarte los resultados que buscas.'
    }
  ]);
}
