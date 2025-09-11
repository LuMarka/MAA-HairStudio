import { Component } from '@angular/core';
import { ProfileTemplate } from "../../shared/templates/profile-template/profile-template";

@Component({
  selector: 'app-profile',
  imports: [ProfileTemplate],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile {

}
