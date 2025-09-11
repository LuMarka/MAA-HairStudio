import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChekingTemplate } from './cheking-template';

describe('ChekingTemplate', () => {
  let component: ChekingTemplate;
  let fixture: ComponentFixture<ChekingTemplate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChekingTemplate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChekingTemplate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
