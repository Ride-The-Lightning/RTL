import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLChannelLookupComponent } from './channel-lookup.component';

describe('CLChannelLookupComponent', () => {
  let component: CLChannelLookupComponent;
  let fixture: ComponentFixture<CLChannelLookupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelLookupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelLookupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
