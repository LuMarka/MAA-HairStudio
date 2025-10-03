import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationVideo } from './location-video';

describe('LocationVideo', () => {
  let component: LocationVideo;
  let fixture: ComponentFixture<LocationVideo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationVideo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationVideo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
