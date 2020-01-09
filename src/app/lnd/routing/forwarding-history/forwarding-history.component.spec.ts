import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ForwardingHistoryComponent } from './forwarding-history.component';

describe('ForwardingHistoryComponent', () => {
  let component: ForwardingHistoryComponent;
  let fixture: ComponentFixture<ForwardingHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ForwardingHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ForwardingHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
