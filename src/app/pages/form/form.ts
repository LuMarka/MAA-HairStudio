import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormTemplate } from "../../shared/templates/form-template/form-template";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-form',
  imports: [FormTemplate],
  templateUrl: './form.html',
  styleUrl: './form.scss'
})
export class Form {

}
