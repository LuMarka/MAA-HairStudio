import { Component } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { HomeTemplate } from "../../shared/templates/home-template/home-template";

@Component({
  selector: 'app-home',
  imports: [HomeTemplate],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {

}
