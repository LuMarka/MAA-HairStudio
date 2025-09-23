import { Component } from '@angular/core';
import { Header } from '../../molecules/header/header';
import { Destacados } from '../../molecules/destacados/destacados';
import { MediosDePago } from "../../organisms/medios-de-pago/medios-de-pago";

@Component({
  selector: 'app-home-template',
  imports: [Header, Destacados, MediosDePago],
  templateUrl: './home-template.html',
  styleUrl: './home-template.scss'
})
export class HomeTemplate {

}
