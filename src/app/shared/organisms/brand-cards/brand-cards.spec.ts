import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandCards } from './brand-cards';

describe('BrandCards', () => {
  let component: BrandCards;
  let fixture: ComponentFixture<BrandCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrandCards);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
