import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuToggle } from './menu-toggle';

describe('MenuToggle', () => {
  let component: MenuToggle;
  let fixture: ComponentFixture<MenuToggle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuToggle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuToggle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
