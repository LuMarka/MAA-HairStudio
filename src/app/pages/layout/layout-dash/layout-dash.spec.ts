import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutDash } from './layout-dash';

describe('LayoutDash', () => {
  let component: LayoutDash;
  let fixture: ComponentFixture<LayoutDash>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutDash]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayoutDash);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
