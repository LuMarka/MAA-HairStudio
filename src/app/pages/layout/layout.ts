import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../shared/organisms/navbar/navbar';
import { Footer } from '../../shared/organisms/footer/footer';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Navbar,Footer],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',

})
export class Layout {

}
