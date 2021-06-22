import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLChannelInformationComponent } from './channel-information.component';

describe('CLChannelInformationComponent', () => {
  let component: CLChannelInformationComponent;
  let fixture: ComponentFixture<CLChannelInformationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
