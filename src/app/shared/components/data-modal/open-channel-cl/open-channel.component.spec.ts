import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLOpenChannelComponent } from './open-channel.component';

describe('CLOpenChannelComponent', () => {
  let component: CLOpenChannelComponent;
  let fixture: ComponentFixture<CLOpenChannelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLOpenChannelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLOpenChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
