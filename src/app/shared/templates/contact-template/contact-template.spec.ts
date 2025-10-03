import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactTemplate } from './contact-template';
import { LocationVideo } from '../../molecules/location-video/location-video';

describe('ContactTemplate', () => {
  let component: ContactTemplate;
  let fixture: ComponentFixture<ContactTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactTemplate, LocationVideo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
