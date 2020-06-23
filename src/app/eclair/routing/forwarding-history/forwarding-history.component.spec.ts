import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRForwardingHistoryComponent } from './forwarding-history.component';

describe('ECLRForwardingHistoryComponent', () => {
  let component: ECLRForwardingHistoryComponent;
  let fixture: ComponentFixture<ECLRForwardingHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRForwardingHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRForwardingHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
