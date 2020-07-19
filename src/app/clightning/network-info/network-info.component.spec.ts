import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLNetworkInfoComponent } from './network-info.component';

describe('CLNetworkInfoComponent', () => {
  let component: CLNetworkInfoComponent;
  let fixture: ComponentFixture<CLNetworkInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLNetworkInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNetworkInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
