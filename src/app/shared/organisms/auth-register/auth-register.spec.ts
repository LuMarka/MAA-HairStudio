import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthRegister } from './auth-register';

describe('AuthRegister', () => {
  let component: AuthRegister;
  let fixture: ComponentFixture<AuthRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthRegister]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthRegister);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
