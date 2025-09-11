import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../../shared/organisms/navbar/navbar';
import { Footer } from '../../../shared/organisms/footer/footer';
import { Search } from '../../../shared/organisms/search/search';

@Component({
  selector: 'app-layout-home',
  imports: [RouterOutlet, Navbar,Footer, Search],
  templateUrl: './layout-home.html',
  styleUrl: './layout-home.scss'
})
export class LayoutHome {

}
