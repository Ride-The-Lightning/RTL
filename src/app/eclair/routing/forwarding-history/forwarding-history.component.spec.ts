import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLForwardingHistoryComponent } from './forwarding-history.component';

describe('ECLForwardingHistoryComponent', () => {
  let component: ECLForwardingHistoryComponent;
  let fixture: ComponentFixture<ECLForwardingHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLForwardingHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLForwardingHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
