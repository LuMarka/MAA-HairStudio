import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediosDePago } from './medios-de-pago';

describe('MediosDePago', () => {
  let component: MediosDePago;
  let fixture: ComponentFixture<MediosDePago>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediosDePago]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediosDePago);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
