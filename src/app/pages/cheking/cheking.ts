import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ChekingTemplate } from "../../shared/templates/cheking-template/cheking-template";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cheking',
  imports: [ChekingTemplate],
  templateUrl: './cheking.html',
  styleUrl: './cheking.scss'
})
export class Cheking {

}
