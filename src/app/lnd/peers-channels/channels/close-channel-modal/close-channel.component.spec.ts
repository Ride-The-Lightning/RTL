import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloseChannelComponent } from './close-channel.component';

describe('CloseChannelComponent', () => {
  let component: CloseChannelComponent;
  let fixture: ComponentFixture<CloseChannelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloseChannelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloseChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
