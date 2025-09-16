import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-about-template',
  templateUrl: './about-template.html',
  styleUrl: './about-template.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutTemplate {
  title = input<string>('Mi Historia');
  subtitle = input<string>('');
  image = input<string>('');
  imageAlt = input<string>('');
  textParagraphs = input<string[]>([]);
  signature = input<string>('');
}
