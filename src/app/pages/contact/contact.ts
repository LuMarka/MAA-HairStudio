import { Component } from '@angular/core';
import { ContactTemplate } from "../../shared/templates/contact-template/contact-template";

@Component({
  selector: 'app-contact',
  imports: [ContactTemplate],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class Contact {

}
