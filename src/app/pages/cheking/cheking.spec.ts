import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cheking } from './cheking';

describe('Cheking', () => {
  let component: Cheking;
  let fixture: ComponentFixture<Cheking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cheking]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cheking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
