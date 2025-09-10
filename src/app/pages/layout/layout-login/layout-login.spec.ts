import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutLogin } from './layout-login';

describe('LayoutLogin', () => {
  let component: LayoutLogin;
  let fixture: ComponentFixture<LayoutLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayoutLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
