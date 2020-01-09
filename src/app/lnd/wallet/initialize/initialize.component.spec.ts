import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InitializeWalletComponent } from './initialize.component';

describe('InitializeWalletComponent', () => {
  let component: InitializeWalletComponent;
  let fixture: ComponentFixture<InitializeWalletComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InitializeWalletComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InitializeWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
