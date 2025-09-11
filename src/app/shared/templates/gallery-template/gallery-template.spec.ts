import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryTemplate } from './gallery-template';

describe('GalleryTemplate', () => {
  let component: GalleryTemplate;
  let fixture: ComponentFixture<GalleryTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GalleryTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
