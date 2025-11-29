import { Component } from '@angular/core';

@Component({
  selector: 'app-profile-template',
  imports: [],
  templateUrl: './profile-template.html',
  styleUrl: './profile-template.scss'
})
export class ProfileTemplate {
  user = {
    name: 'Nombre Apellido',
    email: 'usuario@email.com',
    phone: '1234567890',
    address: 'Calle Falsa 123, Villa María, Córdoba, Argentina',
  };
  isEditing = false;

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }
}
