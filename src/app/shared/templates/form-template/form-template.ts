import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-form-template',
  imports: [],
  templateUrl: './form-template.html',
  styleUrl: './form-template.scss'
})
export class FormTemplate {

}
