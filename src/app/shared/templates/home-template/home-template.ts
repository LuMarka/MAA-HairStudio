import { Component } from '@angular/core';
import { Header } from '../../molecules/header/header';
import { Destacados } from '../../molecules/destacados/destacados';
import { BrandCards } from "../../organisms/brand-cards/brand-cards";
import { PaymentsMethods } from '../../organisms/payments-methods/payments-methods';



@Component({
  selector: 'app-home-template',
  imports: [Header, Destacados, BrandCards, PaymentsMethods],
  templateUrl: './home-template.html',
  styleUrl: './home-template.scss'
})
export class HomeTemplate {

}
