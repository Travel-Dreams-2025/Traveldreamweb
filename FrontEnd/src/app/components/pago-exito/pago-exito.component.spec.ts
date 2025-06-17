import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoExitoComponent } from './pago-exito.component';

describe('PagoExitoComponent', () => {
  let component: PagoExitoComponent;
  let fixture: ComponentFixture<PagoExitoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagoExitoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PagoExitoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
