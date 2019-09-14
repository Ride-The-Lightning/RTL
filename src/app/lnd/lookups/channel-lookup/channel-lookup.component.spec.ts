import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelLookupComponent } from './channel-lookup.component';

describe('ChannelLookupComponent', () => {
  let component: ChannelLookupComponent;
  let fixture: ComponentFixture<ChannelLookupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelLookupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelLookupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
