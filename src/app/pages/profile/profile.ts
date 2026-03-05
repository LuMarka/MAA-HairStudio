import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ProfileTemplate } from "../../shared/templates/profile-template/profile-template";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile',
  imports: [ProfileTemplate],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile {

}
