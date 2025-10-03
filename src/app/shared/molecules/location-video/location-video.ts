import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, input, afterNextRender } from '@angular/core';

@Component({
  selector: 'app-location-video',
  imports: [],
  templateUrl: './location-video.html',
  styleUrls: ['./location-video.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocationVideo {
  // Inputs from parent
  src = input<string>('/videos/ubicacion.mp4');
  alt = input<string>('Video de ubicación');
  title = input<string>('');
  subtitle = input<string>('');

  @ViewChild('videoRef') private videoRef?: ElementRef<HTMLVideoElement>;

  constructor() {
    // Aseguramos mute/autoplay después del primer render en el navegador
    afterNextRender(() => {
      const el = this.videoRef?.nativeElement;
      if (el) {
        try {
          el.muted = true;
          el.autoplay = true;
          // Si el navegador bloquea autoplay, intentamos play()
          const p = el.play();
          if (p && typeof p.then === 'function') {
            p.catch(() => {
              // Si falla, al menos mantenemos muted true
              el.muted = true;
            });
          }
        } catch {
          // noop: mejor esfuerzo
        }
      }
    });
  }
}
