import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Slogan } from './slogan';

describe('Slogan', () => {
  let component: Slogan;
  let fixture: ComponentFixture<Slogan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Slogan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Slogan);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
