import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailProductTemplate } from './detail-product-template';

describe('DetailProductTemplate', () => {
  let component: DetailProductTemplate;
  let fixture: ComponentFixture<DetailProductTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailProductTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailProductTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
