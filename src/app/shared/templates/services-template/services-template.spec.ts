import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesTemplate } from './services-template';

describe('ServicesTemplate', () => {
  let component: ServicesTemplate;
  let fixture: ComponentFixture<ServicesTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicesTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
