import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryCards } from './gallery-cards';

describe('GalleryCards', () => {
  let component: GalleryCards;
  let fixture: ComponentFixture<GalleryCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GalleryCards);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
