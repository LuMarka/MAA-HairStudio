import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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
}
