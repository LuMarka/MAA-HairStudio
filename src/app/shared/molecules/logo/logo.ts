import { Component, input, ChangeDetectionStrategy } from '@angular/core';
@Component({
  selector: 'app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './logo.html',
  styleUrls: ['./logo.scss']
})
export class Logo {
  isSmall = input<boolean>(false);
  showText = input<boolean>(true);
}
