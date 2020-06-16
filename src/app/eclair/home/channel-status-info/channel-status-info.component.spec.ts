import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRChannelStatusInfoComponent } from './channel-status-info.component';

describe('ECLRChannelStatusInfoComponent', () => {
  let component: ECLRChannelStatusInfoComponent;
  let fixture: ComponentFixture<ECLRChannelStatusInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRChannelStatusInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRChannelStatusInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
