
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../../shared/organisms/navbar/navbar';
import { Footer } from '../../../shared/organisms/footer/footer';

@Component({
  selector: 'app-layout-dash',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './layout-dash.html',
  styleUrl: './layout-dash.scss'
})
export class LayoutDash {}
