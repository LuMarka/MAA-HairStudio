import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
@Component({
  selector: 'app-logo',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './logo.html',
  styleUrl: './logo.scss'
})
export class Logo {
  isSmall = input<boolean>(false);
  showText = input<boolean>(true);
}
