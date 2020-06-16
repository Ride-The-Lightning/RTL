import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRChannelCapacityInfoComponent } from './channel-capacity-info.component';

describe('ECLRChannelCapacityInfoComponent', () => {
  let component: ECLRChannelCapacityInfoComponent;
  let fixture: ComponentFixture<ECLRChannelCapacityInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRChannelCapacityInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRChannelCapacityInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
