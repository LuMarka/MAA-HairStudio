import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutTemplate } from './about-template';

describe('AboutTemplate', () => {
  let component: AboutTemplate;
  let fixture: ComponentFixture<AboutTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
