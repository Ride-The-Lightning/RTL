import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelInformationComponent } from './channel-information.component';

describe('ChannelInformationComponent', () => {
  let component: ChannelInformationComponent;
  let fixture: ComponentFixture<ChannelInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
