import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CombosComponent } from './combos.component';

describe('CombosComponent', () => {
  let component: CombosComponent;
  let fixture: ComponentFixture<CombosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CombosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
