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
  readonly descriptionParagraph1 = signal('¿Querés un diagnóstico profesional para tu cabello sin salir de casa?');
  readonly descriptionParagraph2 = signal('Con Beauty Scan obtenés una evaluación precisa y un plan de servicios de peluquería diseñado exclusivamente para vos, todo desde la comodidad de tu hogar.');
  readonly descriptionParagraph3 = signal('✨BEAUTY SCAN, tu diagnóstico capilar online, rápido y personalizado.✨');




  readonly image = signal('images/ale-pelu.jpg');
  readonly imageAlt = signal('Beauty Scan - Diagnóstico capilar online con María Alejandra Alaníz');

  // Sección: Cómo funciona
  readonly howItWorksTitle = signal('¿Cómo funciona?');
  readonly steps = signal<ServiceStep[]>([
    {
      title: 'Sesión online con una experta',
      description: 'Conectate por videollamada con nuestra especialista, María Alejandra Alaníz, para una consulta personalizada.'
    },
    {
      title: 'Análisis completo',
      description: 'Compartí tus productos actuales, tu rutina de cuidado y tus objetivos o preocupaciones sobre tu cabello.'
    },
    {
      title: 'Diagnóstico preciso',
      description: 'Recibí una evaluación detallada que identifica áreas de mejora para optimizar la salud y apariencia de tu pelo.'
    },
    {
      title: 'Propuesta personalizada',
      description: `Te entregamos un plan a medida que puede incluir:
        * Servicios de color y corte.
        * Tratamientos capilares para potenciar la salud y el aspecto de tu cabello.`
    },
    {
      title: 'Plan y presupuesto claros',
      description: 'Vas a recibir un presupuesto detallado y un plan de acción. Además, podés agendar tu cita en nuestro salón para llevar a cabo los servicios recomendados.'
    }
  ]);

  // Sección: Beneficios para ti
  readonly benefitsTitle = signal('Beneficios para vos');
  readonly benefits = signal<ServiceBenefit[]>([
    {
      title: 'Comodidad total',
      description: 'Consultá desde tu casa, sin traslados ni pérdidas de tiempo.'
    },
    {
      title: 'Atención personalizada',
      description: 'Nuestra experta crea un plan único, adaptado a tus necesidades y objetivos.'
    },
    {
      title: 'Resultados visibles',
      description: 'Tratamientos diseñados para mejorar la salud y belleza de tu cabello.'
    },
    {
      title: 'Transparencia',
      description: 'Conocé de antemano el plan y el presupuesto, sin sorpresas.'
    }
  ]);

  // Sección: Beneficios para nuestro salón
  readonly additionalBenefitsTitle = signal('Beneficios para tu experiencia en el salón');
  readonly additionalBenefits = signal<ServiceBenefit[]>([
    {
      title: 'Eficiencia',
      description: 'Llegás con un diagnóstico previo, lo que optimiza el tiempo en tu visita.'
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

  // Frase final
  readonly finalMessage = signal('Con Beauty Scan, tu cambio empieza antes de entrar al salón.');
}
