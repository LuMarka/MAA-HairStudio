import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../../shared/organisms/navbar/navbar';
import { Footer } from '../../../shared/organisms/footer/footer';

@Component({
  selector: 'app-layout-home',
  imports: [RouterOutlet, Navbar,Footer],
  templateUrl: './layout-home.html',
  styleUrl: './layout-home.scss'
})
export class LayoutHome {

}
