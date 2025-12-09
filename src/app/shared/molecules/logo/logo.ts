import { Component, ChangeDetectionStrategy, signal, computed, input, afterNextRender } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage]
})
export class Logo {
  // Inputs del componente
  readonly isSmall = input(false);
  readonly showText = input(true);

  // Señal para el ancho de ventana
  private readonly windowWidth = signal(0);

  // Estado computado basado en el ancho de ventana
  readonly shouldShowText = computed(() => {
    const width = this.windowWidth();
    return width >= 450 && this.showText();
  });

  readonly imageSize = computed(() => this.isSmall() ? 70 : 110);

  constructor() {
    afterNextRender(() => {
      // Inicializar el ancho de ventana
      this.windowWidth.set(window.innerWidth);

      // Escuchar cambios de tamaño
      const handleResize = () => {
        this.windowWidth.set(window.innerWidth);
      };

      window.addEventListener('resize', handleResize);

      // Cleanup se maneja automáticamente por Angular
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    });
  }
}
