import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLForwardingHistoryComponent } from './forwarding-history.component';

describe('CLForwardingHistoryComponent', () => {
  let component: CLForwardingHistoryComponent;
  let fixture: ComponentFixture<CLForwardingHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLForwardingHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLForwardingHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
