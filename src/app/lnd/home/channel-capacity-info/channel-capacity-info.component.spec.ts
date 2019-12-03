import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelCapacityInfoComponent } from './channel-capacity-info.component';

describe('ChannelCapacityInfoComponent', () => {
  let component: ChannelCapacityInfoComponent;
  let fixture: ComponentFixture<ChannelCapacityInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelCapacityInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelCapacityInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
