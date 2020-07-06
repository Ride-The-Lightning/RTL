import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLChannelCapacityInfoComponent } from './channel-capacity-info.component';

describe('ECLChannelCapacityInfoComponent', () => {
  let component: ECLChannelCapacityInfoComponent;
  let fixture: ComponentFixture<ECLChannelCapacityInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLChannelCapacityInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLChannelCapacityInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
