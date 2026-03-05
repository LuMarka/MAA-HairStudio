import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminUsersTemplate } from "../../shared/templates/admin-users-template/admin-users-template";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-users',
  imports: [AdminUsersTemplate],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss'
})
export class AdminUsers {

}
