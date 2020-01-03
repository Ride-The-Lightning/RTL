import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLChannelCapacityInfoComponent } from './channel-capacity-info.component';

describe('CLChannelCapacityInfoComponent', () => {
  let component: CLChannelCapacityInfoComponent;
  let fixture: ComponentFixture<CLChannelCapacityInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelCapacityInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelCapacityInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
