import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryImage } from './gallery-image';

describe('GalleryImage', () => {
  let component: GalleryImage;
  let fixture: ComponentFixture<GalleryImage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryImage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GalleryImage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
