import { Component, ChangeDetectionStrategy, ElementRef, AfterViewInit, WritableSignal, signal } from '@angular/core';


@Component({
  selector: 'app-slogan',
  imports: [],
  templateUrl: './slogan.html',
  styleUrl: './slogan.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Slogan {

  readonly title = '✨ Más que expertas en belleza, somos expertas en vos.';
  readonly text = `Los espejos reflejan, pero no revelan toda la verdad. En MAA Hair Studio creemos que tu historia es el verdadero punto de partida. Aquí hablás, aquí te escuchamos. Juntas trazaremos el camino hacia tu mejor versión, con un cuidado auténtico, sin atajos ni artificios: solo recomendaciones pensadas exclusivamente para vos, porque tu belleza es tan única como vos misma.`;
  readonly bgImage = './images/pelu-int.1.jpg';

  sloganVisible: WritableSignal<boolean> = signal(false);

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.sloganVisible.set(true);
          observer.disconnect();
        }
      });
    }, { threshold: 0.25 });
    observer.observe(this.el.nativeElement);
  }
}
