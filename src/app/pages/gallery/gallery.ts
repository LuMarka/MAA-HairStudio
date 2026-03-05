import { Component, ChangeDetectionStrategy } from '@angular/core';
import { GalleryTemplate } from "../../shared/templates/gallery-template/gallery-template";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-gallery',
  imports: [GalleryTemplate],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss'
})
export class Gallery {

}
