import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingCtaButton } from './floating-cta-button';

describe('FloatingCtaButton', () => {
  let component: FloatingCtaButton;
  let fixture: ComponentFixture<FloatingCtaButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingCtaButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingCtaButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
