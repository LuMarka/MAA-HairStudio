import { Component } from '@angular/core';
import { AboutTemplate } from "../../shared/templates/about-template/about-template";

@Component({
  selector: 'app-about',
  imports: [AboutTemplate],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class About {

}
