import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-menu-toggle',
  imports: [],
  templateUrl: './menu-toggle.html',
  styleUrl: './menu-toggle.scss'
})
export class MenuToggle {
  isOpen = input<boolean>(false);

  toggle = output<boolean>();

  onToggle(): void {
    this.toggle.emit(!this.isOpen());
  }
}
