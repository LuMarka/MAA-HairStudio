import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutHome } from './layout-home';

describe('LayoutHome', () => {
  let component: LayoutHome;
  let fixture: ComponentFixture<LayoutHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayoutHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
